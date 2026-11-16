import { randomUUID } from "node:crypto";
import { OutboxMessage } from "./entities.js";
import { validateDomainEvent } from "@moonwitness/contracts";

export class OutboxError extends Error {
  constructor(code, message, statusCode = 409) {
    super(message);
    this.name = "OutboxError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function boundedInteger(value, fallback, min, max) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function errorMessage(error) {
  return String(error?.message ?? error ?? "Unknown outbox error").slice(0, 2000);
}

function requireWorkerId(workerId) {
  if (typeof workerId !== "string" || workerId.length < 1 || workerId.length > 120) {
    throw new OutboxError("INVALID_WORKER_ID", "A stable worker ID is required.", 422);
  }
}

export function createOutboxRepository(em) {
  async function append({
    eventType,
    schemaVersion = 1,
    payload,
    correlationId,
    idempotencyKey = null,
    availableAt = new Date()
  }) {
    validateDomainEvent(eventType, schemaVersion, payload);

    if (typeof correlationId !== "string" || correlationId.length < 1 || correlationId.length > 120) {
      throw new OutboxError("INVALID_CORRELATION_ID", "A correlation ID is required.", 422);
    }
    if (idempotencyKey !== null &&
        (typeof idempotencyKey !== "string" || idempotencyKey.length < 1 || idempotencyKey.length > 240)) {
      throw new OutboxError("INVALID_IDEMPOTENCY_KEY", "Idempotency key must be 1–240 characters.", 422);
    }

    if (idempotencyKey) {
      const existing = await em.findOne(OutboxMessage, { idempotencyKey });
      if (existing) return existing;
    }

    const record = em.create(OutboxMessage, {
      id: randomUUID(),
      eventType,
      schemaVersion,
      payload,
      correlationId,
      idempotencyKey,
      status: "pending",
      attempts: 0,
      availableAt
    });

    try {
      await em.persist(record).flush();
      return record;
    } catch (error) {
      if (idempotencyKey && (error?.code === "23505" || error?.name === "UniqueConstraintViolationException")) {
        const existing = await em.findOne(OutboxMessage, { idempotencyKey });
        if (existing) return existing;
      }
      throw error;
    }
  }

  async function findById(id) {
    return em.findOne(OutboxMessage, { id });
  }

  async function claimBatch({ workerId, batchSize = 25, leaseSeconds = 60 } = {}) {
    requireWorkerId(workerId);
    const limit = boundedInteger(batchSize, 25, 1, 100);
    const lease = boundedInteger(leaseSeconds, 60, 10, 900);

    return em.transactional(async (tx) => tx.execute(`
      with candidates as (
        select id
        from outbox_messages
        where
          (status = 'pending' and available_at <= now())
          or (status = 'leased' and locked_until < now())
          or (status = 'processing' and locked_until < now())
        order by created_at asc, id asc
        for update skip locked
        limit ?
      )
      update outbox_messages as outbox
      set
        status = 'leased',
        locked_by = ?,
        locked_until = now() + (? * interval '1 second'),
        attempts = outbox.attempts + 1,
        updated_at = now()
      from candidates
      where outbox.id = candidates.id
      returning
        outbox.id,
        outbox.event_type as "eventType",
        outbox.schema_version as "schemaVersion",
        outbox.payload,
        outbox.correlation_id as "correlationId",
        outbox.idempotency_key as "idempotencyKey",
        outbox.attempts
    `, [limit, workerId, lease]));
  }

  async function markDispatched(id, workerId) {
    requireWorkerId(workerId);
    const affected = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "leased",
      lockedBy: workerId
    }, {
      status: "queued",
      dispatchedAt: new Date(),
      lockedBy: null,
      lockedUntil: null,
      lastError: null
    });

