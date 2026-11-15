// DNA System - Primitive Token Definitions
// Atomic design tokens with full metadata

import type {
  PrimitiveToken,
  ColorToken,
  NumberToken,
  StringToken,
  FunctionToken,
  ReferenceToken,
  GradientToken,
  ShadowToken,
  TransitionToken,
  PathToken,
  EasingToken,
  TokenMetadata,
  TokenConstraint,
  GradientDefinition,
  ShadowDefinition,
  TransitionDefinition,
  PathDefinition,
  EasingDefinition,
  AnyPrimitiveToken,
} from '../types'

// ============================================
// TOKEN FACTORIES
// ============================================

export function createTokenMetadata(
  semanticRole: string,
  category: TokenMetadata['category'],
  options: Partial<TokenMetadata> = {}
): TokenMetadata {
  return {
    semanticRole,
    category,
    constraints: [],
    dependencies: [],
    version: '1.0.0',
    source: 'manual',
    ...options,
  }
}

export function createColorToken(
  id: string,
  value: string,
  semanticRole: string,
  options: Partial<Omit<ColorToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): ColorToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'color',
    value,
    metadata: createTokenMetadata(semanticRole, 'color', optionsMetadata),
    colorSpace: 'srgb',
    ...restOptions,
  }
}

export function createNumberToken(
  id: string,
  value: number,
  unit: NumberToken['unit'],
  semanticRole: string,
  options: Partial<Omit<NumberToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): NumberToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'number',
    value,
    unit,
    metadata: createTokenMetadata(semanticRole, getCategoryFromUnit(unit), optionsMetadata),
    scale: 'linear',
    ...restOptions,
  }
}

export function createStringToken(
  id: string,
  value: string,
  semanticRole: string,
  format: StringToken['format'] = 'identifier',
  options: Partial<Omit<StringToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): StringToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'string',
    value,
    format,
    metadata: createTokenMetadata(semanticRole, getCategoryFromFormat(format), optionsMetadata),
    ...restOptions,
  }
}

export function createFunctionToken(
  id: string,
  value: (context: any) => any,
  semanticRole: string,
  pure = true,
  memoize = true,
  options: Partial<Omit<FunctionToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): FunctionToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'function',
    value,
    pure,
    memoize,
    metadata: createTokenMetadata(semanticRole, 'effect', optionsMetadata),
    ...restOptions,
  }
}

export function createReferenceToken(
  id: string,
  targetId: string,
  semanticRole: string,
  fallback?: any,
  options: Partial<Omit<ReferenceToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): ReferenceToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'reference',
    value: targetId,
    fallback,
    metadata: createTokenMetadata(semanticRole, 'effect', optionsMetadata),
    ...restOptions,
  }
}

export function createGradientToken(
  id: string,
  value: GradientDefinition,
  semanticRole: string,
  options: Partial<Omit<GradientToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): GradientToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'gradient',
    value,
    metadata: createTokenMetadata(semanticRole, 'color', optionsMetadata),
    ...restOptions,
  }
}

export function createShadowToken(
  id: string,
  value: ShadowDefinition,
  semanticRole: string,
  options: Partial<Omit<ShadowToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): ShadowToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'shadow',
    value,
    metadata: createTokenMetadata(semanticRole, 'shadow', optionsMetadata),
    ...restOptions,
  }
}

export function createTransitionToken(
  id: string,
  value: TransitionDefinition,
  semanticRole: string,
  options: Partial<Omit<TransitionToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): TransitionToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'transition',
    value,
    metadata: createTokenMetadata(semanticRole, 'motion', optionsMetadata),
    ...restOptions,
  }
}

export function createPathToken(
  id: string,
  value: PathDefinition,
  semanticRole: string,
  options: Partial<Omit<PathToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): PathToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'path',
    value,
    metadata: createTokenMetadata(semanticRole, 'svg', optionsMetadata),
    ...restOptions,
  }
}

export function createEasingToken(
  id: string,
  value: EasingDefinition,
  semanticRole: string,
  options: Partial<Omit<EasingToken, 'metadata'>> & { metadata?: Partial<TokenMetadata> } = {}
): EasingToken {
  const { metadata: optionsMetadata, ...restOptions } = options
  return {
    id,
    type: 'easing',
    value,
    metadata: createTokenMetadata(semanticRole, 'motion', optionsMetadata),
    ...restOptions,
  }
}

