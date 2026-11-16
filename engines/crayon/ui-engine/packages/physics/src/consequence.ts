import type { CommitmentAssessment, Consequence, Reversibility } from "allah-crayon-kernel";

export type ConsequenceSignalKind =
  | "declared-risk" | "effective-risk" | "derived-risk" | "policy-risk"
  | "impact" | "irreversibility" | "uncertainty" | "external-dependency" | "authority" | "policy-floor";

export interface ConsequenceContext {
  derivedRisk?: number;
  policyRisk?: number;
  externalDependency?: number;
  authorityCost?: number;
}
export interface ConsequenceSignal { kind: ConsequenceSignalKind; score: number; weight: number; contribution: number; reason: string; }
export interface ConsequencePolicy {
  riskFloor: number;
  minimumResistance: number;
  reasons: string[];
}
export interface ConsequenceProfile {
  declaredRisk: number;
  derivedRisk: number;
  policyRisk: number;
  effectiveRisk: number;
  impact: number;
  irreversibility: number;
  uncertainty: number;
  externalDependency: number;
  authorityCost: number;
  policy: ConsequencePolicy;
}
export interface ExplainableCommitmentAssessment extends CommitmentAssessment {
  profile: ConsequenceProfile;
  factors: ConsequenceSignal[];
  explanation: string[];
}

const WEIGHTS = { risk: 0.28, impact: 0.24, irreversibility: 0.20, uncertainty: 0.10, externalDependency: 0.10, authorityCost: 0.08 } as const;

export function reversibilityCost(value: Reversibility): number {
  switch (value) {
    case "reversible": return 0.05;
    case "temporarily-reversible": return 0.25;
    case "compensatable": return 0.6;
    case "irreversible": return 1;
  }
}

export function inferConsequenceUncertainty(consequence: Consequence): number {
  if (consequence.uncertainty !== undefined) return clamp(consequence.uncertainty);
  if (consequence.effects.length === 0) return 1;
  const unknownEffects = consequence.effects.filter((effect) => effect.to === undefined && effect.delta === undefined).length;
  return clamp(unknownEffects / consequence.effects.length);
}

export function deriveConsequencePolicy(consequence: Consequence): ConsequencePolicy {
  const impact = clamp(consequence.impact);
  const irreversibility = reversibilityCost(consequence.reversibility);
  const uncertainty = inferConsequenceUncertainty(consequence);
  let riskFloor = 0;
  let minimumResistance = 0;
  const reasons: string[] = [];

  if (impact >= 0.85 && irreversibility >= 0.8) {
    riskFloor = Math.max(riskFloor, 0.78);
    minimumResistance = Math.max(minimumResistance, 0.72);
    reasons.push("Very high-impact hard-to-reverse change requires deliberate commitment.");
  } else if (impact >= 0.75 && irreversibility >= 0.6) {
    riskFloor = Math.max(riskFloor, 0.62);
    minimumResistance = Math.max(minimumResistance, 0.50);
    reasons.push("High-impact low-reversibility change requires explicit preview.");
  }

  if (uncertainty >= 0.7 && impact >= 0.5) {
    riskFloor = Math.max(riskFloor, 0.60);
    minimumResistance = Math.max(minimumResistance, 0.45);
    reasons.push("Material consequence with unresolved outcome uncertainty cannot use a low-resistance path.");
  }
  if (consequence.reversibility === "irreversible") {
    riskFloor = Math.max(riskFloor, 0.50);
    minimumResistance = Math.max(minimumResistance, 0.40);
    reasons.push("Irreversible consequence establishes a commitment-resistance floor.");
  }
  if (consequence.effects.length === 0 && consequence.uncertainty === undefined) {
    riskFloor = Math.max(riskFloor, 0.55);
    minimumResistance = Math.max(minimumResistance, 0.40);
    reasons.push("Unspecified consequence effects are treated as unknown, never as safe.");
  }
  return { riskFloor, minimumResistance, reasons };
}