    if (affected !== 1) {
      throw new OutboxError("OUTBOX_LEASE_LOST", "The outbox lease was lost before dispatch was acknowledged.");
    }
    return true;
  }

  async function claimForProcessing(id, workerId, { leaseSeconds = 300 } = {}) {
    requireWorkerId(workerId);
    const lease = boundedInteger(leaseSeconds, 300, 30, 1800);
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + lease * 1000);

    const claimed = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "queued"
    }, {
      status: "processing",
      lockedBy: workerId,
      lockedUntil
    });
    if (claimed === 1) return true;

    const recovered = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "processing",
      lockedUntil: { $lt: now }
    }, {
      status: "processing",
      lockedBy: workerId,
      lockedUntil
    });
    return recovered === 1;
  }

  async function renewProcessingLease(id, workerId, { leaseSeconds = 300 } = {}) {
    requireWorkerId(workerId);
    const lease = boundedInteger(leaseSeconds, 300, 30, 1800);
    const affected = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "processing",
      lockedBy: workerId
    }, {
      lockedUntil: new Date(Date.now() + lease * 1000)
    });
    return affected === 1;
  }

  async function markProcessed(id, { unhandled = false, workerId } = {}) {
    requireWorkerId(workerId);
    const affected = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "processing",
      lockedBy: workerId
    }, {
      status: unhandled ? "unhandled" : "processed",
      processedAt: new Date(),
      lockedBy: null,
      lockedUntil: null,
      lastError: null
    });
    return affected === 1;
  }

  async function releaseProcessing(id, workerId, error) {
    requireWorkerId(workerId);
    const affected = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "processing",
      lockedBy: workerId
    }, {
      status: "queued",
      lockedBy: null,
      lockedUntil: null,
      lastError: error === undefined ? null : errorMessage(error)
    });
    return affected === 1;
  }

  async function markProcessingFailed(id, error, { workerId } = {}) {
    requireWorkerId(workerId);
    const affected = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "processing",
      lockedBy: workerId
    }, {
      status: "failed",
      lastError: errorMessage(error),
      lockedBy: null,
      lockedUntil: null
    });
    return affected === 1;
  }

  async function markQueuedFailed(id, error) {
    const affected = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "queued"
    }, {
      status: "failed",
      lastError: errorMessage(error),
      lockedBy: null,
      lockedUntil: null
    });
    return affected === 1;
  }

  async function markRetry(id, workerId, error, { delaySeconds = 30, maxAttempts = 12 } = {}) {
    requireWorkerId(workerId);
    const row = await em.findOne(OutboxMessage, { id, status: "leased", lockedBy: workerId });
    if (!row) throw new OutboxError("OUTBOX_LEASE_LOST", "The outbox lease was lost before retry was recorded.");

    const permanent = row.attempts >= boundedInteger(maxAttempts, 12, 1, 100);
    const delay = boundedInteger(delaySeconds, 30, 1, 86400);
    const affected = await em.nativeUpdate(OutboxMessage, {
      id,
      status: "leased",
      lockedBy: workerId
    }, {
      status: permanent ? "failed" : "pending",
      availableAt: new Date(Date.now() + delay * 1000),
      lockedBy: null,
      lockedUntil: null,
      lastError: errorMessage(error)
    });

    if (affected !== 1) {
      throw new OutboxError("OUTBOX_LEASE_LOST", "The outbox lease was lost before retry was recorded.");
    }
    return { status: permanent ? "failed" : "pending", attempts: row.attempts };
  }

  async function listUnresolved({ limit = 50, offset = 0 } = {}) {
    return em.find(OutboxMessage, {
      status: { $in: ["failed", "unhandled"] }
    }, {
      orderBy: { createdAt: "ASC", id: "ASC" },
      limit: boundedInteger(limit, 50, 1, 100),
      offset: boundedInteger(offset, 0, 0, 100000)
    });
  }

  return Object.freeze({
    append,
    findById,
    claimBatch,
    markDispatched,
    claimForProcessing,
    renewProcessingLease,
    markProcessed,
    releaseProcessing,
    markProcessingFailed,
    markQueuedFailed,
    markRetry,
    listUnresolved
  });
}
