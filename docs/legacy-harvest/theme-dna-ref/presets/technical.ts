// Technical DNA Preset - Developer-focused, functional, precise
// Complete design genome with primitives, molecules, organisms, ecosystems, SVG

import type {
  DNAGenotype,
  AnyPrimitiveToken,
  ComponentMolecule,
  OrganismPattern,
  EcosystemTemplate,
  SVGPrimitives,
} from '../types'

import {
  createColorToken,
  createNumberToken,
  createStringToken,
  createShadowToken,
  createTransitionToken,
  createEasingToken,
  createReferenceToken,
  allPrimitives,
} from '../primitives'

// ============================================
// TECHNICAL PRIMITIVES
// ============================================

const technicalColorPrimitives: Record<string, AnyPrimitiveToken> = {
  // Brand - Developer green
  'color-brand-50': createColorToken('color-brand-50', '#f0fdf4', 'brand-lightest'),
  'color-brand-100': createColorToken('color-brand-100', '#dcfce7', 'brand-lighter'),
  'color-brand-200': createColorToken('color-brand-200', '#bbf7d0', 'brand-light'),
  'color-brand-300': createColorToken('color-brand-300', '#86efac', 'brand-medium-light'),
  'color-brand-400': createColorToken('color-brand-400', '#4ade80', 'brand-medium'),
  'color-brand-500': createColorToken('color-brand-500', '#22c55e', 'brand-primary'),
  'color-brand-600': createColorToken('color-brand-600', '#16a34a', 'brand-medium-dark'),
  'color-brand-700': createColorToken('color-brand-700', '#15803d', 'brand-dark'),
  'color-brand-800': createColorToken('color-brand-800', '#166534', 'brand-darker'),
  'color-brand-900': createColorToken('color-brand-900', '#14532d', 'brand-darkest'),
  'color-brand-950': createColorToken('color-brand-950', '#052e16', 'brand-extreme'),

  // Secondary - Slate
  'color-secondary-50': createColorToken('color-secondary-50', '#f8fafc', 'secondary-lightest'),
  'color-secondary-100': createColorToken('color-secondary-100', '#f1f5f9', 'secondary-lighter'),
  'color-secondary-200': createColorToken('color-secondary-200', '#e2e8f0', 'secondary-light'),
  'color-secondary-300': createColorToken('color-secondary-300', '#cbd5e1', 'secondary-medium-light'),
  'color-secondary-400': createColorToken('color-secondary-400', '#94a3b8', 'secondary-medium'),
  'color-secondary-500': createColorToken('color-secondary-500', '#64748b', 'secondary-primary'),
  'color-secondary-600': createColorToken('color-secondary-600', '#475569', 'secondary-medium-dark'),
  'color-secondary-700': createColorToken('color-secondary-700', '#334155', 'secondary-dark'),
  'color-secondary-800': createColorToken('color-secondary-800', '#1e293b', 'secondary-darker'),
  'color-secondary-900': createColorToken('color-secondary-900', '#0f172a', 'secondary-darkest'),
  'color-secondary-950': createColorToken('color-secondary-950', '#020617', 'secondary-extreme'),

  // Accents
  'color-accent-cyan': createColorToken('color-accent-cyan', '#06b6d4', 'accent-cyan'),
  'color-accent-emerald': createColorToken('color-accent-emerald', '#10b981', 'accent-emerald'),
  'color-accent-amber': createColorToken('color-accent-amber', '#f59e0b', 'accent-amber'),
  'color-accent-rose': createColorToken('color-accent-rose', '#f43f5e', 'accent-rose'),
  'color-accent-violet': createColorToken('color-accent-violet', '#8b5cf6', 'accent-violet'),

  // Semantic
  'color-success-500': createColorToken('color-success-500', '#22c55e', 'success-primary'),
  'color-warning-500': createColorToken('color-warning-500', '#f59e0b', 'warning-primary'),
  'color-error-500': createColorToken('color-error-500', '#ef4444', 'error-primary'),
  'color-info-500': createColorToken('color-info-500', '#3b82f6', 'info-primary'),

  // Surfaces
  'color-surface-primary': createReferenceToken('color-surface-primary', 'color-neutral-0', 'surface-primary'),
  'color-surface-secondary': createReferenceToken('color-surface-secondary', 'color-neutral-50', 'surface-secondary'),
  'color-surface-tertiary': createReferenceToken('color-surface-tertiary', 'color-neutral-100', 'surface-tertiary'),
  'color-surface-elevated': createReferenceToken('color-surface-elevated', 'color-neutral-0', 'surface-elevated'),
  'color-surface-overlay': createReferenceToken('color-surface-overlay', 'color-neutral-900', 'surface-overlay'),

  // Text
  'color-text-primary': createReferenceToken('color-text-primary', 'color-neutral-900', 'text-primary'),
  'color-text-secondary': createReferenceToken('color-text-secondary', 'color-neutral-600', 'text-secondary'),
  'color-text-tertiary': createReferenceToken('color-text-tertiary', 'color-neutral-400', 'text-tertiary'),
  'color-text-inverse': createReferenceToken('color-text-inverse', 'color-neutral-0', 'text-inverse'),
  'color-text-link': createReferenceToken('color-text-link', 'color-brand-600', 'text-link'),
  'color-text-on-primary': createReferenceToken('color-text-on-primary', 'color-neutral-0', 'text-on-primary'),
  'color-text-on-error': createReferenceToken('color-text-on-error', 'color-neutral-0', 'text-on-error'),

  // Borders
  'color-border-primary': createReferenceToken('color-border-primary', 'color-neutral-200', 'border-primary'),
  'color-border-secondary': createReferenceToken('color-border-secondary', 'color-neutral-300', 'border-secondary'),
  'color-border-focus': createReferenceToken('color-border-focus', 'color-brand-500', 'border-focus'),
  'color-border-error': createReferenceToken('color-border-error', 'color-error-500', 'border-error'),
  'color-border-success': createReferenceToken('color-border-success', 'color-success-500', 'border-success'),

  // Backgrounds
  'color-bg-primary': createReferenceToken('color-bg-primary', 'color-neutral-50', 'bg-primary'),
  'color-bg-secondary': createReferenceToken('color-bg-secondary', 'color-neutral-100', 'bg-secondary'),
  'color-bg-tertiary': createReferenceToken('color-bg-tertiary', 'color-neutral-200', 'bg-tertiary'),
  'color-bg-inverse': createReferenceToken('color-bg-inverse', 'color-neutral-900', 'bg-inverse'),
  'color-bg-brand': createReferenceToken('color-bg-brand', 'color-brand-50', 'bg-brand'),
  'color-bg-brand-subtle': createReferenceToken('color-bg-brand-subtle', 'color-brand-100', 'bg-brand-subtle'),
}

