import test from "node:test";
import assert from "node:assert/strict";
import { dispatchOutboxBatch } from "../src/outbox-dispatcher.js";
import { JOBS, QUEUES } from "@moonwitness/contracts";

test("outbox dispatcher publishes versioned event references with per-attempt idempotency", async () => {
  const calls = [];
  const dispatched = [];
  const outbox = {
    claimBatch: async () => [{
      id: "00000000-0000-4000-8000-000000000001",
      eventType: "story.created",
      schemaVersion: 1,
      correlationId: "request-1",
      attempts: 4
    }],
    markDispatched: async (id, workerId) => dispatched.push({ id, workerId }),
    markRetry: async () => { throw new Error("unexpected retry"); }
  };
  const queues = {
    add: async (...args) => calls.push(args)
  };

  const result = await dispatchOutboxBatch({ outbox, queues, workerId: "worker-a" });
  assert.deepEqual(result, { claimed: 1, dispatched: 1, retried: 0, failed: 0 });
  assert.equal(calls[0][0], QUEUES.events);
  assert.equal(calls[0][1], JOBS.events.consume);
  assert.equal(calls[0][2].eventType, "story.created");
  assert.equal(calls[0][3].idempotencyKey, "outbox-event:00000000-0000-4000-8000-000000000001:4");
  assert.equal(dispatched[0].workerId, "worker-a");
});

test("outbox dispatcher releases a lease for retry when queue publish fails", async () => {
  let retry = null;
  const outbox = {
    claimBatch: async () => [{
      id: "00000000-0000-4000-8000-000000000002",
      eventType: "story.created",
      schemaVersion: 1,
      correlationId: "request-2",
      attempts: 1
    }],
    markDispatched: async () => { throw new Error("must not dispatch"); },
    markRetry: async (...args) => { retry = args; return { status: "pending" }; }
  };
  const queues = { add: async () => { throw new Error("redis unavailable"); } };

  const result = await dispatchOutboxBatch({ outbox, queues, workerId: "worker-b" });
  assert.equal(result.retried, 1);
  assert.equal(retry[0], "00000000-0000-4000-8000-000000000002");
  assert.match(retry[2].message, /redis unavailable/);
});
