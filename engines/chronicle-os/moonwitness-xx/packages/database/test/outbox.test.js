import test from "node:test";
import assert from "node:assert/strict";
import { OutboxMessage } from "../src/entities.js";
import { createOutboxRepository } from "../src/outbox.js";

function createFakeEm() {
  const records = [];
  const queries = [];
  const pending = [];
  const em = {
    create(Entity, data) {
      assert.equal(Entity, OutboxMessage);
      return { ...data };
    },
    persist(record) {
      pending.push(record);
      return em;
    },
    async flush() {
      while (pending.length) records.push(pending.shift());
    },
    async findOne(_Entity, criteria) {
      return records.find((row) => {
        if (criteria.id !== undefined && row.id !== criteria.id) return false;
        if (criteria.idempotencyKey !== undefined && row.idempotencyKey !== criteria.idempotencyKey) return false;
        if (criteria.status !== undefined && row.status !== criteria.status) return false;
        if (criteria.lockedBy !== undefined && row.lockedBy !== criteria.lockedBy) return false;
        return true;
      }) ?? null;
    },
    async transactional(callback) {
      return callback(em);
    },
    async execute(query, params) {
      queries.push({ query, params });
      return [{
        id: "00000000-0000-4000-8000-000000000001",
        eventType: "story.created",
        schemaVersion: 1,
        payload: {
          storyId: "00000000-0000-4000-8000-000000000002",
          authorId: "00000000-0000-4000-8000-000000000003"
        },
        correlationId: "req-1",
        attempts: 1
      }];
    },
    async nativeUpdate(_Entity, where, data) {
      const row = records.find((entry) => {
        if (entry.id !== where.id) return false;
        if (where.status !== undefined && entry.status !== where.status) return false;
        if (where.lockedBy !== undefined && entry.lockedBy !== where.lockedBy) return false;
        if (where.lockedUntil?.$lt) {
          if (!(entry.lockedUntil instanceof Date) || entry.lockedUntil >= where.lockedUntil.$lt) return false;
        }
        return true;
      });
      if (!row) return 0;
      Object.assign(row, data);
      return 1;
    }
  };

  return { em, records, queries };
}

test("outbox append validates versioned event payloads and deduplicates idempotency keys", async () => {
  const { em, records } = createFakeEm();
  const outbox = createOutboxRepository(em);
  const input = {
    eventType: "story.created",
    schemaVersion: 1,
    payload: {
      storyId: "00000000-0000-4000-8000-000000000002",
      authorId: "00000000-0000-4000-8000-000000000003"
    },
    correlationId: "request-1",
    idempotencyKey: "story.created:story-1"
  };

  const first = await outbox.append(input);
  const second = await outbox.append(input);
  assert.equal(records.length, 1);
  assert.equal(first.id, second.id);

  await assert.rejects(() => outbox.append({
    ...input,
    idempotencyKey: "invalid",
    payload: { storyId: "not-a-uuid", authorId: "also-not-a-uuid" }
  }), /Invalid payload/);
});

test("outbox claim query uses SKIP LOCKED and recovers expired consumer leases", async () => {
  const { em, records, queries } = createFakeEm();
  const outbox = createOutboxRepository(em);
  const claimed = await outbox.claimBatch({ workerId: "worker-a", batchSize: 10, leaseSeconds: 60 });

  assert.equal(claimed.length, 1);
  assert.match(queries[0].query, /for update skip locked/i);
  assert.match(queries[0].query, /status = 'processing' and locked_until < now\(\)/i);
  assert.deepEqual(queries[0].params, [10, "worker-a", 60]);

  await assert.rejects(
    () => outbox.markDispatched("00000000-0000-4000-8000-000000000001", "worker-a"),
    /lease was lost/
  );

  records.push({
    id: "00000000-0000-4000-8000-000000000001",
    status: "leased",
    lockedBy: "worker-a",
    attempts: 1
  });
  assert.equal(await outbox.markDispatched("00000000-0000-4000-8000-000000000001", "worker-a"), true);
});

test("outbox rejects invalid lease requests", async () => {
  const { em } = createFakeEm();
  const outbox = createOutboxRepository(em);
  await assert.rejects(() => outbox.claimBatch({ workerId: "" }), /worker ID is required/);
});

test("event consumers claim one processing lease and release it for retry", async () => {
  const { em, records } = createFakeEm();
  const outbox = createOutboxRepository(em);
  records.push({
    id: "00000000-0000-4000-8000-000000000010",
    status: "queued",
    lockedBy: null,
    lockedUntil: null
  });

  assert.equal(await outbox.claimForProcessing("00000000-0000-4000-8000-000000000010", "worker-a"), true);
  assert.equal(records[0].status, "processing");
  assert.equal(await outbox.claimForProcessing("00000000-0000-4000-8000-000000000010", "worker-b"), false);
  assert.equal(await outbox.renewProcessingLease("00000000-0000-4000-8000-000000000010", "worker-a"), true);
  assert.equal(await outbox.releaseProcessing("00000000-0000-4000-8000-000000000010", "worker-a", new Error("temporary")), true);
  assert.equal(records[0].status, "queued");
  assert.equal(records[0].lockedBy, null);
  assert.match(records[0].lastError, /temporary/);
});

test("expired processing leases can be reclaimed and completion is owner-guarded", async () => {
  const { em, records } = createFakeEm();
  const outbox = createOutboxRepository(em);
  records.push({
    id: "00000000-0000-4000-8000-000000000011",
    status: "processing",
    lockedBy: "dead-worker",
    lockedUntil: new Date(Date.now() - 1000)
  });

  assert.equal(await outbox.claimForProcessing("00000000-0000-4000-8000-000000000011", "worker-b"), true);
  assert.equal(records[0].lockedBy, "worker-b");
  assert.equal(await outbox.markProcessed("00000000-0000-4000-8000-000000000011", {
    unhandled: true,
    workerId: "dead-worker"
  }), false);
  assert.equal(await outbox.markProcessed("00000000-0000-4000-8000-000000000011", {
    unhandled: true,
    workerId: "worker-b"
  }), true);
  assert.equal(records[0].status, "unhandled");
  assert.equal(records[0].lockedBy, null);
  assert.equal(records[0].processedAt instanceof Date, true);
});

test("outbox records terminal failures for a claimed or queued event", async () => {
  const { em, records } = createFakeEm();
  const outbox = createOutboxRepository(em);
  records.push({
    id: "00000000-0000-4000-8000-000000000012",
    status: "processing",
    lockedBy: "worker-a",
    lockedUntil: new Date(Date.now() + 60000)
  });

  assert.equal(await outbox.markProcessingFailed("00000000-0000-4000-8000-000000000012", new Error("consumer failed"), {
    workerId: "worker-a"
  }), true);
  assert.equal(records[0].status, "failed");
  assert.equal(records[0].lastError, "consumer failed");
  assert.equal(records[0].lockedBy, null);

  records.push({
    id: "00000000-0000-4000-8000-000000000013",
    status: "queued"
  });
  assert.equal(await outbox.markQueuedFailed("00000000-0000-4000-8000-000000000013", new Error("poisoned job")), true);
  assert.equal(records[1].status, "failed");
});