function getCategoryFromUnit(unit: NumberToken['unit']): TokenMetadata['category'] {
  switch (unit) {
    case 'px':
    case 'rem':
    case 'em':
    case '%':
    case 'vw':
    case 'vh':
    case 'vmin':
    case 'vmax':
      return 'spacing'
    case 'unitless':
      return 'effect'
    default:
      return 'effect'
  }
}

function getCategoryFromFormat(format: StringToken['format']): TokenMetadata['category'] {
  switch (format) {
    case 'font-family':
    case 'font-feature':
      return 'typography'
    case 'path-data':
      return 'svg'
    default:
      return 'effect'
  }
}

// ============================================
// CONSTRAINT FACTORIES
// ============================================

export function contrastConstraint(
  againstTokenId: string,
  ratio: number,
  severity: TokenConstraint['severity'] = 'error'
): TokenConstraint {
  return {
    type: 'contrast',
    params: { against: againstTokenId, ratio },
    severity,
    message: `Must have ${ratio}:1 contrast ratio against ${againstTokenId}`,
  }
}

export function rangeConstraint(
  min: number,
  max: number,
  severity: TokenConstraint['severity'] = 'error'
): TokenConstraint {
  return {
    type: 'range',
    params: { min, max },
    severity,
    message: `Value must be between ${min} and ${max}`,
  }
}

export function enumConstraint<T>(
  values: T[],
  severity: TokenConstraint['severity'] = 'error'
): TokenConstraint {
  return {
    type: 'enum',
    params: { values },
    severity,
    message: `Value must be one of: ${values.join(', ')}`,
  }
}

export function ratioConstraint(
  numeratorTokenId: string,
  denominatorTokenId: string,
  ratio: number,
  severity: TokenConstraint['severity'] = 'error'
): TokenConstraint {
  return {
    type: 'ratio',
    params: { numerator: numeratorTokenId, denominator: denominatorTokenId, ratio },
    severity,
    message: `${numeratorTokenId} must be ${ratio}x ${denominatorTokenId}`,
  }
}

export function dependencyConstraint(
  dependsOn: string[],
  severity: TokenConstraint['severity'] = 'warning'
): TokenConstraint {
  return {
    type: 'dependency',
    params: { dependsOn },
    severity,
    message: `Depends on: ${dependsOn.join(', ')}`,
  }
}

export function accessibilityConstraint(
  rule: 'wcag-aa' | 'wcag-aaa' | 'section-508' | 'custom',
  severity: TokenConstraint['severity'] = 'error'
): TokenConstraint {
  return {
    type: 'accessibility',
    params: { rule },
    severity,
    message: `Must comply with ${rule}`,
  }
}

export function performanceConstraint(
  metric: 'bundle-size' | 'runtime-tokens' | 'resolution-time' | 'memory',
  budget: number,
  severity: TokenConstraint['severity'] = 'warning'
): TokenConstraint {
  return {
    type: 'performance',
    params: { metric, budget },
    severity,
    message: `${metric} must not exceed ${budget}`,
  }
}

// ============================================
// BASE PRIMITIVE COLLECTIONS
// ============================================

