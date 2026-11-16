import { assessRetrySafety } from "./witness.js";
import type {
  EpistemicState,
  RetryAssessment,
  Transition,
  Witness,
  WitnessReconciliation,
} from "./model.js";

export type TemporalPhase = "prediction" | "observation" | "reconciliation" | "witness";

export interface TemporalFact {
  id: string;
  phase: Exclude<TemporalPhase, "witness">;
  at: string;
  entity: string;
  property: string;
  value?: unknown;
  epistemic?: EpistemicState;
  sourceIds: string[];
  evidenceIds: string[];
}

export interface TemporalWitnessState {
  id: string;
  phase: "witness";
  at: string;
  status: Witness["status"];
}

export interface TemporalRecord {
  version: "0";
  id: string;
  transitionId: string;
  intentId: string;
  actorId: string;
  prediction: TemporalFact[];
  observations: TemporalFact[];
  reconciliations: TemporalFact[];
  witness: TemporalWitnessState;
  retry: RetryAssessment;
  reconciliationIds: string[];
}

export function createTemporalRecord(args: {
  id: string;
  transition: Transition;
  witness: Witness;
  reconciliations?: WitnessReconciliation[];
}): TemporalRecord {
  if (args.transition.id !== args.witness.transitionId) {
    throw new Error("Temporal record transition must match witness transition identity.");
  }
  if (args.transition.intent.id !== args.witness.intentId) {
    throw new Error("Temporal record intent must match witness intent identity.");
  }

  const prediction = args.witness.prediction.effects.map((effect, index) => ({
    id: `${args.id}:prediction:${effect.id || index}`,
    phase: "prediction" as const,
    at: args.transition.intent.createdAt,
    entity: effect.entity,
    property: effect.property,
    value: clone(args.witness.prediction.state.entities[effect.entity]?.[effect.property]),
    epistemic: "estimate" as const,
    sourceIds: [args.witness.prediction.id],
    evidenceIds: [],
  }));

  const observations = args.witness.observed.observations.map((observation) => ({
    id: `${args.id}:observation:${observation.id}`,
    phase: "observation" as const,
    at: observation.observedAt,
    entity: observation.subject.id,
    property: observation.property,
    value: clone(observation.value),
    epistemic: observation.value === undefined ? "unknown" as const : "claim" as const,
    sourceIds: [observation.id, observation.source],
    evidenceIds: (observation.evidence ?? []).map((evidence) => evidence.id),
  }));

  const reconciliations = (args.reconciliations ?? []).flatMap((reconciliation) =>
    reconciliation.checks.map((check) => ({
      id: `${args.id}:reconciliation:${reconciliation.id}:${check.entity}:${check.property}`,
      phase: "reconciliation" as const,
      at: reconciliation.evaluatedAt,
      entity: check.entity,
      property: check.property,
      value: clone(check.reconciliation.knowledge.value),
      epistemic: check.reconciliation.knowledge.epistemic,
      sourceIds: [reconciliation.id, ...(check.reconciliation.knowledge.observations ?? [])],
      evidenceIds: (check.reconciliation.knowledge.evidence ?? []).map((evidence) => evidence.id),
    })),
  );

  const latest = args.reconciliations?.at(-1);
  return deepFreeze({
    version: "0" as const,
    id: args.id,
    transitionId: args.transition.id,
    intentId: args.transition.intent.id,
    actorId: args.witness.actor,
    prediction,
    observations,
    reconciliations,
    witness: {
      id: args.witness.id,
      phase: "witness" as const,
      at: args.witness.happenedAt,
      status: args.witness.status,
    },
    retry: assessRetrySafety({ witness: args.witness, reconciliation: latest }),
    reconciliationIds: (args.reconciliations ?? []).map((item) => item.id),
  });
}

function clone<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