const technicalSpacingPrimitives: Record<string, AnyPrimitiveToken> = {
  'spacing-unit': createNumberToken('spacing-unit', 4, 'px', 'base-unit'),
  ...Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      `spacing-${i}`,
      createNumberToken(`spacing-${i}`, i, 'unitless', `spacing-step-${i}`),
    ])
  ),
  'spacing-xs': createReferenceToken('spacing-xs', 'spacing-1', 'spacing-xs'),
  'spacing-sm': createReferenceToken('spacing-sm', 'spacing-2', 'spacing-sm'),
  'spacing-md': createReferenceToken('spacing-md', 'spacing-4', 'spacing-md'),
  'spacing-lg': createReferenceToken('spacing-lg', 'spacing-6', 'spacing-lg'),
  'spacing-xl': createReferenceToken('spacing-xl', 'spacing-8', 'spacing-xl'),
  'spacing-2xl': createReferenceToken('spacing-2xl', 'spacing-12', 'spacing-2xl'),
  'spacing-3xl': createReferenceToken('spacing-3xl', 'spacing-16', 'spacing-3xl'),
  'spacing-4xl': createReferenceToken('spacing-4xl', 'spacing-24', 'spacing-4xl'),
}

const technicalRadiusPrimitives: Record<string, AnyPrimitiveToken> = {
  'radius-none': createNumberToken('radius-none', 0, 'px', 'radius-none'),
  'radius-xs': createNumberToken('radius-xs', 2, 'px', 'radius-xs'),
  'radius-sm': createNumberToken('radius-sm', 3, 'px', 'radius-sm'),
  'radius-md': createNumberToken('radius-md', 4, 'px', 'radius-md'),
  'radius-lg': createNumberToken('radius-lg', 6, 'px', 'radius-lg'),
  'radius-xl': createNumberToken('radius-xl', 8, 'px', 'radius-xl'),
  'radius-2xl': createNumberToken('radius-2xl', 12, 'px', 'radius-2xl'),
  'radius-3xl': createNumberToken('radius-3xl', 16, 'px', 'radius-3xl'),
  'radius-full': createNumberToken('radius-full', 9999, 'px', 'radius-full'),
  'radius-button': createReferenceToken('radius-button', 'radius-sm', 'radius-button'),
  'radius-input': createReferenceToken('radius-input', 'radius-sm', 'radius-input'),
  'radius-card': createReferenceToken('radius-card', 'radius-md', 'radius-card'),
  'radius-badge': createReferenceToken('radius-badge', 'radius-sm', 'radius-badge'),
  'radius-avatar': createReferenceToken('radius-avatar', 'radius-full', 'radius-avatar'),
  'radius-tooltip': createReferenceToken('radius-tooltip', 'radius-sm', 'radius-tooltip'),
  'radius-dropdown': createReferenceToken('radius-dropdown', 'radius-md', 'radius-dropdown'),
  'radius-modal': createReferenceToken('radius-modal', 'radius-lg', 'radius-modal'),
}

