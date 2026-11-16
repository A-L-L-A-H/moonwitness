import type { Possibility, Transition } from "allah-crayon-kernel";

export interface CompensationPlan {
  version: "0";
  id: string;
  originalTransitionId: string;
  originalIntentId: string;
  originalEffectIds: readonly string[];
  correctivePossibility: Possibility;
  rationale: string;
}

export type CompensationReasonCode =
  | "INVALID_COMPENSATION_ID"
  | "MISSING_ORIGINAL_EFFECTS"
  | "CORRECTIVE_POSSIBILITY_REUSES_ORIGINAL"
  | "MISSING_RATIONALE";

export interface CompensationValidation {
  valid: boolean;
  reasons: readonly CompensationReasonCode[];
}

export function defineCompensation(args: {
  id: string;
  original: Transition;
  correctivePossibility: Possibility;
  rationale: string;
}): Readonly<CompensationPlan> {
  const validation = validateCompensation(args);
  if (!validation.valid) throw new Error(`INVALID_COMPENSATION:${validation.reasons.join(",")}`);
  return deepFreeze({
    version: "0" as const,
    id: args.id,
    originalTransitionId: args.original.id,
    originalIntentId: args.original.intent.id,
    originalEffectIds: args.original.prediction.effects.map((effect) => effect.id),
    correctivePossibility: structuredClone(args.correctivePossibility),
    rationale: args.rationale,
  });
}

export function validateCompensation(args: {
  id: string;
  original: Transition;
  correctivePossibility: Possibility;
  rationale: string;
}): CompensationValidation {
  const reasons: CompensationReasonCode[] = [];
  if (!nonEmpty(args.id)) reasons.push("INVALID_COMPENSATION_ID");
  if (args.original.prediction.effects.length === 0) reasons.push("MISSING_ORIGINAL_EFFECTS");
  if (args.correctivePossibility.id === args.original.intent.possibilityId) reasons.push("CORRECTIVE_POSSIBILITY_REUSES_ORIGINAL");
  if (!nonEmpty(args.rationale)) reasons.push("MISSING_RATIONALE");
  return deepFreeze({ valid: reasons.length === 0, reasons });
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
