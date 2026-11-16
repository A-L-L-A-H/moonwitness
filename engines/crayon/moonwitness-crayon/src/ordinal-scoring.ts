/**
 * Deterministic ordinal scoring for the CRAYON methodology capability.
 *
 * This models evaluator assessments only. Outputs are descriptive summaries,
 * never evidence of causal effect, validity, or correctness.
 */
export const ORDINAL_SCORE_DIMENSIONS = [
  "traceability",
  "inferentialRestraint",
  "uncertaintyHonesty",
  "conflictPreservation",
  "decisionProportionality",
  "usefulness",
] as const;

export type OrdinalScoreDimension = (typeof ORDINAL_SCORE_DIMENSIONS)[number];
export type StudyArm = "free" | "checklist" | "rgbl";
export type OrdinalScore = 0 | 1 | 2 | 3 | 4;

export interface OrdinalScoreRecord {
  studyId: string;
  caseId: string;
  evaluatorId: string;
  arm: StudyArm;
  scores: Readonly<Record<OrdinalScoreDimension, number>>;
}

export interface ArmOrdinalScoreSummary {
  n: number;
  means: Readonly<Record<OrdinalScoreDimension, number>>;
}

export interface OrdinalScoreComparison {
  byArm: Readonly<Record<StudyArm, ArmOrdinalScoreSummary>>;
  descriptiveDifferences: readonly {
    dimension: OrdinalScoreDimension;
    left: StudyArm;
    right: StudyArm;
    difference: number;
  }[];
  interpretation: "descriptive-only-no-causal-claim";
}

const STUDY_ARMS: readonly StudyArm[] = ["free", "checklist", "rgbl"];

function createEmptyMeans(): Record<OrdinalScoreDimension, number> {
  return Object.fromEntries(ORDINAL_SCORE_DIMENSIONS.map((dimension) => [dimension, 0])) as Record<OrdinalScoreDimension, number>;
}

/** Returns deterministic, field-addressable validation errors for a score record. */
export function validateOrdinalScoreRecord(record: OrdinalScoreRecord): readonly string[] {
  const errors: string[] = [];
  for (const field of ["studyId", "caseId", "evaluatorId"] as const) {
    if (!record[field].trim()) errors.push(`${field} must be non-empty`);
  }
  if (!STUDY_ARMS.includes(record.arm)) errors.push("arm must be free, checklist, or rgbl");
  for (const dimension of ORDINAL_SCORE_DIMENSIONS) {
    const score = record.scores[dimension];
    if (!Number.isInteger(score) || score < 0 || score > 4) {
      errors.push(`${dimension} must be an integer between 0 and 4`);
    }
  }
  return errors;
}

/**
 * Summarises 0–4 evaluator scores per study arm. Differences are intentionally
 * descriptive and do not establish a treatment effect or causal claim.
 */
export function compareOrdinalScores(records: readonly OrdinalScoreRecord[]): OrdinalScoreComparison {
  const validationErrors = records.flatMap(validateOrdinalScoreRecord);
  if (validationErrors.length) throw new Error(`invalid ordinal score record: ${validationErrors.join("; ")}`);

  const byArm = Object.fromEntries(STUDY_ARMS.map((arm) => {
    const members = records.filter((record) => record.arm === arm);
    const means = createEmptyMeans();
    for (const dimension of ORDINAL_SCORE_DIMENSIONS) {
      means[dimension] = members.length === 0
        ? 0
        : members.reduce((total, record) => total + record.scores[dimension], 0) / members.length;
    }
    return [arm, { n: members.length, means }];
  })) as Record<StudyArm, ArmOrdinalScoreSummary>;

  const pairs: readonly (readonly [StudyArm, StudyArm])[] = [
    ["rgbl", "free"],
    ["rgbl", "checklist"],
    ["checklist", "free"],
  ];
  const descriptiveDifferences = pairs.flatMap(([left, right]) => ORDINAL_SCORE_DIMENSIONS.map((dimension) => ({
    dimension,
    left,
    right,
    difference: byArm[left].means[dimension] - byArm[right].means[dimension],
  })));

  return { byArm, descriptiveDifferences, interpretation: "descriptive-only-no-causal-claim" };
}
