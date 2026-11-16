import type {CrayonInput, SinCanResult} from "../core/types.js";

const nonEmpty = (xs: string[], fallback: string) => xs.length ? xs : [`UNKNOWN — ${fallback}`];

export function buildSinCan(input: CrayonInput): SinCanResult {
  const sin = nonEmpty(
    [...(input.problems ?? []), ...(input.risks ?? [])],
    "identify what is wrong, incomplete, harmful, risky, or unresolved",
  );

  const understand = [
    "Examine the R1 facts before turning the problem into an identity label.",
    "Use G2 to identify the pattern or mechanism behind the condition.",
    "Use B3 to identify people, intention, impact, relationship, and responsibility.",
  ];

  const can = nonEmpty(
    input.possibilities ?? [],
    "identify a remaining possibility for repair, learning, change, or creation",
  );

  const act = nonEmpty(
    input.nextActions ?? [],
    "choose one proportionate, responsible next action",
  );

  return {
    sin,
    understand,
    can,
    act,
    learn: ["Compare the action and its consequence with the intended benefit and caution."],
    returnToReality: ["Return to new observations and run the CRAYON loop again."],
  };
}
