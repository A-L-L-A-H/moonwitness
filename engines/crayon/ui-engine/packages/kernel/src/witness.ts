import {
  reconcileObservations,
} from "./knowledge.js";

import type {
  Evidence,
  Observation,
  ObservedOutcome,
  OutcomeStatus,
  PredictedOutcome,
  RetryAssessment,
  Transition,
  Witness,
  WitnessOutcomeCheck,
  WitnessReconciliation,
} from "./model.js";

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildOutcomeChecks(args: {
  idPrefix: string;
  prediction: PredictedOutcome;
  observations: Observation[];
  evaluatedAt: string;
}): WitnessOutcomeCheck[] {
  const uniqueTargets = new Map<string, { entity: string; property: string }>();

  for (const effect of args.prediction.effects) {
    uniqueTargets.set(`${effect.entity}::${effect.property}`, {
      entity: effect.entity,
      property: effect.property,
    });
  }

  return [...uniqueTargets.values()].map(({ entity, property }) => {
    const relevant = args.observations.filter(
      (observation) =>
        observation.subject.id === entity && observation.property === property,
    );

    const reconciliation = reconcileObservations({
      id: `${args.idPrefix}:${entity}:${property}`,
      key: `${entity}.${property}`,
      observations: relevant,
      evaluatedAt: args.evaluatedAt,
    });

    const predicted = args.prediction.state.entities[entity]?.[property];
    const comparable =
      reconciliation.knowledge.value !== undefined &&
      reconciliation.knowledge.epistemic !== "conflicted" &&
      reconciliation.knowledge.epistemic !== "unknown";

    return {
      entity,
      property,
      predicted: structuredClone(predicted),
      reconciliation,
      matchesPrediction: comparable
        ? sameValue(reconciliation.knowledge.value, predicted)
        : null,
    };
  });
}

function deriveOutcomeStatus(checks: WitnessOutcomeCheck[]): OutcomeStatus {
  if (checks.length === 0) {
    return "unverified";
  }

  const hasConflict = checks.some(
    (check) =>
      check.reconciliation.knowledge.epistemic === "conflicted" ||
      check.matchesPrediction === false,
  );

  if (hasConflict) {
    return "conflicted";
  }

  const fullyVerified = checks.every(
    (check) =>
      check.reconciliation.knowledge.epistemic === "fact" &&
      check.matchesPrediction === true,
  );

  if (fullyVerified) {
    return "verified";
  }

  const anyEstablished = checks.some(
    (check) =>
      check.matchesPrediction === true &&
      check.reconciliation.knowledge.epistemic !== "unknown",
  );

  return anyEstablished ? "partial" : "unverified";
}

export function createObservedOutcome(args: {
  id: string;
  observations: Observation[];
  observedAt: string;
  evidence?: Evidence[];
}): ObservedOutcome {
  return {
    id: args.id,
    observations: structuredClone(args.observations),
    observedAt: args.observedAt,
    evidence: args.evidence,
  };
}

export function createWitness(args: {
  id: string;
  transition: Transition;
  observed: ObservedOutcome;
  actor: string;
  happenedAt: string;
  evidence?: Evidence[];
}): Witness {
  const checks = buildOutcomeChecks({
    idPrefix: `${args.id}:initial`,
    prediction: args.transition.prediction,
    observations: args.observed.observations,
    evaluatedAt: args.observed.observedAt,
  });

  return {
    id: args.id,
    actor: args.actor,
    intentId: args.transition.intent.id,
    transitionId: args.transition.id,
    status: deriveOutcomeStatus(checks),
    before: args.transition.before,
    prediction: structuredClone(args.transition.prediction),
    observed: structuredClone(args.observed),
    happenedAt: args.happenedAt,
    evidence: args.evidence,
  };
}

export function reconcileWitnessOutcome(args: {
  id: string;
  witness: Witness;
  observations: Observation[];
  evaluatedAt: string;
}): WitnessReconciliation {
  const checks = buildOutcomeChecks({
    idPrefix: args.id,
    prediction: args.witness.prediction,
    observations: args.observations,
    evaluatedAt: args.evaluatedAt,
  });

  return {
    id: args.id,
    witnessId: args.witness.id,
    status: deriveOutcomeStatus(checks),
    evaluatedAt: args.evaluatedAt,
    checks,
  };
}

export function assessRetrySafety(args: {
  witness: Witness;
  reconciliation?: WitnessReconciliation;
}): RetryAssessment {
  const effectiveStatus = args.reconciliation?.status ?? args.witness.status;

  if (effectiveStatus === "verified") {
    return {
      status: "unnecessary",
      witnessId: args.witness.id,
      reason: "OUTCOME_VERIFIED",
      requiredAction: "do-not-retry",
    };
  }

  if (effectiveStatus === "conflicted") {
    return {
      status: "blocked",
      witnessId: args.witness.id,
      reason: "OUTCOME_CONFLICTED",
      requiredAction: "investigate-before-retry",
    };
  }

  return {
    status: "blocked",
    witnessId: args.witness.id,
    reason: "OUTCOME_UNRESOLVED",
    requiredAction: "reconcile-before-retry",
  };
}
