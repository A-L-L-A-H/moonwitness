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

export const epistemicEvaluateInputSchema = z.discriminatedUnion("engine", [
  z.object({ engine: z.literal("divine-text"), text: z.string().min(1) }),
  z.object({ engine: z.literal("mtime"), fromIso: z.string().min(4), toIso: z.string().min(4) }),
  z.object({
    engine: z.literal("crayon"),
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255),
  }),
  z.object({ engine: z.literal("prophetic"), signals: z.array(z.number()).min(1) }),
]);

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
  searchFields: ["engine", "digest"],
  publicFields: ["engine", "digest", "output_json"],
  actions: {
    evaluate: {
      scope: "model",
      roles: ["editor", "admin"],
      label: "Evaluate Epistemic Engine",
      input: epistemicEvaluateInputSchema,
      handler: async ({ input, repository, actor }) => {
        const parsed = input as z.infer<typeof epistemicEvaluateInputSchema>;
        let output: object;
        switch (parsed.engine) {
          case "divine-text":
            output = normalizeDivineText(parsed.text);
            break;
          case "mtime":
            output = computeMtimeDelta(parsed.fromIso, parsed.toIso);
            break;
          case "crayon":
            output = rgbToCrayonRgbl(parsed.r, parsed.g, parsed.b);
            break;
          case "prophetic":
            output = scorePropheticWitness(parsed.signals);
            break;
        }
        const inputJson = JSON.stringify(parsed);
        const outputJson = JSON.stringify(output);
        const digest = createHash("sha256").update(inputJson).digest("hex");
        const saved = await repository.create(
          {
            engine: parsed.engine,
            input_json: inputJson,
            output_json: outputJson,
            digest,
          },
          actor,
        );
        return { record: saved, output };
      },
    },
  },
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