// Color Primitives
export const colorPrimitives = {
  // Brand colors (to be overridden by DNA)
  'color-brand-50': createColorToken('color-brand-50', '#eef2ff', 'brand-lightest', {
    metadata: { description: 'Brand color 50 (lightest)', constraints: [contrastConstraint('color-neutral-900', 4.5)] },
  }),
  'color-brand-100': createColorToken('color-brand-100', '#e0e7ff', 'brand-lighter', {
    metadata: { description: 'Brand color 100' },
  }),
  'color-brand-200': createColorToken('color-brand-200', '#c7d2fe', 'brand-light', {
    metadata: { description: 'Brand color 200' },
  }),
  'color-brand-300': createColorToken('color-brand-300', '#a5b4fc', 'brand-medium-light', {
    metadata: { description: 'Brand color 300' },
  }),
  'color-brand-400': createColorToken('color-brand-400', '#818cf8', 'brand-medium', {
    metadata: { description: 'Brand color 400' },
  }),
  'color-brand-500': createColorToken('color-brand-500', '#6366f1', 'brand-primary', {
    metadata: { description: 'Brand color 500 (primary)', constraints: [contrastConstraint('color-neutral-0', 4.5)] },
  }),
  'color-brand-600': createColorToken('color-brand-600', '#4f46e5', 'brand-medium-dark', {
    metadata: { description: 'Brand color 600' },
  }),
  'color-brand-700': createColorToken('color-brand-700', '#4338ca', 'brand-dark', {
    metadata: { description: 'Brand color 700', constraints: [contrastConstraint('color-neutral-0', 4.5)] },
  }),
  'color-brand-800': createColorToken('color-brand-800', '#3730a3', 'brand-darker', {
    metadata: { description: 'Brand color 800' },
  }),
  'color-brand-900': createColorToken('color-brand-900', '#312e81', 'brand-darkest', {
    metadata: { description: 'Brand color 900 (darkest)' },
  }),
  'color-brand-950': createColorToken('color-brand-950', '#1e1b4b', 'brand-extreme', {
    metadata: { description: 'Brand color 950 (extreme)' },
  }),

  // Neutral colors
  'color-neutral-0': createColorToken('color-neutral-0', '#ffffff', 'neutral-white', {
    metadata: { description: 'Pure white' },
  }),
  'color-neutral-50': createColorToken('color-neutral-50', '#fafafa', 'neutral-50', {
    metadata: { description: 'Neutral 50' },
  }),
  'color-neutral-100': createColorToken('color-neutral-100', '#f5f5f5', 'neutral-100', {
    metadata: { description: 'Neutral 100' },
  }),
  'color-neutral-200': createColorToken('color-neutral-200', '#e5e5e5', 'neutral-200', {
    metadata: { description: 'Neutral 200' },
  }),
  'color-neutral-300': createColorToken('color-neutral-300', '#d4d4d4', 'neutral-300', {
    metadata: { description: 'Neutral 300' },
  }),
  'color-neutral-400': createColorToken('color-neutral-400', '#a3a3a3', 'neutral-400', {
    metadata: { description: 'Neutral 400' },
  }),
  'color-neutral-500': createColorToken('color-neutral-500', '#737373', 'neutral-500', {
    metadata: { description: 'Neutral 500 (medium)' },
  }),
  'color-neutral-600': createColorToken('color-neutral-600', '#525252', 'neutral-600', {
    metadata: { description: 'Neutral 600' },
  }),
  'color-neutral-700': createColorToken('color-neutral-700', '#404040', 'neutral-700', {
    metadata: { description: 'Neutral 700' },
  }),
  'color-neutral-800': createColorToken('color-neutral-800', '#262626', 'neutral-800', {
    metadata: { description: 'Neutral 800' },
  }),
  'color-neutral-900': createColorToken('color-neutral-900', '#171717', 'neutral-900', {
    metadata: { description: 'Neutral 900 (near black)' },
  }),
  'color-neutral-950': createColorToken('color-neutral-950', '#0a0a0a', 'neutral-950', {
    metadata: { description: 'Neutral 950 (pure black)' },
  }),

  // Semantic colors
  'color-success-500': createColorToken('color-success-500', '#22c55e', 'success-primary', {
    metadata: { description: 'Success green', constraints: [contrastConstraint('color-neutral-0', 4.5)] },
  }),
  'color-warning-500': createColorToken('color-warning-500', '#f59e0b', 'warning-primary', {
    metadata: { description: 'Warning amber', constraints: [contrastConstraint('color-neutral-900', 4.5)] },
  }),
  'color-error-500': createColorToken('color-error-500', '#ef4444', 'error-primary', {
    metadata: { description: 'Error red', constraints: [contrastConstraint('color-neutral-0', 4.5)] },
  }),
  'color-info-500': createColorToken('color-info-500', '#3b82f6', 'info-primary', {
    metadata: { description: 'Info blue', constraints: [contrastConstraint('color-neutral-0', 4.5)] },
  }),

  // Surface colors (aliases for component use)
  'color-surface-primary': createReferenceToken('color-surface-primary', 'color-neutral-0', 'surface-primary'),
  'color-surface-secondary': createReferenceToken('color-surface-secondary', 'color-neutral-50', 'surface-secondary'),
  'color-surface-tertiary': createReferenceToken('color-surface-tertiary', 'color-neutral-100', 'surface-tertiary'),
  'color-surface-elevated': createReferenceToken('color-surface-elevated', 'color-neutral-0', 'surface-elevated'),
  'color-surface-overlay': createReferenceToken('color-surface-overlay', 'color-neutral-900', 'surface-overlay'),

  // Text colors
  'color-text-primary': createReferenceToken('color-text-primary', 'color-neutral-900', 'text-primary'),
  'color-text-secondary': createReferenceToken('color-text-secondary', 'color-neutral-600', 'text-secondary'),
  'color-text-tertiary': createReferenceToken('color-text-tertiary', 'color-neutral-400', 'text-tertiary'),
  'color-text-inverse': createReferenceToken('color-text-inverse', 'color-neutral-0', 'text-inverse'),
  'color-text-link': createReferenceToken('color-text-link', 'color-brand-600', 'text-link'),
  'color-text-on-primary': createReferenceToken('color-text-on-primary', 'color-neutral-0', 'text-on-primary'),
  'color-text-on-error': createReferenceToken('color-text-on-error', 'color-neutral-0', 'text-on-error'),

  // Border colors
  'color-border-primary': createReferenceToken('color-border-primary', 'color-neutral-200', 'border-primary'),
  'color-border-secondary': createReferenceToken('color-border-secondary', 'color-neutral-300', 'border-secondary'),
  'color-border-focus': createReferenceToken('color-border-focus', 'color-brand-500', 'border-focus'),
  'color-border-error': createReferenceToken('color-border-error', 'color-error-500', 'border-error'),
  'color-border-success': createReferenceToken('color-border-success', 'color-success-500', 'border-success'),

  // Background aliases
  'color-bg-primary': createReferenceToken('color-bg-primary', 'color-neutral-0', 'bg-primary'),
  'color-bg-secondary': createReferenceToken('color-bg-secondary', 'color-neutral-50', 'bg-secondary'),
  'color-bg-tertiary': createReferenceToken('color-bg-tertiary', 'color-neutral-100', 'bg-tertiary'),
  'color-bg-inverse': createReferenceToken('color-bg-inverse', 'color-neutral-900', 'bg-inverse'),
  'color-bg-brand': createReferenceToken('color-bg-brand', 'color-brand-50', 'bg-brand'),
  'color-bg-brand-subtle': createReferenceToken('color-bg-brand-subtle', 'color-brand-100', 'bg-brand-subtle'),
} as const