const technicalShadowPrimitives: Record<string, AnyPrimitiveToken> = {
  'shadow-none': createShadowToken('shadow-none', { layers: [] }, 'shadow-none'),
  'shadow-xs': createShadowToken('shadow-xs', { layers: [{ x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)' }] }, 'shadow-xs'),
  'shadow-sm': createShadowToken('shadow-sm', { layers: [{ x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.1)' }] }, 'shadow-sm'),
  'shadow-md': createShadowToken('shadow-md', { layers: [{ x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)' }] }, 'shadow-md'),
  'shadow-lg': createShadowToken('shadow-lg', { layers: [{ x: 0, y: 10, blur: 15, spread: -3, color: 'rgba(0, 0, 0, 0.1)' }] }, 'shadow-lg'),
  'shadow-xl': createShadowToken('shadow-xl', { layers: [{ x: 0, y: 20, blur: 25, spread: -5, color: 'rgba(0, 0, 0, 0.1)' }] }, 'shadow-xl'),
  'shadow-2xl': createShadowToken('shadow-2xl', { layers: [{ x: 0, y: 25, blur: 50, spread: -12, color: 'rgba(0, 0, 0, 0.25)' }] }, 'shadow-2xl'),
  'shadow-inner': createShadowToken('shadow-inner', { layers: [{ x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)', inset: true }] }, 'shadow-inner'),
  'shadow-focus': createShadowToken('shadow-focus', { layers: [{ x: 0, y: 0, blur: 0, spread: 2, color: 'rgba(34, 197, 94, 0.5)' }] }, 'shadow-focus'),
}

const technicalTypographyPrimitives: Record<string, AnyPrimitiveToken> = {
  'font-sans': createStringToken('font-sans', 'JetBrains Mono, Fira Code, monospace', 'font-family-primary', 'font-family'),
  'font-mono': createStringToken('font-mono', 'JetBrains Mono, Fira Code, monospace', 'font-family-mono', 'font-family'),
  'font-display': createStringToken('font-display', 'JetBrains Mono, monospace', 'font-family-display', 'font-family'),
  'font-serif': createStringToken('font-serif', 'Georgia, Cambria, serif', 'font-family-serif', 'font-family'),
  'font-size-xs': createNumberToken('font-size-xs', 11, 'px', 'font-size-xs'),
  'font-size-sm': createNumberToken('font-size-sm', 13, 'px', 'font-size-sm'),
  'font-size-base': createNumberToken('font-size-base', 14, 'px', 'font-size-base'),
  'font-size-lg': createNumberToken('font-size-lg', 15, 'px', 'font-size-lg'),
  'font-size-xl': createNumberToken('font-size-xl', 17, 'px', 'font-size-xl'),
  'font-size-2xl': createNumberToken('font-size-2xl', 20, 'px', 'font-size-2xl'),
  'font-size-3xl': createNumberToken('font-size-3xl', 24, 'px', 'font-size-3xl'),
  'font-size-4xl': createNumberToken('font-size-4xl', 30, 'px', 'font-size-4xl'),
  'font-size-5xl': createNumberToken('font-size-5xl', 40, 'px', 'font-size-5xl'),
  'font-size-6xl': createNumberToken('font-size-6xl', 48, 'px', 'font-size-6xl'),
  'font-size-7xl': createNumberToken('font-size-7xl', 64, 'px', 'font-size-7xl'),
  'font-weight-thin': createNumberToken('font-weight-thin', 100, 'unitless', 'font-weight-thin'),
  'font-weight-extralight': createNumberToken('font-weight-extralight', 200, 'unitless', 'font-weight-extralight'),
  'font-weight-light': createNumberToken('font-weight-light', 300, 'unitless', 'font-weight-light'),
  'font-weight-normal': createNumberToken('font-weight-normal', 400, 'unitless', 'font-weight-normal'),
  'font-weight-medium': createNumberToken('font-weight-medium', 500, 'unitless', 'font-weight-medium'),
  'font-weight-semibold': createNumberToken('font-weight-semibold', 600, 'unitless', 'font-weight-semibold'),
  'font-weight-bold': createNumberToken('font-weight-bold', 700, 'unitless', 'font-weight-bold'),
  'font-weight-extrabold': createNumberToken('font-weight-extrabold', 800, 'unitless', 'font-weight-extrabold'),
  'font-weight-black': createNumberToken('font-weight-black', 900, 'unitless', 'font-weight-black'),
  'line-height-none': createNumberToken('line-height-none', 1, 'unitless', 'line-height-none'),
  'line-height-tight': createNumberToken('line-height-tight', 1.4, 'unitless', 'line-height-tight'),
  'line-height-snug': createNumberToken('line-height-snug', 1.5, 'unitless', 'line-height-snug'),
  'line-height-normal': createNumberToken('line-height-normal', 1.6, 'unitless', 'line-height-normal'),
  'line-height-relaxed': createNumberToken('line-height-relaxed', 1.75, 'unitless', 'line-height-relaxed'),
  'line-height-loose': createNumberToken('line-height-loose', 1.8, 'unitless', 'line-height-loose'),
  'letter-spacing-tighter': createNumberToken('letter-spacing-tighter', -0.02, 'em', 'letter-spacing-tighter'),
  'letter-spacing-tight': createNumberToken('letter-spacing-tight', 0, 'em', 'letter-spacing-tight'),
  'letter-spacing-normal': createNumberToken('letter-spacing-normal', 0, 'em', 'letter-spacing-normal'),
  'letter-spacing-wide': createNumberToken('letter-spacing-wide', 0.02, 'em', 'letter-spacing-wide'),
  'letter-spacing-wider': createNumberToken('letter-spacing-wider', 0.04, 'em', 'letter-spacing-wider'),
  'letter-spacing-widest': createNumberToken('letter-spacing-widest', 0.08, 'em', 'letter-spacing-widest'),
}

const technicalTransitionPrimitives: Record<string, AnyPrimitiveToken> = {
  'transition-fast': createTransitionToken('transition-fast', { property: 'all', duration: '50ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-fast'),
  'transition-base': createTransitionToken('transition-base', { property: 'all', duration: '100ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-base'),
  'transition-slow': createTransitionToken('transition-slow', { property: 'all', duration: '150ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-slow'),
  'transition-slower': createTransitionToken('transition-slower', { property: 'all', duration: '200ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-slower'),
  'transition-colors': createTransitionToken('transition-colors', { property: 'color, background-color, border-color, fill, stroke', duration: '100ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-colors'),
  'transition-transform': createTransitionToken('transition-transform', { property: 'transform', duration: '100ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-transform'),
  'transition-opacity': createTransitionToken('transition-opacity', { property: 'opacity', duration: '50ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-opacity'),
  'transition-shadow': createTransitionToken('transition-shadow', { property: 'box-shadow', duration: '100ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-shadow'),
}

const technicalEasingPrimitives: Record<string, AnyPrimitiveToken> = {
  'easing-linear': createEasingToken('easing-linear', { type: 'linear' }, 'easing-linear'),
  'easing-ease-in': createEasingToken('easing-ease-in', { type: 'cubic-bezier', values: [0.4, 0, 1, 1] }, 'easing-ease-in'),
  'easing-ease-out': createEasingToken('easing-ease-out', { type: 'cubic-bezier', values: [0, 0, 0.2, 1] }, 'easing-ease-out'),
  'easing-ease-in-out': createEasingToken('easing-ease-in-out', { type: 'cubic-bezier', values: [0.4, 0, 0.2, 1] }, 'easing-ease-in-out'),
  'easing-sharp': createEasingToken('easing-sharp', { type: 'cubic-bezier', values: [0.4, 0, 0.6, 1] }, 'easing-sharp'),
  'easing-spring-gentle': createEasingToken('easing-spring-gentle', { type: 'spring', springConfig: { stiffness: 120, damping: 18, mass: 1 } }, 'easing-spring-gentle'),
  'easing-spring-wobbly': createEasingToken('easing-spring-wobbly', { type: 'spring', springConfig: { stiffness: 160, damping: 14, mass: 1 } }, 'easing-spring-wobbly'),
  'easing-spring-stiff': createEasingToken('easing-spring-stiff', { type: 'spring', springConfig: { stiffness: 200, damping: 20, mass: 1 } }, 'easing-spring-stiff'),
  'easing-expo-out': createEasingToken('easing-expo-out', { type: 'cubic-bezier', values: [0.19, 1, 0.22, 1] }, 'easing-expo-out'),
}

const technicalDensityPrimitives: Record<string, AnyPrimitiveToken> = {
  'density-compact': createNumberToken('density-compact', 0.875, 'unitless', 'density-compact'),
  'density-comfortable': createNumberToken('density-comfortable', 1, 'unitless', 'density-comfortable'),
  'density-spacious': createNumberToken('density-spacious', 1.125, 'unitless', 'density-spacious'),
}

// ============================================
// TECHNICAL MOLECULES
// ============================================

const technicalMolecules: Record<string, ComponentMolecule> = {
  Button: {
    component: 'Button',
    displayName: 'Button',
    category: 'action',
    defaultVariant: 'primary',
    defaultSize: 'md',
    variants: {
      primary: {
        name: 'primary',
        base: {
          tokens: {
            backgroundColor: 'color-brand-500',
            color: 'color-text-on-primary',
            borderColor: 'color-brand-500',
            borderWidth: '1px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-3',
            paddingY: 'spacing-2',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-medium',
            fontFamily: 'font-mono',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-brand-600', borderColor: 'color-brand-600' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-brand-700', borderColor: 'color-brand-700' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-3', fontSize: 'font-size-base' } } },
        },
      },
      secondary: {
        name: 'secondary',
        base: {
          tokens: {
            backgroundColor: 'color-surface-primary',
            color: 'color-text-primary',
            borderColor: 'color-border-primary',
            borderWidth: '1px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-3',
            paddingY: 'spacing-2',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-medium',
            fontFamily: 'font-mono',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-surface-secondary', borderColor: 'color-border-secondary' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-surface-tertiary' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-3', fontSize: 'font-size-base' } } },
        },
      },
      outline: {
        name: 'outline',
        base: {
          tokens: {
            backgroundColor: 'transparent',
            color: 'color-brand-500',
            borderColor: 'color-brand-500',
            borderWidth: '1px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-3',
            paddingY: 'spacing-2',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-medium',
            fontFamily: 'font-mono',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-brand-50', color: 'color-brand-700' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-brand-100' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-3', fontSize: 'font-size-base' } } },
        },
      },
      ghost: {
        name: 'ghost',
        base: {
          tokens: {
            backgroundColor: 'transparent',
            color: 'color-brand-500',
            borderColor: 'transparent',
            borderWidth: '1px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-3',
            paddingY: 'spacing-2',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-medium',
            fontFamily: 'font-mono',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-brand-50' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-brand-100' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-3', fontSize: 'font-size-base' } } },
        },
      },
      danger: {
        name: 'danger',
        base: {
          tokens: {
            backgroundColor: 'color-error-500',
            color: 'color-text-on-error',
            borderColor: 'color-error-500',
            borderWidth: '1px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-3',
            paddingY: 'spacing-2',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-medium',
            fontFamily: 'font-mono',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-error-600', borderColor: 'color-error-600' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-error-700', borderColor: 'color-error-700' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-3', fontSize: 'font-size-base' } } },
        },
      },
    },
    props: [],
    behaviors: [],
  },
  Card: {
    component: 'Card',
    displayName: 'Card',
    category: 'display',
    defaultVariant: 'outlined',
    defaultSize: 'md',
    variants: {
      elevated: {
        name: 'elevated',
        base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-card', boxShadow: 'shadow-sm', padding: 'spacing-4' } },
        states: {},
      },
      outlined: {
        name: 'outlined',
        base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-card', borderWidth: '1px', borderColor: 'color-border-primary', padding: 'spacing-4' } },
        states: {},
      },
      filled: {
        name: 'filled',
        base: { tokens: { backgroundColor: 'color-surface-secondary', borderRadius: 'radius-card', padding: 'spacing-4' } },
        states: {},
      },
    },
    props: [],
    behaviors: [],
  },
  Input: {
    component: 'Input',
    displayName: 'Input',
    category: 'input',
    defaultVariant: 'outlined',
    defaultSize: 'md',
    variants: {
      outlined: {
        name: 'outlined',
        base: { tokens: { backgroundColor: 'color-surface-primary', borderWidth: '1px', borderColor: 'color-border-primary', borderRadius: 'radius-input', paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-sm', fontFamily: 'font-mono' } },
        states: {
          focus: { tokens: { borderColor: 'color-border-focus', boxShadow: 'shadow-focus' } },
          error: { tokens: { borderColor: 'color-border-error' } },
          disabled: { tokens: { backgroundColor: 'color-surface-tertiary', opacity: '0.5' } },
        },
      },
      filled: {
        name: 'filled',
        base: { tokens: { backgroundColor: 'color-surface-secondary', borderWidth: '0', borderRadius: 'radius-input', paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-sm', fontFamily: 'font-mono' } },
        states: {
          focus: { tokens: { backgroundColor: 'color-surface-primary', boxShadow: 'shadow-focus' } },
          error: { tokens: { backgroundColor: 'color-error-50' } },
          disabled: { tokens: { opacity: '0.5' } },
        },
      },
    },
    props: [],
    behaviors: [],
  },
  Badge: {
    component: 'Badge',
    displayName: 'Badge',
    category: 'display',
    defaultVariant: 'default',
    defaultSize: 'md',
    variants: {
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-neutral-200', color: 'color-neutral-700', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-normal', fontFamily: 'font-mono' } }, states: {} },
      success: { name: 'success', base: { tokens: { backgroundColor: 'color-success-100', color: 'color-success-700', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-normal', fontFamily: 'font-mono' } }, states: {} },
      warning: { name: 'warning', base: { tokens: { backgroundColor: 'color-warning-100', color: 'color-warning-700', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-normal', fontFamily: 'font-mono' } }, states: {} },
      error: { name: 'error', base: { tokens: { backgroundColor: 'color-error-100', color: 'color-error-700', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-normal', fontFamily: 'font-mono' } }, states: {} },
    },
    props: [],
    behaviors: [],
  },
  Avatar: {
    component: 'Avatar',
    displayName: 'Avatar',
    category: 'display',
    defaultVariant: 'default',
    defaultSize: 'md',
    variants: {
      default: {
        name: 'default',
        base: { tokens: { backgroundColor: 'color-neutral-200', color: 'color-neutral-600', borderRadius: 'radius-avatar', fontSize: 'font-size-sm', fontWeight: 'font-weight-medium', fontFamily: 'font-mono' } },
        states: {},
        sizes: {
          xs: { base: { tokens: { width: 'spacing-6', height: 'spacing-6', fontSize: 'font-size-xs' } } },
          sm: { base: { tokens: { width: 'spacing-8', height: 'spacing-8', fontSize: 'font-size-xs' } } },
          md: { base: { tokens: { width: 'spacing-10', height: 'spacing-10', fontSize: 'font-size-sm' } } },
          lg: { base: { tokens: { width: 'spacing-12', height: 'spacing-12', fontSize: 'font-size-base' } } },
          xl: { base: { tokens: { width: 'spacing-16', height: 'spacing-16', fontSize: 'font-size-lg' } } },
        },
      },
    },
    props: [],
    behaviors: [],
  },
  Tooltip: {
    component: 'Tooltip',
    displayName: 'Tooltip',
    category: 'feedback',
    defaultVariant: 'default',
    defaultSize: 'md',
    variants: {
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-neutral-900', color: 'color-neutral-0', borderRadius: 'radius-tooltip', paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-xs', boxShadow: 'shadow-md', fontFamily: 'font-mono' } }, states: {} },
    },
    props: [],
    behaviors: [],
  },
  Dropdown: {
    component: 'Dropdown',
    displayName: 'Dropdown Menu',
    category: 'navigation',
    defaultVariant: 'default',
    defaultSize: 'md',
    variants: {
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-dropdown', boxShadow: 'shadow-lg', borderWidth: '1px', borderColor: 'color-border-primary', padding: 'spacing-1', fontFamily: 'font-mono' } }, states: {} },
    },
    props: [],
    behaviors: [],
  },
  Modal: {
    component: 'Modal',
    displayName: 'Modal Dialog',
    category: 'feedback',
    defaultVariant: 'default',
    defaultSize: 'md',
    variants: {
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-modal', boxShadow: 'shadow-xl', padding: 'spacing-4', maxWidth: 'spacing-20' } }, states: {} },
    },
    props: [],
    behaviors: [],
  },
  Table: {
    component: 'Table',
    displayName: 'Data Table',
    category: 'data',
    defaultVariant: 'default',
    defaultSize: 'md',
    variants: {
      default: { name: 'default', base: { tokens: { borderColor: 'color-border-primary', borderRadius: 'radius-md', fontFamily: 'font-mono', fontSize: 'font-size-sm' } }, states: {} },
    },
    props: [],
    behaviors: [],
  },
  Tabs: {
    component: 'Tabs',
    displayName: 'Tab Navigation',
    category: 'navigation',
    defaultVariant: 'default',
    defaultSize: 'md',
    variants: {
      default: { name: 'default', base: { tokens: { color: 'color-text-secondary', borderColor: 'color-border-primary', activeColor: 'color-brand-500', activeBorderColor: 'color-brand-500', fontFamily: 'font-mono' } }, states: {} },
    },
    props: [],
    behaviors: [],
  },
}

// ============================================
// TECHNICAL ORGANISMS
// ============================================

const technicalOrganisms: Record<string, OrganismPattern> = {
  FormField: {
    id: 'FormField',
    name: 'Form Field',
    category: 'form',
    molecules: ['Label', 'Input', 'HelperText', 'ErrorText'],
    composition: { type: 'stack', config: { gap: 'spacing-1', direction: 'column' }, children: ['Label', 'Input', 'HelperText', 'ErrorText'] },
    responsive: [],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
  DataTable: {
    id: 'DataTable',
    name: 'Data Table',
    category: 'table',
    molecules: ['Table', 'Pagination', 'Search', 'Filter', 'Toolbar'],
    composition: { type: 'stack', config: { gap: 'spacing-4', direction: 'column' }, children: ['Toolbar', 'Search', 'Filter', 'Table', 'Pagination'] },
    responsive: [{ breakpoint: 'sm', mutations: [] }],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
  ModalForm: {
    id: 'ModalForm',
    name: 'Modal Form',
    category: 'modal',
    molecules: ['Modal', 'FormField', 'Button'],
    composition: { type: 'stack', config: { gap: 'spacing-4', direction: 'column' }, children: ['Modal', 'FormField', 'Button'] },
    responsive: [],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
  NavigationBar: {
    id: 'NavigationBar',
    name: 'Navigation Bar',
    category: 'navigation',
    molecules: ['Logo', 'Navigation', 'Search', 'UserMenu', 'Button'],
    composition: { type: 'inline', config: { justify: 'space-between', align: 'center', gap: 'spacing-4' }, children: ['Logo', 'Navigation', 'Search', 'UserMenu'] },
    responsive: [],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
  CardGrid: {
    id: 'CardGrid',
    name: 'Card Grid',
    category: 'display',
    molecules: ['Card'],
    composition: { type: 'grid', config: { columns: { sm: 1, md: 2, lg: 3, xl: 4 }, gap: 'spacing-4' }, children: ['Card'] },
    responsive: [{ breakpoint: 'sm', mutations: [] }],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
  Wizard: {
    id: 'Wizard',
    name: 'Multi-step Wizard',
    category: 'form',
    molecules: ['Stepper', 'FormField', 'Button', 'Progress'],
    composition: { type: 'stack', config: { gap: 'spacing-6', direction: 'column' }, children: ['Progress', 'Stepper', 'FormField', 'Button'] },
    responsive: [],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
  CodeBlock: {
    id: 'CodeBlock',
    name: 'Code Block',
    category: 'display',
    molecules: ['Code', 'CopyButton', 'LanguageLabel'],
    composition: { type: 'stack', config: { gap: 'spacing-2', direction: 'column' }, children: ['LanguageLabel', 'Code', 'CopyButton'] },
    responsive: [],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
  Terminal: {
    id: 'Terminal',
    name: 'Terminal',
    category: 'display',
    molecules: ['Card', 'CodeBlock', 'Prompt'],
    composition: { type: 'stack', config: { gap: 'spacing-2', direction: 'column' }, children: ['Card', 'CodeBlock', 'Prompt'] },
    responsive: [],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
}

// ============================================
// TECHNICAL ECOSYSTEMS
// ============================================

const technicalEcosystems: Record<string, EcosystemTemplate> = {
  Dashboard: {
    id: 'Dashboard',
    name: 'Dashboard',
    category: 'dashboard',
    organisms: ['NavigationBar', 'CardGrid', 'DataTable', 'CodeBlock'],
    globalState: { providers: [], initialState: {}, persistence: { strategy: 'localStorage', keys: [] }, hydration: { strategy: 'ssr', priority: 'high' } },
    theming: { mode: 'dynamic', defaultDNA: 'technical', fallbackDNA: 'technical', transitions: [], mutations: [], userOverrides: true },
    seo: { title: 'Dashboard', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'none', events: [], consent: { required: false, categories: [], defaultDeny: false } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
  Landing: {
    id: 'Landing',
    name: 'Landing Page',
    category: 'marketing',
    organisms: ['NavigationBar', 'CardGrid', 'CodeBlock'],
    globalState: { providers: [], initialState: {}, persistence: { strategy: 'none', keys: [] }, hydration: { strategy: 'ssr', priority: 'high' } },
    theming: { mode: 'dynamic', defaultDNA: 'technical', fallbackDNA: 'technical', transitions: [], mutations: [], userOverrides: true },
    seo: { title: 'Landing', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'ga4', events: [], consent: { required: true, categories: [], defaultDeny: true } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
  Auth: {
    id: 'Auth',
    name: 'Authentication Flow',
    category: 'auth',
    organisms: ['ModalForm', 'Card'],
    globalState: { providers: [{ id: 'auth', type: 'auth', config: {}, dependencies: [] }], initialState: {}, persistence: { strategy: 'localStorage', keys: ['auth'] }, hydration: { strategy: 'csr', priority: 'high' } },
    theming: { mode: 'dynamic', defaultDNA: 'technical', fallbackDNA: 'technical', transitions: [], mutations: [], userOverrides: false },
    seo: { title: 'Sign In', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'none', events: [], consent: { required: false, categories: [], defaultDeny: false } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
  Settings: {
    id: 'Settings',
    name: 'Settings Page',
    category: 'settings',
    organisms: ['NavigationBar', 'FormField', 'CardGrid'],
    globalState: { providers: [], initialState: {}, persistence: { strategy: 'localStorage', keys: ['settings'] }, hydration: { strategy: 'ssr', priority: 'normal' } },
    theming: { mode: 'dynamic', defaultDNA: 'technical', fallbackDNA: 'technical', transitions: [], mutations: [], userOverrides: true },
    seo: { title: 'Settings', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'none', events: [], consent: { required: false, categories: [], defaultDeny: false } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
  Docs: {
    id: 'Docs',
    name: 'Documentation',
    category: 'documentation',
    organisms: ['NavigationBar', 'CardGrid', 'CodeBlock', 'Terminal'],
    globalState: { providers: [], initialState: {}, persistence: { strategy: 'localStorage', keys: ['docs'] }, hydration: { strategy: 'ssr', priority: 'high' } },
    theming: { mode: 'dynamic', defaultDNA: 'technical', fallbackDNA: 'technical', transitions: [], mutations: [], userOverrides: true },
    seo: { title: 'Documentation', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'none', events: [], consent: { required: false, categories: [], defaultDeny: false } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
}

// ============================================
// TECHNICAL SVG PRIMITIVES
// ============================================

const technicalSVG: SVGPrimitives = {
  pathData: {
    'icon-home': { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    'icon-user': { d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    'icon-settings': { d: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.59-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.56.24-1.09.56-1.59.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.59.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.56-.24 1.09-.56 1.59-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
    'icon-menu': { d: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' },
    'icon-close': { d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' },
    'icon-search': { d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
    'icon-chevron-right': { d: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z' },
    'icon-chevron-down': { d: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z' },
    'icon-terminal': { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' },
    'icon-github': { d: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.579v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z' },
  },
  shapePresets: {
    'rounded-rect': { type: 'rounded-rect', params: { rx: 4, ry: 4 } },
    'pill': { type: 'pill', params: {} },
    'circle': { type: 'circle', params: { r: 16 } },
    'square': { type: 'rect', params: { width: 32, height: 32 } },
  },
  fills: {},
  strokes: {},
  gradients: {
    'gradient-primary': { type: 'linear', direction: '135deg', stops: [{ color: '#22c55e', position: 0 }, { color: '#16a34a', position: 1 }] },
    'gradient-subtle': { type: 'linear', direction: '180deg', stops: [{ color: '#f0fdf4', position: 0 }, { color: '#ffffff', position: 1 }] },
  },
  patterns: {},
  filters: {},
  motionPaths: {},
  easingCurves: {},
  keyframeSets: {},
  viewBoxPresets: {},
  coordinateSystems: {},
  iconRoles: {
    navigation: { category: 'navigation', interactive: true, semanticMeaning: 'Navigation element', sizes: { default: 20, compact: 16, spacious: 24 }, states: { hover: { opacity: 0.7 }, focus: { outline: '2px solid currentColor' } } },
    action: { category: 'action', interactive: true, semanticMeaning: 'Action trigger', sizes: { default: 16, compact: 14, spacious: 20 }, states: { hover: { opacity: 0.7 }, active: { transform: 'scale(0.95)' } } },
    status: { category: 'status', interactive: false, semanticMeaning: 'Status indicator', sizes: { default: 14, compact: 12, spacious: 16 }, states: {} },
    decoration: { category: 'decoration', interactive: false, semanticMeaning: 'Decorative element', sizes: { default: 20, compact: 16, spacious: 24 }, states: {} },
  },
  sizeScales: {
    icon: { name: 'icon', base: 20, scale: [14, 16, 20, 24, 28, 32], remBase: 1, usage: 'icon' },
    illustration: { name: 'illustration', base: 100, scale: [64, 80, 100, 128, 160], remBase: 1, usage: 'illustration' },
    avatar: { name: 'avatar', base: 32, scale: [24, 32, 40, 48, 56, 64], remBase: 1, usage: 'avatar' },
  },
  densityTokens: {
    compact: { name: 'compact', multiplier: 0.875, spacingScale: 0.875, borderScale: 1, radiusScale: 0.875, shadowScale: 0.875, description: 'Compact density' },
    comfortable: { name: 'comfortable', multiplier: 1, spacingScale: 1, borderScale: 1, radiusScale: 1, shadowScale: 1, description: 'Default comfortable density' },
    spacious: { name: 'spacious', multiplier: 1.125, spacingScale: 1.125, borderScale: 1, radiusScale: 1.125, shadowScale: 1.125, description: 'Spacious density' },
  },
}

const technicalContextMutations = [
  {
    id: 'reduced-motion',
    name: 'Reduced Motion',
    condition: (ctx: any) => ctx.reducedMotion,
    mutations: [
      { id: 'disable-transitions', target: 'transition-base', op: 'set' as const, value: '0ms', priority: 100 },
      { id: 'disable-easing', target: 'easing-ease-in-out', op: 'set' as const, value: { type: 'linear' }, priority: 100 },
    ],
    priority: 100,
    reversible: true,
    tags: ['accessibility', 'motion'],
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    condition: (ctx: any) => ctx.highContrast,
    mutations: [
      { id: 'increase-contrast', target: 'color-text-primary', op: 'set' as const, value: '#000000', priority: 100 },
      { id: 'increase-border', target: 'color-border-primary', op: 'set' as const, value: '#000000', priority: 100 },
    ],
    priority: 100,
    reversible: true,
    tags: ['accessibility', 'contrast'],
  },
  {
    id: 'compact-density',
    name: 'Compact Density',
    condition: (ctx: any) => ctx.density === 'compact',
    mutations: [
      { id: 'scale-spacing', target: 'spacing-unit', op: 'scale' as const, value: 0.875, priority: 50 },
      { id: 'scale-radius', target: 'radius-md', op: 'scale' as const, value: 0.875, priority: 50 },
    ],
    priority: 50,
    reversible: true,
    tags: ['density', 'spacing'],
  },
]

// ============================================
// TECHNICAL GENOTYPE
// ============================================

export const technicalDNA: DNAGenotype = {
  id: 'technical',
  name: 'Technical',
  version: '1.0.0',
  description: 'Developer-focused, functional, precise design language',
  primitives: {
    ...allPrimitives,
    ...technicalColorPrimitives,
    ...technicalSpacingPrimitives,
    ...technicalRadiusPrimitives,
    ...technicalShadowPrimitives,
    ...technicalTypographyPrimitives,
    ...technicalTransitionPrimitives,
    ...technicalEasingPrimitives,
    ...technicalDensityPrimitives,
  },
  molecules: technicalMolecules,
  organisms: technicalOrganisms,
  ecosystems: technicalEcosystems,
  svg: technicalSVG,
  contextMutations: technicalContextMutations,
  versionHistory: [],
  metadata: {
    author: 'DNA System',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['technical', 'developer', 'functional', 'precise'],
    category: 'technical',
    license: 'proprietary',
  },
}