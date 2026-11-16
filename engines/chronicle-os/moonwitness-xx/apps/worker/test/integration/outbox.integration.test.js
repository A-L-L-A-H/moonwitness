import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { Worker } from "bullmq";
import { JOBS, QUEUES } from "@moonwitness/contracts";
import { createDomainEventBus } from "@moonwitness/core";
import {
  createOrm,
  createOutboxRepository,
  OutboxMessage
} from "@moonwitness/database";
import {
  createQueueRegistry,
  dispatchOutboxBatch,
  validateJobPayload
} from "@moonwitness/queue";
import { loadWorkerConfig } from "@moonwitness/config";

test("PostgreSQL outbox event is leased, queued, claimed, consumed, and durably marked unhandled", {
  timeout: 30000
}, async (t) => {
  const config = loadWorkerConfig();
  const orm = await createOrm(config.databaseUrl);
  const redisProducer = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false
  });
  const redisConsumer = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null
  });
  const prefix = `mw-integration-${randomUUID()}`;
  const queues = createQueueRegistry({ connection: redisProducer, prefix });
  const workerId = `integration-${randomUUID()}`;
  const eventBus = createDomainEventBus({ logger: { error() {} } });
  let outboxId;

  let eventWorker;
  t.after(async () => {
    await eventWorker?.close().catch(() => {});
    await queues.close().catch(() => {});
    await redisProducer.quit().catch(() => {});
    await redisConsumer.quit().catch(() => {});
    if (outboxId) {
      await orm.em.nativeDelete(OutboxMessage, { id: outboxId }).catch(() => {});
    }
    await orm.close(true).catch(() => {});
  });

  const repository = createOutboxRepository(orm.em.fork({ clear: true }));
  const record = await repository.append({
    eventType: "story.created",
    schemaVersion: 1,
    payload: {
      storyId: randomUUID(),
      authorId: randomUUID()
    },
    correlationId: workerId,
    idempotencyKey: `integration:${randomUUID()}`
  });
  outboxId = record.id;

  assert.equal(record.status, "pending");

  eventWorker = new Worker(
    QUEUES.events,
    async (job) => {
      validateJobPayload(job.name, job.data);
      assert.equal(job.name, JOBS.events.consume);

      const workerRepository = createOutboxRepository(orm.em.fork({ clear: true }));
      const current = await workerRepository.findById(job.data.outboxId);
      assert.ok(current);
      assert.equal(current.status, "queued");
      assert.equal(current.eventType, job.data.eventType);
      assert.equal(current.correlationId, job.data.correlationId);

      const claimed = await workerRepository.claimForProcessing(current.id, workerId, {
        leaseSeconds: 30
      });
      assert.equal(claimed, true);

      const result = await eventBus.dispatch({
        eventId: current.id,
        eventType: current.eventType,
        schemaVersion: current.schemaVersion,
        occurredAt: current.createdAt.toISOString(),
        correlationId: current.correlationId,
        payload: current.payload
      });

      assert.equal(await workerRepository.markProcessed(current.id, {
        unhandled: result.unhandled,
        workerId
      }), true);
      return result;
    },
    {
      connection: redisConsumer,
      prefix,
      concurrency: 1
    }
  );

  const completed = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for the event worker.")), 15000);
    eventWorker.once("completed", (job, result) => {
      clearTimeout(timer);
      resolve({ job, result });
    });
    eventWorker.once("failed", (job, error) => {
      clearTimeout(timer);
      reject(error);
    });
    eventWorker.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  const dispatched = await dispatchOutboxBatch({
    outbox: repository,
    queues,
    workerId,
    batchSize: 5,
    leaseSeconds: 30
  });

  assert.deepEqual(dispatched, {
    claimed: 1,
    dispatched: 1,
    retried: 0,
    failed: 0
  });

  const result = await completed;
  assert.equal(result.job.name, JOBS.events.consume);
  assert.equal(result.result.unhandled, true);

  const finalRecord = await repository.findById(record.id);
  assert.equal(finalRecord.status, "unhandled");
  assert.equal(finalRecord.lockedBy, null);
  assert.equal(finalRecord.lockedUntil, null);
  assert.ok(finalRecord.dispatchedAt instanceof Date);
  assert.ok(finalRecord.processedAt instanceof Date);
});
