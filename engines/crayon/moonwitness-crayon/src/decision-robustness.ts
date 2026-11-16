/**
 * Deterministic robustness assessment for declared CRAYON decision scenarios.
 *
 * The result describes stability across the supplied scenarios; it makes no
 * claim about truth, probability, validity, or a real-world outcome.
 */
export type DecisionRisk = "low" | "medium" | "high" | "critical";
export type DecisionReversibility = "reversible" | "partially-reversible" | "irreversible";

export interface DecisionContext {
  risk: DecisionRisk;
  reversibility: DecisionReversibility;
}

export type ScenarioStatus = "live" | "weak" | "rejected";

export interface DecisionScenario {
  id: string;
  label: string;
  status: ScenarioStatus;
  decisionKey?: string;
  rationale: string;
  discriminatingEvidenceNeeded?: readonly string[];
}

export type DecisionRobustness = "robust" | "conditional" | "fragile" | "blocked";
export type RobustnessRecommendation =
  | "proceed-with-bounds"
  | "gather-discriminating-evidence"
  | "bounded-reversible-test"
  | "stop-high-consequence-action";

export interface DecisionRobustnessReport {
  classification: DecisionRobustness;
  liveScenarios: number;
  distinctLiveDecisions: number;
  dominantDecision?: string;
  consensusRatio: number;
  recommendation: RobustnessRecommendation;
  reasons: readonly string[];
  interpretation: "stability-across-declared-scenarios-not-correctness";
}

const INTERPRETATION = "stability-across-declared-scenarios-not-correctness" as const;

function normalizeDecision(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function highConsequence(context: DecisionContext): boolean {
  return context.risk === "high" || context.risk === "critical" || context.reversibility === "irreversible";
}

function blockedRecommendation(context: DecisionContext): RobustnessRecommendation {
  return highConsequence(context) ? "stop-high-consequence-action" : "gather-discriminating-evidence";
}

/**
 * Assesses whether the declared live scenarios preserve an identical decision
 * direction. Scenario status, context, and decision keys are caller-supplied
 * research inputs and are not independently inferred here.
 */
export function assessDecisionRobustness(
  scenarios: readonly DecisionScenario[],
  context: DecisionContext,
): DecisionRobustnessReport {
  const live = scenarios.filter((scenario) => scenario.status === "live");
  if (!live.length) {
    return {
      classification: "blocked", liveScenarios: 0, distinctLiveDecisions: 0, consensusRatio: 0,
      recommendation: blockedRecommendation(context),
      reasons: ["No live scenario has been declared; robustness cannot be assessed."],
      interpretation: INTERPRETATION,
    };
  }

  const decisions = live.map((scenario) => normalizeDecision(scenario.decisionKey));
  const distinctNonEmpty = new Set(decisions.filter(Boolean));
  if (decisions.some((decision) => !decision)) {
    return {
      classification: "blocked", liveScenarios: live.length, distinctLiveDecisions: distinctNonEmpty.size, consensusRatio: 0,
      recommendation: blockedRecommendation(context),
      reasons: ["At least one live scenario has no explicit L4 decision key."],
      interpretation: INTERPRETATION,
    };
  }

  const counts = new Map<string, number>();
  for (const decision of decisions) counts.set(decision, (counts.get(decision) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const dominantDecision = ranked[0]?.[0];
  const consensusRatio = (ranked[0]?.[1] ?? 0) / live.length;
  const distinctLiveDecisions = counts.size;
  const classification: DecisionRobustness = distinctLiveDecisions === 1
    ? "robust"
    : consensusRatio >= 0.67 ? "conditional" : "fragile";
  const reasons: string[] = [];
  if (distinctLiveDecisions > 1) reasons.push(`${distinctLiveDecisions} different L4 directions remain live across declared scenarios.`);
  if (classification === "robust") reasons.push("All live scenarios converge on the same normalized L4 direction under the declared scenario set.");
  if (classification === "conditional") reasons.push("A dominant direction exists, but alternatives remain material.");
  if (classification === "fragile") reasons.push("L4 changes materially across live scenarios; discriminate among them before committing.");

  const recommendation: RobustnessRecommendation = classification === "robust"
    ? "proceed-with-bounds"
    : classification === "conditional" && context.reversibility === "reversible" && context.risk !== "critical"
      ? "bounded-reversible-test"
      : highConsequence(context) ? "stop-high-consequence-action" : "gather-discriminating-evidence";

  return { classification, liveScenarios: live.length, distinctLiveDecisions, dominantDecision, consensusRatio, recommendation, reasons, interpretation: INTERPRETATION };
}
