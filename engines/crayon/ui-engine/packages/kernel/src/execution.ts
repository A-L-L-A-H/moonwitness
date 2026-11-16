import { evaluateAuthority } from "./authority.js";
import { assessPossibility } from "./constraints.js";
import { evaluateTransitionReadiness } from "./state.js";
import type {
  Actor,
  AuthorityDecision,
  AuthorityRule,
  CommitmentAssessment,
  Entity,
  Evidence,
  Knowledge,
  Observation,
  Possibility,
  PossibilityAssessment,
  Transition,
  TransitionReadiness,
} from "./model.js";

const commitmentRecords = new WeakSet<object>();
const validatedExecutionRequests = new WeakSet<object>();
const consumedExecutionRequests = new WeakSet<object>();
const invalidatedExecutionRequests = new WeakSet<object>();
const activeExecutionLeases = new WeakSet<object>();

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }

  return Object.freeze(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }

  return value;
}

function sameSemanticValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export interface CommitmentRecord {
  readonly id: string;
  readonly actorId: string;
  readonly transitionId: string;
  readonly committedAt: string;
  readonly assessment: CommitmentAssessment;
}

export type ExecutionGateReasonCode =
  | "TRANSITION_STALE"
  | "TRANSITION_POSSIBILITY_MISMATCH"
  | "POSSIBILITY_UNAVAILABLE"
  | "POSSIBILITY_UNKNOWN"
  | "COMMIT_AUTHORITY_DENIED"
  | "COMMIT_AUTHORITY_UNKNOWN"
  | "EXECUTE_AUTHORITY_DENIED"
  | "EXECUTE_AUTHORITY_UNKNOWN"
  | "INVALID_COMMITMENT_RECORD"
  | "COMMITMENT_ACTOR_MISMATCH"
  | "COMMITMENT_TRANSITION_MISMATCH";

export interface ExecutionGateReason {
  code: ExecutionGateReasonCode;
  detail?: Record<string, unknown>;
}

type ValidReadiness = Extract<TransitionReadiness, { status: "valid" }>;

export interface ValidatedExecutionRequest {
  readonly id: string;
  readonly transition: Transition;
  readonly readiness: ValidReadiness;
  readonly possibility: PossibilityAssessment;
  readonly commitment: CommitmentRecord;
  readonly commitAuthority: AuthorityDecision;
  readonly executeAuthority: AuthorityDecision;
  readonly committer: Actor;
  readonly executor: Actor;
  readonly preparedAt: string;
}

export type ExecutionGateResult =
  | {
      status: "ready";
      request: ValidatedExecutionRequest;
      reasons: [];
    }
  | {
      status: "rejected";
      transitionId: string;
      readiness: TransitionReadiness;
      possibility: PossibilityAssessment;
      commitAuthority: AuthorityDecision;
      executeAuthority: AuthorityDecision;
      reasons: ExecutionGateReason[];
    };

export interface ExecutionLease {
  readonly id: string;
  readonly executionRequestId: string;
  readonly transitionId: string;
  readonly executorId: string;
  readonly startedAt: string;
}

export type ExecutionStartResult =
  | {
      status: "started";
      lease: ExecutionLease;
      readiness: ValidReadiness;
    }
  | {
      status: "rejected";
      reason:
        | "INVALID_EXECUTION_REQUEST"
        | "EXECUTION_ALREADY_STARTED"
        | "EXECUTION_REQUEST_INVALIDATED"
        | "TRANSITION_STALE";
      readiness?: TransitionReadiness;
    };

export interface ExecutionObservationBatch {
  id: string;
  executionRequestId: string;
  executionLeaseId: string;
  observations: Observation[];
  observedAt: string;
  evidence?: Evidence[];
}

export function createCommitmentRecord(args: {
  id: string;
  actor: Actor;
  transition: Transition;
  committedAt: string;
  assessment: CommitmentAssessment;
}): CommitmentRecord {
  const record = deepFreeze({
    id: args.id,
    actorId: args.actor.id,
    transitionId: args.transition.id,
    committedAt: args.committedAt,
    assessment: structuredClone(args.assessment),
  });

  commitmentRecords.add(record);
  return record;
}

export function isCommitmentRecord(value: unknown): value is CommitmentRecord {
  return typeof value === "object" && value !== null && commitmentRecords.has(value);
}

