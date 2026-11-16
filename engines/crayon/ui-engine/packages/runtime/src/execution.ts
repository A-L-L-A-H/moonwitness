import {
  isExecutionLease,
  type ExecutionLease,
} from "allah-crayon-kernel";

export interface ExternalDispatchContext {
  operationId: string;
  idempotencyKey: string;
  transitionId: string;
  intentId: string;
}

export interface ExternalDispatchReceipt {
  operationId: string;
  dispatchedAt: string;
  transportReference?: string;
}

export type AsyncDispatchResult =
  | {
      status: "dispatched";
      receipt: Readonly<ExternalDispatchReceipt>;
      outcome: "unknown";
    }
  | {
      status: "transport-error";
      operationId: string;
      error: string;
      outcome: "unknown";
    }
  | {
      status: "rejected";
      reason: "INVALID_EXECUTION_LEASE";
    };

export interface AsyncDispatchArgs {
  lease: ExecutionLease;
  context: ExternalDispatchContext;
  dispatchedAt: string;
  perform: (context: Readonly<ExternalDispatchContext>) => Promise<{ transportReference?: string } | void>;
}

export interface AsyncExecutor {
  dispatch(args: AsyncDispatchArgs): Promise<AsyncDispatchResult>;
}

/**
 * Outer-runtime asynchronous dispatch. It authenticates the process-local Kernel
 * lease, but transport completion is deliberately never represented as an
 * observed/verified domain outcome.
 */
export function createAsyncExecutor(): AsyncExecutor {
  const consumed = new WeakSet<object>();
  return Object.freeze({
    async dispatch(args: AsyncDispatchArgs): Promise<AsyncDispatchResult> {
      if (!isExecutionLease(args.lease) || consumed.has(args.lease)) {
        return { status: "rejected", reason: "INVALID_EXECUTION_LEASE" };
      }
      assertContext(args.context, args.lease);
      assertTime(args.dispatchedAt);
      consumed.add(args.lease);
      const context = deepFreeze(structuredClone(args.context));
      try {
        const transport = await args.perform(context);
        return deepFreeze({
          status: "dispatched" as const,
          receipt: {
            operationId: context.operationId,
            dispatchedAt: args.dispatchedAt,
            transportReference: transport?.transportReference,
          },
          outcome: "unknown" as const,
        });
      } catch (error) {
        return deepFreeze({
          status: "transport-error" as const,
          operationId: context.operationId,
          error: error instanceof Error ? error.message : String(error),
          outcome: "unknown" as const,
        });
      }
    },
  });
}

function assertContext(context: ExternalDispatchContext, lease: ExecutionLease): void {
  for (const [name, value] of Object.entries(context)) {
    if (typeof value !== "string" || value.length === 0) throw new Error(`External dispatch ${name} must be non-empty.`);
  }
  if (context.transitionId !== lease.transitionId) {
    throw new Error("EXTERNAL_DISPATCH_TRANSITION_MISMATCH");
  }
}

function assertTime(value: string): void {
  if (!value || !Number.isFinite(Date.parse(value))) throw new Error("External dispatch requires a valid dispatchedAt timestamp.");
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
