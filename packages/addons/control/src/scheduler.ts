import { SYSTEM_ACTOR, type ActorContext } from "@moonwitness/orm";
import { enqueueJob, processNextJob, type OpsJobRecord } from "@moonwitness/addon-base";

export type ControlSchedulerAction = "plan" | "apply";

export interface ControlDispatchRequest {
  action: ControlSchedulerAction;
  resourceKind: string;
  targetPath?: string;
  payload: Record<string, unknown>;
  traceparent?: string;
}

export interface ControlDispatchResult {
  backend: "arsy" | "queue";
  accepted: boolean;
  statusCode: number;
  jobId?: string;
  data: unknown;
}

export interface ControlSchedulerBackend {
  readonly kind: "arsy" | "queue";
  dispatch(request: ControlDispatchRequest, actor?: ActorContext): Promise<ControlDispatchResult>;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ArsySchedulerOptions {
  baseUrl: string;
  adminToken?: string;
  fetchImpl?: FetchLike;
}

/**
 * Single-host HTTP adapter delegating declarative `plan`/`apply` reconciliation
 * to the canonical `cp/arsy` daemon (`127.0.0.1:8787` by default).
 */
export class ArsyHttpSchedulerAdapter implements ControlSchedulerBackend {
  readonly kind = "arsy" as const;
  private readonly baseUrl: string;
  private readonly adminToken: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: ArsySchedulerOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.adminToken = options.adminToken ?? "";
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
  }

  async dispatch(request: ControlDispatchRequest): Promise<ControlDispatchResult> {
    const endpoint = `${this.baseUrl}/v1/${request.action}`;
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (this.adminToken) {
      headers.authorization = `Bearer ${this.adminToken}`;
    }
    if (request.traceparent) {
      headers.traceparent = request.traceparent;
    }

    const res = await this.fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        resourceKind: request.resourceKind,
        ...(request.targetPath ? { targetPath: request.targetPath } : {}),
        ...request.payload,
      }),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return {
      backend: "arsy",
      accepted: res.ok,
      statusCode: res.status,
      data,
    };
  }
}

export interface QueueSchedulerOptions {
  queueName?: string;
}

/**
 * Durable multi-worker queue adapter backed by `@moonwitness/addon-base`'s `ops.job` ledger.
 * Enables horizontal worker consumption alongside single-host `cp/arsy` execution (`ADR-010`).
 */
export class DurableQueueSchedulerAdapter implements ControlSchedulerBackend {
  readonly kind = "queue" as const;
  private readonly queueName: string;

  constructor(options: QueueSchedulerOptions = {}) {
    this.queueName = options.queueName?.trim() || "control-plane";
  }

  async dispatch(
    request: ControlDispatchRequest,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<ControlDispatchResult> {
    const job = await enqueueJob(
      {
        queue: this.queueName,
        jobType: `control.${request.action}`,
        payload: {
          resourceKind: request.resourceKind,
          targetPath: request.targetPath ?? null,
          payload: request.payload,
          traceparent: request.traceparent ?? null,
        },
      },
      actor,
    );

    return {
      backend: "queue",
      accepted: true,
      statusCode: 202,
      jobId: job.id,
      data: { queue: this.queueName, jobState: job.job_state },
    };
  }
}

/**
 * Worker helper executing one queued `control-plane` job against an upstream `ControlSchedulerBackend`.
 */
export async function processControlSchedulerJob(
  workerId: string,
  executor: (request: ControlDispatchRequest, job: OpsJobRecord) => Promise<unknown>,
  queueName = "control-plane",
): Promise<boolean> {
  const handleJob = async (payload: unknown, job: OpsJobRecord): Promise<unknown> => {
    const record = payload as {
      resourceKind?: string;
      targetPath?: string | null;
      payload?: Record<string, unknown>;
      traceparent?: string | null;
    };
    const action: ControlSchedulerAction = job.job_type === "control.apply" ? "apply" : "plan";
    return executor(
      {
        action,
        resourceKind: record.resourceKind ?? "files",
        ...(record.targetPath ? { targetPath: record.targetPath } : {}),
        payload: record.payload ?? {},
        ...(record.traceparent ? { traceparent: record.traceparent } : {}),
      },
      job,
    );
  };

  const result = await processNextJob(
    {
      "control.plan": handleJob,
      "control.apply": handleJob,
    },
    { workerId, queue: queueName },
  );
  return result.processed;
}

export function createControlScheduler(
  options: {
    mode?: "arsy" | "queue";
    arsyBaseUrl?: string;
    arsyAdminToken?: string;
    fetchImpl?: FetchLike;
    queueName?: string;
  } = {},
): ControlSchedulerBackend {
  const mode = options.mode ?? (process.env.CONTROL_SCHEDULER === "queue" ? "queue" : "arsy");
  if (mode === "queue") {
    return new DurableQueueSchedulerAdapter({ queueName: options.queueName });
  }
  return new ArsyHttpSchedulerAdapter({
    baseUrl: options.arsyBaseUrl ?? process.env.ARSY_URL ?? "http://127.0.0.1:8787",
    adminToken: options.arsyAdminToken ?? process.env.ARSY_TOKEN_ADMIN,
    fetchImpl: options.fetchImpl,
  });
}
