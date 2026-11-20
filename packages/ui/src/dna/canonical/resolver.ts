import { IMPERIUM_LUMEN_TOKENS, MASTER_DNA_PALETTES } from "../../skin/imperium-tokens";
import type { SkinName } from "../../skin/compositions";
import type { DNATokens } from "../tokens";
import { createCanonicalColorToken, hexToHslString, MASTER_DNA_LIGHT_PALETTES } from "./palettes-dna";
import { SKIN_SURFACE_PALETTES } from "./palettes-skins";
import { DENSITY_PADDING, SKIN_RECIPES } from "./recipes";
import {
  BRAND_TOKENS,
  type CanonicalDensity,
  type CanonicalDnaId,
  type CanonicalResolvedTokens,
  type CanonicalSemanticTokens,
  type CanonicalThemeMode,
  type DnaPaletteSpec,
  type ResolveCanonicalTokensOptions,
} from "./types";

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
    options.dnaId && Object.prototype.hasOwnProperty.call(MASTER_DNA_PALETTES, options.dnaId)
      ? options.dnaId
      : "01-imperium-lumen";
  const skin: SkinName =
    options.skin && Object.prototype.hasOwnProperty.call(SKIN_RECIPES, options.skin)
      ? options.skin
      : "default";
  const mode: CanonicalThemeMode = options.mode === "light" ? "light" : "dark";
  const density: CanonicalDensity =
    options.density && Object.prototype.hasOwnProperty.call(DENSITY_PADDING, options.density)
      ? options.density
      : "comfortable";

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
