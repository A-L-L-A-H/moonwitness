import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import WebSocket from "ws";
import { buildApp } from "../dist/app.js";
import { ai } from "@rocksoul/ai-base";
import {
  FrameType,
  MAGIC,
  Priority,
  decodeFrame,
  encodeFrame,
} from "@rocksoul/protocol";
import { aepSessions, hashPassword, users } from "@rocksoul/orm";
import { aepEventHub } from "../dist/services/aep-events.js";

const helloFrame = () =>
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
      helloKind: "REQUEST",
      mode: "INITIAL",
      serializers: ["msgpack"],
    },
  });
const runFrameFor = (sequence, idempotencyKey, executionId) =>
  encodeFrame({
    header: {
      magic: MAGIC,
      protocolVersion: 1,
      frameType: FrameType.RUN,
      flags: 16,
      streamId: 1,
      sequence,
      acknowledgement: 0,
      timestamp: 0n,
      priority: Priority.HIGH,
      payloadLength: 0,
    },
    payload: {
      capabilityId: "ai.chat",
      input: { prompt: "Say hello from AEP" },
      executionId,
      requestId: "aep-test-request",
      idempotencyKey,
    },
  });
const runFrame = () =>
  runFrameFor(
    1,
    `aep-test-idempotency-${randomUUID()}`,
    `aep-test-execution-${randomUUID()}`,
  );
const resumeFrame = (sessionId, resumeToken) =>
  encodeFrame({
    header: {
      magic: MAGIC,
      protocolVersion: 1,
      frameType: FrameType.HELLO,
      flags: 4,
      streamId: 0,
      sequence: 0,
      acknowledgement: 0,
      timestamp: 0n,
      priority: Priority.CRITICAL,
      payloadLength: 0,
    },
    payload: {
      helloKind: "REQUEST",
      mode: "RESUME",
      serializers: ["msgpack"],
      sessionId,
      resumeToken,
      lastAckSeq: 0,
    },
  });
const cancelFrame = (sequence, executionId) =>
  encodeFrame({
    header: {
      magic: MAGIC,
      protocolVersion: 1,
      frameType: FrameType.SIGNAL,
      flags: 0,
      streamId: 0,
      sequence,
      acknowledgement: 0,
      timestamp: 0n,
      priority: Priority.CRITICAL,
      payloadLength: 0,
    },
    payload: { signal: "CANCEL", executionId },
  });

const runCapabilityFrame = (sequence, capabilityId, input, executionId) =>
  encodeFrame({
    header: { magic: MAGIC, protocolVersion: 1, frameType: FrameType.RUN, flags: 0, streamId: 1, sequence, acknowledgement: 0, timestamp: 0n, priority: Priority.HIGH, payloadLength: 0 },
    payload: { capabilityId, input, executionId, requestId: `request-${executionId}` },
  });

