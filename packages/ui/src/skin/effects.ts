// Moonwitness Skin Layer -- Reusable Effect Class Helpers
// Every helper returns valid CSS utility class names (defined in base.css and skins/dna-base.css),
// never raw CSS declaration strings, so React `className` and `cva()` compose cleanly.
import type { CSSProperties } from "react";
import type { EffectToken } from "../dna/tokens";

export function halftone(options: Partial<EffectToken["halftone"]> = {}): string {
  const colorHex = options.color?.hex?.toLowerCase();
  if (colorHex === "#ff2d78" || colorHex === "#ed149b") {
    return "halftone-pink";
  }
  return "halftone";
}

export function grain(_options: Partial<EffectToken["grain"]> = {}): string {
  return "grain relative";
}

export function cmykSlip(_options: Partial<EffectToken["cmykSlip"]> = {}): string {
  return "cmyk-slip";
}

export function duotone(_options: Partial<EffectToken["duotone"]> = {}): string {
  return "duotone relative";
}

export function tape(_options: Partial<EffectToken["tape"]> = {}): string {
  return "tape";
}

export function sticker(_options: Partial<EffectToken["sticker"]> = {}): string {
  return "sticker";
}

export function brushUnderline(_options: Partial<EffectToken["brushUnderline"]> = {}): string {
  return "brush-underline";
}

export function scanlines(): string {
  return "scanlines relative";
}

/** Optional runtime CSS custom-property style object for tuned effect parameters */
export function resolveEffectStyle(options: {
  grainOpacity?: number;
  halftoneOpacity?: number;
  cmykOffset?: string;
}): CSSProperties {
  const style: Record<string, string> = {};
  if (options.grainOpacity !== undefined) {
    style["--mw-grain-opacity"] = String(options.grainOpacity);
  }
  if (options.halftoneOpacity !== undefined) {
    style["--mw-halftone-opacity"] = String(options.halftoneOpacity);
  }
  if (options.cmykOffset !== undefined) {
    style["--mw-cmyk-offset"] = options.cmykOffset;
  }
  return style as CSSProperties;
}

export function composeEffects(...effects: string[]): string {
  const tokens = effects
    .flatMap((effect) => effect.split(/\s+/))
    .map((token) => token.trim())
    .filter(Boolean);
  return Array.from(new Set(tokens)).join(" ");
}

export const effectPresets = {
  riot: composeEffects(
    halftone({ color: { hex: "#ff2d78" } }),
    grain(),
    cmykSlip(),
  ),
  editorial: composeEffects(duotone(), brushUnderline()),
  technical: "",
  archive: composeEffects(grain(), brushUnderline()),
  transmission: composeEffects(halftone({ color: { hex: "#2ea8ff" } }), grain(), scanlines()),
  print: "",
  highContrast: "",
  lowMotion: "",
} as const;
