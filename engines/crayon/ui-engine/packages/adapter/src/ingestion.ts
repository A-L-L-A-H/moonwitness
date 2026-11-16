import type { Observation } from "allah-crayon-kernel";

export type ObservationIngestionReasonCode =
  | "INVALID_OBSERVATION_ID"
  | "INVALID_SUBJECT_ID"
  | "INVALID_PROPERTY"
  | "INVALID_OBSERVED_AT"
  | "OBSERVED_AT_IN_FUTURE"
  | "INVALID_VALID_UNTIL"
  | "VALID_UNTIL_BEFORE_OBSERVED_AT"
  | "MISSING_SOURCE"
  | "INVALID_RELIABILITY"
  | "LOW_RELIABILITY"
  | "MISSING_EVIDENCE"
  | "INVALID_EVIDENCE_ID"
  | "DUPLICATE_EVIDENCE_ID"
  | "MISSING_EVIDENCE_SOURCE"
  | "INVALID_EVIDENCE_TIME"
  | "EVIDENCE_TIME_IN_FUTURE";

export interface ObservationIngestionIssue {
  code: ObservationIngestionReasonCode;
  path: string;
  explanation: string;
}

export interface ObservationIngestionPolicy {
  receivedAt: string;
  maxFutureSkewMs?: number;
  minimumReliability?: number;
  requireEvidence?: boolean;
}

export interface ObservationIngestionReport {
  accepted: boolean;
  receivedAt: string;
  freshness: "current" | "stale" | "unbounded" | "invalid";
  issues: readonly ObservationIngestionIssue[];
}

export type ObservationIngestionResult<T = unknown> =
  | {
      accepted: true;
      observation: Readonly<Observation<T>>;
      report: ObservationIngestionReport;
    }
  | {
      accepted: false;
      report: ObservationIngestionReport;
    };

export function ingestObservation<T>(
  observation: Observation<T>,
  policy: ObservationIngestionPolicy,
): ObservationIngestionResult<T> {
  const issues: ObservationIngestionIssue[] = [];
  const receivedAtMs = parseTime(policy.receivedAt);
  if (receivedAtMs === null) throw new Error("Observation ingestion policy requires a valid explicit receivedAt timestamp.");
  const skew = Math.max(0, policy.maxFutureSkewMs ?? 0);
  const minimumReliability = policy.minimumReliability;
  if (minimumReliability !== undefined && !unitInterval(minimumReliability)) {
    throw new Error("Observation ingestion minimumReliability must be within 0..1.");
  }

  if (!nonEmpty(observation?.id)) issues.push(issue("INVALID_OBSERVATION_ID", "observation.id", "Observation identity is required."));
  if (!nonEmpty(observation?.subject?.id)) issues.push(issue("INVALID_SUBJECT_ID", "observation.subject.id", "Observation subject identity is required."));
  if (!nonEmpty(observation?.property)) issues.push(issue("INVALID_PROPERTY", "observation.property", "Observed property is required."));
  if (!nonEmpty(observation?.source)) issues.push(issue("MISSING_SOURCE", "observation.source", "Observation provenance source is required."));
  assessReliability(observation?.reliability, minimumReliability, "observation.reliability", issues);

  const observedMs = parseTime(observation?.observedAt);
  if (observedMs === null) {
    issues.push(issue("INVALID_OBSERVED_AT", "observation.observedAt", "Observation timestamp must be valid."));
  } else if (observedMs > receivedAtMs + skew) {
    issues.push(issue("OBSERVED_AT_IN_FUTURE", "observation.observedAt", "Observation timestamp exceeds allowed future clock skew relative to receivedAt."));
  }

  let validUntilMs: number | null | undefined;
  if (observation?.validUntil !== undefined) {
    validUntilMs = parseTime(observation.validUntil);
    if (validUntilMs === null) {
      issues.push(issue("INVALID_VALID_UNTIL", "observation.validUntil", "Observation validUntil must be a valid timestamp."));
    } else if (observedMs !== null && validUntilMs < observedMs) {
      issues.push(issue("VALID_UNTIL_BEFORE_OBSERVED_AT", "observation.validUntil", "Observation cannot expire before it was observed."));
    }
  }

  const evidence = observation?.evidence ?? [];
  if (policy.requireEvidence && evidence.length === 0) {
    issues.push(issue("MISSING_EVIDENCE", "observation.evidence", "This ingestion policy requires explicit evidence provenance."));
  }
  const evidenceIds = new Set<string>();
  for (let index = 0; index < evidence.length; index += 1) {
    const item = evidence[index];
    if (!nonEmpty(item.id)) {
      issues.push(issue("INVALID_EVIDENCE_ID", `observation.evidence[${index}].id`, "Evidence identity is required."));
    } else if (evidenceIds.has(item.id)) {
      issues.push(issue("DUPLICATE_EVIDENCE_ID", `observation.evidence[${index}].id`, `Evidence identity ${item.id} is duplicated in the same observation.`));
    } else {
      evidenceIds.add(item.id);
    }
    if (!nonEmpty(item.source)) issues.push(issue("MISSING_EVIDENCE_SOURCE", `observation.evidence[${index}].source`, "Evidence source is required."));
    assessReliability(item.reliability, minimumReliability, `observation.evidence[${index}].reliability`, issues);
    const evidenceMs = parseTime(item.observedAt);
    if (evidenceMs === null) {
      issues.push(issue("INVALID_EVIDENCE_TIME", `observation.evidence[${index}].observedAt`, "Evidence timestamp must be valid."));
    } else if (evidenceMs > receivedAtMs + skew) {
      issues.push(issue("EVIDENCE_TIME_IN_FUTURE", `observation.evidence[${index}].observedAt`, "Evidence timestamp exceeds allowed future clock skew relative to receivedAt."));
    }
  }

  const freshness = issues.length > 0
    ? "invalid"
    : validUntilMs === undefined
      ? "unbounded"
      : validUntilMs !== null && validUntilMs < receivedAtMs
        ? "stale"
        : "current";

  const report: ObservationIngestionReport = deepFreeze({
    accepted: issues.length === 0,
    receivedAt: policy.receivedAt,
    freshness,
    issues,
  });
  if (!report.accepted) return { accepted: false, report };

  return {
    accepted: true,
    observation: deepFreeze(structuredClone(observation)),
    report,
  };
}

function assessReliability(
  value: number | undefined,
  minimum: number | undefined,
  path: string,
  issues: ObservationIngestionIssue[],
): void {
  if (value !== undefined && !unitInterval(value)) {
    issues.push(issue("INVALID_RELIABILITY", path, "Reliability must be within 0..1."));
    return;
  }
  if (minimum !== undefined && (value === undefined || value < minimum)) {
    issues.push(issue("LOW_RELIABILITY", path, `Reliability must be explicitly at least ${minimum}.`));
  }
}

function parseTime(value: unknown): number | null {
  if (!nonEmpty(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function issue(code: ObservationIngestionReasonCode, path: string, explanation: string): ObservationIngestionIssue {
  return { code, path, explanation };
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