test("AEP WebSocket rejects unauthenticated upgrades", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildApp({ logger: false });
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const status = await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`);
      ws.on("open", () => reject(new Error("upgrade unexpectedly succeeded")));
      ws.on("unexpected-response", (_request, response) => {
        resolve(response.statusCode);
      });
      ws.on("error", reject);
    });
    assert.equal(status, 401);
  } finally {
    await app.close();
  }
});

test("AEP WebSocket binds an authenticated principal before HELLO/WELCOME", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db
    .insert(users)
    .values({
      id: `aep_${nonce}`,
      name: "AEP Test User",
      email,
      passwordHash: await hashPassword(password),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  assert.equal(login.statusCode, 200);
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const output = await new Promise((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.binaryType = "arraybuffer";
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("message", (data) => {
        resolve(new Uint8Array(data));
        ws.close();
      });
    });
    const frame = decodeFrame(output);
    assert.equal(frame.header.frameType, FrameType.HELLO);
    assert.equal(frame.header.streamId, 0);
    assert.equal(frame.payload.helloKind, "WELCOME");
    assert.equal(frame.payload.negotiatedSerializer, "msgpack");
    assert.match(frame.payload.sessionId, /^aep-/);
  } finally {
    await app.close();
  }
});

test("AEP resource watch delivers only matching authoritative events", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-watch-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db.insert(users).values({ id: `aep_watch_${nonce}`, name: "Watch User", email, passwordHash: await hashPassword(password), role: "user", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email, password } });
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const received = await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, { headers: { authorization: `Bearer ${token}` } });
      const timer = setTimeout(() => { ws.close(); reject(new Error("watch timeout")); }, 5000);
      const frames = [];
      ws.binaryType = "arraybuffer";
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("error", reject);
      ws.on("message", data => {
        const frame = decodeFrame(new Uint8Array(data));
        frames.push(frame);
        if (frame.header.frameType === FrameType.HELLO) ws.send(runCapabilityFrame(1, "projects.watch", { id: "project-1" }, `watch-${nonce}`));
        if (frame.header.frameType === FrameType.ACK) {
          aepEventHub.publish({ eventId: `event-${nonce}`, eventType: "resource.updated", resource: "projects", recordId: "project-2", timestamp: Date.now(), payload: { id: "project-2" } });
          aepEventHub.publish({ eventId: `event-match-${nonce}`, eventType: "resource.updated", resource: "projects", recordId: "project-1", timestamp: Date.now(), payload: { id: "project-1", name: "Updated" } });
        }
        if (frame.header.frameType === FrameType.DATA) { clearTimeout(timer); ws.close(); resolve(frames); }
      });
    });
    const data = received.find(frame => frame.header.frameType === FrameType.DATA);
    assert.equal(data.payload.eventType, "resource.updated");
    assert.equal(data.payload.payload.id, "project-1");
  } finally {
    await app.close();
  }
});

test("AEP RUN resolves through the canonical AI service and emits ACK then DATA", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-run-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db
    .insert(users)
    .values({
      id: `aep_run_${nonce}`,
      name: "AEP Run User",
      email,
      passwordHash: await hashPassword(password),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  assert.equal(login.statusCode, 200);
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const frames = await new Promise((resolve, reject) => {
      const received = [];
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("AEP RUN response timeout"));
      }, 5000);
      ws.binaryType = "arraybuffer";
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("error", reject);
      ws.on("close", () => {
        if (received.length < 3) {
          clearTimeout(timer);
          reject(new Error("AEP gateway closed before execution completed"));
        }
      });
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        received.push(frame);
        if (frame.header.frameType === FrameType.HELLO) ws.send(runFrame());
        if (frame.header.frameType === FrameType.DATA) {
          clearTimeout(timer);
          ws.close();
          resolve(received);
        }
      });
    });
    assert.equal(frames.length, 3);
    assert.equal(frames[0].payload.helloKind, "WELCOME");
    assert.equal(frames[1].header.frameType, FrameType.ACK);
    assert.equal(frames[1].payload.state, "ACCEPTED");
    assert.equal(frames[2].header.frameType, FrameType.DATA);
    assert.equal(frames[2].payload.state, "SUCCEEDED");
    assert.equal(frames[2].payload.data.runId !== undefined, true);
  } finally {
    await app.close();
  }
});

test("AEP duplicate RUN reuses the durable idempotency record", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-duplicate-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db
    .insert(users)
    .values({
      id: `aep_duplicate_${nonce}`,
      name: "AEP Duplicate User",
      email,
      passwordHash: await hashPassword(password),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  const token = login.json().data.token;
  const key = `duplicate-${nonce}`;
  const firstId = `first-${nonce}`;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const frames = await new Promise((resolve, reject) => {
      const received = [];
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const timer = setTimeout(
        () => reject(new Error("duplicate test timeout")),
        5000,
      );
      ws.binaryType = "arraybuffer";
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("error", reject);
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        received.push(frame);
        if (frame.header.frameType === FrameType.HELLO)
          ws.send(runFrameFor(1, key, firstId));
        if (frame.header.frameType === FrameType.DATA && received.length === 3)
          ws.send(runFrameFor(2, key, `duplicate-${nonce}`));
        if (
          frame.header.frameType === FrameType.DATA &&
          received.length === 5
        ) {
          clearTimeout(timer);
          ws.close();
          resolve(received);
        }
      });
    });
    assert.equal(frames.length, 5);
    assert.equal(frames[1].payload.state, "ACCEPTED");
    assert.equal(frames[3].payload.state, "SUCCEEDED");
    assert.equal(frames[4].payload.state, "SUCCEEDED");
    assert.equal(frames[2].payload.executionId, firstId);
    assert.equal(frames[4].payload.executionId, firstId);
  } finally {
    await app.close();
  }
});

test("AEP gateway closes a connection that exceeds the rate window", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-rate-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db
    .insert(users)
    .values({
      id: `aep_rate_${nonce}`,
      name: "AEP Rate User",
      email,
      passwordHash: await hashPassword(password),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const closeCode = await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("error", reject);
      ws.on("message", (data) => {
        if (
          decodeFrame(new Uint8Array(data)).header.frameType === FrameType.HELLO
        )
          ws.send(new Uint8Array(2_097_153));
      });
      ws.on("close", (code) => resolve(code));
    });
    assert.equal(closeCode, 1008);
  } finally {
    await app.close();
  }
});

test("AEP resume validates durable token, rotates it, and returns authoritative snapshot", async () => {
  process.env.NODE_ENV = "test";
  let app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-resume-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db
    .insert(users)
    .values({
      id: `aep_resume_${nonce}`,
      name: "AEP Resume User",
      email,
      passwordHash: await hashPassword(password),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    let port = typeof address === "object" && address ? address.port : 0;
    const first = await new Promise((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        ws.close();
        resolve(frame);
      });
    });
    assert.equal(first.payload.helloKind, "WELCOME");
    assert.match(first.payload.resumeToken, /^[0-9a-f-]{36}$/);
    await app.close();
    app = await buildApp({ logger: false });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const restartedAddress = app.server.address();
    port =
      typeof restartedAddress === "object" && restartedAddress
        ? restartedAddress.port
        : 0;
    const resumed = await new Promise((resolve) => {
      const received = [];
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.on("open", () =>
        ws.send(
          resumeFrame(first.payload.sessionId, first.payload.resumeToken),
        ),
      );
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        received.push(frame);
        if (frame.header.frameType === FrameType.DATA) {
          ws.close();
          resolve(received);
        }
      });
    });
    assert.equal(resumed[0].payload.resume.status, "ACCEPTED");
    assert.equal(resumed[0].payload.resume.delivery, "SYNC_SNAPSHOT");
    assert.equal(resumed[1].payload.eventType, "session.snapshot");
    assert.match(resumed[0].payload.resumeToken, /^[0-9a-f-]{36}$/);
    assert.notEqual(resumed[0].payload.resumeToken, first.payload.resumeToken);
  } finally {
    await app.close();
  }
});

test("AEP resume replays an unacknowledged DATA frame within the replay window", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-replay-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db
    .insert(users)
    .values({
      id: `aep_replay_${nonce}`,
      name: "AEP Replay User",
      email,
      passwordHash: await hashPassword(password),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const initial = await new Promise((resolve, reject) => {
      const received = [];
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const timer = setTimeout(
        () => reject(new Error("replay seed timeout")),
        5000,
      );
      ws.binaryType = "arraybuffer";
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("error", reject);
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        received.push(frame);
        if (frame.header.frameType === FrameType.HELLO) ws.send(runFrame());
        if (frame.header.frameType === FrameType.DATA) {
          clearTimeout(timer);
          const welcome = received[0];
          ws.close();
          resolve({ welcome, data: frame });
        }
      });
    });
    const resumed = await new Promise((resolve, reject) => {
      const received = [];
      const timer = setTimeout(
        () => reject(new Error("replay resume timeout")),
        5000,
      );
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.binaryType = "arraybuffer";
      ws.on("open", () =>
        ws.send(
          resumeFrame(
            initial.welcome.payload.sessionId,
            initial.welcome.payload.resumeToken,
          ),
        ),
      );
      ws.on("error", reject);
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        received.push(frame);
        if (frame.header.frameType === FrameType.DATA) {
          clearTimeout(timer);
          ws.close();
          resolve(received);
        }
      });
    });
    assert.equal(resumed[0].payload.resume.delivery, "REPLAY");
    assert.equal(resumed[1].header.frameType, FrameType.DATA);
    assert.equal(
      resumed[1].payload.executionId,
      initial.data.payload.executionId,
    );
    await app.db
      .update(aepSessions)
      .set({ replayUntil: new Date(0).toISOString() });
    const expired = await new Promise((resolve, reject) => {
      const received = [];
      const timer = setTimeout(
        () => reject(new Error("replay expiry timeout")),
        5000,
      );
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.binaryType = "arraybuffer";
      ws.on("open", () =>
        ws.send(
          resumeFrame(
            initial.welcome.payload.sessionId,
            resumed[0].payload.resumeToken,
          ),
        ),
      );
      ws.on("error", reject);
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        received.push(frame);
        if (frame.header.frameType === FrameType.DATA) {
          clearTimeout(timer);
          ws.close();
          resolve(received);
        }
      });
    });
    assert.equal(expired[0].payload.resume.delivery, "SYNC_SNAPSHOT");
    assert.equal(expired[1].payload.eventType, "session.snapshot");
  } finally {
    await app.close();
  }
});

test("AEP cancellation race keeps a late service completion cancelled", async () => {
  process.env.NODE_ENV = "test";
  const originalChat = ai.chat;
  ai.chat = async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { runId: `late-${randomUUID()}`, output: "late" };
  };
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-cancel-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db.insert(users).values({
    id: `aep_cancel_${nonce}`,
    name: "AEP Cancel User",
    email,
    passwordHash: await hashPassword(password),
    role: "user",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const executionId = `cancel-${nonce}`;
    const received = await new Promise((resolve, reject) => {
      const frames = [];
      const timer = setTimeout(() => reject(new Error("cancel race timeout")), 5000);
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.binaryType = "arraybuffer";
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("error", reject);
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        frames.push(frame);
        if (frame.header.frameType === FrameType.HELLO) {
          ws.send(runFrameFor(1, `cancel-key-${nonce}`, executionId));
        } else if (
          frame.header.frameType === FrameType.ACK &&
          frame.payload.executionId === executionId &&
          frame.payload.state === "ACCEPTED"
        ) {
          ws.send(cancelFrame(1, executionId));
        } else if (
          frame.header.frameType === FrameType.ACK &&
          frame.payload.executionId === executionId &&
          frame.payload.state === "CANCELLED"
        ) {
          setTimeout(() => {
            clearTimeout(timer);
            ws.close();
            resolve(frames);
          }, 250);
        }
      });
    });
    assert.equal(
      received.some(
        (frame) =>
          frame.header.frameType === FrameType.ACK &&
          frame.payload.state === "CANCELLED",
      ),
      true,
    );
    assert.equal(
      received.some(
        (frame) =>
          frame.header.frameType === FrameType.DATA &&
          frame.payload.state === "SUCCEEDED",
      ),
      false,
    );
  } finally {
    await app.close();
    ai.chat = originalChat;
  }
});

test("AEP gateway closes a stream that exceeds outbound backpressure budget", async () => {
  process.env.NODE_ENV = "test";
  const originalChat = ai.chat;
  ai.chat = async () => ({
    runId: `oversized-${randomUUID()}`,
    output: "x".repeat(2_200_000),
  });
  const app = await buildApp({ logger: false });
  const nonce = randomUUID();
  const email = `aep-outbound-${nonce}@example.invalid`;
  const password = randomUUID();
  await app.db.insert(users).values({
    id: `aep_outbound_${nonce}`,
    name: "AEP Outbound User",
    email,
    passwordHash: await hashPassword(password),
    role: "user",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  const token = login.json().data.token;
  await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const closeCode = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("backpressure timeout")), 5000);
      const ws = new WebSocket(`ws://127.0.0.1:${port}/aep`, {
        headers: { authorization: `Bearer ${token}` },
      });
      ws.binaryType = "arraybuffer";
      ws.on("open", () => ws.send(helloFrame()));
      ws.on("error", reject);
      ws.on("message", (data) => {
        const frame = decodeFrame(new Uint8Array(data));
        if (frame.header.frameType === FrameType.HELLO) ws.send(runFrame());
      });
      ws.on("close", (code) => {
        clearTimeout(timer);
        resolve(code);
      });
    });
    assert.equal(closeCode, 1008);
  } finally {
    await app.close();
    ai.chat = originalChat;
  }
});
