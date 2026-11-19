import { z } from "zod";
import {
  ConflictError,
  defineModel,
  getDb,
  syncModels,
  SYSTEM_ACTOR,
  uuidv7,
  type ActorContext,
  type ModelRecord,
} from "@moonwitness/orm";

export const opsJobSchema = z.object({
  queue: z.string().min(1).max(80).default("default"),
  job_type: z.string().min(1).max(120),
  payload_json: z.string().default("{}"),
  job_state: z.enum(["pending", "running", "completed", "failed", "dead"]).default("pending"),
  attempts: z.number().int().min(0).default(0),
  max_attempts: z.number().int().min(1).max(100).default(3),
  run_after: z.string().min(1),
  locked_by: z.string().max(120).nullable().default(null),
  locked_at: z.string().nullable().default(null),
  last_error: z.string().nullable().default(null),
  result_json: z.string().nullable().default(null),
  completed_at: z.string().nullable().default(null),
});

export const opsJobModel = defineModel({
  name: "ops.job",
  table: "ops_jobs",
  schema: opsJobSchema,
  softDelete: false,
  indexes: [{ fields: ["queue", "job_state", "run_after"] }, { fields: ["locked_by"] }],
});

export type OpsJobRecord = ModelRecord<typeof opsJobSchema>;

export interface EnqueueJobInput {
  queue?: string;
  jobType: string;
  payload?: unknown;
  runAfter?: Date | string;
  maxAttempts?: number;
}

export interface ClaimJobOptions {
  queue?: string;
  workerId: string;
  lockTtlMs?: number;
  now?: Date;
  tenantId?: string;
}

export interface FailJobOptions {
  retryDelayMs?: number;
  now?: Date;
}

export type JobHandler = (payload: unknown, job: OpsJobRecord) => Promise<unknown> | unknown;

const DEFAULT_LOCK_TTL_MS = 60_000;

function isRetryableContentionError(error: unknown): boolean {
  if (error instanceof ConflictError) return true;
  const code = (error as { code?: string } | null)?.code;
  if (code === "SQLITE_BUSY" || code === "SQLITE_LOCKED") return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /SQLITE_BUSY|database is locked/i.test(msg);
}

/** Ensures the durable `ops_jobs` and outbox tables and indexes exist cleanly. */
export async function ensureJobQueueSchema(): Promise<void> {
  await syncModels([opsJobModel]);
  await ensureOutboxSchema();
}

function serializeJson(value: unknown): string {
  if (value === undefined) return "{}";
  return JSON.stringify(value);
}

