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
    readonly editorial: string;
    readonly body: string;
    readonly label: string;
    readonly technical: string;
    readonly componentUi: string;
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
  readonly fontFamily: string;
  readonly textTransform: string;
  readonly buttonShadow: string;
  readonly cardShadow: string;
  readonly overlayShadow: string;
}

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
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.body,
    textTransform: "none",
    buttonShadow: "0 3px 0 var(--brand-ink, #08090d)",
    cardShadow: "0 2px 10px rgba(0, 0, 0, 0.28)",
    overlayShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
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
    fontFamily: 'var(--font-brush), Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    textTransform: "uppercase",
    buttonShadow: "4px 4px 0 var(--brand-ink, #08090d)",
    cardShadow: "5px 5px 0 rgba(0, 0, 0, 0.6)",
    overlayShadow: "8px 8px 0 var(--dna-accent-secondary, #ed149b)",
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
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    textTransform: "none",
    buttonShadow: "none",
    cardShadow: "0 4px 20px rgba(0, 0, 0, 0.14)",
    overlayShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
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
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.technical,
    textTransform: "uppercase",
    buttonShadow: "0 0 0 1px var(--dna-border)",
    cardShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
    overlayShadow: "0 0 24px rgba(46, 168, 255, 0.2)",
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
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.editorial,
    textTransform: "none",
    buttonShadow: "2px 3px 0 rgba(0, 0, 0, 0.35)",
    cardShadow: "3px 4px 0 rgba(0, 0, 0, 0.25)",
    overlayShadow: "6px 6px 0 rgba(0, 0, 0, 0.35)",
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
    fontFamily: IMPERIUM_LUMEN_TOKENS.typography.technical,
    textTransform: "uppercase",
    buttonShadow: "0 0 14px rgba(46, 168, 255, 0.28)",
    cardShadow: "0 0 18px rgba(46, 168, 255, 0.14)",
    overlayShadow: "0 0 28px rgba(46, 168, 255, 0.26)",
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

  const palette: DnaPaletteSpec =
    mode === "light" ? MASTER_DNA_LIGHT_PALETTES[dnaId] : MASTER_DNA_PALETTES[dnaId];
  const recipe = SKIN_RECIPES[skin];
  const densityMetrics = DENSITY_PADDING[density];

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
    secondaryForeground: palette.accentSecondary
      ? mode === "light"
        ? BRAND_TOKENS.white
        : BRAND_TOKENS.ink
      : palette.text,
    muted: palette.surfaceElevated,
    mutedForeground: palette.mutedText,
    accent: palette.accentSecondary ?? palette.accent,
    accentSecondary: palette.accentSecondary ?? palette.accent,
    accentForeground: palette.accentForeground,
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
      borderStyle: "solid",
      outlineWidth: "2px",
      outlineOffset: "3px",
    },
    layout: {
      spacingScale: IMPERIUM_LUMEN_TOKENS.layout.spacingScale,
      contentWidth: IMPERIUM_LUMEN_TOKENS.layout.contentWidth,
      breakpoints: IMPERIUM_LUMEN_TOKENS.layout.breakpoints,
    },
    typography: {
      display: IMPERIUM_LUMEN_TOKENS.typography.display,
      editorial: IMPERIUM_LUMEN_TOKENS.typography.editorial,
      body: IMPERIUM_LUMEN_TOKENS.typography.body,
      label: IMPERIUM_LUMEN_TOKENS.typography.label,
      technical: IMPERIUM_LUMEN_TOKENS.typography.technical,
      componentUi: recipe.fontFamily,
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
  const { brand, semantic, components, shape, typography, elevation } = resolved;
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
    // Component & elevation tokens driven by active skin + density
    "--mw-btn-radius": components.button.radius,
    "--mw-btn-border-width": components.button.borderWidth,
    "--mw-btn-shadow": components.button.shadow,
    "--mw-btn-font": components.button.fontFamily,
    "--mw-btn-transform": components.button.textTransform,
    "--mw-input-radius": components.input.radius,
    "--mw-input-border-width": components.input.borderWidth,
    "--mw-card-radius": components.card.radius,
    "--mw-card-border-width": components.card.borderWidth,
    "--mw-card-shadow": elevation.shadowSurface,
    "--mw-card-padding": components.card.padding,
    "--mw-badge-radius": components.badge.radius,
    "--mw-dialog-radius": components.dialog.radius,
    "--mw-dialog-shadow": elevation.shadowOverlay,
    "--mw-font-component": typography.componentUi,
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
