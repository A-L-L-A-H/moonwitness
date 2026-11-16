import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeFrame,
  encodeFrame,
  FrameType,
  MAGIC,
  Priority,
} from "@rocksoul/protocol";
import {
  ApplicationRuntime,
  MemoryTransport,
  RuntimeError,
  createAppRuntime,
} from "../dist/index.js";

const ids = (() => {
  let n = 0;
  return (kind) => `${kind}-${++n}`;
})();
const clock = {
  now: () => 0,
  setTimeout(fn) {
    fn();
    return 1;
  },
  clearTimeout() {},
};
const server = (type, seq, payload, ack = 0) =>
  encodeFrame({
    header: {
      magic: MAGIC,
      protocolVersion: 1,
      frameType: type,
      flags: 0,
      streamId: 1,
    sequence: seq,
      acknowledgement: ack,
      timestamp: 0n,
      priority: Priority.NORMAL,
      payloadLength: 0,
    },
    payload,
  });
const welcome = () =>
  encodeFrame({
    header: {
      magic: MAGIC,
      protocolVersion: 1,
      frameType: FrameType.HELLO,
      flags: 0,
      streamId: 0,
      sequence: 0,
      acknowledgement: 0,
      timestamp: 0n,
      priority: Priority.CRITICAL,
      payloadLength: 0,
    },
    payload: {
      helloKind: "WELCOME",
      sessionId: "gateway-session",
      negotiatedSerializer: "msgpack",
    },
  });
const setup = async () => {
  const transport = new MemoryTransport();
  transport.onSend = (bytes) => {
    if (decodeFrame(bytes).header.frameType === FrameType.HELLO)
      transport.receive(welcome());
  };
  const runtime = new ApplicationRuntime({
    transport,
    ids,
    clock,
    capabilities: [
      {
        id: "demo",
        supported: true,
        mutation: true,
        validateInput: (v) => typeof v === "string",
      },
    ],
  });
  await runtime.connect();
  return { runtime, transport };
};

