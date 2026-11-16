export const THIRTEEN_WAY = [
  "Observe",
  "Notice",
  "Question",
  "Measure",
  "Compare",
  "Explore",
  "Understand",
  "Connect",
  "Evaluate",
  "Reason",
  "Conclude",
  "Act",
  "Live",
] as const;

export type WayName = (typeof THIRTEEN_WAY)[number];