// Spacing Primitives
export const spacingPrimitives = {
  // Base unit
  'spacing-unit': createNumberToken('spacing-unit', 4, 'px', 'base-unit', {
    metadata: { description: 'Base spacing unit (4px)', constraints: [rangeConstraint(1, 16)] },
  }),

  // Spacing scale (0-24 steps)
  ...Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      `spacing-${i}`,
      createNumberToken(`spacing-${i}`, i, 'unitless', `spacing-step-${i}`, {
        metadata: {
          description: `Spacing step ${i}`,
          dependencies: ['spacing-unit'],
          transform: 'multiply-unit',
        },
      }),
    ])
  ),

  // Component-specific spacing
  'spacing-xs': createReferenceToken('spacing-xs', 'spacing-1', 'spacing-xs', undefined, {
    metadata: { description: 'Extra small spacing (4px)' },
  }),
  'spacing-sm': createReferenceToken('spacing-sm', 'spacing-2', 'spacing-sm', undefined, {
    metadata: { description: 'Small spacing (8px)' },
  }),
  'spacing-md': createReferenceToken('spacing-md', 'spacing-4', 'spacing-md', undefined, {
    metadata: { description: 'Medium spacing (16px)' },
  }),
  'spacing-lg': createReferenceToken('spacing-lg', 'spacing-6', 'spacing-lg', undefined, {
    metadata: { description: 'Large spacing (24px)' },
  }),
  'spacing-xl': createReferenceToken('spacing-xl', 'spacing-8', 'spacing-xl', undefined, {
    metadata: { description: 'Extra large spacing (32px)' },
  }),
  'spacing-2xl': createReferenceToken('spacing-2xl', 'spacing-12', 'spacing-2xl', undefined, {
    metadata: { description: '2X large spacing (48px)' },
  }),
  'spacing-3xl': createReferenceToken('spacing-3xl', 'spacing-16', 'spacing-3xl', undefined, {
    metadata: { description: '3X large spacing (64px)' },
  }),
  'spacing-4xl': createReferenceToken('spacing-4xl', 'spacing-24', 'spacing-4xl', undefined, {
    metadata: { description: '4X large spacing (96px)' },
  }),

  // Layout spacing
  'spacing-layout-gap': createReferenceToken('spacing-layout-gap', 'spacing-6', 'layout-gap'),
  'spacing-layout-section': createReferenceToken('spacing-layout-section', 'spacing-16', 'layout-section'),
  'spacing-layout-container': createReferenceToken('spacing-layout-container', 'spacing-8', 'layout-container'),
  'spacing-component-padding': createReferenceToken('spacing-component-padding', 'spacing-4', 'component-padding'),
  'spacing-component-gap': createReferenceToken('spacing-component-gap', 'spacing-3', 'component-gap'),
  'spacing-form-field': createReferenceToken('spacing-form-field', 'spacing-4', 'form-field-gap'),
  'spacing-form-group': createReferenceToken('spacing-form-group', 'spacing-6', 'form-group-gap'),
} as const

