export type Id = string;

export interface EntityRef {
  id: Id;
  type?: string;
}

export interface Entity {
  id: Id;
  type: string;
  state: Record<string, unknown>;
}

export interface Relation {
  from: Id;
  type: string;
  to: Id;
  strength?: number;
}

export type EpistemicState =
  | "fact"
  | "derived"
  | "estimate"
  | "claim"
  | "uncertain"
  | "conflicted"
  | "unknown";

export interface Evidence {
  id: Id;
  source: string;
  observedAt: string;
  reliability?: number;
  detail?: Record<string, unknown>;
}

export interface Observation<T = unknown> {
  id: Id;
  subject: EntityRef;
  property: string;
  value?: T;
  observedAt: string;
  validUntil?: string;
  source: string;
  reliability?: number;
  evidence?: Evidence[];
}

export interface Expectation<T = unknown> {
  id: Id;
  subject: EntityRef;
  property: string;
  expectedValue?: T;
  expectedAt?: string;
  basis?: string[];
}

export interface Knowledge<T = unknown> {
  id: Id;
  key: string;
  value?: T;
  epistemic: EpistemicState;
  certainty?: number;
  evidence?: Evidence[];
  observations?: Id[];
}

export type ReconciliationReasonCode =
  | "NO_OBSERVATION"
  | "NO_VALUE"
  | "SOURCE_AGREEMENT"
  | "SOURCE_DISAGREEMENT"
  | "STALE_OBSERVATION"
  | "LOW_RELIABILITY";

export interface ReconciliationReason {
  code: ReconciliationReasonCode;
  observationIds?: Id[];
  sources?: string[];
  detail?: Record<string, unknown>;
}

export interface ReconciliationResult<T = unknown> {
  knowledge: Knowledge<T>;
  reasons: ReconciliationReason[];
  evaluatedAt: string;
}

export type ConstraintOperator =
  | "exists"
  | "equals"
  | "not-equals"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "one-of";

export interface Constraint {
  id: Id;
  knowledgeKey: string;
  operator: ConstraintOperator;
  expected?: unknown;
  acceptedEpistemic?: EpistemicState[];
  reason?: string;
}

export type ConstraintReasonCode =
  | "CONSTRAINT_SATISFIED"
  | "MISSING_KNOWLEDGE"
  | "EPISTEMIC_STATE_NOT_ACCEPTED"
  | "MISSING_VALUE"
  | "INVALID_EXPECTED_VALUE"
  | "VALUE_MISMATCH"
  | "TYPE_MISMATCH";

export interface ConstraintCheck {
  constraintId: Id;
  status: "satisfied" | "failed" | "unknown";
  reason: ConstraintReasonCode;
  knowledgeKey: string;
  actual?: unknown;
  expected?: unknown;
  detail?: Record<string, unknown>;
}

export interface ConstraintEvaluation {
  status: "satisfied" | "failed" | "unknown";
  checks: ConstraintCheck[];
}

export type Capability =
  | "observe"
  | "propose"
  | "intend"
  | "commit"
  | "execute"
  | "verify"
  | "override";

export type ActorKind = "human" | "agent" | "service";

export interface Actor {
  id: Id;
  kind: ActorKind;
  attributes?: Record<string, unknown>;
}

export interface AuthorityActorSelector {
  ids?: Id[];
  kinds?: ActorKind[];
}

export interface AuthorityScope {
  situationIds?: Id[];
  subjectIds?: Id[];
  subjectTypes?: string[];
}

export interface AuthorityRequirement {
  capability: Capability;
  subject?: EntityRef;
  situationId?: Id;
}

export interface AuthorityRule {
  id: Id;
  effect: "allow" | "deny";
  capabilities: Capability[];
  actors?: AuthorityActorSelector;
  scope?: AuthorityScope;
  reason?: string;
}

export interface AuthorityRequest {
  actor: Actor;
  capability: Capability;
  subject?: EntityRef;
  situationId?: Id;
}

export type AuthorityReasonCode =
  | "EXPLICIT_ALLOW"
  | "EXPLICIT_DENY"
  | "DENY_OVERRIDES_ALLOW"
  | "NO_MATCHING_RULE";

export interface AuthorityReason {
  code: AuthorityReasonCode;
  ruleId?: Id;
  detail?: Record<string, unknown>;
}

export interface AuthorityDecision {
  status: "allowed" | "denied" | "unknown";
  request: AuthorityRequest;
  matchedRuleIds: Id[];
  reasons: AuthorityReason[];
}

