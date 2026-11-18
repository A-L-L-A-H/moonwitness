import { createHash } from "node:crypto";
import { z } from "zod";
import { defineModel } from "@moonwitness/orm";
import {
  computeMtimeDelta,
  normalizeDivineText as normalizeDivineTextCanon,
  rgbToCrayonRgbl,
  scorePropheticWitness,
  srgbChannelToLinear,
} from "@moonwitness/canon";

export { computeMtimeDelta, rgbToCrayonRgbl, scorePropheticWitness, srgbChannelToLinear };

export const epistemicComputationModel = defineModel({
  name: "epistemic.computation",
  table: "epistemic_computations",
  schema: z.object({
    engine: z.enum(["divine-text", "mtime", "crayon", "prophetic"]),
    input_json: z.string(),
    output_json: z.string(),
    digest: z.string().min(16).max(128),
  }),
  softDelete: false,
  restEnabled: true,
  publicFields: ["engine", "digest", "output_json"],
  indexes: [{ fields: ["engine"] }, { fields: ["digest"] }],
});

export function normalizeDivineText(input: string): {
  canonical: string;
  wordCount: number;
  sha256: string;
} {
  const { canonical, wordCount } = normalizeDivineTextCanon(input);
  const sha256 = createHash("sha256").update(canonical).digest("hex");
  return { canonical, wordCount, sha256 };
}
