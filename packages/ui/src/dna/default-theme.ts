// Moonwitness DNA Core -- Default Theme Token Values
// Complete serialized token map extracted from theme.css + base.css
// Single source of truth for all visual design decisions

import type { DNATokens, ColorToken, ColorScale, SemanticColors, LegacyColors, SpacingToken, RadiusToken, ShadowToken, TypographyToken, MotionToken, EffectToken, ZIndexToken, BreakpointToken } from './tokens';

// Helper to create color tokens with both hex and HSL
const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return Math.round(h) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%';
};

const createColorToken = (hex: string, alpha?: number): ColorToken => ({
  hex,
  hsl: hexToHsl(hex),
  alpha,
});

// Color scales - generated from base colors
const createScale = (baseHex: string): ColorScale => {
  // This is a simplified scale generation - in production you'd use a proper color scale generator
  const base = createColorToken(baseHex);
  return {
    50: createColorToken(baseHex),
    100: createColorToken(baseHex),
    200: createColorToken(baseHex),
    300: createColorToken(baseHex),
    400: createColorToken(baseHex),
    500: base,
    600: createColorToken(baseHex),
    700: createColorToken(baseHex),
    800: createColorToken(baseHex),
    900: createColorToken(baseHex),
    950: createColorToken(baseHex),
  };
};

// Semantic colors from theme.css (HSL values)
const semanticColors: SemanticColors = {
  background: { hex: '#0b0b10', hsl: '220 13% 5%' },
  foreground: { hex: '#f5f3ee', hsl: '45 15% 96%' },
  card: { hex: '#14141c', hsl: '220 13% 8%' },
  cardForeground: { hex: '#f5f3ee', hsl: '45 15% 96%' },
  popover: { hex: '#14141c', hsl: '220 13% 8%' },
  popoverForeground: { hex: '#f5f3ee', hsl: '45 15% 96%' },
  primary: { hex: '#ff2d78', hsl: '335 100% 56%' },
  primaryForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
  secondary: { hex: '#ffd21f', hsl: '45 100% 57%' },
  secondaryForeground: { hex: '#060812', hsl: '6 8% 12%' },
  muted: { hex: '#1b1b26', hsl: '220 13% 11%' },
  mutedForeground: { hex: '#9b9b9b', hsl: '45 8% 65%' },
  accent: { hex: '#2ea8ff', hsl: '200 85% 56%' },
  accentForeground: { hex: '#060812', hsl: '6 8% 12%' },
  destructive: { hex: '#ff3b3b', hsl: '0 85% 60%' },
  destructiveForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
  border: { hex: '#2a2a38', hsl: '220 10% 19%' },
  input: { hex: '#2a2a38', hsl: '220 10% 19%' },
  ring: { hex: '#ff2d78', hsl: '335 100% 56%' },
};

// Legacy colors from theme.css (hex values)
const legacyColors: LegacyColors = {
  ink: { hex: '#0b0b10' },
  panel: { hex: '#14141c' },
  panel2: { hex: '#1b1b26' },
  paper: { hex: '#f4eede' },
  pink: { hex: '#ff2d78' },
  blue: { hex: '#2ea8ff' },
  yellow: { hex: '#ffd21f' },
  purple: { hex: '#a855f7' },
  red: { hex: '#ff3b3b' },
  green: { hex: '#3ddc84' },
  line: { hex: '#2a2a38' },
  heroHeadlinePaper: { hex: '#ff2d78' },
  heroCaptionPaper: { hex: '#f4eede' },
  heroPrintShadow: { hex: 'rgba(11, 11, 16, 1)' },
  heroRule: { hex: '#f4eede' },
};