export type Reversibility =
  | "reversible"
  | "temporarily-reversible"
  | "compensatable"
  | "irreversible";

export interface Effect {
  id: Id;
  entity: Id;
  property: string;
  from?: unknown;
  to?: unknown;
  delta?: number;
  description?: string;
}

export interface Consequence {
  effects: Effect[];
  reversibility: Reversibility;
  risk: number;
  impact: number;
  uncertainty?: number;
}

export interface Possibility {
  id: Id;
  verb: string;
  subject: EntityRef;
  constraints?: Constraint[];
  authority?: AuthorityRequirement[];
  consequence: Consequence;
}

export type PossibilityReasonCode =
  | "CONSTRAINT_FAILED"
  | "CONSTRAINT_UNKNOWN"
  | "AUTHORITY_DENIED"
  | "AUTHORITY_UNKNOWN";

export interface PossibilityReason {
  code: PossibilityReasonCode;
  constraintId?: Id;
  capability?: Capability;
  detail?: Record<string, unknown>;
}

export interface PossibilityAssessment {
  possibilityId: Id;
  status: "available" | "unavailable" | "unknown";
  constraints: ConstraintEvaluation;
  authority: AuthorityDecision[];
  reasons: PossibilityReason[];
}

export interface Intent {
  id: Id;
  possibilityId: Id;
  actor: Id;
  parameters?: Record<string, unknown>;
  createdAt: string;
}

export interface StateSnapshot {
  entities: Record<Id, Record<string, unknown>>;
}

export interface PredictedOutcome {
  id: Id;
  state: StateSnapshot;
  effects: Effect[];
}

export interface TransitionPrecondition {
  id: Id;
  entity: Id;
  property: string;
  expected: unknown;
  source: "derived" | "explicit";
}

export interface PreconditionFailure {
  preconditionId: Id;
  entity: Id;
  property: string;
  expected: unknown;
  actual: unknown;
}

export type TransitionReadiness =
  | {
      status: "valid";
      transitionId: Id;
      evaluatedAt: string;
      failures: [];
    }
  | {
      status: "stale";
      transitionId: Id;
      evaluatedAt: string;
      failures: PreconditionFailure[];
      requiredAction: "reobserve-and-resimulate";
    };

export interface Transition {
  id: Id;
  before: StateSnapshot;
  prediction: PredictedOutcome;
  preconditions: TransitionPrecondition[];
  intent: Intent;
  consequence: Consequence;
}

export type OutcomeStatus =
  | "verified"
  | "partial"
  | "unverified"
  | "conflicted";

export interface ObservedOutcome {
  id: Id;
  observations: Observation[];
  observedAt: string;
  evidence?: Evidence[];
}

export interface CommitmentAssessment {
  score: number;
  mode:
    | "direct"
    | "visible-consequence"
    | "explicit-preview"
    | "deliberate"
    | "high-assurance";
  reasons: {
    risk: number;
    impact: number;
    irreversibility: number;
    uncertainty: number;
    authorityCost: number;
  };
}

export interface Witness {
  id: Id;
  actor: Id;
  intentId: Id;
  transitionId: Id;
  status: OutcomeStatus;
  before: StateSnapshot;
  prediction: PredictedOutcome;
  observed: ObservedOutcome;
  happenedAt: string;
  evidence?: Evidence[];
}

export interface WitnessOutcomeCheck {
  entity: Id;
  property: string;
  predicted: unknown;
  reconciliation: ReconciliationResult;
  matchesPrediction: boolean | null;
}

export interface WitnessReconciliation {
  id: Id;
  witnessId: Id;
  status: OutcomeStatus;
  evaluatedAt: string;
  checks: WitnessOutcomeCheck[];
}

export type RetryAssessment =
  | {
      status: "blocked";
      witnessId: Id;
      reason: "OUTCOME_UNRESOLVED";
      requiredAction: "reconcile-before-retry";
    }
  | {
      status: "blocked";
      witnessId: Id;
      reason: "OUTCOME_CONFLICTED";
      requiredAction: "investigate-before-retry";
    }
  | {
      status: "unnecessary";
      witnessId: Id;
      reason: "OUTCOME_VERIFIED";
      requiredAction: "do-not-retry";
    };

export interface Situation {
  id: Id;
  anchor: EntityRef;
  entities: Entity[];
  relations: Relation[];
  observations: Observation[];
  expectations: Expectation[];
  knowledge: Knowledge[];
  possibilities: Possibility[];
  now: string;
}
