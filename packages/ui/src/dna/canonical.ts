// Moonwitness Canonical Design Token Engine
// Single server-safe TypeScript authority reconciling Brand, DNA, Theme Mode, Skin,
// and shadcn/ui CSS custom properties.

import {
  IMPERIUM_LUMEN_TOKENS,
  MASTER_DNA_PALETTES,
  type MasterDnaPaletteMap,
} from "../skin/imperium-tokens";
import type { SkinName } from "../skin/compositions";
import type { ColorToken, DNATokens } from "./tokens";

export type CanonicalDnaId = keyof MasterDnaPaletteMap;
export type CanonicalThemeMode = "dark" | "light";
export type CanonicalDensity = "compact" | "comfortable" | "spacious";

export interface DnaPaletteSpec {
  readonly canvas: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly text: string;
  readonly mutedText: string;
  readonly border: string;
  readonly accent: string;
  readonly accentSecondary?: string;
  readonly accentForeground: string;
  readonly focus: string;
  readonly success?: string;
  readonly warning?: string;
  readonly danger?: string;
}

export interface CanonicalBrandTokens {
  readonly ink: string;
  readonly paper: string;
  readonly yellow: string;
  readonly pink: string;
  readonly blue: string;
  readonly white: string;
  readonly purple: string;
  readonly red: string;
  readonly green: string;
  readonly riotInk: string;
  readonly riotPink: string;
  readonly riotYellow: string;
  readonly riotPaper: string;
}

export interface CanonicalSemanticTokens {
  readonly canvas: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly surfaceMuted: string;
  readonly background: string;
  readonly foreground: string;
  readonly card: string;
  readonly cardForeground: string;
  readonly popover: string;
  readonly popoverForeground: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly secondary: string;
  readonly secondaryForeground: string;
  readonly muted: string;
  readonly mutedForeground: string;
  readonly accent: string;
  readonly accentSecondary: string;
  readonly accentForeground: string;
  readonly destructive: string;
  readonly destructiveForeground: string;
  readonly border: string;
  readonly input: string;
  readonly ring: string;
  readonly focus: string;
  readonly success: string;
  readonly warning: string;
  readonly info: string;
  readonly error: string;
}

export interface CanonicalComponentTokens {
  readonly button: {
    readonly heightSm: string;
    readonly heightMd: string;
    readonly heightLg: string;
    readonly paddingX: string;
    readonly radius: string;
    readonly borderWidth: string;
    readonly shadow: string;
    readonly fontFamily: string;
    readonly textTransform: string;
  };
  readonly input: {
    readonly height: string;
    readonly paddingX: string;
    readonly radius: string;
    readonly borderWidth: string;
    readonly focusRingWidth: string;
  };
  readonly card: {
    readonly padding: string;
    readonly radius: string;
    readonly borderWidth: string;
    readonly shadow: string;
  };
  readonly dialog: {
    readonly maxWidth: string;
    readonly padding: string;
    readonly radius: string;
    readonly shadow: string;
  };
  readonly badge: {
    readonly radius: string;
    readonly paddingX: string;
    readonly fontSize: string;
  };
}

export interface CanonicalShapeTokens {
  readonly radius: {
    readonly none: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
    readonly full: string;
  };
  readonly borderWidth: {
    readonly hairline: string;
    readonly thin: string;
    readonly medium: string;
    readonly thick: string;
  };
  readonly borderStyle: string;
  readonly outlineWidth: string;
  readonly outlineOffset: string;
}

export interface CanonicalResolvedTokens {
  readonly dnaId: CanonicalDnaId;
  readonly skin: SkinName;
  readonly mode: CanonicalThemeMode;
  readonly density: CanonicalDensity;
  readonly brand: CanonicalBrandTokens;
  readonly semantic: CanonicalSemanticTokens;
  readonly shape: CanonicalShapeTokens;
  readonly layout: {
    readonly spacingScale: typeof IMPERIUM_LUMEN_TOKENS.layout.spacingScale;
    readonly contentWidth: string;
    readonly breakpoints: typeof IMPERIUM_LUMEN_TOKENS.layout.breakpoints;
  };
  readonly typography: {
    readonly display: string;
    readonly heading: string;
    readonly editorial: string;
    readonly body: string;
    readonly label: string;
    readonly technical: string;
    readonly componentUi: string;
    readonly headingTracking: string;
    readonly headingTransform: string;
  };
  readonly atmosphere: {
    readonly canvasPattern: string;
    readonly cardBorderStyle: string;
    readonly cardClip: string;
    readonly cardTransform: string;
    readonly cardHoverTransform: string;
    readonly ornament: string;
    readonly iconStroke: string;
    readonly iconCap: string;
    readonly mediaFilter: string;
    readonly motionDuration: string;
    readonly worldAccent: string;
  };
  readonly elevation: {
    readonly shadowSurface: string;
    readonly shadowInteractive: string;
    readonly shadowOverlay: string;
  };
  readonly motion: typeof IMPERIUM_LUMEN_TOKENS.motion;
  readonly components: CanonicalComponentTokens;
}

export interface DeprecatedTokenAlias {
  readonly legacy: string;
  readonly canonical: string;
  readonly reason: string;
}

