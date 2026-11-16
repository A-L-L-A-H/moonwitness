import type {
  Evidence,
  Knowledge,
  Observation,
  ReconciliationReason,
  ReconciliationResult,
} from "./model.js";

const FACT_RELIABILITY_THRESHOLD = 0.95;

export function knowledgeFromObservation<T>(
  observation: Observation<T>,
): Knowledge<T> {
  const reliability = observation.reliability ?? 1;

  return {
    id: `knowledge:${observation.id}`,
    key: `${observation.subject.id}.${observation.property}`,
    value: observation.value,
    epistemic: reliability >= FACT_RELIABILITY_THRESHOLD ? "fact" : "uncertain",
    certainty: reliability,
    evidence: observation.evidence,
    observations: [observation.id],
  };
}

function isStale(observation: Observation, evaluatedAt: string): boolean {
  if (!observation.validUntil) {
    return false;
  }

  return Date.parse(evaluatedAt) > Date.parse(observation.validUntil);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function reconcileObservations<T>(args: {
  id: string;
  key: string;
  observations: Observation<T>[];
  evaluatedAt: string;
  evidence?: Evidence[];
}): ReconciliationResult<T> {
  const reasons: ReconciliationReason[] = [];
  const allObservationIds = args.observations.map((observation) => observation.id);

  if (args.observations.length === 0) {
    reasons.push({ code: "NO_OBSERVATION" });

    return {
      knowledge: {
        id: args.id,
        key: args.key,
        epistemic: "unknown",
        certainty: 0,
        evidence: args.evidence,
        observations: [],
      },
      reasons,
      evaluatedAt: args.evaluatedAt,
    };
  }

  const stale = args.observations.filter((observation) =>
    isStale(observation, args.evaluatedAt),
  );

  if (stale.length > 0) {
    reasons.push({
      code: "STALE_OBSERVATION",
      observationIds: stale.map((observation) => observation.id),
      sources: unique(stale.map((observation) => observation.source)),
    });
  }

  const fresh = args.observations.filter(
    (observation) => !isStale(observation, args.evaluatedAt),
  );

  const missingValue = fresh.filter((observation) => observation.value === undefined);
  if (missingValue.length > 0) {
    reasons.push({
      code: "NO_VALUE",
      observationIds: missingValue.map((observation) => observation.id),
      sources: unique(missingValue.map((observation) => observation.source)),
    });
  }

  const populated = fresh.filter((observation) => observation.value !== undefined);

  if (populated.length === 0) {
    return {
      knowledge: {
        id: args.id,
        key: args.key,
        epistemic: "unknown",
        certainty: 0,
        evidence: args.evidence,
        observations: allObservationIds,
      },
      reasons,
      evaluatedAt: args.evaluatedAt,
    };
  }

  const lowReliability = populated.filter(
    (observation) => (observation.reliability ?? 1) < FACT_RELIABILITY_THRESHOLD,
  );

  if (lowReliability.length > 0) {
    reasons.push({
      code: "LOW_RELIABILITY",
      observationIds: lowReliability.map((observation) => observation.id),
      sources: unique(lowReliability.map((observation) => observation.source)),
      detail: { threshold: FACT_RELIABILITY_THRESHOLD },
    });
  }

  const canonical = JSON.stringify(populated[0].value);
  const allAgree = populated.every(
    (observation) => JSON.stringify(observation.value) === canonical,
  );

  if (!allAgree) {
    reasons.push({
      code: "SOURCE_DISAGREEMENT",
      observationIds: populated.map((observation) => observation.id),
      sources: unique(populated.map((observation) => observation.source)),
    });

    return {
      knowledge: {
        id: args.id,
        key: args.key,
        epistemic: "conflicted",
        certainty: Math.min(...populated.map((observation) => observation.reliability ?? 1)),
        evidence: args.evidence,
        observations: allObservationIds,
      },
      reasons,
      evaluatedAt: args.evaluatedAt,
    };
  }

  const certainty =
    populated.reduce(
      (sum, observation) => sum + (observation.reliability ?? 1),
      0,
    ) / populated.length;

  reasons.push({
    code: "SOURCE_AGREEMENT",
    observationIds: populated.map((observation) => observation.id),
    sources: unique(populated.map((observation) => observation.source)),
  });

  return {
    knowledge: {
      id: args.id,
      key: args.key,
      value: populated[0].value,
      epistemic:
        certainty >= FACT_RELIABILITY_THRESHOLD && lowReliability.length === 0
          ? "fact"
          : "uncertain",
      certainty,
      evidence: args.evidence,
      observations: allObservationIds,
    },
    reasons,
    evaluatedAt: args.evaluatedAt,
  };
}
