import { z } from "zod";
import {
  ConflictError,
  defineModel,
  syncModels,
  SYSTEM_ACTOR,
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

/** Ensures the durable `ops_jobs` table and indexes exist cleanly. */
export async function ensureJobQueueSchema(): Promise<void> {
  await syncModels([opsJobModel]);
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
        if (error instanceof ConflictError) {
          contended = true;
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
    const failed = await failJob(claimed.id, options.workerId, error, {}, scopedActor);
    return { processed: true, job: failed ?? claimed };
  }
}
