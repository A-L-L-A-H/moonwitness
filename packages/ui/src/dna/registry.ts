// Moonwitness DNA Core -- Token Registry
// Token resolution, CSS variable generation, and theme switching

import type { DNATokens, TokenPath, TokenReference, ColorToken } from './tokens';
import { defaultTheme } from './default-theme';

type TokenValue = string | number | boolean | ColorToken | Record<string, unknown>;

// Flatten theme tokens into a path-value map for O(1) lookups
function flattenTokens(obj: Record<string, unknown>, prefix = ''): Map<string, TokenValue> {
  const map = new Map<string, TokenValue>();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? prefix + '.' + key : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value as ColorToken).hex) {
      const nested = flattenTokens(value as Record<string, unknown>, path);
      for (const [nestedPath, nestedValue] of nested) map.set(nestedPath, nestedValue);
    } else {
      map.set(path, value as TokenValue);
    }
  }
  return map;
}

const defaultTokenMap = flattenTokens(defaultTheme as unknown as Record<string, unknown>);

/** Get a token value by dot-notation path */
export function getToken(path: TokenPath, theme: DNATokens = defaultTheme): TokenValue | undefined {
  if (theme === defaultTheme) return defaultTokenMap.get(path);
  const parts = path.split('.');
  let current: unknown = theme;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else return undefined;
  }
  return current as TokenValue;
}

/** Resolve a token reference */
export function resolveToken(ref: TokenReference, theme: DNATokens = defaultTheme): TokenValue | undefined {
  return getToken(ref.$ref, theme);
}

/** Generate CSS custom properties from a theme */
export function generateCSSVariables(theme: DNATokens = defaultTheme, prefix = 'mw'): string {
  const lines: string[] = [];
  const tokenMap = theme === defaultTheme ? defaultTokenMap : flattenTokens(theme as unknown as Record<string, unknown>);
  for (const [path, value] of tokenMap) {
    const cssVar = prefix + '-' + path.replace(/\./g, '-');
    if (value && typeof value === 'object' && 'hex' in value) {
      const color = value as ColorToken;
      lines.push('  ' + cssVar + '-hex: ' + color.hex + ';');
      if (color.hsl) lines.push('  ' + cssVar + '-hsl: ' + color.hsl + ';');
      if (color.alpha !== undefined) lines.push('  ' + cssVar + '-alpha: ' + color.alpha + ';');
    } else if (typeof value === 'string' || typeof value === 'number') {
      lines.push('  ' + cssVar + ': ' + value + ';');
    } else if (typeof value === 'boolean') {
      lines.push('  ' + cssVar + ': ' + (value ? '1' : '0') + ';');
    }
  }

  // Also generate shadcn/ui compatible HSL variables
  const shadcnMap = generateShadcnHSLVars(theme);
  for (const [name, hsl] of Object.entries(shadcnMap)) {
    lines.push('  --' + name + ': ' + hsl + ';');
  }

  return ':root {\n' + lines.join('\n') + '\n}';
}

function generateShadcnHSLVars(theme: DNATokens): Record<string, string> {
  const vars: Record<string, string> = {};
  const sem = theme.colors?.semantic;
  if (!sem) return vars;

  const map: Record<string, keyof typeof sem> = {
    background: 'background',
    foreground: 'foreground',
    card: 'card',
    'card-foreground': 'cardForeground',
    popover: 'popover',
    'popover-foreground': 'popoverForeground',
    primary: 'primary',
    'primary-foreground': 'primaryForeground',
    secondary: 'secondary',
    'secondary-foreground': 'secondaryForeground',
    muted: 'muted',
    'muted-foreground': 'mutedForeground',
    accent: 'accent',
    'accent-foreground': 'accentForeground',
    destructive: 'destructive',
    'destructive-foreground': 'destructiveForeground',
    border: 'border',
    input: 'input',
    ring: 'ring',
  };

  for (const [cssName, tokenKey] of Object.entries(map)) {
    const token = sem[tokenKey];
    if (token && typeof token === 'object' && 'hsl' in token) {
      vars[cssName] = (token as ColorToken).hsl!;
    }
  }

  // radius
  if (theme.radius) vars.radius = String(theme.radius);

  return vars;
}