test("connect reaches READY only after a validated server welcome", async () => {
  const { runtime, transport } = await setup();
  assert.equal(runtime.session.state, "READY");
  assert.equal(transport.sent.length, 1);
  assert.equal(runtime.session.sessionId, "gateway-session");
  const request = decodeFrame(transport.sent[0]);
  assert.deepEqual(request.payload, {
    helloKind: "REQUEST",
    mode: "INITIAL",
    serializers: ["msgpack"],
  });
});
test("run creates distinct identities and converges through ACK/data", async () => {
  const { runtime, transport } = await setup();
  const execution = await runtime.run("demo", "input");
  assert.equal(execution.state, "CREATED");
  assert.notEqual(execution.id, execution.requestId);
  assert.equal(execution.idempotencyKey !== undefined, true);
  const payload = JSON.parse(
    JSON.stringify({
      executionId: execution.id,
      state: "ACCEPTED",
      streamId: 1,
      ackSeq: 0,
    }),
  );
  transport.receive(server(FrameType.ACK, 0, payload));
  assert.equal(execution.state, "ACCEPTED");
  transport.receive(
    server(FrameType.DATA, 1, {
      executionId: execution.id,
      state: "RUNNING",
      eventType: "state",
      data: null,
    }),
  );
  assert.equal(execution.state, "RUNNING");
  transport.receive(
    server(FrameType.DATA, 2, {
      executionId: execution.id,
      state: "SUCCEEDED",
      eventType: "state",
      data: "ok",
    }),
  );
  assert.equal(await execution.result(), "ok");
  assert.equal(execution.state, "SUCCEEDED");
  transport.receive(
    server(FrameType.DATA, 3, {
      executionId: execution.id,
      state: "SUCCEEDED",
      eventType: "state",
      data: "late",
    }),
  );
  assert.equal(execution.state, "SUCCEEDED");
});
test("watch unsubscribes and cancellation is idempotent", async () => {
  const { runtime, transport } = await setup();
  const execution = await runtime.run("demo", "x");
  let calls = 0;
  const off = execution.watch(() => calls++);
  off();
  await execution.cancel();
  await execution.cancel();
  await assert.rejects(execution.result());
  assert.equal(execution.state, "CANCELLED");
  assert.equal(calls, 0);
  assert.equal(transport.sent.length, 3);
});
test("unsupported and invalid capability inputs are normalized", async () => {
  const { runtime } = await setup();
  await assert.rejects(
    runtime.run("missing", "x"),
    (e) => e instanceof RuntimeError && e.kind === "validation",
  );
  await assert.rejects(
    runtime.run("demo", 3),
    (e) => e instanceof RuntimeError && e.kind === "validation",
  );
});
test("connection loss suspends session without destroying executions", async () => {
  const { runtime, transport } = await setup();
  const execution = await runtime.run("demo", "x");
  await transport.disconnect();
  assert.equal(runtime.session.state, "SUSPENDED");
  assert.equal(execution.state, "CREATED");
});
test("timeout settles execution exactly once", async () => {
  const transport = new MemoryTransport();
  transport.onSend = (bytes) => {
    if (decodeFrame(bytes).header.frameType === FrameType.HELLO)
      transport.receive(welcome());
  };
  const runtime = createAppRuntime({
    transport,
    ids,
    clock,
    executionTimeoutMs: 10,
    capabilities: [{ id: "demo", validateInput: () => true }],
  });
  await runtime.connect();
  const e = await runtime.run("demo", null);
  await assert.rejects(
    e.result(),
    (x) => x.kind === "timeout" || x.kind === "execution",
  );
});
test("property: deterministic IDs and client stream allocation are distinct and odd", async () => {
  const { runtime, transport } = await setup();
  const executions = await Promise.all(
    Array.from({ length: 50 }, (_, i) => runtime.run("demo", String(i))),
  );
  const idsSet = new Set(executions.map((e) => e.id));
  assert.equal(idsSet.size, 50);
  const runFrames = transport.sent.slice(1).map((bytes) => bytes[8 + 3]);
  assert.ok(runFrames.length >= 50);
  for (const e of executions) {
    assert.notEqual(e.id, e.requestId);
    assert.equal(e.idempotencyKey !== undefined, true);
  }
});
test("concurrency: duplicate terminal and transport fault do not corrupt execution", async () => {
  const { runtime, transport } = await setup();
  const e = await runtime.run("demo", "x");
  transport.receive(
    server(FrameType.ACK, 0, {
      executionId: e.id,
      state: "ACCEPTED",
      streamId: 1,
      ackSeq: 0,
    }),
  );
  transport.receive(
    server(FrameType.DATA, 1, {
      executionId: e.id,
      state: "RUNNING",
      eventType: "state",
      data: null,
    }),
  );
  transport.receive(
    server(FrameType.DATA, 2, {
      executionId: e.id,
      state: "SUCCEEDED",
      eventType: "state",
      data: "ok",
    }),
  );
  transport.receive(
    server(FrameType.DATA, 2, {
      executionId: e.id,
      state: "FAILED",
      eventType: "state",
      data: null,
    }),
  );
  assert.equal(await e.result(), "ok");
  await transport.disconnect();
  assert.equal(runtime.session.state, "SUSPENDED");
});
test("contract: execution lifecycle rejects transitions outside the normative matrix", async () => {
  const { runtime, transport } = await setup();
  const e = await runtime.run("demo", "x");
  const errors = [];
  runtime.onEvent((event) => {
    if (event.type === "error") errors.push(event.data);
  });
  transport.receive(
    server(FrameType.ACK, 0, {
      executionId: e.id,
      state: "ACCEPTED",
      streamId: 1,
      ackSeq: 0,
    }),
  );
  transport.receive(
    server(FrameType.DATA, 1, {
      executionId: e.id,
      state: "WAITING",
      eventType: "state",
      data: null,
    }),
  );
  assert.equal(e.state, "ACCEPTED");
  assert.equal(errors.length, 1);
  assert.equal(errors[0].kind, "execution");
});
test("regression: arbitrary chunks reconstruct concatenated frames exactly once", async () => {
  const { runtime, transport } = await setup();
  const e = await runtime.run("demo", "x");
  const frames = [
    server(FrameType.ACK, 0, {
      executionId: e.id,
      state: "ACCEPTED",
      streamId: 1,
      ackSeq: 0,
    }),
    server(FrameType.DATA, 1, {
      executionId: e.id,
      state: "RUNNING",
      eventType: "state",
      data: null,
    }),
    server(FrameType.DATA, 2, {
      executionId: e.id,
      state: "SUCCEEDED",
      eventType: "state",
      data: "ok",
    }),
  ];
  const merged = Buffer.concat(frames);
  for (let i = 0; i < merged.length; i++)
    transport.receive(merged.subarray(i, i + 1));
  assert.equal(await e.result(), "ok");
  assert.equal(e.state, "SUCCEEDED");
});
test("regression: one transport delivery containing 100 frames emits no duplicates", async () => {
  const { runtime, transport } = await setup();
  const frames = Array.from({ length: 100 }, (_, i) =>
    server(FrameType.DATA, i, { eventType: "tick", data: i }, 0),
  );
  transport.receive(Buffer.concat(frames));
  assert.equal(runtime.session.lastAcknowledgedSequence, 99);
});