export const DEPRECATED_TOKEN_ALIASES: readonly DeprecatedTokenAlias[] = [
  {
    legacy: "--hero-headline-paper",
    canonical: "--brand-pink",
    reason: "Use canonical brand/semantic CSS custom properties instead of hero-specific color aliases.",
  },
  {
    legacy: "--hero-caption-paper",
    canonical: "--brand-paper",
    reason: "Use --brand-paper or --dna-text from the canonical token resolver.",
  },
  {
    legacy: "--celestial-gold",
    canonical: "--dna-border",
    reason: "Gold structural surfaces map to semantic --dna-border / --dna-accent.",
  },
  {
    legacy: "--celestial-void",
    canonical: "--dna-canvas",
    reason: "Canvas background is standardized across all DNAs as --dna-canvas.",
  },
] as const;

export const BRAND_TOKENS: CanonicalBrandTokens = {
  ink: IMPERIUM_LUMEN_TOKENS.brand.ink,
  paper: IMPERIUM_LUMEN_TOKENS.brand.paper,
  yellow: IMPERIUM_LUMEN_TOKENS.brand.yellow,
  pink: IMPERIUM_LUMEN_TOKENS.brand.pink,
  blue: IMPERIUM_LUMEN_TOKENS.brand.blue,
  white: IMPERIUM_LUMEN_TOKENS.brand.white,
  purple: "#a855f7",
  red: "#d61f2c",
  green: "#3ddc84",
  riotInk: "#0b0b10",
  riotPink: "#ff2d78",
  riotYellow: "#ffd21f",
  riotPaper: "#f4eede",
} as const;

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
    success: "#0f7a3f",
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
    success: "#0f7a3f",
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
    success: "#15803d",
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
    success: "#0f766e",
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
    success: "#15803d",
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
    success: "#116635",
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
    success: "#15803d",
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

interface SkinRecipeSpec {
  readonly radius: CanonicalShapeTokens["radius"];
  readonly borderWidth: string;
  readonly borderStyle: string;
  readonly cardClip: string;
  readonly cardTransform?: string;
  readonly cardHoverTransform?: string;
  readonly fontFamily: string;
  readonly displayFont: string;
  readonly headingFont: string;
  readonly bodyFont: string;
  readonly headingTracking: string;
  readonly headingTransform: string;
  readonly textTransform: string;
  readonly buttonShadow: string;
  readonly cardShadow: string;
  readonly overlayShadow: string;
  readonly canvasPattern: string;
  readonly iconStroke: string;
  readonly iconCap: string;
  readonly ornament: string;
  readonly mediaFilter: string;
  readonly motionDuration: string;
}

/**
 * Chromatic surface & mood palettes per Skin Archetype (dark + WCAG AA light).
 * When `skin === "default"`, the raw Master DNA palette is used directly;
 * specialized skins apply unmistakable chromatic + material identity.
 */
export const SKIN_SURFACE_PALETTES: Readonly<
  Record<Exclude<SkinName, "default">, Readonly<Record<CanonicalThemeMode, DnaPaletteSpec>>>
