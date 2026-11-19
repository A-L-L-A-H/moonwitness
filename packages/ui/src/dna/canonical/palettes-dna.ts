import type { ColorToken } from "../tokens";
import type { CanonicalDnaId, DnaPaletteSpec } from "./types";

/** WCAG-AA verified light-mode palettes for each of the 7 Master DNA identities */
export const MASTER_DNA_LIGHT_PALETTES: Readonly<Record<CanonicalDnaId, DnaPaletteSpec>> = {
  "01-imperium-lumen": {
    canvas: "#f7f1e3",
    surface: "#ffffff",
    surfaceElevated: "#efe4ca",
    text: "#08090d",
    mutedText: "#48453e",
    border: "#8f6b14",
    accent: "#f6d438",
    accentSecondary: "#9b0b66",
    accentForeground: "#08090d",
    focus: "#9b0b66",
    success: "#0c5e31",
    warning: "#8f5900",
    danger: "#c81e1e",
  },
  "02-lunar-chronicles": {
    canvas: "#eef3fa",
    surface: "#ffffff",
    surfaceElevated: "#e1eaf5",
    text: "#0b1220",
    mutedText: "#3d4d66",
    border: "#355a8a",
    accent: "#0b5cab",
    accentSecondary: "#1e40af",
    accentForeground: "#ffffff",
    focus: "#0b5cab",
    success: "#0c5e31",
    warning: "#92400e",
    danger: "#c81e1e",
  },
  "03-rocksoul": {
    canvas: "#f5efe4",
    surface: "#fffdf8",
    surfaceElevated: "#e9dfd0",
    text: "#14110f",
    mutedText: "#4c453c",
    border: "#6c573c",
    accent: "#b45309",
    accentSecondary: "#854d0e",
    accentForeground: "#ffffff",
    focus: "#854d0e",
    success: "#0c5e31",
    warning: "#b45309",
    danger: "#b91c1c",
  },
  "04-nexus-paradox": {
    canvas: "#ebf7fa",
    surface: "#ffffff",
    surfaceElevated: "#d9eef4",
    text: "#06141a",
    mutedText: "#264e5a",
    border: "#0d6982",
    accent: "#006980",
    accentSecondary: "#0e7490",
    accentForeground: "#ffffff",
    focus: "#006980",
    success: "#0a5953",
    warning: "#a16207",
    danger: "#be123c",
  },
  "05-riot-anarchy": {
    canvas: "#f4eede",
    surface: "#fffcf7",
    surfaceElevated: "#ebe1cb",
    text: "#0b0b10",
    mutedText: "#423e36",
    border: "#1f1d24",
    accent: "#c9145a",
    accentSecondary: "#854d0e",
    accentForeground: "#ffffff",
    focus: "#0b0b10",
    success: "#0c5e31",
    warning: "#92400e",
    danger: "#c81e1e",
  },
  "06-mycelium": {
    canvas: "#edf6f0",
    surface: "#ffffff",
    surfaceElevated: "#dfece4",
    text: "#09180e",
    mutedText: "#2b543a",
    border: "#1f6f42",
    accent: "#116635",
    accentSecondary: "#15803d",
    accentForeground: "#ffffff",
    focus: "#116635",
    success: "#0c5e31",
    warning: "#92400e",
    danger: "#b91c1c",
  },
  "09-simpul-nusantara": {
    canvas: "#faf4ea",
    surface: "#ffffff",
    surfaceElevated: "#efe5d5",
    text: "#0b1220",
    mutedText: "#453e33",
    border: "#945214",
    accent: "#a84e00",
    accentSecondary: "#92400e",
    accentForeground: "#ffffff",
    focus: "#7c2d12",
    success: "#0c5e31",
    warning: "#a16207",
    danger: "#c81e1e",
  },
} as const;

/** Convert 3- or 6-digit hex color to space-delimited HSL triplet (`H S% L%`) */
export function hexToHslString(hex: string): string {
  const clean = hex.trim().replace(/^#/, "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "0 0% 0%";
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Normalize a ColorToken into a valid CSS color value (`hsl(...)` or hex/rgb) */
export function normalizeColorTokenToCss(token: ColorToken): string {
  if (token.hex.startsWith("rgb")) {
    return token.hex;
  }
  const hsl = token.hsl ?? hexToHslString(token.hex);
  return hsl.startsWith("hsl") ? hsl : `hsl(${hsl})`;
}

export function createCanonicalColorToken(hex: string, alpha?: number): ColorToken {
  return {
    hex,
    hsl: hexToHslString(hex),
    ...(alpha !== undefined ? { alpha } : {}),
  };
}
