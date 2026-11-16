export interface PhysicsFactor {
  key: string;
  value: number;
  weight: number;
  contribution: number;
  reason: string;
}

export interface PhysicsScore {
  score: number;
  factors: PhysicsFactor[];
  explanation: string[];
}

export interface GravityInput { relevance?: number; impact?: number; uncertainty?: number; urgency?: number; }
export interface DistanceInput { relationStrength?: number; sharedContext?: number; }
export interface DepthInput { abstraction?: number; evidenceDemand?: number; uncertainty?: number; }
export interface TraceInput { impact?: number; irreversibility?: number; uncertainty?: number; externalDependency?: number; }
export interface DisclosureInput { impact?: number; irreversibility?: number; uncertainty?: number; authorityCost?: number; evidenceDemand?: number; }
export interface ContinuityInput { identityStability?: number; relationStability?: number; semanticChange?: number; }
export interface MomentumInput { committed?: number; executing?: number; externalPending?: number; observationProgress?: number; }

export function gravity(input: GravityInput): PhysicsScore {
  return weightedScore([
    factor("relevance", input.relevance ?? 0.5, 0.4, "Semantic relevance pulls representation attention."),
    factor("impact", input.impact ?? 0, 0.3, "Higher consequence impact increases attention gravity."),
    factor("urgency", input.urgency ?? 0, 0.2, "Time sensitivity increases immediate attention."),
    factor("uncertainty", input.uncertainty ?? 0, 0.1, "Uncertainty increases the need for visible context."),
  ]);
}

export function distance(input: DistanceInput): PhysicsScore {
  const relation = clamp(input.relationStrength ?? 0);
  const shared = clamp(input.sharedContext ?? 0);
  const closeness = clamp(relation * 0.7 + shared * 0.3);
  const score = clamp(1 - closeness);
  return {
    score,
    factors: [
      factor("relationStrength", relation, 0.7, "Stronger semantic relations reduce representational distance."),
      factor("sharedContext", shared, 0.3, "Shared context reduces representational distance."),
    ],
    explanation: [
      `Semantic distance is ${score.toFixed(2)}; lower means closer to the current anchor.`,
      relation > 0.7 ? "A strong relation keeps this subject near the anchor." : "A weak relation permits more separation from the anchor.",
    ],
  };
}

export function depth(input: DepthInput): PhysicsScore {
  return weightedScore([
    factor("abstraction", input.abstraction ?? 0.5, 0.45, "More abstract meaning may remain at a higher semantic level."),
    factor("evidenceDemand", input.evidenceDemand ?? 0, 0.35, "Evidence demand increases the need for deeper disclosure."),
    factor("uncertainty", input.uncertainty ?? 0, 0.2, "Uncertainty increases useful semantic depth."),
  ]);
}

export function trace(input: TraceInput): PhysicsScore {
  return weightedScore([
    factor("impact", input.impact ?? 0, 0.35, "High-impact changes deserve a stronger durable trace."),
    factor("irreversibility", input.irreversibility ?? 0, 0.35, "Hard-to-reverse changes require stronger traceability."),
    factor("uncertainty", input.uncertainty ?? 0, 0.15, "Uncertain outcomes require traceable evidence."),
    factor("externalDependency", input.externalDependency ?? 0, 0.15, "External systems increase the need for outcome traceability."),
  ]);
}

export function disclosure(input: DisclosureInput): PhysicsScore {
  return weightedScore([
    factor("impact", input.impact ?? 0, 0.28, "Higher-impact commitments require more consequence disclosure."),
    factor("irreversibility", input.irreversibility ?? 0, 0.27, "Hard-to-reverse commitments require more pre-commitment disclosure."),
    factor("uncertainty", input.uncertainty ?? 0, 0.20, "Uncertain outcomes require uncertainty to be surfaced before commitment."),
    factor("evidenceDemand", input.evidenceDemand ?? 0, 0.15, "Evidence demand increases the amount of supporting context that must remain available."),
    factor("authorityCost", input.authorityCost ?? 0, 0.10, "Additional authority requirements increase disclosure demand."),
  ]);
}

export function continuity(input: ContinuityInput): PhysicsScore {
  const identity = clamp(input.identityStability ?? 1);
  const relations = clamp(input.relationStability ?? 1);
  const change = clamp(input.semanticChange ?? 0);
  return weightedScore([
    factor("identityStability", identity, 0.45, "Stable entity identity should preserve orientation across change."),
    factor("relationStability", relations, 0.30, "Stable relations should remain spatially/contextually continuous."),
    factor("meaningPersistence", 1 - change, 0.25, "Meaning that did not change should not be presented as replacement."),
  ]);
}

export function momentum(input: MomentumInput): PhysicsScore {
  const progress = clamp(input.observationProgress ?? 0);
  return weightedScore([
    factor("committed", input.committed ?? 0, 0.15, "A committed transition has semantic momentum even before execution begins."),
    factor("executing", input.executing ?? 0, 0.40, "Execution in progress increases transition momentum."),
    factor("externalPending", input.externalPending ?? 0, 0.30, "Outstanding external effects keep the transition semantically in motion."),
    factor("unobservedRemainder", 1 - progress, 0.15, "Unobserved outcome remainder keeps the transition unresolved."),
  ]);
}

function weightedScore(factors: PhysicsFactor[]): PhysicsScore {
  const score = clamp(factors.reduce((total, item) => total + item.contribution, 0));
  return {
    score,
    factors,
    explanation: [
      ...factors.filter((item) => item.value > 0).map((item) => `${item.reason} (${item.value.toFixed(2)} × ${item.weight.toFixed(2)})`),
      `Deterministic score: ${score.toFixed(2)}.`,
    ],
  };
}

function factor(key: string, value: number, weight: number, reason: string): PhysicsFactor {
  const normalized = clamp(value);
  return { key, value: normalized, weight, contribution: normalized * weight, reason };
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