> = {
  riot: {
    dark: {
      canvas: "#07070c",
      surface: "#12101b",
      surfaceElevated: "#1c1829",
      text: "#f7f1e1",
      mutedText: "#cfc6b4",
      border: "#ff2d78",
      accent: "#ff4088",
      accentSecondary: "#ffd21f",
      accentForeground: "#07070c",
      focus: "#ffd21f",
      success: "#3ddc84",
      warning: "#ffd21f",
      danger: "#ff4d5a",
    },
    light: {
      canvas: "#f4eede",
      surface: "#fffdf7",
      surfaceElevated: "#ebe0c9",
      text: "#0b0b10",
      mutedText: "#3f3a32",
      border: "#0b0b10",
      accent: "#b80d4d",
      accentSecondary: "#854d0e",
      accentForeground: "#ffffff",
      focus: "#0b0b10",
      success: "#15803d",
      warning: "#92400e",
      danger: "#b91c1c",
    },
  },
  editorial: {
    dark: {
      canvas: "#11100f",
      surface: "#191715",
      surfaceElevated: "#24211d",
      text: "#faf6ee",
      mutedText: "#c9c0b1",
      border: "#9c7c3e",
      accent: "#f5d061",
      accentSecondary: "#e04f5f",
      accentForeground: "#11100f",
      focus: "#ffe699",
      success: "#4ade80",
      warning: "#f5d061",
      danger: "#f87171",
    },
    light: {
      canvas: "#faf6ee",
      surface: "#ffffff",
      surfaceElevated: "#efe8da",
      text: "#171411",
      mutedText: "#4f483f",
      border: "#2c2620",
      accent: "#8c1d2e",
      accentSecondary: "#6b4c1b",
      accentForeground: "#ffffff",
      focus: "#171411",
      success: "#15803d",
      warning: "#92400e",
      danger: "#b91c1c",
    },
  },
  technical: {
    dark: {
      canvas: "#050a10",
      surface: "#0a131f",
      surfaceElevated: "#102033",
      text: "#e6f4fc",
      mutedText: "#97bed1",
      border: "#0e7490",
      accent: "#00e5ff",
      accentSecondary: "#38bdf8",
      accentForeground: "#041016",
      focus: "#7df4ff",
      success: "#2dd4bf",
      warning: "#facc15",
      danger: "#fb7185",
    },
    light: {
      canvas: "#eef5fa",
      surface: "#ffffff",
      surfaceElevated: "#ddebf5",
      text: "#061826",
      mutedText: "#2d526b",
      border: "#0b5cab",
      accent: "#005a8d",
      accentSecondary: "#0284c7",
      accentForeground: "#ffffff",
      focus: "#061826",
      success: "#0f766e",
      warning: "#a16207",
      danger: "#be123c",
    },
  },
  archive: {
    dark: {
      canvas: "#14110d",
      surface: "#1e1913",
      surfaceElevated: "#2a231b",
      text: "#f5ead6",
      mutedText: "#cabba1",
      border: "#8c6b3b",
      accent: "#f0b849",
      accentSecondary: "#d97706",
      accentForeground: "#14110d",
      focus: "#ffe08a",
      success: "#4ade80",
      warning: "#f0b849",
      danger: "#f87171",
    },
    light: {
      canvas: "#f2e8d5",
      surface: "#fbf6ec",
      surfaceElevated: "#e6d8be",
      text: "#1d160e",
      mutedText: "#4f4130",
      border: "#4a3728",
      accent: "#7c3a0a",
      accentSecondary: "#92400e",
      accentForeground: "#ffffff",
      focus: "#1d160e",
      success: "#15803d",
      warning: "#92400e",
      danger: "#b91c1c",
    },
  },
  transmission: {
    dark: {
      canvas: "#050811",
      surface: "#0b1222",
      surfaceElevated: "#131f38",
      text: "#eaf2ff",
      mutedText: "#9eb8de",
      border: "#2563eb",
      accent: "#38bdf8",
      accentSecondary: "#3ddc84",
      accentForeground: "#050811",
      focus: "#7dd3fc",
      success: "#3ddc84",
      warning: "#fbbf24",
      danger: "#fb7185",
    },
    light: {
      canvas: "#eef4fb",
      surface: "#ffffff",
      surfaceElevated: "#dfe9f7",
      text: "#091324",
      mutedText: "#334b6e",
      border: "#1d4ed8",
      accent: "#0369a1",
      accentSecondary: "#0f766e",
      accentForeground: "#ffffff",
      focus: "#091324",
      success: "#0f766e",
      warning: "#a16207",
      danger: "#be123c",
    },
  },
  sanctuary: {
    dark: {
      canvas: "#08090d",
      surface: "#0e1118",
      surfaceElevated: "#151a24",
      text: "#f4edd9",
      mutedText: "#b8ad94",
      border: "#9a7b3b",
      accent: "#dfc07b",
      accentSecondary: "#6ec4d9",
      accentForeground: "#08090d",
      focus: "#f7dfb0",
      success: "#4ade80",
      warning: "#dfc07b",
      danger: "#f87171",
    },
    light: {
      canvas: "#faf7f0",
      surface: "#ffffff",
      surfaceElevated: "#eee6d4",
      text: "#18140d",
      mutedText: "#524838",
      border: "#7a5e28",
      accent: "#7a5508",
      accentSecondary: "#0e6678",
      accentForeground: "#ffffff",
      focus: "#18140d",
      success: "#15803d",
      warning: "#92400e",
      danger: "#b91c1c",
    },
  },
  brutalist: {
    dark: {
      canvas: "#090909",
      surface: "#121212",
      surfaceElevated: "#1d1d1d",
      text: "#ffffff",
      mutedText: "#b8b8b8",
      border: "#ffffff",
      accent: "#ff5c00",
      accentSecondary: "#ffffff",
      accentForeground: "#090909",
      focus: "#ff5c00",
      success: "#4ade80",
      warning: "#facc15",
      danger: "#ff3b30",
    },
    light: {
      canvas: "#e9e9e7",
      surface: "#ffffff",
      surfaceElevated: "#d8d8d4",
      text: "#090909",
      mutedText: "#404040",
      border: "#090909",
      accent: "#c43e00",
      accentSecondary: "#090909",
      accentForeground: "#ffffff",
      focus: "#090909",
      success: "#15803d",
      warning: "#92400e",
      danger: "#b91c1c",
    },
  },
  noir: {
    dark: {
      canvas: "#060607",
      surface: "#101012",
      surfaceElevated: "#19191d",
      text: "#f2f2f2",
      mutedText: "#b3b3b8",
      border: "#44444a",
      accent: "#ff4757",
      accentSecondary: "#e4e4e7",
      accentForeground: "#060607",
      focus: "#ff4757",
      success: "#4ade80",
      warning: "#facc15",
      danger: "#ff4757",
    },
    light: {
      canvas: "#ededed",
      surface: "#fafafa",
      surfaceElevated: "#dedede",
      text: "#111111",
      mutedText: "#464646",
      border: "#111111",
      accent: "#a80d22",
      accentSecondary: "#111111",
      accentForeground: "#ffffff",
      focus: "#111111",
      success: "#15803d",
      warning: "#92400e",
      danger: "#a80d22",
    },
  },
  kinetic: {
    dark: {
      canvas: "#080614",
      surface: "#110d24",
      surfaceElevated: "#1b1636",
      text: "#f4f2ff",
      mutedText: "#b8b1de",
      border: "#4f46e5",
      accent: "#a3e635",
      accentSecondary: "#22d3ee",
      accentForeground: "#080614",
      focus: "#a3e635",
      success: "#a3e635",
      warning: "#fbbf24",
      danger: "#fb7185",
    },
    light: {
      canvas: "#eef0ff",
      surface: "#ffffff",
      surfaceElevated: "#dfe2fc",
      text: "#100c2b",
      mutedText: "#3e3866",
      border: "#4338ca",
      accent: "#3f6212",
      accentSecondary: "#0e7490",
      accentForeground: "#ffffff",
      focus: "#100c2b",
      success: "#3f6212",
      warning: "#92400e",
      danger: "#be123c",
    },
  },
};