// Spacing tokens from Tailwind default + custom
const spacing: SpacingToken = {
  px: '1px',
  0: '0',
  '0_5': '0.125rem',
  1: '0.25rem',
  '1_5': '0.375rem',
  2: '0.5rem',
  '2_5': '0.625rem',
  3: '0.75rem',
  '3_5': '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Radius tokens
const radius: RadiusToken = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

// Shadow tokens from base.css
const shadows: ShadowToken = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  zine: '5px 5px 0 rgba(0, 0, 0, 0.55)',
  zineHover: '7px 7px 0 rgba(255, 45, 120, 0.4)',
  zineRough: '6px 6px 0 rgba(0, 0, 0, 0.55)',
  zineRoughHover: '8px 8px 0 rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 45, 120, 0.25)',
  print: '4px 5px 0 #0b0b10',
  cmyk: '4px 4px 0 #ff2d78, -2px -2px 0 #2ea8ff',
};

// Typography tokens
const typography: TypographyToken = {
  fontFamily: {
    brush: 'var(--font-brush), cursive',
    hand: 'var(--font-hand), cursive',
    mono: 'var(--font-mono), ui-monospace, monospace',
    sans: 'ui-sans-serif, system-ui, sans-serif',
    serif: 'ui-serif, Georgia, serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Motion tokens
const motion: MotionToken = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inout: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  reducedMotion: {
    disableAnimations: true,
    instantTransitions: true,
  },
};

// Effect tokens from base.css
const effects: EffectToken = {
  halftone: {
    dotSize: '1px',
    spacing: '7px',
    opacity: 0.08,
    color: { hex: '#ffffff', hsl: '0 0% 100%' },
  },
  grain: {
    opacity: 0.5,
    blendMode: 'overlay',
    size: '160px',
  },
  cmykSlip: {
    offset: '2px',
    cyan: { hex: '#2ea8ff' },
    magenta: { hex: '#ff2d78' },
  },
  duotone: {
    gradient: 'linear-gradient(155deg, #ff2d78 0%, #a5166a 45%, #2ea8ff 100%)',
    blendMode: 'color',
    opacity: 0.9,
  },
  tape: {
    width: '92px',
    height: '26px',
    opacity: 0.28,
    blur: '1px',
  },
  sticker: {
    clipPath: 'polygon(1% 4%, 4% 1%, 9% 3%, 15% 0%, 22% 2%, 30% 1%, 38% 3%, 47% 0%, 55% 2%, 63% 1%, 71% 3%, 79% 0%, 87% 2%, 94% 1%, 99% 4%, 100% 12%, 98% 20%, 100% 30%, 98% 41%, 100% 52%, 98% 63%, 100% 74%, 98% 85%, 100% 93%, 97% 99%, 90% 97%, 82% 100%, 74% 98%, 66% 100%, 58% 98%, 50% 100%, 42% 98%, 34% 100%, 26% 98%, 18% 100%, 10% 98%, 4% 100%, 0% 96%, 1% 88%, 0% 78%, 2% 68%, 0% 57%, 1% 46%, 0% 36%, 2% 26%, 0% 15%)',
    rotation: '-2deg',
  },
  brushUnderline: {
    height: '0.28em',
    color: { hex: '#ffd21f' },
    position: '92%',
  },
};

// Z-index tokens
const zIndex: ZIndexToken = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  max: 2147483647,
};

// Breakpoint tokens
const breakpoints: BreakpointToken = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Complete default theme
export const defaultTheme: DNATokens = {
  colors: {
    semantic: semanticColors,
    legacy: legacyColors,
    scales: {
      pink: createScale('#ff2d78'),
      blue: createScale('#2ea8ff'),
      yellow: createScale('#ffd21f'),
      purple: createScale('#a855f7'),
      red: createScale('#ff3b3b'),
      green: createScale('#3ddc84'),
      zinc: createScale('#71717a'),
      slate: createScale('#64748b'),
    },
  },
  spacing,
  radius,
  shadows,
  typography,
  motion,
  effects,
  zIndex,
  breakpoints,
};

export type DefaultTheme = typeof defaultTheme;