/** Apply a theme by injecting CSS variables into the document */
export function applyTheme(theme: DNATokens = defaultTheme, prefix = 'mw'): void {
  if (typeof document === 'undefined') return;
  const css = generateCSSVariables(theme, prefix);
  const styleId = prefix + '-theme-variables';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

/** Create a new theme by merging overrides with the default theme */
export function createTheme(overrides: Partial<DNATokens>): DNATokens {
  return deepMerge(defaultTheme as unknown as Record<string, unknown>, overrides as unknown as Record<string, unknown>) as unknown as DNATokens;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value as ColorToken).hex) {
      const targetValue = target[key];
      if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue as Record<string, unknown>, value as Record<string, unknown>);
      } else result[key] = value;
    } else result[key] = value;
  }
  return result;
}

export type ThemeName = 'default' | 'highContrast' | 'print' | 'lowMotion' | 'sepia';

export const themeRegistry: Record<ThemeName, DNATokens> = {
  default: defaultTheme,
  highContrast: {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      semantic: {
        background: { hex: '#000000', hsl: '0 0% 0%' }, foreground: { hex: '#ffffff', hsl: '0 0% 100%' },
        card: { hex: '#000000', hsl: '0 0% 0%' }, cardForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        popover: { hex: '#000000', hsl: '0 0% 0%' }, popoverForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        primary: { hex: '#ffff00', hsl: '60 100% 50%' }, primaryForeground: { hex: '#000000', hsl: '0 0% 0%' },
        secondary: { hex: '#ffffff', hsl: '0 0% 100%' }, secondaryForeground: { hex: '#000000', hsl: '0 0% 0%' },
        muted: { hex: '#333333', hsl: '0 0% 20%' }, mutedForeground: { hex: '#cccccc', hsl: '0 0% 80%' },
        accent: { hex: '#00ffff', hsl: '180 100% 50%' }, accentForeground: { hex: '#000000', hsl: '0 0% 0%' },
        destructive: { hex: '#ff0000', hsl: '0 100% 50%' }, destructiveForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        border: { hex: '#ffffff', hsl: '0 0% 100%' }, input: { hex: '#ffffff', hsl: '0 0% 100%' },
        ring: { hex: '#ffff00', hsl: '60 100% 50%' },
      },
    },
  },
  print: {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      semantic: {
        background: { hex: '#ffffff', hsl: '0 0% 100%' }, foreground: { hex: '#000000', hsl: '0 0% 0%' },
        card: { hex: '#ffffff', hsl: '0 0% 100%' }, cardForeground: { hex: '#000000', hsl: '0 0% 0%' },
        popover: { hex: '#ffffff', hsl: '0 0% 100%' }, popoverForeground: { hex: '#000000', hsl: '0 0% 0%' },
        primary: { hex: '#000000', hsl: '0 0% 0%' }, primaryForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        secondary: { hex: '#666666', hsl: '0 0% 40%' }, secondaryForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        muted: { hex: '#f5f5f5', hsl: '0 0% 96%' }, mutedForeground: { hex: '#666666', hsl: '0 0% 40%' },
        accent: { hex: '#333333', hsl: '0 0% 20%' }, accentForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        destructive: { hex: '#cc0000', hsl: '0 100% 40%' }, destructiveForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        border: { hex: '#cccccc', hsl: '0 0% 80%' }, input: { hex: '#cccccc', hsl: '0 0% 80%' },
        ring: { hex: '#000000', hsl: '0 0% 0%' },
      },
    },
    effects: {
      ...defaultTheme.effects,
      halftone: { dotSize: '0', spacing: '0', opacity: 0, color: { hex: '#000000' } },
      grain: { opacity: 0, blendMode: 'normal', size: '0' },
      cmykSlip: { offset: '0', cyan: { hex: '#000000' }, magenta: { hex: '#000000' } },
      duotone: { gradient: 'none', blendMode: 'normal', opacity: 0 },
      tape: { width: '0', height: '0', opacity: 0, blur: '0' },
      sticker: { clipPath: 'none', rotation: '0' },
      brushUnderline: { height: '0', color: { hex: '#000000' }, position: '0' },
    },
    motion: {
      ...defaultTheme.motion,
      duration: { instant: '0ms', fast: '0ms', normal: '0ms', slow: '0ms', slower: '0ms' },
      easing: { linear: 'linear', in: 'linear', out: 'linear', inout: 'linear', spring: 'linear', bounce: 'linear' },
      reducedMotion: { disableAnimations: true, instantTransitions: true },
    },
  },
  lowMotion: {
    ...defaultTheme,
    motion: {
      ...defaultTheme.motion,
      duration: { instant: '0ms', fast: '0ms', normal: '0ms', slow: '0ms', slower: '0ms' },
      easing: { linear: 'linear', in: 'linear', out: 'linear', inout: 'linear', spring: 'linear', bounce: 'linear' },
      reducedMotion: { disableAnimations: true, instantTransitions: true },
    },
    effects: {
      ...defaultTheme.effects,
      grain: { opacity: 0, blendMode: 'overlay', size: '160px' },
      cmykSlip: { offset: '0', cyan: { hex: '#2ea8ff' }, magenta: { hex: '#ff2d78' } },
    },
  },
  sepia: {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      semantic: {
        background: { hex: '#f4eede', hsl: '45 40% 94%' }, foreground: { hex: '#3d362b', hsl: '30 20% 20%' },
        card: { hex: '#ebe3d5', hsl: '40 35% 90%' }, cardForeground: { hex: '#3d362b', hsl: '30 20% 20%' },
        popover: { hex: '#ebe3d5', hsl: '40 35% 90%' }, popoverForeground: { hex: '#3d362b', hsl: '30 20% 20%' },
        primary: { hex: '#a855f7', hsl: '270 90% 60%' }, primaryForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        secondary: { hex: '#d4a517', hsl: '45 80% 46%' }, secondaryForeground: { hex: '#1a1610', hsl: '30 30% 8%' },
        muted: { hex: '#dcd3c6', hsl: '40 25% 85%' }, mutedForeground: { hex: '#6b6254', hsl: '30 15% 37%' },
        accent: { hex: '#2ea8ff', hsl: '200 85% 56%' }, accentForeground: { hex: '#1a1610', hsl: '30 30% 8%' },
        destructive: { hex: '#c0392b', hsl: '360 60% 46%' }, destructiveForeground: { hex: '#ffffff', hsl: '0 0% 100%' },
        border: { hex: '#c9bfad', hsl: '40 20% 74%' }, input: { hex: '#c9bfad', hsl: '40 20% 74%' },
        ring: { hex: '#a855f7', hsl: '270 90% 60%' },
      },
      legacy: {
        ...defaultTheme.colors.legacy,
        ink: { hex: '#3d362b' }, panel: { hex: '#ebe3d5' }, panel2: { hex: '#dcd3c6' }, paper: { hex: '#f4eede' },
        pink: { hex: '#a855f7' }, blue: { hex: '#2ea8ff' }, yellow: { hex: '#d4a517' }, purple: { hex: '#9b59b6' },
        red: { hex: '#c0392b' }, green: { hex: '#27ae60' }, line: { hex: '#c9bfad' },
        heroHeadlinePaper: { hex: '#a855f7' }, heroCaptionPaper: { hex: '#3d362b' },
        heroPrintShadow: { hex: 'rgba(61, 54, 43, 1)' }, heroRule: { hex: '#3d362b' },
      },
    },
  },
};

export function getTheme(name: ThemeName): DNATokens { return themeRegistry[name]; }
export function listThemes(): ThemeName[] { return Object.keys(themeRegistry) as ThemeName[]; }
