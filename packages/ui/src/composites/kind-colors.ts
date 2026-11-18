/** Default semantic color tokens per item kind/category. */
export const defaultKindColors: Record<string, string> = {
  PROJECT: "var(--primary)",
  STORY: "var(--accent)",
  SIGNAL: "var(--green)",
  WORLD: "var(--purple)",
  PEOPLE: "var(--pink)",
  RESEARCH: "var(--blue)",
};

/** @deprecated Use defaultKindColors */
export const kindColors = defaultKindColors;
