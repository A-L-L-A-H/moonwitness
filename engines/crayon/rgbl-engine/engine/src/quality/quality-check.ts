import type {CrayonInput, EpistemicYield, QualityCheck} from "../core/types.js";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function runQualityCheck(input: CrayonInput, yieldMap: EpistemicYield): QualityCheck {
  const evidenceCount = (input.evidence?.length ?? 0) + (input.observations?.length ?? 0) + (input.sources?.length ?? 0);
  const evidenceStatus: QualityCheck["evidenceStatus"] =
    evidenceCount >= 3 ? "supported" : evidenceCount > 0 ? "partial" : "missing";

  const coverage = [
    !yieldMap.R1.items[0]?.startsWith("UNKNOWN"),
    !yieldMap.G2.items[0]?.startsWith("UNKNOWN"),
    !yieldMap.B3.items[0]?.startsWith("UNKNOWN"),
    !yieldMap.L4.items[0]?.startsWith("UNKNOWN"),
  ].filter(Boolean).length / 4;

  const explicit = input.confidence;
  const confidence = clamp01(explicit ?? coverage * (evidenceStatus === "supported" ? 1 : evidenceStatus === "partial" ? 0.8 : 0.5));
  const confidenceLabel = confidence >= 0.75 ? "high" : confidence >= 0.45 ? "medium" : "low";

  return {
    evidenceStatus,
    alternatives: input.interpretations?.length ? input.interpretations : ["UNKNOWN — record plausible alternative explanations"],
    assumptions: input.assumptions?.length ? input.assumptions : ["No explicit assumptions recorded"],
    reasoningTrace: [
      "R1: separate observed/source information from interpretation.",
      "G2: derive only patterns or relations supported by R1.",
      "B3: identify beings, agency, intention, impact, relation, and meaning.",
      "L4: integrate prior levels into responsible direction with caution.",
    ],
    confidence,
    confidenceLabel,
    cautions: input.cautions?.length ? input.cautions : ["Do not present an unsupported inference as an observed fact."],
  };
}
