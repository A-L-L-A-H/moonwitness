export const NINE_GATE = [
  "See",
  "Hear",
  "Touch",
  "Taste",
  "Smell",
  "Attend",
  "Remember",
  "Reason",
  "Choose",
] as const;

export type GateName = (typeof NINE_GATE)[number];

export const RGBL_PERCEPTION = {
  R1: "Receive",
  G2: "Differentiate",
  B3: "Integrate",
  L4: "Orient",
} as const;