/** Enqueues a durable background job into `ops_jobs`. */
export async function enqueueJob(
  input: EnqueueJobInput,
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<OpsJobRecord> {
  const runAfterIso =
    input.runAfter instanceof Date
      ? input.runAfter.toISOString()
      : (input.runAfter ?? new Date().toISOString());

  return opsJobModel.repository.create(
    {
      queue: input.queue?.trim() || "default",
      job_type: input.jobType,
      payload_json: serializeJson(input.payload),
      job_state: "pending",
      attempts: 0,
      max_attempts: input.maxAttempts ?? 3,
      run_after: runAfterIso,
      locked_by: null,
      locked_at: null,
      last_error: null,
      result_json: null,
      completed_at: null,
    },
    actor,
  );
}

/** Claims the next due job using optimistic locking on `version`. */
export async function claimNextJob(
  options: ClaimJobOptions,
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<OpsJobRecord | null> {
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const lockExpiredIso = new Date(
    now.getTime() - (options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS),
  ).toISOString();
  const queue = options.queue?.trim() || "default";
  const scopeOpts = {
    limit: 10,
    orderBy: [{ field: "run_after", direction: "ASC" as const }],
    ...(options.tenantId !== undefined ? { tenantId: options.tenantId } : {}),
  };

  for (let pass = 0; pass < 5; pass++) {
    const duePending = await opsJobModel.repository.find(
      { queue, job_state: "pending", run_after: { $lte: nowIso } },
      scopeOpts,
    );
    const expiredRunning = await opsJobModel.repository.find(
      { queue, job_state: "running", locked_at: { $lte: lockExpiredIso } },
      { ...scopeOpts, orderBy: [{ field: "locked_at", direction: "ASC" as const }] },
    );

    const candidates = [...duePending, ...expiredRunning];
    if (candidates.length === 0) return null;

    let contended = false;
    for (const candidate of candidates) {
      const claimActor: ActorContext =
        options.tenantId !== undefined ? { ...actor, tenantId: options.tenantId } : actor;
      const nextAttempts = candidate.attempts + 1;
      try {
        if (nextAttempts > candidate.max_attempts) {
          await opsJobModel.repository.update(
            candidate.id,
            {
              version: candidate.version,
              job_state: "dead",
              locked_by: null,
              locked_at: null,
              last_error: candidate.last_error ?? "Exceeded max_attempts after worker lock expiry",
            },
            claimActor,
          );
          continue;
        }

        const claimed = await opsJobModel.repository.update(
          candidate.id,
          {
            version: candidate.version,
            job_state: "running",
            locked_by: options.workerId,
            locked_at: nowIso,
            attempts: nextAttempts,
          },
          claimActor,
        );
        if (claimed) return claimed;
      } catch (error) {
        if (isRetryableContentionError(error)) {
          contended = true;
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }
        throw error;
      }
    }

    if (!contended) return null;
  }

  return null;
}

/** Marks a claimed job completed when still owned by `workerId`. */
export async function completeJob(
  jobId: string,
  workerId: string,
  result?: unknown,
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<OpsJobRecord | null> {
  const existing = await opsJobModel.repository.findOne(jobId, {
    ...(actor.tenantId !== undefined ? { tenantId: actor.tenantId } : {}),
  });
  if (!existing || existing.job_state !== "running" || existing.locked_by !== workerId) {
    return null;
  }
  return opsJobModel.repository.update(
    jobId,
    {
      version: existing.version,
      job_state: "completed",
      locked_by: null,
      locked_at: null,
      last_error: null,
      result_json: result === undefined ? null : JSON.stringify(result),
      completed_at: new Date().toISOString(),
    },
    actor,
  );
}

/** Records failure on a claimed job and requeues with backoff or transitions to `dead`. */
export async function failJob(
  jobId: string,
  workerId: string,
  error: unknown,
  options: FailJobOptions = {},
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<OpsJobRecord | null> {
  const existing = await opsJobModel.repository.findOne(jobId, {
    ...(actor.tenantId !== undefined ? { tenantId: actor.tenantId } : {}),
  });
  if (!existing || existing.job_state !== "running" || existing.locked_by !== workerId) {
    return null;
  }
  const message = error instanceof Error ? error.message : String(error);
  const now = options.now ?? new Date();
  const exhausted = existing.attempts >= existing.max_attempts;
  const delayMs =
    options.retryDelayMs ?? Math.min(300_000, 1_000 * 2 ** Math.max(0, existing.attempts - 1));
  const nextRunAfter = new Date(now.getTime() + Math.max(0, delayMs)).toISOString();

  return opsJobModel.repository.update(
    jobId,
    {
      version: existing.version,
      job_state: exhausted ? "dead" : "pending",
      run_after: exhausted ? existing.run_after : nextRunAfter,
      locked_by: null,
      locked_at: null,
      last_error: message,
    },
    actor,
  );
}

/** Claims and executes one due job from `queue` using the provided handler map. */
export async function processNextJob(
  handlers: Record<string, JobHandler>,
  options: ClaimJobOptions,
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<{ processed: false } | { processed: true; job: OpsJobRecord }> {
  const claimed = await claimNextJob(options, actor);
  if (!claimed) return { processed: false };

  const scopedActor: ActorContext = { ...actor, tenantId: claimed.tenant_id };
  const handler = handlers[claimed.job_type];
  if (!handler) {
    const dead = await opsJobModel.repository.update(
      claimed.id,
      {
        version: claimed.version,
        job_state: "dead",
        locked_by: null,
        locked_at: null,
        last_error: `No registered handler for job_type '${claimed.job_type}'`,
      },
      scopedActor,
    );
    return { processed: true, job: dead ?? claimed };
  }

  try {
    const payload = JSON.parse(claimed.payload_json) as unknown;
    const result = await handler(payload, claimed);
    const done = await completeJob(claimed.id, options.workerId, result, scopedActor);
    return { processed: true, job: done ?? claimed };
  } catch (error) {
    const failed = await failJob(
      claimed.id,
      options.workerId,
      error,
      { now: options.now },
      scopedActor,
    );
    return { processed: true, job: failed ?? claimed };
  }
}

// ============================================================================
// Transactional Outbox Dispatcher (#502 / MW-0817)
// ============================================================================

export type OutboxEventStatus = "pending" | "processing" | "delivered" | "dead_letter";

export interface OutboxEventRecord {
  id: string;
  model: string;
  entity_id: string;
  action: string;
  tenant_id: string;
  actor_id: string | null;
  request_id: string | null;
  event_version: number;
  payload_json: string;
  status: OutboxEventStatus;
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutboxDeliveryRecord {
  event_id: string;
  subscriber: string;
  status: OutboxEventStatus;
  attempts: number;
  next_attempt_at: string;
  lease_owner: string | null;
  lease_expires_at: string | null;
  last_error: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutboxDispatchContext {
  event: OutboxEventRecord;
  payload: unknown;
  subscriber: string;
  attempt: number;
}

export type OutboxSubscriberHandler = (ctx: OutboxDispatchContext) => Promise<void> | void;

export interface OutboxSubscriber {
  name: string;
  /** Model match pattern: `"*"`, `"prefix.*"`, or exact `"model.name"`. Defaults to `"*"`. */
  pattern?: string;
  handler: OutboxSubscriberHandler;
  maxAttempts?: number;
}

export interface EnqueueOutboxEventInput {
  id?: string;
  model: string;
  entityId: string;
  action: string;
  tenantId?: string;
  actorId?: string | null;
  requestId?: string | null;
  eventVersion?: number;
  payload: unknown;
  nextAttemptAt?: Date | string;
}

export interface RecoverOutboxLeasesOptions {
  now?: Date;
  leaseTtlMs?: number;
  maxAttempts?: number;
}

export interface RecoverOutboxLeasesResult {
  recoveredDeliveries: number;
  deadLetteredDeliveries: number;
  recoveredEvents: number;
}

export interface DispatchOutboxOptions {
  workerId?: string;
  batchSize?: number;
  leaseTtlMs?: number;
  maxAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  now?: Date;
  recoverExpired?: boolean;
}

export interface DispatchOutboxBatchResult {
  processed: number;
  delivered: number;
  retried: number;
  deadLettered: number;
  recovered: number;
}

const DEFAULT_OUTBOX_LEASE_TTL_MS = 60_000;
const DEFAULT_OUTBOX_MAX_ATTEMPTS = 5;
const DEFAULT_OUTBOX_BASE_BACKOFF_MS = 1_000;
const DEFAULT_OUTBOX_MAX_BACKOFF_MS = 300_000;
const DEFAULT_OUTBOX_BATCH_SIZE = 50;

function matchOutboxPattern(pattern: string, modelName: string): boolean {
  if (pattern === "*" || pattern === modelName) return true;
  if (pattern.endsWith(".*")) {
    return modelName.startsWith(pattern.slice(0, -1));
  }
  return false;
}

function sanitizeOutboxError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg
      .replace(/[\r\n\t]+/g, " ")
      .trim()
      .slice(0, 1000) || "Outbox subscriber error"
  );
}

async function withBusyRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableContentionError(error) || attempt === 4) {
        throw error;
      }
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
    }
  }
  throw lastError;
}

/**
 * Ensures `_orm_outbox_events` and per-subscriber `_orm_outbox_deliveries`
 * tables and indexes exist idempotently using the active ORM database handle.
 */
export async function ensureOutboxSchema(): Promise<void> {
  const db = getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _orm_outbox_events (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      actor_id TEXT,
      request_id TEXT,
      event_version INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at TEXT NOT NULL,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orm_outbox_events_status_next
      ON _orm_outbox_events (status, next_attempt_at);
    CREATE INDEX IF NOT EXISTS idx_orm_outbox_events_model_created
      ON _orm_outbox_events (model, created_at);

    CREATE TABLE IF NOT EXISTS _orm_outbox_deliveries (
      event_id TEXT NOT NULL,
      subscriber TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at TEXT NOT NULL,
      lease_owner TEXT,
      lease_expires_at TEXT,
      last_error TEXT,
      delivered_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (event_id, subscriber)
    );
    CREATE INDEX IF NOT EXISTS idx_orm_outbox_deliveries_status_next
      ON _orm_outbox_deliveries (status, next_attempt_at);
    CREATE INDEX IF NOT EXISTS idx_orm_outbox_deliveries_lease
      ON _orm_outbox_deliveries (status, lease_expires_at);
  `);
}

/** Inserts an event row into `_orm_outbox_events` cleanly. */
export async function enqueueOutboxEvent(
  input: EnqueueOutboxEventInput,
): Promise<OutboxEventRecord> {
  await ensureOutboxSchema();
  const db = getDb();
  const nowIso = new Date().toISOString();
  const nextAttemptIso =
    input.nextAttemptAt instanceof Date
      ? input.nextAttemptAt.toISOString()
      : (input.nextAttemptAt ?? nowIso);
  const id = input.id?.trim() || uuidv7();
  const tenantId = input.tenantId?.trim() || "default";
  const eventVersion = input.eventVersion ?? 1;
  const payloadJson = serializeJson(input.payload);

  await withBusyRetry(() =>
    db.run(
      `INSERT INTO _orm_outbox_events (
        id, model, entity_id, action, tenant_id, actor_id, request_id,
        event_version, payload_json, status, attempts, next_attempt_at,
        last_error, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, ?, ?)`,
      [
        id,
        input.model,
        input.entityId,
        input.action,
        tenantId,
        input.actorId ?? null,
        input.requestId ?? null,
        eventVersion,
        payloadJson,
        nextAttemptIso,
        nowIso,
        nowIso,
      ],
    ),
  );

  return {
    id,
    model: input.model,
    entity_id: input.entityId,
    action: input.action,
    tenant_id: tenantId,
    actor_id: input.actorId ?? null,
    request_id: input.requestId ?? null,
    event_version: eventVersion,
    payload_json: payloadJson,
    status: "pending",
    attempts: 0,
    next_attempt_at: nextAttemptIso,
    last_error: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

async function syncParentOutboxEventState(eventId: string, nowIso: string): Promise<void> {
  const db = getDb();
  const deliveries = await db.all<OutboxDeliveryRecord>(
    "SELECT * FROM _orm_outbox_deliveries WHERE event_id = ?",
    [eventId],
  );
  if (deliveries.length === 0) return;

  const maxAttempts = deliveries.reduce((acc, row) => Math.max(acc, row.attempts), 0);
  const anyProcessing = deliveries.some((row) => row.status === "processing");
  const pending = deliveries.filter((row) => row.status === "pending");
  const deadLetters = deliveries.filter((row) => row.status === "dead_letter");
  const allDelivered = deliveries.every((row) => row.status === "delivered");

  if (allDelivered) {
    await withBusyRetry(() =>
      db.run(
        `UPDATE _orm_outbox_events
         SET status = 'delivered', attempts = ?, last_error = NULL, updated_at = ?
         WHERE id = ?`,
        [maxAttempts, nowIso, eventId],
      ),
    );
    return;
  }

  if (pending.length === 0 && !anyProcessing && deadLetters.length > 0) {
    const deadError =
      deadLetters.find((d) => d.last_error)?.last_error ?? "Subscriber dead-lettered";
    await withBusyRetry(() =>
      db.run(
        `UPDATE _orm_outbox_events
         SET status = 'dead_letter', attempts = ?, last_error = ?, updated_at = ?
         WHERE id = ?`,
        [maxAttempts, deadError, nowIso, eventId],
      ),
    );
    return;
  }

  if (anyProcessing) {
    await withBusyRetry(() =>
      db.run(
        `UPDATE _orm_outbox_events
         SET status = 'processing', attempts = ?, updated_at = ?
         WHERE id = ?`,
        [maxAttempts, nowIso, eventId],
      ),
    );
    return;
  }

  const nextAttemptAt =
    pending.map((d) => d.next_attempt_at).sort((a, b) => a.localeCompare(b))[0] ?? nowIso;
  const lastError =
    pending.find((d) => d.last_error)?.last_error ??
    deadLetters.find((d) => d.last_error)?.last_error ??
    null;

  await withBusyRetry(() =>
    db.run(
      `UPDATE _orm_outbox_events
       SET status = 'pending', attempts = ?, next_attempt_at = ?, last_error = ?, updated_at = ?
       WHERE id = ?`,
      [maxAttempts, nextAttemptAt, lastError, nowIso, eventId],
    ),
  );
}

/**
 * Reclaims expired `processing` leases across `_orm_outbox_deliveries` and
 * `_orm_outbox_events` after a worker crash/restart.
 */
export async function recoverExpiredOutboxLeases(
  options: RecoverOutboxLeasesOptions = {},
): Promise<RecoverOutboxLeasesResult> {
  await ensureOutboxSchema();
  const db = getDb();
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const leaseTtlMs = options.leaseTtlMs ?? DEFAULT_OUTBOX_LEASE_TTL_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_OUTBOX_MAX_ATTEMPTS;
  const expiredIso = new Date(now.getTime() - leaseTtlMs).toISOString();

  const expiredDeliveries = await db.all<OutboxDeliveryRecord>(
    `SELECT * FROM _orm_outbox_deliveries
     WHERE status = 'processing'
       AND lease_expires_at IS NOT NULL
       AND lease_expires_at <= ?`,
    [nowIso],
  );

  let recoveredDeliveries = 0;
  let deadLetteredDeliveries = 0;
  const touchedEventIds = new Set<string>();

  for (const row of expiredDeliveries) {
    if (row.attempts >= maxAttempts) {
      const res = await withBusyRetry(() =>
        db.run(
          `UPDATE _orm_outbox_deliveries
           SET status = 'dead_letter',
               lease_owner = NULL,
               lease_expires_at = NULL,
               last_error = COALESCE(last_error, 'Outbox lease expired after maxAttempts'),
               updated_at = ?
           WHERE event_id = ? AND subscriber = ? AND status = 'processing' AND attempts = ?`,
          [nowIso, row.event_id, row.subscriber, row.attempts],
        ),
      );
      if (res.rowsAffected === 1) {
        deadLetteredDeliveries += 1;
        touchedEventIds.add(row.event_id);
      }
    } else {
      const res = await withBusyRetry(() =>
        db.run(
          `UPDATE _orm_outbox_deliveries
           SET status = 'pending',
               lease_owner = NULL,
               lease_expires_at = NULL,
               next_attempt_at = ?,
               updated_at = ?
           WHERE event_id = ? AND subscriber = ? AND status = 'processing' AND attempts = ?`,
          [nowIso, nowIso, row.event_id, row.subscriber, row.attempts],
        ),
      );
      if (res.rowsAffected === 1) {
        recoveredDeliveries += 1;
        touchedEventIds.add(row.event_id);
      }
    }
  }

  for (const eventId of touchedEventIds) {
    await syncParentOutboxEventState(eventId, nowIso);
  }

  const staleEvents = await db.all<OutboxEventRecord>(
    `SELECT * FROM _orm_outbox_events
     WHERE status = 'processing'
       AND updated_at <= ?`,
    [expiredIso],
  );

  let recoveredEvents = 0;
  for (const ev of staleEvents) {
    const deliveries = await db.all<OutboxDeliveryRecord>(
      "SELECT * FROM _orm_outbox_deliveries WHERE event_id = ?",
      [ev.id],
    );
    if (deliveries.length > 0) {
      const stillProcessing = deliveries.some((d) => d.status === "processing");
      if (!stillProcessing) {
        await syncParentOutboxEventState(ev.id, nowIso);
        recoveredEvents += 1;
      }
      continue;
    }

    const nextStatus: OutboxEventStatus = ev.attempts >= maxAttempts ? "dead_letter" : "pending";
    const res = await withBusyRetry(() =>
      db.run(
        `UPDATE _orm_outbox_events
         SET status = ?, next_attempt_at = ?, updated_at = ?
         WHERE id = ? AND status = 'processing' AND updated_at = ?`,
        [nextStatus, nowIso, nowIso, ev.id, ev.updated_at],
      ),
    );
    if (res.rowsAffected === 1) {
      recoveredEvents += 1;
    }
  }

  return { recoveredDeliveries, deadLetteredDeliveries, recoveredEvents };
}

/**
 * Claims and dispatches a batch of due outbox events across registered
 * subscribers with isolated per-subscriber delivery state, lease locking,
 * exponential backoff retries, and dead-lettering after `maxAttempts`.
 */
export async function dispatchOutboxBatch(
  subscribers: readonly OutboxSubscriber[],
  options: DispatchOutboxOptions = {},
): Promise<DispatchOutboxBatchResult> {
  await ensureOutboxSchema();
  const db = getDb();
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const workerId = options.workerId?.trim() || "outbox-worker";
  const batchSize = Math.max(1, options.batchSize ?? DEFAULT_OUTBOX_BATCH_SIZE);
  const leaseTtlMs = options.leaseTtlMs ?? DEFAULT_OUTBOX_LEASE_TTL_MS;
  const defaultMaxAttempts = options.maxAttempts ?? DEFAULT_OUTBOX_MAX_ATTEMPTS;
  const baseBackoffMs = options.baseBackoffMs ?? DEFAULT_OUTBOX_BASE_BACKOFF_MS;
  const maxBackoffMs = options.maxBackoffMs ?? DEFAULT_OUTBOX_MAX_BACKOFF_MS;

  let recovered = 0;
  if (options.recoverExpired !== false) {
    const rec = await recoverExpiredOutboxLeases({
      now,
      leaseTtlMs,
      maxAttempts: defaultMaxAttempts,
    });
    recovered = rec.recoveredDeliveries + rec.recoveredEvents;
  }

  if (subscribers.length === 0) {
    return { processed: 0, delivered: 0, retried: 0, deadLettered: 0, recovered };
  }

  const subscriberMap = new Map<string, OutboxSubscriber>();
  for (const sub of subscribers) {
    subscriberMap.set(sub.name, sub);
  }

  // Materialize per-subscriber delivery rows for active outbox events.
  const candidateEvents = await db.all<OutboxEventRecord>(
    `SELECT * FROM _orm_outbox_events
     WHERE status IN ('pending', 'processing')
     ORDER BY created_at ASC, id ASC
     LIMIT ?`,
    [batchSize * 4],
  );

  for (const ev of candidateEvents) {
    for (const sub of subscribers) {
      if (!matchOutboxPattern(sub.pattern ?? "*", ev.model)) continue;
      await withBusyRetry(() =>
        db.run(
          `INSERT INTO _orm_outbox_deliveries (
            event_id, subscriber, status, attempts, next_attempt_at,
            lease_owner, lease_expires_at, last_error, delivered_at,
            created_at, updated_at
          ) VALUES (?, ?, 'pending', 0, ?, NULL, NULL, NULL, NULL, ?, ?)
          ON CONFLICT (event_id, subscriber) DO NOTHING`,
          [ev.id, sub.name, ev.next_attempt_at, nowIso, nowIso],
        ),
      );
    }
  }

  const dueDeliveries = await db.all<OutboxDeliveryRecord>(
    `SELECT d.*
     FROM _orm_outbox_deliveries d
     INNER JOIN _orm_outbox_events e ON e.id = d.event_id
     WHERE d.status = 'pending'
       AND d.next_attempt_at <= ?
       AND e.status IN ('pending', 'processing')
     ORDER BY e.created_at ASC, d.event_id ASC, d.subscriber ASC
     LIMIT ?`,
    [nowIso, batchSize],
  );

  const eventById = new Map<string, OutboxEventRecord>(candidateEvents.map((e) => [e.id, e]));
  const leaseExpiresIso = new Date(now.getTime() + leaseTtlMs).toISOString();

  let processed = 0;
  let delivered = 0;
  let retried = 0;
  let deadLettered = 0;
  const touchedEventIds = new Set<string>();

  for (const delivery of dueDeliveries) {
    const sub = subscriberMap.get(delivery.subscriber);
    if (!sub) continue;

    let event = eventById.get(delivery.event_id);
    if (!event) {
      event = await db.get<OutboxEventRecord>("SELECT * FROM _orm_outbox_events WHERE id = ?", [
        delivery.event_id,
      ]);
      if (!event) continue;
      eventById.set(event.id, event);
    }

    const subMaxAttempts = Math.max(1, sub.maxAttempts ?? defaultMaxAttempts);
    const nextAttempt = delivery.attempts + 1;

    if (nextAttempt > subMaxAttempts) {
      const deadRes = await withBusyRetry(() =>
        db.run(
          `UPDATE _orm_outbox_deliveries
           SET status = 'dead_letter',
               lease_owner = NULL,
               lease_expires_at = NULL,
               last_error = COALESCE(last_error, 'Exceeded maxAttempts'),
               updated_at = ?
           WHERE event_id = ? AND subscriber = ? AND status = 'pending' AND attempts = ?`,
          [nowIso, delivery.event_id, delivery.subscriber, delivery.attempts],
        ),
      );
      if (deadRes.rowsAffected === 1) {
        deadLettered += 1;
        touchedEventIds.add(delivery.event_id);
      }
      continue;
    }

    const claimRes = await withBusyRetry(() =>
      db.run(
        `UPDATE _orm_outbox_deliveries
         SET status = 'processing',
             attempts = ?,
             lease_owner = ?,
             lease_expires_at = ?,
             updated_at = ?
         WHERE event_id = ? AND subscriber = ? AND status = 'pending' AND attempts = ?`,
        [
          nextAttempt,
          workerId,
          leaseExpiresIso,
          nowIso,
          delivery.event_id,
          delivery.subscriber,
          delivery.attempts,
        ],
      ),
    );
    if (claimRes.rowsAffected !== 1) {
      continue;
    }

    processed += 1;
    touchedEventIds.add(delivery.event_id);

    await withBusyRetry(() =>
      db.run(
        `UPDATE _orm_outbox_events
         SET status = 'processing',
             attempts = CASE WHEN attempts < ? THEN ? ELSE attempts END,
             updated_at = ?
         WHERE id = ? AND status IN ('pending', 'processing')`,
        [nextAttempt, nextAttempt, nowIso, delivery.event_id],
      ),
    );

    let payload: unknown;
    try {
      payload = JSON.parse(event.payload_json) as unknown;
    } catch {
      payload = event.payload_json;
    }

    try {
      await sub.handler({
        event,
        payload,
        subscriber: sub.name,
        attempt: nextAttempt,
      });

      const doneIso = new Date().toISOString();
      await withBusyRetry(() =>
        db.run(
          `UPDATE _orm_outbox_deliveries
           SET status = 'delivered',
               lease_owner = NULL,
               lease_expires_at = NULL,
               last_error = NULL,
               delivered_at = ?,
               updated_at = ?
           WHERE event_id = ? AND subscriber = ? AND lease_owner = ? AND status = 'processing'`,
          [doneIso, doneIso, delivery.event_id, delivery.subscriber, workerId],
        ),
      );
      delivered += 1;
    } catch (error) {
      const errMsg = sanitizeOutboxError(error);
      const exhausted = nextAttempt >= subMaxAttempts;
      if (exhausted) {
        await withBusyRetry(() =>
          db.run(
            `UPDATE _orm_outbox_deliveries
             SET status = 'dead_letter',
                 lease_owner = NULL,
                 lease_expires_at = NULL,
                 last_error = ?,
                 updated_at = ?
             WHERE event_id = ? AND subscriber = ? AND lease_owner = ? AND status = 'processing'`,
            [errMsg, nowIso, delivery.event_id, delivery.subscriber, workerId],
          ),
        );
        deadLettered += 1;
      } else {
        const delayMs = Math.min(maxBackoffMs, baseBackoffMs * 2 ** Math.max(0, nextAttempt - 1));
        const nextRetryIso = new Date(now.getTime() + Math.max(0, delayMs)).toISOString();
        await withBusyRetry(() =>
          db.run(
            `UPDATE _orm_outbox_deliveries
             SET status = 'pending',
                 next_attempt_at = ?,
                 lease_owner = NULL,
                 lease_expires_at = NULL,
                 last_error = ?,
                 updated_at = ?
             WHERE event_id = ? AND subscriber = ? AND lease_owner = ? AND status = 'processing'`,
            [nextRetryIso, errMsg, nowIso, delivery.event_id, delivery.subscriber, workerId],
          ),
        );
        retried += 1;
      }
    }
  }

  for (const eventId of touchedEventIds) {
    await syncParentOutboxEventState(eventId, nowIso);
  }

  return { processed, delivered, retried, deadLettered, recovered };
}

/**
 * Stateful transactional outbox dispatcher managing isolated per-subscriber
 * subscriptions, lease recovery, exponential backoff retries, and dead-lettering.
 */
export class OutboxDispatcher {
  private readonly subscribers = new Map<string, OutboxSubscriber>();
  private readonly defaults: Omit<DispatchOutboxOptions, "now">;

  constructor(options: Omit<DispatchOutboxOptions, "now"> = {}) {
    this.defaults = { ...options };
  }

  subscribe(subscriber: OutboxSubscriber): () => void {
    const name = subscriber.name.trim();
    if (!name) {
      throw new Error("Outbox subscriber name cannot be empty.");
    }
    if (this.subscribers.has(name)) {
      throw new Error(`Duplicate outbox subscriber '${name}'.`);
    }
    const normalized: OutboxSubscriber = {
      ...subscriber,
      name,
      pattern: subscriber.pattern?.trim() || "*",
    };
    this.subscribers.set(name, normalized);
    return () => {
      this.subscribers.delete(name);
    };
  }

  unsubscribe(name: string): boolean {
    return this.subscribers.delete(name);
  }

  listSubscribers(): OutboxSubscriber[] {
    return [...this.subscribers.values()];
  }

  async ensureSchema(): Promise<void> {
    await ensureOutboxSchema();
  }

  async enqueue(input: EnqueueOutboxEventInput): Promise<OutboxEventRecord> {
    return enqueueOutboxEvent(input);
  }

  async recoverExpiredLeases(
    options: RecoverOutboxLeasesOptions = {},
  ): Promise<RecoverOutboxLeasesResult> {
    return recoverExpiredOutboxLeases({
      leaseTtlMs: this.defaults.leaseTtlMs,
      maxAttempts: this.defaults.maxAttempts,
      ...options,
    });
  }

  async dispatchBatch(options: DispatchOutboxOptions = {}): Promise<DispatchOutboxBatchResult> {
    return dispatchOutboxBatch([...this.subscribers.values()], {
      ...this.defaults,
      ...options,
    });
  }

  async getEvent(eventId: string): Promise<OutboxEventRecord | null> {
    await ensureOutboxSchema();
    const row = await getDb().get<OutboxEventRecord>(
      "SELECT * FROM _orm_outbox_events WHERE id = ?",
      [eventId],
    );
    return row ?? null;
  }

  async listDeliveries(eventId: string): Promise<OutboxDeliveryRecord[]> {
    await ensureOutboxSchema();
    return getDb().all<OutboxDeliveryRecord>(
      "SELECT * FROM _orm_outbox_deliveries WHERE event_id = ? ORDER BY subscriber ASC",
      [eventId],
    );
  }
}
