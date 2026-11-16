import test from "node:test";
import assert from "node:assert/strict";
import {
  WebSocketTransport,
  WebSocketTransportError,
} from "../dist/transport/websocket.js";
import { ApplicationRuntime } from "../dist/index.js";
import {
  decodeFrame,
  FrameType,
  MAGIC,
  Priority,
  encodeFrame,
} from "@rocksoul/protocol";

class FakeSocket {
  constructor() {
    this.readyState = 0;
    this.binaryType = "";
    this.bufferedAmount = 0;
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }
  open() {
    this.readyState = 1;
    this.onopen?.({});
  }
  send(bytes) {
    if (this.readyState !== 1) throw new Error("not open");
    this.sent.push(new Uint8Array(bytes));
  }
  close(code = 1000, reason = "") {
    this.readyState = 3;
    this.onclose?.({ code, reason, wasClean: true });
  }
  receive(data) {
    this.onmessage?.({ data });
  }
  fail(e) {
    this.onerror?.(e);
  }
}

const setup = () => {
  const socket = new FakeSocket();
  const transport = new WebSocketTransport({
    url: "wss://example.test/aep",
    factory: () => socket,
    connectTimeoutMs: 100,
    maxQueueBytes: 8,
  });
  return { socket, transport };
};
test("connect configures binary mode and preserves bytes", async () => {
  const { socket, transport } = setup();
  const received = [];
  transport.onFrame((bytes) => received.push(bytes));
  const connecting = transport.connect();
  assert.equal(transport.connectionState, "CONNECTING");
  socket.open();
  await connecting;
  assert.equal(socket.binaryType, "arraybuffer");
  await transport.send(new Uint8Array([0, 1, 255]));
  assert.deepEqual(socket.sent, [new Uint8Array([0, 1, 255])]);
  socket.receive(new Uint8Array([4, 5]).buffer);
  assert.deepEqual(received, [new Uint8Array([4, 5])]);
});
test("text messages are rejected and close is normalized", async () => {
  const { socket, transport } = setup();
  const errors = [];
  const closes = [];
  transport.onError((e) => errors.push(e));
  transport.onClose((e) => closes.push(e));
  const p = transport.connect();
  socket.open();
  await p;
  socket.receive("not binary");
  assert.equal(errors[0].code, "RECEIVE_FAILED");
  await transport.disconnect();
  await transport.disconnect();
  assert.equal(transport.connectionState, "CLOSED");
  assert.equal(closes[0].code, "CONNECTION_CLOSED");
});
test("send before open and bounded queue are deterministic", async () => {
  const { socket, transport } = setup();
  await assert.rejects(
    transport.send(new Uint8Array([1])),
    (e) => e.code === "SEND_FAILED",
  );
  const p = transport.connect();
  socket.open();
  await p;
  await transport.send(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  socket.bufferedAmount = 8;
  await assert.rejects(
    transport.send(new Uint8Array([9])),
    (e) => e instanceof WebSocketTransportError && e.code === "SEND_FAILED",
  );
});
test("WebSocketTransport to runtime handles one message containing multiple AEP frames", async () => {
  const socket = new FakeSocket();
  const originalSend = socket.send.bind(socket);
  socket.send = (bytes) => {
    originalSend(bytes);
    if (decodeFrame(new Uint8Array(bytes)).header.frameType === FrameType.HELLO)
      socket.receive(
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
        }).buffer,
      );
  };
  const transport = new WebSocketTransport({
    url: "wss://example.test/aep",
    factory: () => socket,
    maxQueueBytes: 2_097_152,
  });
  const runtime = new ApplicationRuntime({
    transport,
    ids: (k) => `${k}-fixed`,
    capabilities: [{ id: "demo", mutation: true, validateInput: () => true }],
  });
  const connected = runtime.connect();
  socket.open();
  await connected;
  const execution = await runtime.run("demo", "x");
  const make = (type, sequence, payload) =>
    encodeFrame({
      header: {
        magic: MAGIC,
        protocolVersion: 1,
        frameType: type,
        flags: 0,
        streamId: 1,
    sequence,
    acknowledgement: 0,
        timestamp: 0n,
        priority: Priority.NORMAL,
        payloadLength: 0,
      },
      payload,
    });
  const a = make(FrameType.ACK, 0, {
    executionId: execution.id,
    state: "ACCEPTED",
    streamId: 1,
    ackSeq: 0,
  });
  const b = make(FrameType.DATA, 1, {
    executionId: execution.id,
    state: "RUNNING",
    eventType: "state",
    data: null,
  });
  const c = make(FrameType.DATA, 2, {
    executionId: execution.id,
    state: "SUCCEEDED",
    eventType: "state",
    data: "ok",
  });
  const merged = new Uint8Array(Buffer.concat([a, b, c]));
  socket.receive(merged.buffer);
  assert.equal(await execution.result(), "ok");
});
test("repeated connect/disconnect does not duplicate lifecycle callbacks", async () => {
  let opens = 0,
    closes = 0;
  for (let i = 0; i < 100; i++) {
    const socket = new FakeSocket();
    const transport = new WebSocketTransport({
      url: "wss://example.test/aep",
      factory: () => socket,
    });
    transport.onClose(() => closes++);
    const p = transport.connect();
    socket.open();
    await p;
    opens++;
    await transport.disconnect();
  }
  assert.equal(opens, 100);
  assert.equal(closes, 100);
});
