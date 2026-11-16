import type {CrayonInput, EpistemicYield} from "../core/types.js";

const unknown = (label: string) => `UNKNOWN — ${label}`;
const compact = (items: Array<string | undefined>) => items.filter(Boolean) as string[];
const nonEmpty = (items: string[], fallback: string) => items.length ? items : [unknown(fallback)];

export function buildEpistemicYield(input: CrayonInput): EpistemicYield {
  const information = nonEmpty(
    [...(input.observations ?? []), ...(input.evidence ?? [])],
    "collect observable facts, evidence, measurements, or source records",
  );

  const knowledge = nonEmpty(
    compact([
      ...(input.patterns ?? []),
      ...(input.relations ?? []),
    ]),
    "identify supported patterns, relations, rules, mechanisms, or models",
  );

  const meaning = nonEmpty(
    compact([
      ...(input.actors ?? []).map((x) => `Actor / being: ${x}`),
      ...(input.intentions ?? []).map((x) => `Intention: ${x}`),
      ...(input.impacts ?? []).map((x) => `Impact: ${x}`),
      ...(input.values ?? []).map((x) => `Value / meaning: ${x}`),
    ]),
    "identify being, agency, intention, relationship, impact, value, or meaning",
  );

  const wisdom = nonEmpty(
    compact([
      ...(input.nextActions ?? []).map((x) => `Responsible direction: ${x}`),
      ...(input.cautions ?? []).map((x) => `Caution: ${x}`),
      ...(input.benefits ?? []).map((x) => `Benefit to preserve: ${x}`),
    ]),
    "state a responsible direction, benefit, limitation, or caution",
  );

  return {
    R1: {level: "Reality", yield: "Information", items: information},
    G2: {level: "Governing Order", yield: "Knowledge", items: knowledge},
    B3: {level: "Being", yield: "Understanding / Meaning", items: meaning},
    L4: {level: "Light", yield: "Wisdom / Responsible Direction", items: wisdom},
  };
}
