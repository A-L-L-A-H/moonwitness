import { normalizeArabicScript } from "./divine-text-engine";

export interface DivineTextNormalizationResult {
  readonly canonical: string;
  readonly wordCount: number;
}

export interface MtimeDeltaResult {
  readonly deltaMs: number;
  readonly deltaDays: number;
  readonly harmonicEpoch: "forward-witness" | "retro-witness";
}

export interface CrayonRgblResult {
  readonly rgbl: [number, number, number];
  readonly luminance: number;
  readonly contrastVsBlack: number;
}

export interface PropheticWitnessScoreResult {
  readonly score: number;
  readonly verdict: "corroborated" | "plausible" | "unverified";
}

/**
 * Canonical cross-runtime Divine Text normalizer reusing the Quran/Arabic script stripper
 * without mutating casing or introducing platform-specific hashing dependencies.
 */
export function normalizeDivineText(input: string): DivineTextNormalizationResult {
  const canonical = normalizeArabicScript(input).replace(/\s+/g, " ").trim();
  const wordCount = canonical ? canonical.split(" ").length : 0;
  return { canonical, wordCount };
}

/**
 * Computes signed millisecond/day offset between two ISO-8601 witness timestamps.
 */
export function computeMtimeDelta(fromIso: string, toIso: string): MtimeDeltaResult {
  const start = Date.parse(fromIso);
  const end = Date.parse(toIso);
  const deltaMs = Number.isFinite(start) && Number.isFinite(end) ? end - start : 0;
  const deltaDays = Number((deltaMs / 86_400_000).toFixed(6));
  const harmonicEpoch = deltaDays >= 0 ? "forward-witness" : "retro-witness";
  return { deltaMs, deltaDays, harmonicEpoch };
}

/**
 * Converts an 8-bit sRGB channel value (0..255) into linearized luminance channel (0..1).
 */
export function srgbChannelToLinear(c8: number): number {
  const s = Math.min(1, Math.max(0, c8 / 255));
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * Converts 8-bit sRGB channels into linear Crayon RGBL tuple, WCAG relative luminance, and black contrast ratio.
 */
export function rgbToCrayonRgbl(r: number, g: number, b: number): CrayonRgblResult {
  const lr = Number(srgbChannelToLinear(r).toFixed(6));
  const lg = Number(srgbChannelToLinear(g).toFixed(6));
  const lb = Number(srgbChannelToLinear(b).toFixed(6));
  const luminance = Number((0.2126 * lr + 0.7152 * lg + 0.0722 * lb).toFixed(6));
  const contrastVsBlack = Number(((luminance + 0.05) / 0.05).toFixed(4));
  return { rgbl: [lr, lg, lb], luminance, contrastVsBlack };
}

/**
 * Aggregates clamped [0..1] prophetic witness corroboration signals into a deterministic verdict.
 */
export function scorePropheticWitness(signals: readonly number[]): PropheticWitnessScoreResult {
  if (signals.length === 0) return { score: 0, verdict: "unverified" };
  const clamped = signals.map((s) => Math.min(1, Math.max(0, s)));
  const score = Number((clamped.reduce((a, b) => a + b, 0) / clamped.length).toFixed(4));
  const verdict = score >= 0.75 ? "corroborated" : score >= 0.4 ? "plausible" : "unverified";
  return { score, verdict };
}