const SKIN_RECIPES: Readonly<Record<SkinName, SkinRecipeSpec>> = {
  default: {
    radius: {
      none: "0px",
      sm: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
      full: "9999px",
    },
    borderWidth: "1px",
    borderStyle: "solid",
    cardClip: "none",
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.body,
    displayFont: 'var(--font-brush), Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    headingFont: 'var(--font-brush), Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    bodyFont: IMPERIUM_LUMEN_TOKENS.typography.body,
    headingTracking: "0.03em",
    headingTransform: "none",
    textTransform: "none",
    buttonShadow: "0 3px 0 var(--brand-ink, #08090d)",
    cardShadow: "0 2px 10px rgba(0, 0, 0, 0.28)",
    overlayShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
    canvasPattern:
      "radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--primary) 10%, transparent) 0, transparent 42%)",
    iconStroke: "1.95",
    iconCap: "round",
    ornament: "lunar-bracket",
    mediaFilter: "none",
    motionDuration: "200ms",
  },
  riot: {
    radius: {
      none: "0px",
      sm: "0px",
      md: "2px",
      lg: "2px",
      xl: "4px",
      full: "9999px",
    },
    borderWidth: "2px",
    borderStyle: "solid",
    cardClip: "none",
    fontFamily: 'var(--font-brush), Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    displayFont: 'var(--font-brush), Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    headingFont: 'var(--font-brush), Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    bodyFont: 'var(--font-mono), ui-monospace, SFMono-Regular, monospace',
    headingTracking: "0.06em",
    headingTransform: "uppercase",
    textTransform: "uppercase",
    buttonShadow: "4px 4px 0 var(--brand-ink, #08090d)",
    cardShadow: "6px 6px 0 var(--dna-accent-secondary, #ffd21f)",
    overlayShadow: "8px 8px 0 var(--dna-accent-secondary, #ed149b)",
    canvasPattern:
      "radial-gradient(color-mix(in srgb, var(--primary) 16%, transparent) 1px, transparent 1.5px)",
    iconStroke: "2.3",
    iconCap: "square",
    ornament: "staple-tape",
    mediaFilter: "contrast(1.18) saturate(1.25)",
    motionDuration: "120ms",
  },
  editorial: {
    radius: {
      none: "0px",
      sm: "2px",
      md: "4px",
      lg: "6px",
      xl: "8px",
      full: "9999px",
    },
    borderWidth: "1px",
    borderStyle: "solid",
    cardClip: "none",
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    displayFont: 'var(--font-cinzel), "Cinzel", "Palatino Linotype", Georgia, serif',
    headingFont: 'var(--font-cinzel), "Cinzel", "Palatino Linotype", Georgia, serif',
    bodyFont: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    headingTracking: "-0.01em",
    headingTransform: "none",
    textTransform: "none",
    buttonShadow: "none",
    cardShadow: "0 12px 32px rgba(0, 0, 0, 0.16)",
    overlayShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
    canvasPattern:
      "linear-gradient(90deg, color-mix(in srgb, var(--border) 18%, transparent) 1px, transparent 1px)",
    iconStroke: "1.4",
    iconCap: "round",
    ornament: "editorial-rule",
    mediaFilter: "contrast(1.04) saturate(0.92)",
    motionDuration: "320ms",
  },
  technical: {
    radius: {
      none: "0px",
      sm: "0px",
      md: "2px",
      lg: "2px",
      xl: "4px",
      full: "2px",
    },
    borderWidth: "1px",
    borderStyle: "dashed",
    cardClip:
      "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.technical,
    displayFont: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
    headingFont: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
    bodyFont: IMPERIUM_LUMEN_TOKENS.typography.technical,
    headingTracking: "0.14em",
    headingTransform: "uppercase",
    textTransform: "uppercase",
    buttonShadow: "0 0 0 1px var(--dna-border)",
    cardShadow: "inset 0 1px 0 color-mix(in srgb, var(--primary) 35%, transparent)",
    overlayShadow: "0 0 24px rgba(46, 168, 255, 0.25)",
    canvasPattern:
      "linear-gradient(to right, color-mix(in srgb, var(--primary) 11%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--primary) 11%, transparent) 1px, transparent 1px)",
    iconStroke: "1.6",
    iconCap: "square",
    ornament: "cad-reticle",
    mediaFilter: "grayscale(0.55) contrast(1.15) saturate(1.15)",
    motionDuration: "70ms",
  },
  archive: {
    radius: {
      none: "0px",
      sm: "4px",
      md: "6px",
      lg: "10px",
      xl: "14px",
      full: "9999px",
    },
    borderWidth: "2px",
    borderStyle: "double",
    cardClip: "none",
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    displayFont: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
    headingFont: 'var(--font-hand), "Palatino Linotype", Georgia, serif',
    bodyFont: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    headingTracking: "0.02em",
    headingTransform: "none",
    textTransform: "none",
    buttonShadow: "2px 3px 0 rgba(0, 0, 0, 0.35)",
    cardShadow: "4px 4px 0 rgba(0, 0, 0, 0.28)",
    overlayShadow: "6px 6px 0 rgba(0, 0, 0, 0.35)",
    canvasPattern:
      "repeating-linear-gradient(0deg, transparent 0 27px, color-mix(in srgb, var(--border) 16%, transparent) 27px 28px)",
    iconStroke: "1.75",
    iconCap: "round",
    ornament: "archival-stamp",
    mediaFilter: "sepia(0.36) contrast(1.05)",
    motionDuration: "240ms",
  },
  transmission: {
    radius: {
      none: "0px",
      sm: "2px",
      md: "6px",
      lg: "8px",
      xl: "12px",
      full: "9999px",
    },
    borderWidth: "1px",
    borderStyle: "solid",
    cardClip: "none",
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.technical,
    displayFont: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
    headingFont: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
    bodyFont: IMPERIUM_LUMEN_TOKENS.typography.technical,
    headingTracking: "0.12em",
    headingTransform: "uppercase",
    textTransform: "uppercase",
    buttonShadow: "0 0 14px rgba(56, 189, 248, 0.32)",
    cardShadow: "0 0 22px rgba(56, 189, 248, 0.16)",
    overlayShadow: "0 0 28px rgba(56, 189, 248, 0.28)",
    canvasPattern:
      "repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb, var(--primary) 8%, transparent) 2px 3px)",
    iconStroke: "1.8",
    iconCap: "round",
    ornament: "signal-led",
    mediaFilter: "contrast(1.16) saturate(1.15)",
    motionDuration: "150ms",
  },
  sanctuary: {
    radius: {
      none: "0px",
      sm: "0px",
      md: "0px",
      lg: "0px",
      xl: "2px",
      full: "9999px",
    },
    borderWidth: "1px",
    borderStyle: "solid",
    cardClip: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
    cardTransform: "none",
    cardHoverTransform: "translateY(-2px)",
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    displayFont: 'var(--font-cinzel), "Cinzel", Georgia, serif',
    headingFont: 'var(--font-cinzel), "Cinzel", Georgia, serif',
    bodyFont: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    headingTracking: "0.14em",
    headingTransform: "uppercase",
    textTransform: "uppercase",
    buttonShadow: "0 0 0 1px var(--primary)",
    cardShadow: "0 12px 32px rgba(0, 0, 0, 0.25)",
    overlayShadow: "0 20px 60px rgba(0, 0, 0, 0.45)",
    canvasPattern:
      "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 65%)",
    iconStroke: "1.35",
    iconCap: "round",
    ornament: "octagram-bracket",
    mediaFilter: "contrast(1.06) saturate(0.95)",
    motionDuration: "280ms",
  },
  brutalist: {
    radius: {
      none: "0px",
      sm: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      full: "0px",
    },
    borderWidth: "3px",
    borderStyle: "solid",
    cardClip: "none",
    cardTransform: "none",
    cardHoverTransform: "translate(-3px, -3px)",
    fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", system-ui, sans-serif',
    displayFont: 'var(--font-brush), Impact, "Arial Black", sans-serif',
    headingFont: 'Impact, "Arial Black", sans-serif',
    bodyFont: 'var(--font-mono), ui-monospace, monospace',
    headingTracking: "0.08em",
    headingTransform: "uppercase",
    textTransform: "uppercase",
    buttonShadow: "4px 4px 0 var(--border)",
    cardShadow: "6px 6px 0 var(--border)",
    overlayShadow: "10px 10px 0 var(--border)",
    canvasPattern:
      "repeating-linear-gradient(45deg, color-mix(in srgb, var(--border) 6%, transparent) 0 12px, transparent 12px 24px)",
    iconStroke: "2.6",
    iconCap: "square",
    ornament: "concrete-rivet",
    mediaFilter: "contrast(1.32) saturate(0.85)",
    motionDuration: "40ms",
  },
  noir: {
    radius: {
      none: "0px",
      sm: "2px",
      md: "2px",
      lg: "2px",
      xl: "4px",
      full: "9999px",
    },
    borderWidth: "1px",
    borderStyle: "solid",
    cardClip: "none",
    cardTransform: "none",
    cardHoverTransform: "translateY(-1px)",
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    displayFont: 'var(--font-cinzel), Georgia, serif',
    headingFont: 'var(--font-mono), ui-monospace, monospace',
    bodyFont: 'var(--font-mono), ui-monospace, monospace',
    headingTracking: "0.1em",
    headingTransform: "uppercase",
    textTransform: "uppercase",
    buttonShadow: "none",
    cardShadow: "0 10px 28px rgba(0, 0, 0, 0.4)",
    overlayShadow: "0 24px 56px rgba(0, 0, 0, 0.65)",
    canvasPattern:
      "radial-gradient(color-mix(in srgb, var(--border) 20%, transparent) 1px, transparent 1px)",
    iconStroke: "1.6",
    iconCap: "butt",
    ornament: "film-sprocket",
    mediaFilter: "grayscale(1) contrast(1.28) brightness(0.95)",
    motionDuration: "180ms",
  },
  kinetic: {
    radius: {
      none: "0px",
      sm: "2px",
      md: "4px",
      lg: "6px",
      xl: "10px",
      full: "9999px",
    },
    borderWidth: "2px",
    borderStyle: "solid",
    cardClip: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
    cardTransform: "skewX(-0.8deg)",
    cardHoverTransform: "skewX(0deg) translateY(-4px) scale(1.015)",
    fontFamily: 'var(--font-brush), Impact, system-ui, sans-serif',
    displayFont: 'var(--font-brush), Impact, sans-serif',
    headingFont: 'var(--font-brush), Impact, sans-serif',
    bodyFont: 'var(--font-mono), ui-monospace, monospace',
    headingTracking: "0.05em",
    headingTransform: "uppercase",
    textTransform: "uppercase",
    buttonShadow: "3px 3px 0 var(--accent)",
    cardShadow: "5px 5px 0 var(--accent)",
    overlayShadow: "8px 8px 0 var(--accent)",
    canvasPattern:
      "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--primary) 7%, transparent) 0 8px, transparent 8px 20px)",
    iconStroke: "2.2",
    iconCap: "round",
    ornament: "vector-chevron",
    mediaFilter: "saturate(1.35) contrast(1.12)",
    motionDuration: "130ms",
  },
};