// Border Radius Primitives
export const radiusPrimitives = {
  'radius-none': createNumberToken('radius-none', 0, 'px', 'radius-none'),
  'radius-xs': createNumberToken('radius-xs', 2, 'px', 'radius-xs'),
  'radius-sm': createNumberToken('radius-sm', 4, 'px', 'radius-sm'),
  'radius-md': createNumberToken('radius-md', 6, 'px', 'radius-md'),
  'radius-lg': createNumberToken('radius-lg', 8, 'px', 'radius-lg'),
  'radius-xl': createNumberToken('radius-xl', 12, 'px', 'radius-xl'),
  'radius-2xl': createNumberToken('radius-2xl', 16, 'px', 'radius-2xl'),
  'radius-3xl': createNumberToken('radius-3xl', 24, 'px', 'radius-3xl'),
  'radius-full': createNumberToken('radius-full', 9999, 'px', 'radius-full'),

  // Component-specific
  'radius-button': createReferenceToken('radius-button', 'radius-md', 'radius-button'),
  'radius-input': createReferenceToken('radius-input', 'radius-md', 'radius-input'),
  'radius-card': createReferenceToken('radius-card', 'radius-lg', 'radius-card'),
  'radius-badge': createReferenceToken('radius-badge', 'radius-full', 'radius-badge'),
  'radius-avatar': createReferenceToken('radius-avatar', 'radius-full', 'radius-avatar'),
  'radius-tooltip': createReferenceToken('radius-tooltip', 'radius-sm', 'radius-tooltip'),
  'radius-dropdown': createReferenceToken('radius-dropdown', 'radius-lg', 'radius-dropdown'),
  'radius-modal': createReferenceToken('radius-modal', 'radius-xl', 'radius-modal'),
} as const

