/**
 * Genesis 00 public package entrypoint.
 *
 * Domain capabilities and canonical contracts are intentionally not implemented
 * until their authorized implementation phases.
 */
export const repositoryIdentity = "moonwitness-crayon" as const;

export {
  ORDINAL_SCORE_DIMENSIONS,
  compareOrdinalScores,
  validateOrdinalScoreRecord,
} from "./ordinal-scoring.js";
export type {
  ArmOrdinalScoreSummary,
  OrdinalScore,
  OrdinalScoreComparison,
  OrdinalScoreDimension,
  OrdinalScoreRecord,
  StudyArm,
} from "./ordinal-scoring.js";

export { assessDecisionRobustness } from "./decision-robustness.js";
export type {
  DecisionContext,
  DecisionReversibility,
  DecisionRisk,
  DecisionRobustness,
  DecisionRobustnessReport,
  DecisionScenario,
  RobustnessRecommendation,
  ScenarioStatus,
} from "./decision-robustness.js";
