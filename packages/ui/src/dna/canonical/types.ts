// Moonwitness Canonical Design Token Engine
// Single server-safe TypeScript authority reconciling Brand, DNA, Theme Mode, Skin,
// and shadcn/ui CSS custom properties.

import { IMPERIUM_LUMEN_TOKENS, type MasterDnaPaletteMap } from "../../skin/imperium-tokens";
import type { SkinName } from "../../skin/compositions";


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


export interface SkinRecipeSpec {
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

export interface ResolveCanonicalTokensOptions {
  dnaId?: CanonicalDnaId;
  skin?: SkinName;
  mode?: CanonicalThemeMode;
  density?: CanonicalDensity;
}
