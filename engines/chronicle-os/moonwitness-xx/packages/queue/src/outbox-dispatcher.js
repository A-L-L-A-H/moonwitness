import { JOBS, QUEUES } from "@moonwitness/contracts";

export async function dispatchOutboxBatch({
  outbox,
  queues,
  workerId,
  batchSize = 25,
  leaseSeconds = 60,
  retryDelaySeconds = 30
}) {
  if (!outbox || !queues || !workerId) {
    throw new Error("outbox repository, queue registry, and worker ID are required");
  }

  const records = await outbox.claimBatch({ workerId, batchSize, leaseSeconds });
  const result = {
    claimed: records.length,
    dispatched: 0,
    retried: 0,
    failed: 0
  };

  for (const record of records) {
    try {
      await queues.add(
        QUEUES.events,
        JOBS.events.consume,
        {
          schemaVersion: 1,
          outboxId: record.id,
          eventType: record.eventType,
          eventVersion: record.schemaVersion,
          correlationId: record.correlationId
        },
        {
          idempotencyKey: `outbox-event:${record.id}:${record.attempts ?? 1}`
        }
      );

      await outbox.markDispatched(record.id, workerId);
      result.dispatched += 1;
    } catch (error) {
      try {
        const retry = await outbox.markRetry(record.id, workerId, error, {
          delaySeconds: retryDelaySeconds
        });
        if (retry.status === "failed") result.failed += 1;
        else result.retried += 1;
      } catch (leaseError) {
        result.failed += 1;
        throw leaseError;
      }
    }
  }

  return result;
}