// Shadow Primitives
export const shadowPrimitives = {
  'shadow-none': createShadowToken('shadow-none', { layers: [] }, 'shadow-none'),

  'shadow-xs': createShadowToken('shadow-xs', {
    layers: [{ x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)' }],
  }, 'shadow-xs'),

  'shadow-sm': createShadowToken('shadow-sm', {
    layers: [
      { x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.1)' },
      { x: 0, y: 1, blur: 2, spread: -1, color: 'rgba(0, 0, 0, 0.1)' },
    ],
  }, 'shadow-sm'),

  'shadow-md': createShadowToken('shadow-md', {
    layers: [
      { x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)' },
      { x: 0, y: 2, blur: 4, spread: -2, color: 'rgba(0, 0, 0, 0.1)' },
    ],
  }, 'shadow-md'),

  'shadow-lg': createShadowToken('shadow-lg', {
    layers: [
      { x: 0, y: 10, blur: 15, spread: -3, color: 'rgba(0, 0, 0, 0.1)' },
      { x: 0, y: 4, blur: 6, spread: -4, color: 'rgba(0, 0, 0, 0.1)' },
    ],
  }, 'shadow-lg'),

  'shadow-xl': createShadowToken('shadow-xl', {
    layers: [
      { x: 0, y: 20, blur: 25, spread: -5, color: 'rgba(0, 0, 0, 0.1)' },
      { x: 0, y: 8, blur: 10, spread: -6, color: 'rgba(0, 0, 0, 0.1)' },
    ],
  }, 'shadow-xl'),

  'shadow-2xl': createShadowToken('shadow-2xl', {
    layers: [{ x: 0, y: 25, blur: 50, spread: -12, color: 'rgba(0, 0, 0, 0.25)' }],
  }, 'shadow-2xl'),

  'shadow-inner': createShadowToken('shadow-inner', {
    layers: [{ x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.05)', inset: true }],
  }, 'shadow-inner'),

  // Elevation shadows (Material Design)
  'shadow-elevation-1': createReferenceToken('shadow-elevation-1', 'shadow-sm', 'elevation-1'),
  'shadow-elevation-2': createReferenceToken('shadow-elevation-2', 'shadow-md', 'elevation-2'),
  'shadow-elevation-3': createReferenceToken('shadow-elevation-3', 'shadow-lg', 'elevation-3'),
  'shadow-elevation-4': createReferenceToken('shadow-elevation-4', 'shadow-xl', 'elevation-4'),
  'shadow-elevation-5': createReferenceToken('shadow-elevation-5', 'shadow-2xl', 'elevation-5'),

  // Colored shadows
  'shadow-brand': createShadowToken('shadow-brand', {
    layers: [{ x: 0, y: 4, blur: 14, spread: 0, color: 'rgba(99, 102, 241, 0.3)' }],
  }, 'shadow-brand'),

  'shadow-brand-lg': createShadowToken('shadow-brand-lg', {
    layers: [{ x: 0, y: 10, blur: 24, spread: -4, color: 'rgba(99, 102, 241, 0.4)' }],
  }, 'shadow-brand-lg'),

  'shadow-focus': createShadowToken('shadow-focus', {
    layers: [{ x: 0, y: 0, blur: 0, spread: 2, color: 'rgba(99, 102, 241, 0.5)' }],
  }, 'shadow-focus'),
} as const

// Typography Primitives
export const typographyPrimitives = {
  // Font families
  'font-sans': createStringToken('font-sans', 'Inter, system-ui, -apple-system, sans-serif', 'font-family-primary', 'font-family'),
  'font-mono': createStringToken('font-mono', 'JetBrains Mono, Fira Code, monospace', 'font-family-mono', 'font-family'),
  'font-display': createStringToken('font-display', 'Inter, system-ui, sans-serif', 'font-family-display', 'font-family'),
  'font-serif': createStringToken('font-serif', 'Georgia, Cambria, serif', 'font-family-serif', 'font-family'),

  // Font sizes
  'font-size-xs': createNumberToken('font-size-xs', 12, 'px', 'font-size-xs'),
  'font-size-sm': createNumberToken('font-size-sm', 14, 'px', 'font-size-sm'),
  'font-size-base': createNumberToken('font-size-base', 16, 'px', 'font-size-base'),
  'font-size-lg': createNumberToken('font-size-lg', 18, 'px', 'font-size-lg'),
  'font-size-xl': createNumberToken('font-size-xl', 20, 'px', 'font-size-xl'),
  'font-size-2xl': createNumberToken('font-size-2xl', 24, 'px', 'font-size-2xl'),
  'font-size-3xl': createNumberToken('font-size-3xl', 30, 'px', 'font-size-3xl'),
  'font-size-4xl': createNumberToken('font-size-4xl', 36, 'px', 'font-size-4xl'),
  'font-size-5xl': createNumberToken('font-size-5xl', 48, 'px', 'font-size-5xl'),
  'font-size-6xl': createNumberToken('font-size-6xl', 60, 'px', 'font-size-6xl'),
  'font-size-7xl': createNumberToken('font-size-7xl', 72, 'px', 'font-size-7xl'),

  // Font weights
  'font-weight-thin': createNumberToken('font-weight-thin', 100, 'unitless', 'font-weight-thin'),
  'font-weight-extralight': createNumberToken('font-weight-extralight', 200, 'unitless', 'font-weight-extralight'),
  'font-weight-light': createNumberToken('font-weight-light', 300, 'unitless', 'font-weight-light'),
  'font-weight-normal': createNumberToken('font-weight-normal', 400, 'unitless', 'font-weight-normal'),
  'font-weight-medium': createNumberToken('font-weight-medium', 500, 'unitless', 'font-weight-medium'),
  'font-weight-semibold': createNumberToken('font-weight-semibold', 600, 'unitless', 'font-weight-semibold'),
  'font-weight-bold': createNumberToken('font-weight-bold', 700, 'unitless', 'font-weight-bold'),
  'font-weight-extrabold': createNumberToken('font-weight-extrabold', 800, 'unitless', 'font-weight-extrabold'),
  'font-weight-black': createNumberToken('font-weight-black', 900, 'unitless', 'font-weight-black'),

  // Line heights
  'line-height-none': createNumberToken('line-height-none', 1, 'unitless', 'line-height-none'),
  'line-height-tight': createNumberToken('line-height-tight', 1.25, 'unitless', 'line-height-tight'),
  'line-height-snug': createNumberToken('line-height-snug', 1.375, 'unitless', 'line-height-snug'),
  'line-height-normal': createNumberToken('line-height-normal', 1.5, 'unitless', 'line-height-normal'),
  'line-height-relaxed': createNumberToken('line-height-relaxed', 1.625, 'unitless', 'line-height-relaxed'),
  'line-height-loose': createNumberToken('line-height-loose', 2, 'unitless', 'line-height-loose'),

  // Letter spacing
  'letter-spacing-tighter': createNumberToken('letter-spacing-tighter', -0.05, 'em', 'letter-spacing-tighter'),
  'letter-spacing-tight': createNumberToken('letter-spacing-tight', -0.025, 'em', 'letter-spacing-tight'),
  'letter-spacing-normal': createNumberToken('letter-spacing-normal', 0, 'em', 'letter-spacing-normal'),
  'letter-spacing-wide': createNumberToken('letter-spacing-wide', 0.025, 'em', 'letter-spacing-wide'),
  'letter-spacing-wider': createNumberToken('letter-spacing-wider', 0.05, 'em', 'letter-spacing-wider'),
  'letter-spacing-widest': createNumberToken('letter-spacing-widest', 0.1, 'em', 'letter-spacing-widest'),
} as const

// Transition Primitives
export const transitionPrimitives = {
  'transition-fast': createTransitionToken('transition-fast', {
    property: 'all',
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-fast'),

  'transition-base': createTransitionToken('transition-base', {
    property: 'all',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-base'),

  'transition-slow': createTransitionToken('transition-slow', {
    property: 'all',
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-slow'),

  'transition-slower': createTransitionToken('transition-slower', {
    property: 'all',
    duration: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-slower'),

  // Property-specific
  'transition-colors': createTransitionToken('transition-colors', {
    property: 'color, background-color, border-color, fill, stroke',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-colors'),

  'transition-transform': createTransitionToken('transition-transform', {
    property: 'transform',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-transform'),

  'transition-opacity': createTransitionToken('transition-opacity', {
    property: 'opacity',
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-opacity'),

  'transition-shadow': createTransitionToken('transition-shadow', {
    property: 'box-shadow',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-shadow'),

  'transition-all': createTransitionToken('transition-all', {
    property: 'all',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }, 'transition-all'),
} as const

// Z-Index Primitives
export const zIndexPrimitives = {
  'z-index-hide': createNumberToken('z-index-hide', -1, 'unitless', 'z-index-hide'),
  'z-index-auto': createNumberToken('z-index-auto', 0, 'unitless', 'z-index-auto'),
  'z-index-base': createNumberToken('z-index-base', 1, 'unitless', 'z-index-base'),
  'z-index-dropdown': createNumberToken('z-index-dropdown', 100, 'unitless', 'z-index-dropdown'),
  'z-index-sticky': createNumberToken('z-index-sticky', 200, 'unitless', 'z-index-sticky'),
  'z-index-fixed': createNumberToken('z-index-fixed', 300, 'unitless', 'z-index-fixed'),
  'z-index-modal-backdrop': createNumberToken('z-index-modal-backdrop', 400, 'unitless', 'z-index-modal-backdrop'),
  'z-index-modal': createNumberToken('z-index-modal', 500, 'unitless', 'z-index-modal'),
  'z-index-popover': createNumberToken('z-index-popover', 600, 'unitless', 'z-index-popover'),
  'z-index-tooltip': createNumberToken('z-index-tooltip', 700, 'unitless', 'z-index-tooltip'),
  'z-index-toast': createNumberToken('z-index-toast', 800, 'unitless', 'z-index-toast'),
  'z-index-maximum': createNumberToken('z-index-maximum', 9999, 'unitless', 'z-index-maximum'),
} as const

// Breakpoint Primitives
export const breakpointPrimitives = {
  'breakpoint-xs': createNumberToken('breakpoint-xs', 0, 'px', 'breakpoint-xs'),
  'breakpoint-sm': createNumberToken('breakpoint-sm', 640, 'px', 'breakpoint-sm'),
  'breakpoint-md': createNumberToken('breakpoint-md', 768, 'px', 'breakpoint-md'),
  'breakpoint-lg': createNumberToken('breakpoint-lg', 1024, 'px', 'breakpoint-lg'),
  'breakpoint-xl': createNumberToken('breakpoint-xl', 1280, 'px', 'breakpoint-xl'),
  'breakpoint-2xl': createNumberToken('breakpoint-2xl', 1536, 'px', 'breakpoint-2xl'),
} as const

// Motion/Easing Primitives
export const easingPrimitives = {
  'easing-linear': createEasingToken('easing-linear', { type: 'linear' }, 'easing-linear'),
  'easing-ease-in': createEasingToken('easing-ease-in', { type: 'cubic-bezier', values: [0.4, 0, 1, 1] }, 'easing-ease-in'),
  'easing-ease-out': createEasingToken('easing-ease-out', { type: 'cubic-bezier', values: [0, 0, 0.2, 1] }, 'easing-ease-out'),
  'easing-ease-in-out': createEasingToken('easing-ease-in-out', { type: 'cubic-bezier', values: [0.4, 0, 0.2, 1] }, 'easing-ease-in-out'),
  'easing-sharp': createEasingToken('easing-sharp', { type: 'cubic-bezier', values: [0.4, 0, 0.6, 1] }, 'easing-sharp'),

  // Spring easings
  'easing-spring-gentle': createEasingToken('easing-spring-gentle', {
    type: 'spring',
    springConfig: { stiffness: 120, damping: 14, mass: 1 },
  }, 'easing-spring-gentle'),

  'easing-spring-wobbly': createEasingToken('easing-spring-wobbly', {
    type: 'spring',
    springConfig: { stiffness: 180, damping: 12, mass: 1 },
  }, 'easing-spring-wobbly'),

  'easing-spring-stiff': createEasingToken('easing-spring-stiff', {
    type: 'spring',
    springConfig: { stiffness: 210, damping: 20, mass: 1 },
  }, 'easing-spring-stiff'),

  // Custom curves
  'easing-expo-out': createEasingToken('easing-expo-out', { type: 'cubic-bezier', values: [0.19, 1, 0.22, 1] }, 'easing-expo-out'),
  'easing-circ-out': createEasingToken('easing-circ-out', { type: 'cubic-bezier', values: [0.07, 0.7, 0.33, 1] }, 'easing-circ-out'),
  'easing-back-out': createEasingToken('easing-back-out', { type: 'cubic-bezier', values: [0.34, 1.56, 0.64, 1] }, 'easing-back-out'),
} as const

// Density Primitives
export const densityPrimitives = {
  'density-compact': createNumberToken('density-compact', 0.875, 'unitless', 'density-compact', {
    metadata: { description: 'Compact density (87.5%)' },
  }),
  'density-comfortable': createNumberToken('density-comfortable', 1, 'unitless', 'density-comfortable', {
    metadata: { description: 'Comfortable density (100%)' },
  }),
  'density-spacious': createNumberToken('density-spacious', 1.125, 'unitless', 'density-spacious', {
    metadata: { description: 'Spacious density (112.5%)' },
  }),
} as const

// ============================================
// COMPLETE PRIMITIVE REGISTRY
// ============================================

export const allPrimitives: Record<string, AnyPrimitiveToken> = {
  ...colorPrimitives,
  ...spacingPrimitives,
  ...radiusPrimitives,
  ...shadowPrimitives,
  ...typographyPrimitives,
  ...transitionPrimitives,
  ...zIndexPrimitives,
  ...breakpointPrimitives,
  ...easingPrimitives,
  ...densityPrimitives,
} as const

export type PrimitiveId = keyof typeof allPrimitives

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getPrimitive(id: string): AnyPrimitiveToken | undefined {
  return allPrimitives[id as PrimitiveId]
}

export function getPrimitivesByCategory(category: TokenMetadata['category']): AnyPrimitiveToken[] {
  return Object.values(allPrimitives).filter(t => t.metadata.category === category)
}

export function getPrimitivesBySemanticRole(role: string): AnyPrimitiveToken[] {
  return Object.values(allPrimitives).filter(t => t.metadata.semanticRole === role)
}

export function createPrimitiveRegistry(customPrimitives: Record<string, AnyPrimitiveToken> = {}): Record<string, AnyPrimitiveToken> {
  return { ...allPrimitives, ...customPrimitives }
}