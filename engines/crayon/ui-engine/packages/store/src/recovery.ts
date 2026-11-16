import type { ExternalOperationRecord } from "./index.js";

export type ExternalOperationRecoveryDecision =
  | {
      state: "no-record";
      dispatchAllowed: false;
      requiredAction: "start-with-fresh-validation";
      explanation: string;
    }
  | {
      state: "reserved-before-dispatch";
      operationId: string;
      idempotencyKey: string;
      dispatchAllowed: false;
      requiredAction: "revalidate-authority-preconditions-and-create-fresh-lease";
      explanation: string;
    }
  | {
      state: "ambiguous-after-dispatch";
      operationId: string;
      idempotencyKey: string;
      dispatchAllowed: false;
      requiredAction: "reconcile-before-any-new-dispatch";
      explanation: string;
    }
  | {
      state: "conflicted-after-dispatch";
      operationId: string;
      idempotencyKey: string;
      dispatchAllowed: false;
      requiredAction: "investigate-before-any-new-dispatch";
      explanation: string;
    }
  | {
      state: "verified-complete";
      operationId: string;
      idempotencyKey: string;
      dispatchAllowed: false;
      requiredAction: "do-not-retry";
      explanation: string;
    };

export function recoverExternalOperation(
  record: ExternalOperationRecord | undefined,
): ExternalOperationRecoveryDecision {
  if (!record) {
    return Object.freeze({
      state: "no-record" as const,
      dispatchAllowed: false as const,
      requiredAction: "start-with-fresh-validation" as const,
      explanation: "No durable external-operation identity was recovered. Begin only through fresh authority, precondition, commitment, and execution validation.",
    });
  }

  const operationId = record.identity.id;
  const idempotencyKey = record.identity.idempotencyKey;

  if (record.phase === "reserved") {
    return Object.freeze({
      state: "reserved-before-dispatch" as const,
      operationId,
      idempotencyKey,
      dispatchAllowed: false as const,
      requiredAction: "revalidate-authority-preconditions-and-create-fresh-lease" as const,
      explanation: "The operation identity survived restart but an execution lease does not. Revalidate current reality and authority, then create a new one-shot lease before dispatch.",
    });
  }

  if (!record.latestRetry) {
    return Object.freeze({
      state: "ambiguous-after-dispatch" as const,
      operationId,
      idempotencyKey,
      dispatchAllowed: false as const,
      requiredAction: "reconcile-before-any-new-dispatch" as const,
      explanation: "Dispatch was recorded but no outcome observation is linked. A duplicate external dispatch is unsafe until reconciliation establishes what happened.",
    });
  }

  if (record.latestRetry.status === "unnecessary") {
    return Object.freeze({
      state: "verified-complete" as const,
      operationId,
      idempotencyKey,
      dispatchAllowed: false as const,
      requiredAction: "do-not-retry" as const,
      explanation: "The prior outcome is verified. Recovery must preserve completion and must not dispatch the operation again.",
    });
  }

  if (record.latestRetry.reason === "OUTCOME_CONFLICTED") {
    return Object.freeze({
      state: "conflicted-after-dispatch" as const,
      operationId,
      idempotencyKey,
      dispatchAllowed: false as const,
      requiredAction: "investigate-before-any-new-dispatch" as const,
      explanation: "Recovered evidence conflicts about the prior external outcome. Investigation/reconciliation is required before any new external side effect.",
    });
  }

  return Object.freeze({
    state: "ambiguous-after-dispatch" as const,
    operationId,
    idempotencyKey,
    dispatchAllowed: false as const,
    requiredAction: "reconcile-before-any-new-dispatch" as const,
    explanation: "The prior outcome remains unresolved after restart. Reconcile the durable operation before considering another dispatch.",
  });
}