export function deriveConsequenceProfile(consequence: Consequence, context: ConsequenceContext = {}): ConsequenceProfile {
  const declaredRisk = clamp(consequence.risk);
  const derivedRisk = clamp(context.derivedRisk ?? 0);
  const policy = deriveConsequencePolicy(consequence);
  const policyRisk = Math.max(clamp(context.policyRisk ?? 0), policy.riskFloor);
  return {
    declaredRisk,
    derivedRisk,
    policyRisk,
    effectiveRisk: Math.max(declaredRisk, derivedRisk, policyRisk),
    impact: clamp(consequence.impact),
    irreversibility: reversibilityCost(consequence.reversibility),
    uncertainty: inferConsequenceUncertainty(consequence),
    externalDependency: clamp(context.externalDependency ?? 0),
    authorityCost: clamp(context.authorityCost ?? 0),
    policy,
  };
}

export function explainCommitment(consequence: Consequence, context: ConsequenceContext = {}): ExplainableCommitmentAssessment {
  const profile = deriveConsequenceProfile(consequence, context);
  const factors: ConsequenceSignal[] = [
    signal("declared-risk", profile.declaredRisk, 0, "Declared domain risk retained for compatibility and provenance."),
    signal("derived-risk", profile.derivedRisk, 0, "Risk inferred deterministically from current semantic context."),
    signal("policy-risk", profile.policyRisk, 0, "Risk floor contributed by explicit and deterministic policy."),
    signal("impact", profile.impact, WEIGHTS.impact, "Magnitude of expected state change."),
    signal("irreversibility", profile.irreversibility, WEIGHTS.irreversibility, "Cost of undoing or compensating for the change."),
    signal("uncertainty", profile.uncertainty, WEIGHTS.uncertainty, "Uncertainty in predicted consequence."),
    signal("external-dependency", profile.externalDependency, WEIGHTS.externalDependency, "Dependence on systems outside the current transaction boundary."),
    signal("authority", profile.authorityCost, WEIGHTS.authorityCost, "Additional deliberation required by authority policy."),
    signal("policy-floor", profile.policy.minimumResistance, 0, "Minimum resistance derived from impact, reversibility, and uncertainty policy."),
  ];
  const riskContribution = profile.effectiveRisk * WEIGHTS.risk;
  factors.push({ kind: "effective-risk", score: profile.effectiveRisk, weight: WEIGHTS.risk, contribution: riskContribution, reason: "Effective risk is the conservative maximum of declared, derived, and policy risk." });
  const rawScore = clamp(riskContribution + profile.impact * WEIGHTS.impact + profile.irreversibility * WEIGHTS.irreversibility + profile.uncertainty * WEIGHTS.uncertainty + profile.externalDependency * WEIGHTS.externalDependency + profile.authorityCost * WEIGHTS.authorityCost);
  const score = Math.max(rawScore, profile.policy.minimumResistance);
  const mode = commitmentMode(score);
  return {
    score,
    mode,
    reasons: { risk: profile.effectiveRisk, impact: profile.impact, irreversibility: profile.irreversibility, uncertainty: profile.uncertainty, authorityCost: profile.authorityCost },
    profile,
    factors,
    explanation: [
      `Resistance ${score.toFixed(3)} resolves to ${mode}.`,
      `Effective risk ${profile.effectiveRisk.toFixed(3)} = max(declared ${profile.declaredRisk.toFixed(3)}, derived ${profile.derivedRisk.toFixed(3)}, policy ${profile.policyRisk.toFixed(3)}).`,
      `External dependency contributes ${profile.externalDependency.toFixed(3)} before representation is chosen.`,
      ...profile.policy.reasons,
    ],
  };
}

function signal(kind: ConsequenceSignalKind, score: number, weight: number, reason: string): ConsequenceSignal { return { kind, score, weight, contribution: score * weight, reason }; }
function commitmentMode(score: number): CommitmentAssessment["mode"] { return score <= 0.15 ? "direct" : score <= 0.40 ? "visible-consequence" : score <= 0.70 ? "explicit-preview" : score <= 0.90 ? "deliberate" : "high-assurance"; }
function clamp(value: number): number { if (!Number.isFinite(value)) return 0; return Math.max(0, Math.min(1, value)); }