const DENSITY_PADDING: Readonly<
  Record<CanonicalDensity, { buttonX: string; cardPad: string; dialogPad: string }>
> = {
  compact: { buttonX: "0.75rem", cardPad: "0.875rem", dialogPad: "1.125rem" },
  comfortable: { buttonX: "1rem", cardPad: "1.25rem", dialogPad: "1.5rem" },
  spacious: { buttonX: "1.35rem", cardPad: "1.75rem", dialogPad: "2rem" },
};

export interface ResolveCanonicalTokensOptions {
  dnaId?: CanonicalDnaId;
  skin?: SkinName;
  mode?: CanonicalThemeMode;
  density?: CanonicalDensity;
}

function pickContrastForeground(bgHex: string): string {
  const clean = bgHex.replace(/^#/, "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : clean;
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  const whiteContrast = 1.05 / (lum + 0.05);
  const darkContrast = (lum + 0.05) / 0.054;
  return whiteContrast >= darkContrast ? BRAND_TOKENS.white : BRAND_TOKENS.ink;
}

/** Single canonical pipeline resolver: DNA -> Theme Mode -> Skin -> Semantic -> Component Tokens */
export function resolveCanonicalTokens(
  options: ResolveCanonicalTokensOptions = {},
): CanonicalResolvedTokens {
  const dnaId: CanonicalDnaId =
    options.dnaId && options.dnaId in MASTER_DNA_PALETTES ? options.dnaId : "01-imperium-lumen";
  const skin: SkinName = options.skin && options.skin in SKIN_RECIPES ? options.skin : "default";
  const mode: CanonicalThemeMode = options.mode === "light" ? "light" : "dark";
  const density: CanonicalDensity =
    options.density && options.density in DENSITY_PADDING ? options.density : "comfortable";

  const baseDnaPalette: DnaPaletteSpec =
    mode === "light" ? MASTER_DNA_LIGHT_PALETTES[dnaId] : MASTER_DNA_PALETTES[dnaId];
  const palette: DnaPaletteSpec =
    skin === "default" ? baseDnaPalette : SKIN_SURFACE_PALETTES[skin][mode];
  const recipe = SKIN_RECIPES[skin];
  const densityMetrics = DENSITY_PADDING[density];
  const resolvedSecondaryAccent = palette.accentSecondary ?? palette.accent;
  const resolvedSecondaryFg = palette.accentSecondary
    ? pickContrastForeground(resolvedSecondaryAccent)
    : palette.accentForeground;

  const semantic: CanonicalSemanticTokens = {
    canvas: palette.canvas,
    surface: palette.surface,
    surfaceElevated: palette.surfaceElevated,
    surfaceMuted: palette.surfaceElevated,
    background: palette.canvas,
    foreground: palette.text,
    card: palette.surface,
    cardForeground: palette.text,
    popover: palette.surfaceElevated,
    popoverForeground: palette.text,
    primary: palette.accent,
    primaryForeground: palette.accentForeground,
    secondary: palette.accentSecondary ?? palette.surfaceElevated,
    secondaryForeground: palette.accentSecondary ? resolvedSecondaryFg : palette.text,
    muted: palette.surfaceElevated,
    mutedForeground: palette.mutedText,
    accent: resolvedSecondaryAccent,
    accentSecondary: resolvedSecondaryAccent,
    accentForeground: resolvedSecondaryFg,
    destructive: palette.danger ?? BRAND_TOKENS.red,
    destructiveForeground: BRAND_TOKENS.white,
    border: palette.border,
    input: palette.border,
    ring: palette.focus,
    focus: palette.focus,
    success: palette.success ?? IMPERIUM_LUMEN_TOKENS.semantic.success,
    warning: palette.warning ?? palette.accent,
    info: BRAND_TOKENS.blue,
    error: palette.danger ?? IMPERIUM_LUMEN_TOKENS.semantic.danger,
  };

  return {
    dnaId,
    skin,
    mode,
    density,
    brand: BRAND_TOKENS,
    semantic,
    shape: {
      radius: recipe.radius,
      borderWidth: {
        hairline: "1px",
        thin: "1px",
        medium: "2px",
        thick: "3px",
      },
      borderStyle: recipe.borderStyle,
      outlineWidth: "2px",
      outlineOffset: "3px",
    },
    layout: {
      spacingScale: IMPERIUM_LUMEN_TOKENS.layout.spacingScale,
      contentWidth: IMPERIUM_LUMEN_TOKENS.layout.contentWidth,
      breakpoints: IMPERIUM_LUMEN_TOKENS.layout.breakpoints,
    },
    typography: {
      display: recipe.displayFont,
      heading: recipe.headingFont,
      editorial: IMPERIUM_LUMEN_TOKENS.typography.editorial,
      body: recipe.bodyFont,
      label: IMPERIUM_LUMEN_TOKENS.typography.label,
      technical: IMPERIUM_LUMEN_TOKENS.typography.technical,
      componentUi: recipe.fontFamily,
      headingTracking: recipe.headingTracking,
      headingTransform: recipe.headingTransform,
    },
    atmosphere: {
      canvasPattern: recipe.canvasPattern,
      cardBorderStyle: recipe.borderStyle,
      cardClip: recipe.cardClip,
      cardTransform: recipe.cardTransform ?? (skin === "riot" ? "rotate(-0.45deg)" : "none"),
      cardHoverTransform:
        recipe.cardHoverTransform ?? (skin === "riot" ? "translateY(-4px) rotate(0.6deg) scale(1.008)" : "translateY(-2px)"),
      ornament: recipe.ornament,
      iconStroke: recipe.iconStroke,
      iconCap: recipe.iconCap,
      mediaFilter: recipe.mediaFilter,
      motionDuration: recipe.motionDuration,
      worldAccent: baseDnaPalette.accent,
    },
    elevation: {
      shadowSurface: recipe.cardShadow,
      shadowInteractive: recipe.buttonShadow,
      shadowOverlay: recipe.overlayShadow,
    },
    motion: IMPERIUM_LUMEN_TOKENS.motion,
    components: {
      button: {
        heightSm: "2.25rem",
        heightMd: "2.75rem",
        heightLg: "3rem",
        paddingX: densityMetrics.buttonX,
        radius: recipe.radius.md,
        borderWidth: recipe.borderWidth,
        shadow: recipe.buttonShadow,
        fontFamily: recipe.fontFamily,
        textTransform: recipe.textTransform,
      },
      input: {
        height: "2.75rem",
        paddingX: "0.875rem",
        radius: recipe.radius.md,
        borderWidth: recipe.borderWidth,
        focusRingWidth: "2px",
      },
      card: {
        padding: densityMetrics.cardPad,
        radius: recipe.radius.lg,
        borderWidth: recipe.borderWidth,
        shadow: recipe.cardShadow,
      },
      dialog: {
        maxWidth: "32rem",
        padding: densityMetrics.dialogPad,
        radius: recipe.radius.lg,
        shadow: recipe.overlayShadow,
      },
      badge: {
        radius: skin === "riot" || skin === "technical" ? recipe.radius.sm : recipe.radius.full,
        paddingX: "0.625rem",
        fontSize: "0.75rem",
      },
    },
  };
}

/**
 * Emit complete, browser-valid CSS custom properties for the resolved DNA + Skin + Theme state.
 * Includes `--dna-*`, `--brand-*`, `--mw-*` component tokens, `--background..--ring`, `--radius`,
 * and derived zine palette tokens (`--ink`, `--panel`, `--line`, `--pink`, `--blue`, `--yellow`).
 */
export function canonicalTokensToCssVariables(
  resolved: CanonicalResolvedTokens,
): Readonly<Record<`--${string}`, string>> {
  const { brand, semantic, components, shape, typography, elevation, atmosphere } = resolved;
  return {
    "--dna-canvas": semantic.canvas,
    "--dna-surface": semantic.surface,
    "--dna-surface-elevated": semantic.surfaceElevated,
    "--dna-text": semantic.foreground,
    "--dna-muted": semantic.mutedForeground,
    "--dna-border": semantic.border,
    "--dna-accent": semantic.primary,
    "--dna-accent-secondary": semantic.accentSecondary,
    "--dna-accent-fg": semantic.primaryForeground,
    "--dna-focus": semantic.focus,
    "--dna-world-accent": atmosphere.worldAccent,
    "--dna-success": semantic.success,
    "--dna-warning": semantic.warning,
    "--dna-danger": semantic.error,
    "--brand-ink": brand.ink,
    "--brand-paper": brand.paper,
    "--brand-yellow": brand.yellow,
    "--brand-pink": brand.pink,
    "--brand-blue": brand.blue,
    "--brand-white": brand.white,
    // Valid CSS colors for Tailwind v4 arbitrary utilities (`bg-[var(--background)]`, etc.)
    "--background": `hsl(${hexToHslString(semantic.background)})`,
    "--foreground": `hsl(${hexToHslString(semantic.foreground)})`,
    "--card": `hsl(${hexToHslString(semantic.card)})`,
    "--card-foreground": `hsl(${hexToHslString(semantic.cardForeground)})`,
    "--popover": `hsl(${hexToHslString(semantic.popover)})`,
    "--popover-foreground": `hsl(${hexToHslString(semantic.popoverForeground)})`,
    "--primary": `hsl(${hexToHslString(semantic.primary)})`,
    "--primary-foreground": `hsl(${hexToHslString(semantic.primaryForeground)})`,
    "--secondary": `hsl(${hexToHslString(semantic.secondary)})`,
    "--secondary-foreground": `hsl(${hexToHslString(semantic.secondaryForeground)})`,
    "--muted": `hsl(${hexToHslString(semantic.muted)})`,
    "--muted-foreground": `hsl(${hexToHslString(semantic.mutedForeground)})`,
    "--accent": `hsl(${hexToHslString(semantic.accent)})`,
    "--accent-foreground": `hsl(${hexToHslString(semantic.accentForeground)})`,
    "--destructive": `hsl(${hexToHslString(semantic.destructive)})`,
    "--destructive-foreground": `hsl(${hexToHslString(semantic.destructiveForeground)})`,
    "--border": `hsl(${hexToHslString(semantic.border)})`,
    "--input": `hsl(${hexToHslString(semantic.input)})`,
    "--ring": `hsl(${hexToHslString(semantic.ring)})`,
    "--radius": shape.radius.lg,
    // Component & 8-Axis Skin Grammar tokens driven by active skin + DNA + density
    "--mw-btn-radius": components.button.radius,
    "--mw-btn-border-width": components.button.borderWidth,
    "--mw-btn-shadow": components.button.shadow,
    "--mw-btn-font": components.button.fontFamily,
    "--mw-btn-transform": components.button.textTransform,
    "--mw-input-radius": components.input.radius,
    "--mw-input-border-width": components.input.borderWidth,
    "--mw-card-radius": components.card.radius,
    "--mw-card-border-width": components.card.borderWidth,
    "--mw-card-border-style": atmosphere.cardBorderStyle,
    "--mw-card-clip": atmosphere.cardClip,
    "--mw-card-transform": atmosphere.cardTransform,
    "--mw-card-hover-transform": atmosphere.cardHoverTransform,
    "--mw-card-shadow": elevation.shadowSurface,
    "--mw-card-padding": components.card.padding,
    "--mw-badge-radius": components.badge.radius,
    "--mw-dialog-radius": components.dialog.radius,
    "--mw-dialog-shadow": elevation.shadowOverlay,
    "--mw-font-component": typography.componentUi,
    "--mw-font-display": typography.display,
    "--mw-font-heading": typography.heading,
    "--mw-font-body": typography.body,
    "--mw-heading-tracking": typography.headingTracking,
    "--mw-heading-transform": typography.headingTransform,
    "--mw-canvas-pattern": atmosphere.canvasPattern,
    "--mw-icon-stroke": atmosphere.iconStroke,
    "--mw-icon-cap": atmosphere.iconCap,
    "--mw-ornament": atmosphere.ornament,
    "--mw-media-filter": atmosphere.mediaFilter,
    "--mw-motion-duration": atmosphere.motionDuration,
    // Legacy variable bridge derived from active canonical theme (supports mode + skin switching)
    "--ink": semantic.background,
    "--panel": semantic.surface,
    "--panel-2": semantic.surfaceElevated,
    "--paper": resolved.mode === "light" ? semantic.foreground : brand.paper,
    "--line": semantic.border,
    "--pink": semantic.primary,
    "--blue": resolved.mode === "light" ? semantic.info : brand.blue,
    "--yellow": semantic.warning,
    "--purple": brand.purple,
    "--red": semantic.destructive,
    "--green": semantic.success,
  };
}

/** Validate that a resolved token tree contains no undefined/empty CSS variable values */
export function assertCanonicalTokensValid(resolved: CanonicalResolvedTokens): readonly string[] {
  const vars = canonicalTokensToCssVariables(resolved);
  const errors: string[] = [];
  for (const [key, value] of Object.entries(vars)) {
    if (!value || value.includes("undefined") || value.includes("[object")) {
      errors.push(`${key}=${String(value)}`);
    }
  }
  return errors;
}

/** Helper to bridge canonical tokens to a partial DNATokens semantic block */
export function canonicalSemanticToDnaTokens(
  resolved: CanonicalResolvedTokens,
): DNATokens["colors"]["semantic"] {
  const s = resolved.semantic;
  return {
    background: createCanonicalColorToken(s.background),
    foreground: createCanonicalColorToken(s.foreground),
    card: createCanonicalColorToken(s.card),
    cardForeground: createCanonicalColorToken(s.cardForeground),
    popover: createCanonicalColorToken(s.popover),
    popoverForeground: createCanonicalColorToken(s.popoverForeground),
    primary: createCanonicalColorToken(s.primary),
    primaryForeground: createCanonicalColorToken(s.primaryForeground),
    secondary: createCanonicalColorToken(s.secondary),
    secondaryForeground: createCanonicalColorToken(s.secondaryForeground),
    muted: createCanonicalColorToken(s.muted),
    mutedForeground: createCanonicalColorToken(s.mutedForeground),
    accent: createCanonicalColorToken(s.accent),
    accentForeground: createCanonicalColorToken(s.accentForeground),
    destructive: createCanonicalColorToken(s.destructive),
    destructiveForeground: createCanonicalColorToken(s.destructiveForeground),
    border: createCanonicalColorToken(s.border),
    input: createCanonicalColorToken(s.input),
    ring: createCanonicalColorToken(s.ring),
  };
}
