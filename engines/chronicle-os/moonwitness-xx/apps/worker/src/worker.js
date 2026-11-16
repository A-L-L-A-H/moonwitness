import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { Worker } from "bullmq";
import { JOBS, QUEUES } from "@moonwitness/contracts";
import { loadWorkerConfig } from "@moonwitness/config";
import { createDomainEventBus } from "@moonwitness/core";
import { createOrm, createOutboxRepository } from "@moonwitness/database";
import { createQueueRegistry, dispatchOutboxBatch, validateJobPayload } from "@moonwitness/queue";

const config = loadWorkerConfig();
const workerId = `${hostname()}-${process.pid}-${randomUUID()}`;
const orm = await createOrm(config.databaseUrl);

const producerConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  enableReadyCheck: true
});
const systemConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});
const eventsConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

const queues = createQueueRegistry({ connection: producerConnection });
const eventBus = createDomainEventBus({
  logger: {
    error: (entry) => console.error(JSON.stringify(entry))
  }
});

const systemWorker = new Worker(
  QUEUES.system,
  async (job) => {
    validateJobPayload(job.name, job.data);

    if (job.name === JOBS.system.ping) {
      return {
        ok: true,
        processedAt: new Date().toISOString(),
        correlationId: job.data.correlationId
      };
    }

    throw new Error(`Unsupported system job: ${job.name}`);
  },
  {
    connection: systemConnection,
    concurrency: config.concurrency
  }
);

const eventWorker = new Worker(
  QUEUES.events,
  async (job) => {
    validateJobPayload(job.name, job.data);

    if (job.name !== JOBS.events.consume) {
      throw new Error(`Unsupported event job: ${job.name}`);
    }

    const repository = createOutboxRepository(orm.em.fork({ clear: true }));
    const record = await repository.findById(job.data.outboxId);
    if (!record) throw new Error("Outbox event record was not found.");

    if (["processed", "unhandled"].includes(record.status)) {
      return { duplicate: true, outboxId: record.id, status: record.status };
    }

    if (!["queued", "processing"].includes(record.status)) {
      throw new Error(`Outbox event is not ready for consumption: ${record.status}`);
    }

    if (record.eventType !== job.data.eventType ||
        record.schemaVersion !== job.data.eventVersion ||
        record.correlationId !== job.data.correlationId) {
      const error = new Error("Outbox event metadata does not match the queued job.");
      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        await repository.markQueuedFailed(record.id, error);
      }
      throw error;
    }

    const claimed = await repository.claimForProcessing(record.id, workerId, { leaseSeconds: 300 });
    if (!claimed) {
      const latest = await repository.findById(record.id);
      if (latest && ["processed", "unhandled"].includes(latest.status)) {
        return { duplicate: true, outboxId: latest.id, status: latest.status };
      }
      throw new Error("Outbox event is already owned by another active consumer.");
    }

    let leaseLost = false;
    const heartbeat = setInterval(() => {
      void repository.renewProcessingLease(record.id, workerId, { leaseSeconds: 300 })
        .then((renewed) => {
          if (!renewed) leaseLost = true;
        })
        .catch((error) => {
          leaseLost = true;
          console.error(JSON.stringify({
            event: "outbox.processing_lease_renewal_failed",
            outboxId: record.id,
            message: error.message
          }));
        });
    }, 60000);
    heartbeat.unref?.();

    try {
      const event = {
        eventId: record.id,
        eventType: record.eventType,
        schemaVersion: record.schemaVersion,
        occurredAt: record.createdAt.toISOString(),
        correlationId: record.correlationId,
        payload: record.payload
      };

      const result = await eventBus.dispatch(event, {
        outboxId: record.id,
        workerId,
        jobId: job.id
      });

      if (leaseLost) throw new Error("Outbox processing lease was lost during event dispatch.");

      const marked = await repository.markProcessed(record.id, {
        unhandled: result.unhandled,
        workerId
      });
      if (!marked) throw new Error("Outbox processing lease was lost before completion.");

      if (result.unhandled) {
        console.warn(JSON.stringify({
          event: "domain_event.unhandled",
          eventId: record.id,
          eventType: record.eventType,
          correlationId: record.correlationId
        }));
      }

      return {
        outboxId: record.id,
        eventType: record.eventType,
        handlerCount: result.handlerCount,
        unhandled: result.unhandled
      };
    } catch (error) {
      const finalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (finalAttempt) {
        await repository.markProcessingFailed(record.id, error, { workerId });
      } else {
        await repository.releaseProcessing(record.id, workerId, error);
      }
      throw error;
    } finally {
      clearInterval(heartbeat);
    }
  },
  {
    connection: eventsConnection,
    concurrency: config.concurrency
  }
);

systemWorker.on("completed", (job) => {
  console.info(JSON.stringify({
    event: "job.completed",
    queue: QUEUES.system,
    jobId: job.id
  }));
});

systemWorker.on("failed", (job, error) => {
  console.error(JSON.stringify({
    event: "job.failed",
    queue: QUEUES.system,
    jobId: job?.id,
    message: error.message
  }));
});

eventWorker.on("completed", (job) => {
  console.info(JSON.stringify({
    event: "event.consumed",
    queue: QUEUES.events,
    jobId: job.id,
    outboxId: job.data.outboxId
  }));
});

eventWorker.on("failed", (job, error) => {
  console.error(JSON.stringify({
    event: "event.consume_failed",
    queue: QUEUES.events,
    jobId: job?.id,
    outboxId: job?.data?.outboxId,
    attemptsMade: job?.attemptsMade,
    message: error.message
  }));
});

for (const worker of [systemWorker, eventWorker]) {
  worker.on("error", (error) => {
    console.error(JSON.stringify({
      event: "worker.error",
      message: error.message
    }));
  });
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let closing = false;

async function runOutboxPump() {
  while (!closing) {
    try {
      const result = await dispatchOutboxBatch({
        outbox: createOutboxRepository(orm.em.fork({ clear: true })),
        queues,
        workerId,
        batchSize: Number(process.env.OUTBOX_BATCH_SIZE ?? 25),
        leaseSeconds: Number(process.env.OUTBOX_LEASE_SECONDS ?? 60),
        retryDelaySeconds: Number(process.env.OUTBOX_RETRY_DELAY_SECONDS ?? 30)
      });

      if (result.dispatched > 0 || result.failed > 0) {
        console.info(JSON.stringify({
          event: "outbox.batch",
          workerId,
          ...result
        }));
      }
    } catch (error) {
      console.error(JSON.stringify({
        event: "outbox.dispatch_error",
        workerId,
        message: error.message
      }));
    }

    await pause(1000);
  }
}

const outboxPump = runOutboxPump();

async function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.info(JSON.stringify({ event: "worker.shutdown", signal, workerId }));

  await outboxPump;
  await Promise.all([systemWorker.close(), eventWorker.close()]);
  await queues.close();
  await Promise.all([
    producerConnection.quit(),
    systemConnection.quit(),
    eventsConnection.quit()
  ]);
  await orm.close(true);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
