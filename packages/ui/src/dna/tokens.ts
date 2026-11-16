// Moonwitness DNA Core -- Design Token Types
// Single source of truth for all visual design decisions

export interface ColorToken {
  readonly hex: string;
  readonly hsl?: string;
  readonly alpha?: number;
}

export interface ColorScale {
  readonly 50: ColorToken;
  readonly 100: ColorToken;
  readonly 200: ColorToken;
  readonly 300: ColorToken;
  readonly 400: ColorToken;
  readonly 500: ColorToken;
  readonly 600: ColorToken;
  readonly 700: ColorToken;
  readonly 800: ColorToken;
  readonly 900: ColorToken;
  readonly 950: ColorToken;
}

export interface SemanticColors {
  readonly background: ColorToken;
  readonly foreground: ColorToken;
  readonly card: ColorToken;
  readonly cardForeground: ColorToken;
  readonly popover: ColorToken;
  readonly popoverForeground: ColorToken;
  readonly primary: ColorToken;
  readonly primaryForeground: ColorToken;
  readonly secondary: ColorToken;
  readonly secondaryForeground: ColorToken;
  readonly muted: ColorToken;
  readonly mutedForeground: ColorToken;
  readonly accent: ColorToken;
  readonly accentForeground: ColorToken;
  readonly destructive: ColorToken;
  readonly destructiveForeground: ColorToken;
  readonly border: ColorToken;
  readonly input: ColorToken;
  readonly ring: ColorToken;
}

export interface LegacyColors {
  readonly ink: ColorToken;
  readonly panel: ColorToken;
  readonly panel2: ColorToken;
  readonly paper: ColorToken;
  readonly pink: ColorToken;
  readonly blue: ColorToken;
  readonly yellow: ColorToken;
  readonly purple: ColorToken;
  readonly red: ColorToken;
  readonly green: ColorToken;
  readonly line: ColorToken;
  readonly heroHeadlinePaper: ColorToken;
  readonly heroCaptionPaper: ColorToken;
  readonly heroPrintShadow: ColorToken;
  readonly heroRule: ColorToken;
}

export interface SpacingToken {
  readonly px: string;
  readonly 0: string;
  readonly "0_5": string;
  readonly 1: string;
  readonly "1_5": string;
  readonly 2: string;
  readonly "2_5": string;
  readonly 3: string;
  readonly "3_5": string;
  readonly 4: string;
  readonly 5: string;
  readonly 6: string;
  readonly 7: string;
  readonly 8: string;
  readonly 9: string;
  readonly 10: string;
  readonly 11: string;
  readonly 12: string;
  readonly 14: string;
  readonly 16: string;
  readonly 20: string;
  readonly 24: string;
  readonly 28: string;
  readonly 32: string;
  readonly 36: string;
  readonly 40: string;
  readonly 44: string;
  readonly 48: string;
  readonly 52: string;
  readonly 56: string;
  readonly 60: string;
  readonly 64: string;
  readonly 72: string;
  readonly 80: string;
  readonly 96: string;
}

export interface RadiusToken {
  readonly none: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly "2xl": string;
  readonly full: string;
}

export interface ShadowToken {
  readonly none: string;
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly "2xl": string;
  readonly inner: string;
  readonly zine: string;
  readonly zineHover: string;
  readonly zineRough: string;
  readonly zineRoughHover: string;
  readonly print: string;
  readonly cmyk: string;
}

export interface TypographyToken {
  readonly fontFamily: {
    readonly brush: string;
    readonly hand: string;
    readonly mono: string;
    readonly sans: string;
    readonly serif: string;
  };
  readonly fontSize: {
    readonly xs: string;
    readonly sm: string;
    readonly base: string;
    readonly lg: string;
    readonly xl: string;
    readonly "2xl": string;
    readonly "3xl": string;
    readonly "4xl": string;
    readonly "5xl": string;
    readonly "6xl": string;
  };
  readonly fontWeight: {
    readonly normal: number;
    readonly medium: number;
    readonly semibold: number;
    readonly bold: number;
    readonly extrabold: number;
    readonly black: number;
  };
  readonly lineHeight: {
    readonly none: string;
    readonly tight: string;
    readonly snug: string;
    readonly normal: string;
    readonly relaxed: string;
    readonly loose: string;
  };
  readonly letterSpacing: {
    readonly tighter: string;
    readonly tight: string;
    readonly normal: string;
    readonly wide: string;
    readonly wider: string;
    readonly widest: string;
  };
}

export interface MotionToken {
  readonly duration: {
    readonly instant: string;
    readonly fast: string;
    readonly normal: string;
    readonly slow: string;
    readonly slower: string;
  };
  readonly easing: {
    readonly linear: string;
    readonly in: string;
    readonly out: string;
    readonly inout: string;
    readonly spring: string;
    readonly bounce: string;
  };
  readonly reducedMotion: {
    readonly disableAnimations: boolean;
    readonly instantTransitions: boolean;
  };
}

export interface EffectToken {
  readonly halftone: {
    readonly dotSize: string;
    readonly spacing: string;
    readonly opacity: number;
    readonly color: ColorToken;
  };
  readonly grain: {
    readonly opacity: number;
    readonly blendMode: string;
    readonly size: string;
  };
  readonly cmykSlip: {
    readonly offset: string;
    readonly cyan: ColorToken;
    readonly magenta: ColorToken;
  };
  readonly duotone: {
    readonly gradient: string;
    readonly blendMode: string;
    readonly opacity: number;
  };
  readonly tape: {
    readonly width: string;
    readonly height: string;
    readonly opacity: number;
    readonly blur: string;
  };
  readonly sticker: {
    readonly clipPath: string;
    readonly rotation: string;
  };
  readonly brushUnderline: {
    readonly height: string;
    readonly color: ColorToken;
    readonly position: string;
  };
}

export interface ZIndexToken {
  readonly hide: number;
  readonly base: number;
  readonly dropdown: number;
  readonly sticky: number;
  readonly fixed: number;
  readonly modalBackdrop: number;
  readonly modal: number;
  readonly popover: number;
  readonly tooltip: number;
  readonly toast: number;
  readonly max: number;
}

export interface BreakpointToken {
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly "2xl": string;
}

export interface DNATokens {
  readonly colors: {
    readonly semantic: SemanticColors;
    readonly legacy: LegacyColors;
    readonly scales: {
      readonly pink: ColorScale;
      readonly blue: ColorScale;
      readonly yellow: ColorScale;
      readonly purple: ColorScale;
      readonly red: ColorScale;
      readonly green: ColorScale;
      readonly zinc: ColorScale;
      readonly slate: ColorScale;
    };
  };
  readonly spacing: SpacingToken;
  readonly radius: RadiusToken;
  readonly shadows: ShadowToken;
  readonly typography: TypographyToken;
  readonly motion: MotionToken;
  readonly effects: EffectToken;
  readonly zIndex: ZIndexToken;
  readonly breakpoints: BreakpointToken;
}

export type TokenPath = string;

export interface TokenReference {
  readonly $ref: TokenPath;
}
