import { createHash } from "node:crypto";
import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

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
  const canonical = input
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = canonical ? canonical.split(" ").length : 0;
  const sha256 = createHash("sha256").update(canonical).digest("hex");
  return { canonical, wordCount, sha256 };
}

export function computeMtimeDelta(
  fromIso: string,
  toIso: string,
): {
  deltaMs: number;
  deltaDays: number;
  harmonicEpoch: string;
} {
  const start = Date.parse(fromIso);
  const end = Date.parse(toIso);
  const deltaMs = Number.isFinite(start) && Number.isFinite(end) ? end - start : 0;
  const deltaDays = Number((deltaMs / 86_400_000).toFixed(6));
  const harmonicEpoch = deltaDays >= 0 ? "forward-witness" : "retro-witness";
  return { deltaMs, deltaDays, harmonicEpoch };
}

export function srgbChannelToLinear(c8: number): number {
  const s = Math.min(1, Math.max(0, c8 / 255));
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function rgbToCrayonRgbl(
  r: number,
  g: number,
  b: number,
): {
  rgbl: [number, number, number];
  luminance: number;
  contrastVsBlack: number;
} {
  const lr = Number(srgbChannelToLinear(r).toFixed(6));
  const lg = Number(srgbChannelToLinear(g).toFixed(6));
  const lb = Number(srgbChannelToLinear(b).toFixed(6));
  const luminance = Number((0.2126 * lr + 0.7152 * lg + 0.0722 * lb).toFixed(6));
  const contrastVsBlack = Number(((luminance + 0.05) / 0.05).toFixed(4));
  return { rgbl: [lr, lg, lb], luminance, contrastVsBlack };
}

export function scorePropheticWitness(signals: number[]): {
  score: number;
  verdict: "corroborated" | "plausible" | "unverified";
} {
  if (signals.length === 0) return { score: 0, verdict: "unverified" };
  const clamped = signals.map((s) => Math.min(1, Math.max(0, s)));
  const score = Number((clamped.reduce((a, b) => a + b, 0) / clamped.length).toFixed(4));
  const verdict = score >= 0.75 ? "corroborated" : score >= 0.4 ? "plausible" : "unverified";
  return { score, verdict };
}