export function prepareExecution(args: {
  id: string;
  transition: Transition;
  possibility: Possibility;
  currentEntities: Entity[];
  knowledge: Knowledge[];
  committer: Actor;
  executor: Actor;
  commitment: CommitmentRecord;
  authorityRules: AuthorityRule[];
  situationId?: string;
  evaluatedAt: string;
}): ExecutionGateResult {
  const readiness = evaluateTransitionReadiness({
    transition: args.transition,
    currentEntities: args.currentEntities,
    evaluatedAt: args.evaluatedAt,
  });

  const possibility = assessPossibility({
    possibility: args.possibility,
    actor: args.committer,
    knowledge: args.knowledge,
    authorityRules: args.authorityRules,
    situationId: args.situationId,
  });

  const commitAuthority = evaluateAuthority({
    request: {
      actor: args.committer,
      capability: "commit",
      subject: args.possibility.subject,
      situationId: args.situationId,
    },
    rules: args.authorityRules,
  });

  const executeAuthority = evaluateAuthority({
    request: {
      actor: args.executor,
      capability: "execute",
      subject: args.possibility.subject,
      situationId: args.situationId,
    },
    rules: args.authorityRules,
  });

  const reasons: ExecutionGateReason[] = [];

  if (readiness.status === "stale") {
    reasons.push({
      code: "TRANSITION_STALE",
      detail: {
        failures: readiness.failures,
        requiredAction: readiness.requiredAction,
      },
    });
  }

  const intentPossibilityMatches =
    args.transition.intent.possibilityId === args.possibility.id;
  const consequenceMatches = sameSemanticValue(
    args.transition.consequence,
    args.possibility.consequence,
  );

  if (!intentPossibilityMatches || !consequenceMatches) {
    reasons.push({
      code: "TRANSITION_POSSIBILITY_MISMATCH",
      detail: {
        intentPossibilityId: args.transition.intent.possibilityId,
        suppliedPossibilityId: args.possibility.id,
        intentPossibilityMatches,
        consequenceMatches,
      },
    });
  }

  if (possibility.status === "unavailable") {
    reasons.push({
      code: "POSSIBILITY_UNAVAILABLE",
      detail: { reasons: possibility.reasons },
    });
  } else if (possibility.status === "unknown") {
    reasons.push({
      code: "POSSIBILITY_UNKNOWN",
      detail: { reasons: possibility.reasons },
    });
  }

  if (commitAuthority.status === "denied") {
    reasons.push({ code: "COMMIT_AUTHORITY_DENIED" });
  } else if (commitAuthority.status === "unknown") {
    reasons.push({ code: "COMMIT_AUTHORITY_UNKNOWN" });
  }

  if (executeAuthority.status === "denied") {
    reasons.push({ code: "EXECUTE_AUTHORITY_DENIED" });
  } else if (executeAuthority.status === "unknown") {
    reasons.push({ code: "EXECUTE_AUTHORITY_UNKNOWN" });
  }

  if (!isCommitmentRecord(args.commitment)) {
    reasons.push({ code: "INVALID_COMMITMENT_RECORD" });
  } else {
    if (args.commitment.actorId !== args.committer.id) {
      reasons.push({
        code: "COMMITMENT_ACTOR_MISMATCH",
        detail: {
          commitmentActorId: args.commitment.actorId,
          committerId: args.committer.id,
        },
      });
    }

    if (args.commitment.transitionId !== args.transition.id) {
      reasons.push({
        code: "COMMITMENT_TRANSITION_MISMATCH",
        detail: {
          commitmentTransitionId: args.commitment.transitionId,
          transitionId: args.transition.id,
        },
      });
    }
  }

  if (reasons.length > 0 || readiness.status !== "valid") {
    return {
      status: "rejected",
      transitionId: args.transition.id,
      readiness,
      possibility,
      commitAuthority,
      executeAuthority,
      reasons,
    };
  }

  const request = deepFreeze({
    id: args.id,
    transition: structuredClone(args.transition),
    readiness: structuredClone(readiness),
    possibility: structuredClone(possibility),
    commitment: args.commitment,
    commitAuthority: structuredClone(commitAuthority),
    executeAuthority: structuredClone(executeAuthority),
    committer: structuredClone(args.committer),
    executor: structuredClone(args.executor),
    preparedAt: args.evaluatedAt,
  }) as ValidatedExecutionRequest;

  validatedExecutionRequests.add(request);
  return { status: "ready", request, reasons: [] };
}

export function isValidatedExecutionRequest(
  value: unknown,
): value is ValidatedExecutionRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    validatedExecutionRequests.has(value)
  );
}

export function beginExecution(args: {
  id: string;
  request: ValidatedExecutionRequest;
  currentEntities: Entity[];
  startedAt: string;
}): ExecutionStartResult {
  if (!isValidatedExecutionRequest(args.request)) {
    return { status: "rejected", reason: "INVALID_EXECUTION_REQUEST" };
  }

  if (invalidatedExecutionRequests.has(args.request)) {
    return { status: "rejected", reason: "EXECUTION_REQUEST_INVALIDATED" };
  }

  if (consumedExecutionRequests.has(args.request)) {
    return { status: "rejected", reason: "EXECUTION_ALREADY_STARTED" };
  }

  const readiness = evaluateTransitionReadiness({
    transition: args.request.transition,
    currentEntities: args.currentEntities,
    evaluatedAt: args.startedAt,
  });

  if (readiness.status === "stale") {
    invalidatedExecutionRequests.add(args.request);
    return {
      status: "rejected",
      reason: "TRANSITION_STALE",
      readiness,
    };
  }

  consumedExecutionRequests.add(args.request);

  const lease = deepFreeze({
    id: args.id,
    executionRequestId: args.request.id,
    transitionId: args.request.transition.id,
    executorId: args.request.executor.id,
    startedAt: args.startedAt,
  });

  activeExecutionLeases.add(lease);
  return { status: "started", lease, readiness };
}

export function isExecutionLease(value: unknown): value is ExecutionLease {
  return typeof value === "object" && value !== null && activeExecutionLeases.has(value);
}

export function createExecutionObservationBatch(args: {
  id: string;
  lease: ExecutionLease;
  observations: Observation[];
  observedAt: string;
  evidence?: Evidence[];
}): ExecutionObservationBatch {
  if (!isExecutionLease(args.lease)) {
    throw new Error("INVALID_EXECUTION_LEASE");
  }

  return {
    id: args.id,
    executionRequestId: args.lease.executionRequestId,
    executionLeaseId: args.lease.id,
    observations: structuredClone(args.observations),
    observedAt: args.observedAt,
    evidence: structuredClone(args.evidence),
  };
}
