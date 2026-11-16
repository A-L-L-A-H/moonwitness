// Creative DNA Preset - Playful, organic, expressive
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
// CREATIVE PRIMITIVES
// ============================================

const creativeColorPrimitives: Record<string, AnyPrimitiveToken> = {
  // Brand - Playful magenta/pink
  'color-brand-50': createColorToken('color-brand-50', '#fdf4ff', 'brand-lightest'),
  'color-brand-100': createColorToken('color-brand-100', '#fae8ff', 'brand-lighter'),
  'color-brand-200': createColorToken('color-brand-200', '#f5d0fe', 'brand-light'),
  'color-brand-300': createColorToken('color-brand-300', '#f0abfc', 'brand-medium-light'),
  'color-brand-400': createColorToken('color-brand-400', '#e879f9', 'brand-medium'),
  'color-brand-500': createColorToken('color-brand-500', '#d946ef', 'brand-primary'),
  'color-brand-600': createColorToken('color-brand-600', '#c026d3', 'brand-medium-dark'),
  'color-brand-700': createColorToken('color-brand-700', '#a21caf', 'brand-dark'),
  'color-brand-800': createColorToken('color-brand-800', '#86198f', 'brand-darker'),
  'color-brand-900': createColorToken('color-brand-900', '#701a75', 'brand-darkest'),
  'color-brand-950': createColorToken('color-brand-950', '#4a044e', 'brand-extreme'),

  // Secondary - Warm amber
  'color-secondary-50': createColorToken('color-secondary-50', '#fef3c7', 'secondary-lightest'),
  'color-secondary-100': createColorToken('color-secondary-100', '#fde68a', 'secondary-lighter'),
  'color-secondary-200': createColorToken('color-secondary-200', '#fcd34d', 'secondary-light'),
  'color-secondary-300': createColorToken('color-secondary-300', '#fbbf24', 'secondary-medium-light'),
  'color-secondary-400': createColorToken('color-secondary-400', '#f59e0b', 'secondary-medium'),
  'color-secondary-500': createColorToken('color-secondary-500', '#f59e0b', 'secondary-primary'),
  'color-secondary-600': createColorToken('color-secondary-600', '#d97706', 'secondary-medium-dark'),
  'color-secondary-700': createColorToken('color-secondary-700', '#b45309', 'secondary-dark'),
  'color-secondary-800': createColorToken('color-secondary-800', '#92400e', 'secondary-darker'),
  'color-secondary-900': createColorToken('color-secondary-900', '#78350f', 'secondary-darkest'),
  'color-secondary-950': createColorToken('color-secondary-950', '#451a03', 'secondary-extreme'),

  // Accents
  'color-accent-cyan': createColorToken('color-accent-cyan', '#06b6d4', 'accent-cyan'),
  'color-accent-emerald': createColorToken('color-accent-emerald', '#10b981', 'accent-emerald'),
  'color-accent-amber': createColorToken('color-accent-amber', '#f59e0b', 'accent-amber'),
  'color-accent-rose': createColorToken('color-accent-rose', '#f43f5e', 'accent-rose'),
  'color-accent-violet': createColorToken('color-accent-violet', '#8b5cf6', 'accent-violet'),

  // Semantic
  'color-success-500': createColorToken('color-success-500', '#10b981', 'success-primary'),
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
  'color-bg-primary': createReferenceToken('color-bg-primary', 'color-neutral-0', 'bg-primary'),
  'color-bg-secondary': createReferenceToken('color-bg-secondary', 'color-neutral-50', 'bg-secondary'),
  'color-bg-tertiary': createReferenceToken('color-bg-tertiary', 'color-neutral-100', 'bg-tertiary'),
  'color-bg-inverse': createReferenceToken('color-bg-inverse', 'color-neutral-900', 'bg-inverse'),
  'color-bg-brand': createReferenceToken('color-bg-brand', 'color-brand-100', 'bg-brand'),
  'color-bg-brand-subtle': createReferenceToken('color-bg-brand-subtle', 'color-brand-200', 'bg-brand-subtle'),
}

const creativeSpacingPrimitives: Record<string, AnyPrimitiveToken> = {
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

const creativeRadiusPrimitives: Record<string, AnyPrimitiveToken> = {
  'radius-none': createNumberToken('radius-none', 0, 'px', 'radius-none'),
  'radius-xs': createNumberToken('radius-xs', 4, 'px', 'radius-xs'),
  'radius-sm': createNumberToken('radius-sm', 8, 'px', 'radius-sm'),
  'radius-md': createNumberToken('radius-md', 12, 'px', 'radius-md'),
  'radius-lg': createNumberToken('radius-lg', 16, 'px', 'radius-lg'),
  'radius-xl': createNumberToken('radius-xl', 24, 'px', 'radius-xl'),
  'radius-2xl': createNumberToken('radius-2xl', 32, 'px', 'radius-2xl'),
  'radius-3xl': createNumberToken('radius-3xl', 48, 'px', 'radius-3xl'),
  'radius-full': createNumberToken('radius-full', 9999, 'px', 'radius-full'),
  'radius-button': createReferenceToken('radius-button', 'radius-full', 'radius-button'),
  'radius-input': createReferenceToken('radius-input', 'radius-xl', 'radius-input'),
  'radius-card': createReferenceToken('radius-card', 'radius-2xl', 'radius-card'),
  'radius-badge': createReferenceToken('radius-badge', 'radius-full', 'radius-badge'),
  'radius-avatar': createReferenceToken('radius-avatar', 'radius-full', 'radius-avatar'),
  'radius-tooltip': createReferenceToken('radius-tooltip', 'radius-lg', 'radius-tooltip'),
  'radius-dropdown': createReferenceToken('radius-dropdown', 'radius-xl', 'radius-dropdown'),
  'radius-modal': createReferenceToken('radius-modal', 'radius-2xl', 'radius-modal'),
}

const creativeShadowPrimitives: Record<string, AnyPrimitiveToken> = {
  'shadow-none': createShadowToken('shadow-none', { layers: [] }, 'shadow-none'),
  'shadow-xs': createShadowToken('shadow-xs', { layers: [{ x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.05)' }] }, 'shadow-xs'),
  'shadow-sm': createShadowToken('shadow-sm', { layers: [{ x: 0, y: 4, blur: 8, spread: 0, color: 'rgba(0, 0, 0, 0.08)' }] }, 'shadow-sm'),
  'shadow-md': createShadowToken('shadow-md', { layers: [{ x: 0, y: 8, blur: 16, spread: 0, color: 'rgba(0, 0, 0, 0.1)' }] }, 'shadow-md'),
  'shadow-lg': createShadowToken('shadow-lg', { layers: [{ x: 0, y: 16, blur: 32, spread: 0, color: 'rgba(0, 0, 0, 0.12)' }] }, 'shadow-lg'),
  'shadow-xl': createShadowToken('shadow-xl', { layers: [{ x: 0, y: 24, blur: 48, spread: 0, color: 'rgba(0, 0, 0, 0.15)' }] }, 'shadow-xl'),
  'shadow-2xl': createShadowToken('shadow-2xl', { layers: [{ x: 0, y: 32, blur: 64, spread: 0, color: 'rgba(0, 0, 0, 0.2)' }] }, 'shadow-2xl'),
  'shadow-inner': createShadowToken('shadow-inner', { layers: [{ x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.05)', inset: true }] }, 'shadow-inner'),
  'shadow-focus': createShadowToken('shadow-focus', { layers: [{ x: 0, y: 0, blur: 0, spread: 3, color: 'rgba(217, 70, 239, 0.5)' }] }, 'shadow-focus'),
  'shadow-brand': createShadowToken('shadow-brand', { layers: [{ x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(217, 70, 239, 0.3)' }] }, 'shadow-brand'),
  'shadow-brand-lg': createShadowToken('shadow-brand-lg', { layers: [{ x: 0, y: 16, blur: 48, spread: 0, color: 'rgba(217, 70, 239, 0.4)' }] }, 'shadow-brand-lg'),
}

const creativeTypographyPrimitives: Record<string, AnyPrimitiveToken> = {
  'font-sans': createStringToken('font-sans', 'Poppins, Inter, sans-serif', 'font-family-primary', 'font-family'),
  'font-mono': createStringToken('font-mono', 'JetBrains Mono, Fira Code, monospace', 'font-family-mono', 'font-family'),
  'font-display': createStringToken('font-display', 'Poppins, sans-serif', 'font-family-display', 'font-family'),
  'font-serif': createStringToken('font-serif', 'Georgia, Cambria, serif', 'font-family-serif', 'font-family'),
  'font-size-xs': createNumberToken('font-size-xs', 12, 'px', 'font-size-xs'),
  'font-size-sm': createNumberToken('font-size-sm', 14, 'px', 'font-size-sm'),
  'font-size-base': createNumberToken('font-size-base', 16, 'px', 'font-size-base'),
  'font-size-lg': createNumberToken('font-size-lg', 18, 'px', 'font-size-lg'),
  'font-size-xl': createNumberToken('font-size-xl', 20, 'px', 'font-size-xl'),
  'font-size-2xl': createNumberToken('font-size-2xl', 24, 'px', 'font-size-2xl'),
  'font-size-3xl': createNumberToken('font-size-3xl', 32, 'px', 'font-size-3xl'),
  'font-size-4xl': createNumberToken('font-size-4xl', 40, 'px', 'font-size-4xl'),
  'font-size-5xl': createNumberToken('font-size-5xl', 56, 'px', 'font-size-5xl'),
  'font-size-6xl': createNumberToken('font-size-6xl', 72, 'px', 'font-size-6xl'),
  'font-size-7xl': createNumberToken('font-size-7xl', 96, 'px', 'font-size-7xl'),
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
  'line-height-tight': createNumberToken('line-height-tight', 1.2, 'unitless', 'line-height-tight'),
  'line-height-snug': createNumberToken('line-height-snug', 1.375, 'unitless', 'line-height-snug'),
  'line-height-normal': createNumberToken('line-height-normal', 1.5, 'unitless', 'line-height-normal'),
  'line-height-relaxed': createNumberToken('line-height-relaxed', 1.625, 'unitless', 'line-height-relaxed'),
  'line-height-loose': createNumberToken('line-height-loose', 1.75, 'unitless', 'line-height-loose'),
  'letter-spacing-tighter': createNumberToken('letter-spacing-tighter', -0.05, 'em', 'letter-spacing-tighter'),
  'letter-spacing-tight': createNumberToken('letter-spacing-tight', -0.01, 'em', 'letter-spacing-tight'),
  'letter-spacing-normal': createNumberToken('letter-spacing-normal', 0, 'em', 'letter-spacing-normal'),
  'letter-spacing-wide': createNumberToken('letter-spacing-wide', 0.03, 'em', 'letter-spacing-wide'),
  'letter-spacing-wider': createNumberToken('letter-spacing-wider', 0.06, 'em', 'letter-spacing-wider'),
  'letter-spacing-widest': createNumberToken('letter-spacing-widest', 0.1, 'em', 'letter-spacing-widest'),
}

const creativeTransitionPrimitives: Record<string, AnyPrimitiveToken> = {
  'transition-fast': createTransitionToken('transition-fast', { property: 'all', duration: '200ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-fast'),
  'transition-base': createTransitionToken('transition-base', { property: 'all', duration: '300ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-base'),
  'transition-slow': createTransitionToken('transition-slow', { property: 'all', duration: '500ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-slow'),
  'transition-slower': createTransitionToken('transition-slower', { property: 'all', duration: '700ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-slower'),
  'transition-colors': createTransitionToken('transition-colors', { property: 'color, background-color, border-color, fill, stroke', duration: '300ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-colors'),
  'transition-transform': createTransitionToken('transition-transform', { property: 'transform', duration: '300ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-transform'),
  'transition-opacity': createTransitionToken('transition-opacity', { property: 'opacity', duration: '200ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-opacity'),
  'transition-shadow': createTransitionToken('transition-shadow', { property: 'box-shadow', duration: '300ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, 'transition-shadow'),
}

const creativeEasingPrimitives: Record<string, AnyPrimitiveToken> = {
  'easing-linear': createEasingToken('easing-linear', { type: 'linear' }, 'easing-linear'),
  'easing-ease-in': createEasingToken('easing-ease-in', { type: 'cubic-bezier', values: [0.4, 0, 1, 1] }, 'easing-ease-in'),
  'easing-ease-out': createEasingToken('easing-ease-out', { type: 'cubic-bezier', values: [0, 0, 0.2, 1] }, 'easing-ease-out'),
  'easing-ease-in-out': createEasingToken('easing-ease-in-out', { type: 'cubic-bezier', values: [0.4, 0, 0.2, 1] }, 'easing-ease-in-out'),
  'easing-sharp': createEasingToken('easing-sharp', { type: 'cubic-bezier', values: [0.4, 0, 0.6, 1] }, 'easing-sharp'),
  'easing-spring-gentle': createEasingToken('easing-spring-gentle', { type: 'spring', springConfig: { stiffness: 100, damping: 10, mass: 1 } }, 'easing-spring-gentle'),
  'easing-spring-wobbly': createEasingToken('easing-spring-wobbly', { type: 'spring', springConfig: { stiffness: 150, damping: 8, mass: 1 } }, 'easing-spring-wobbly'),
  'easing-spring-stiff': createEasingToken('easing-spring-stiff', { type: 'spring', springConfig: { stiffness: 200, damping: 15, mass: 1 } }, 'easing-spring-stiff'),
  'easing-back-out': createEasingToken('easing-back-out', { type: 'cubic-bezier', values: [0.34, 1.56, 0.64, 1] }, 'easing-back-out'),
  'easing-bounce': createEasingToken('easing-bounce', { type: 'cubic-bezier', values: [0.68, -0.55, 0.265, 1.55] }, 'easing-bounce'),
}

const creativeDensityPrimitives: Record<string, AnyPrimitiveToken> = {
  'density-compact': createNumberToken('density-compact', 0.875, 'unitless', 'density-compact'),
  'density-comfortable': createNumberToken('density-comfortable', 1, 'unitless', 'density-comfortable'),
  'density-spacious': createNumberToken('density-spacious', 1.125, 'unitless', 'density-spacious'),
}

// ============================================
// CREATIVE MOLECULES
// ============================================

const creativeMolecules: Record<string, ComponentMolecule> = {
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
            borderWidth: '2px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-6',
            paddingY: 'spacing-3',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-semibold',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-brand-600', borderColor: 'color-brand-600', boxShadow: 'shadow-brand' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-brand-700', borderColor: 'color-brand-700', transform: 'scale(0.98)' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-2', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-8', paddingY: 'spacing-4', fontSize: 'font-size-base' } } },
        },
      },
      secondary: {
        name: 'secondary',
        base: {
          tokens: {
            backgroundColor: 'color-secondary-500',
            color: 'color-text-on-primary',
            borderColor: 'color-secondary-500',
            borderWidth: '2px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-6',
            paddingY: 'spacing-3',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-semibold',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-secondary-600', borderColor: 'color-secondary-600' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-secondary-700', borderColor: 'color-secondary-700' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-2', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-8', paddingY: 'spacing-4', fontSize: 'font-size-base' } } },
        },
      },
      outline: {
        name: 'outline',
        base: {
          tokens: {
            backgroundColor: 'transparent',
            color: 'color-brand-500',
            borderColor: 'color-brand-500',
            borderWidth: '2px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-6',
            paddingY: 'spacing-3',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-semibold',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-brand-100', color: 'color-brand-700' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-brand-200' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-2', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-8', paddingY: 'spacing-4', fontSize: 'font-size-base' } } },
        },
      },
      ghost: {
        name: 'ghost',
        base: {
          tokens: {
            backgroundColor: 'transparent',
            color: 'color-brand-500',
            borderColor: 'transparent',
            borderWidth: '2px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-6',
            paddingY: 'spacing-3',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-semibold',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-brand-100' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-brand-200' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-2', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-8', paddingY: 'spacing-4', fontSize: 'font-size-base' } } },
        },
      },
      danger: {
        name: 'danger',
        base: {
          tokens: {
            backgroundColor: 'color-error-500',
            color: 'color-text-on-error',
            borderColor: 'color-error-500',
            borderWidth: '2px',
            borderRadius: 'radius-button',
            paddingX: 'spacing-6',
            paddingY: 'spacing-3',
            fontSize: 'font-size-sm',
            fontWeight: 'font-weight-semibold',
          },
        },
        states: {
          hover: { tokens: { backgroundColor: 'color-error-600', borderColor: 'color-error-600' } },
          focus: { tokens: { boxShadow: 'shadow-focus' } },
          active: { tokens: { backgroundColor: 'color-error-700', borderColor: 'color-error-700' } },
          disabled: { tokens: { opacity: '0.5', cursor: 'not-allowed' } },
        },
        sizes: {
          sm: { base: { tokens: { paddingX: 'spacing-4', paddingY: 'spacing-2', fontSize: 'font-size-xs' } } },
          lg: { base: { tokens: { paddingX: 'spacing-8', paddingY: 'spacing-4', fontSize: 'font-size-base' } } },
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
    defaultVariant: 'elevated',
    defaultSize: 'md',
    variants: {
      elevated: {
        name: 'elevated',
        base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-card', boxShadow: 'shadow-lg', padding: 'spacing-6', borderWidth: '0' } },
        states: {},
      },
      outlined: {
        name: 'outlined',
        base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-card', borderWidth: '2px', borderColor: 'color-border-primary', padding: 'spacing-6' } },
        states: {},
      },
      filled: {
        name: 'filled',
        base: { tokens: { backgroundColor: 'color-surface-secondary', borderRadius: 'radius-card', padding: 'spacing-6' } },
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
        base: { tokens: { backgroundColor: 'color-surface-primary', borderWidth: '2px', borderColor: 'color-border-primary', borderRadius: 'radius-input', paddingX: 'spacing-3', paddingY: 'spacing-2', fontSize: 'font-size-base', fontFamily: 'font-sans' } },
        states: {
          focus: { tokens: { borderColor: 'color-border-focus', boxShadow: 'shadow-focus' } },
          error: { tokens: { borderColor: 'color-border-error' } },
          disabled: { tokens: { backgroundColor: 'color-surface-tertiary', opacity: '0.5' } },
        },
      },
      filled: {
        name: 'filled',
        base: { tokens: { backgroundColor: 'color-surface-secondary', borderWidth: '0', borderRadius: 'radius-input', paddingX: 'spacing-3', paddingY: 'spacing-2', fontSize: 'font-size-base', fontFamily: 'font-sans' } },
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
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-brand-200', color: 'color-brand-800', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-medium' } }, states: {} },
      success: { name: 'success', base: { tokens: { backgroundColor: 'color-success-200', color: 'color-success-800', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-medium' } }, states: {} },
      warning: { name: 'warning', base: { tokens: { backgroundColor: 'color-warning-200', color: 'color-warning-800', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-medium' } }, states: {} },
      error: { name: 'error', base: { tokens: { backgroundColor: 'color-error-200', color: 'color-error-800', borderRadius: 'radius-badge', paddingX: 'spacing-2', paddingY: 'spacing-0', fontSize: 'font-size-xs', fontWeight: 'font-weight-medium' } }, states: {} },
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
        base: { tokens: { backgroundColor: 'color-brand-200', color: 'color-brand-800', borderRadius: 'radius-avatar', fontSize: 'font-size-base', fontWeight: 'font-weight-semibold', borderWidth: '3px', borderColor: 'color-brand-500' } },
        states: {},
        sizes: {
          xs: { base: { tokens: { width: 'spacing-6', height: 'spacing-6', fontSize: 'font-size-xs' } } },
          sm: { base: { tokens: { width: 'spacing-8', height: 'spacing-8', fontSize: 'font-size-sm' } } },
          md: { base: { tokens: { width: 'spacing-10', height: 'spacing-10', fontSize: 'font-size-base' } } },
          lg: { base: { tokens: { width: 'spacing-12', height: 'spacing-12', fontSize: 'font-size-lg' } } },
          xl: { base: { tokens: { width: 'spacing-16', height: 'spacing-16', fontSize: 'font-size-xl' } } },
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
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-neutral-900', color: 'color-neutral-0', borderRadius: 'radius-tooltip', paddingX: 'spacing-2', paddingY: 'spacing-1', fontSize: 'font-size-xs', boxShadow: 'shadow-xl' } }, states: {} },
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
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-dropdown', boxShadow: 'shadow-xl', borderWidth: '2px', borderColor: 'color-border-primary', padding: 'spacing-1' } }, states: {} },
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
      default: { name: 'default', base: { tokens: { backgroundColor: 'color-surface-primary', borderRadius: 'radius-modal', boxShadow: 'shadow-2xl', padding: 'spacing-6', maxWidth: 'spacing-24', borderWidth: '0' } }, states: {} },
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
      default: { name: 'default', base: { tokens: { borderColor: 'color-border-primary', borderRadius: 'radius-md', borderWidth: '0' } }, states: {} },
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
      default: { name: 'default', base: { tokens: { color: 'color-text-secondary', borderColor: 'color-border-primary', activeColor: 'color-brand-500', activeBorderColor: 'color-brand-500', borderWidth: '2px' } }, states: {} },
    },
    props: [],
    behaviors: [],
  },
}

// ============================================
// CREATIVE ORGANISMS
// ============================================

const creativeOrganisms: Record<string, OrganismPattern> = {
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
  Hero: {
    id: 'Hero',
    name: 'Hero Section',
    category: 'marketing',
    molecules: ['Heading', 'Text', 'Button', 'Illustration'],
    composition: { type: 'stack', config: { gap: 'spacing-8', direction: 'column', align: 'center' }, children: ['Heading', 'Text', 'Button', 'Illustration'] },
    responsive: [{ breakpoint: 'lg', mutations: [] }],
    accessibility: { landmarks: {}, headingStructure: [], focusOrder: [], skipLinks: [], liveRegions: [], colorContrast: [] },
    states: {},
    slots: [],
  },
}

// ============================================
// CREATIVE ECOSYSTEMS
// ============================================

const creativeEcosystems: Record<string, EcosystemTemplate> = {
  Dashboard: {
    id: 'Dashboard',
    name: 'Dashboard',
    category: 'dashboard',
    organisms: ['NavigationBar', 'CardGrid', 'DataTable', 'Hero'],
    globalState: { providers: [], initialState: {}, persistence: { strategy: 'localStorage', keys: [] }, hydration: { strategy: 'ssr', priority: 'high' } },
    theming: { mode: 'dynamic', defaultDNA: 'creative', fallbackDNA: 'creative', transitions: [], mutations: [], userOverrides: true },
    seo: { title: 'Dashboard', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'none', events: [], consent: { required: false, categories: [], defaultDeny: false } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
  Landing: {
    id: 'Landing',
    name: 'Landing Page',
    category: 'marketing',
    organisms: ['NavigationBar', 'Hero', 'CardGrid'],
    globalState: { providers: [], initialState: {}, persistence: { strategy: 'none', keys: [] }, hydration: { strategy: 'ssr', priority: 'high' } },
    theming: { mode: 'dynamic', defaultDNA: 'creative', fallbackDNA: 'creative', transitions: [], mutations: [], userOverrides: true },
    seo: { title: 'Landing', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'ga4', events: [], consent: { required: true, categories: [], defaultDeny: true } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
  Auth: {
    id: 'Auth',
    name: 'Authentication Flow',
    category: 'auth',
    organisms: ['ModalForm', 'Card', 'Hero'],
    globalState: { providers: [{ id: 'auth', type: 'auth', config: {}, dependencies: [] }], initialState: {}, persistence: { strategy: 'localStorage', keys: ['auth'] }, hydration: { strategy: 'csr', priority: 'high' } },
    theming: { mode: 'dynamic', defaultDNA: 'creative', fallbackDNA: 'creative', transitions: [], mutations: [], userOverrides: false },
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
    theming: { mode: 'dynamic', defaultDNA: 'creative', fallbackDNA: 'creative', transitions: [], mutations: [], userOverrides: true },
    seo: { title: 'Settings', description: '', keywords: [], openGraph: { type: '', locale: '', url: '', siteName: '', images: [] }, twitterCard: { card: 'summary', site: '' }, jsonLd: [] },
    performance: { budgets: { maxBundleSize: 50000, maxRuntimeTokens: 1000, targetFPS: 60, maxCLS: 0.1, maxLCP: 2500, maxINP: 200 }, optimizations: [], monitoring: { vitals: true, customMetrics: [], alerts: [] } },
    analytics: { provider: 'none', events: [], consent: { required: false, categories: [], defaultDeny: false } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en'], fallbackLocale: 'en', namespaces: [], interpolation: { prefix: '{{', suffix: '}}', escapeValue: false, format: (v) => String(v) } },
  },
}

// ============================================
// CREATIVE SVG PRIMITIVES
// ============================================

const creativeSVG: SVGPrimitives = {
  pathData: {
    'icon-home': { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    'icon-user': { d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    'icon-settings': { d: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.59-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.56.24-1.09.56-1.59.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.59.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.56-.24 1.09-.56 1.59-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
    'icon-menu': { d: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' },
    'icon-close': { d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' },
    'icon-search': { d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
    'icon-chevron-right': { d: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z' },
    'icon-chevron-down': { d: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z' },
    'icon-heart': { d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
    'icon-star': { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    'icon-sparkles': { d: 'M12 2l1 3h3l1-3h2l-3 3 1 3-3 1 3 3h-2l1-3h-3l-1 3H8l3-3-1-3H5l-3 3 1-3-3-1 3-3h2z' },
  },
  shapePresets: {
    'rounded-rect': { type: 'rounded-rect', params: { rx: 24, ry: 24 } },
    'pill': { type: 'pill', params: {} },
    'circle': { type: 'circle', params: { r: 16 } },
    'square': { type: 'rect', params: { width: 32, height: 32 } },
    'blob': { type: 'path', params: { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' } },
  },
  fills: {},
  strokes: {},
  gradients: {
    'gradient-primary': { type: 'linear', direction: '135deg', stops: [{ color: '#d946ef', position: 0 }, { color: '#f59e0b', position: 1 }] },
    'gradient-secondary': { type: 'linear', direction: '135deg', stops: [{ color: '#f59e0b', position: 0 }, { color: '#f43f5e', position: 1 }] },
    'gradient-subtle': { type: 'linear', direction: '180deg', stops: [{ color: '#fdf4ff', position: 0 }, { color: '#ffffff', position: 1 }] },
    'gradient-mesh': { type: 'radial', direction: 'center', stops: [{ color: '#d946ef', position: 0 }, { color: '#f59e0b', position: 0.5 }, { color: '#06b6d4', position: 1 }] },
  },
  patterns: {},
  filters: {
    'filter-glow': { id: 'filter-glow', primitives: [{ type: 'drop-shadow', in: 'SourceGraphic', result: 'glow', attributes: { dx: 0, dy: 0, stdDeviation: 8, color: 'rgba(217, 70, 239, 0.5)' } }], type: 'drop-shadow', params: { dx: 0, dy: 0, stdDeviation: 8, color: 'rgba(217, 70, 239, 0.5)' } },
    'filter-blur': { id: 'filter-blur', primitives: [{ type: 'gaussian-blur', in: 'SourceGraphic', result: 'blur', attributes: { stdDeviation: 4 } }], type: 'gaussian-blur', params: { stdDeviation: 4 } },
  },
  motionPaths: {},
  easingCurves: {},
  keyframeSets: {
    'keyframe-float': { name: 'float', keyframes: [{ offset: 0, properties: { transform: 'translateY(0)' } }, { offset: 0.5, properties: { transform: 'translateY(-10px)' } }, { offset: 1, properties: { transform: 'translateY(0)' } }], duration: '3s', iterations: 'infinite', easing: 'ease-in-out' },
    'keyframe-pulse': { name: 'pulse', keyframes: [{ offset: 0, properties: { opacity: 1 } }, { offset: 0.5, properties: { opacity: 0.5 } }, { offset: 1, properties: { opacity: 1 } }], duration: '2s', iterations: 'infinite', easing: 'ease-in-out' },
    'keyframe-spin': { name: 'spin', keyframes: [{ offset: 0, properties: { transform: 'rotate(0deg)' } }, { offset: 1, properties: { transform: 'rotate(360deg)' } }], duration: '1s', iterations: 'infinite', easing: 'linear' },
  },
  viewBoxPresets: {},
  coordinateSystems: {},
  iconRoles: {
    navigation: { category: 'navigation', interactive: true, semanticMeaning: 'Navigation element', sizes: { default: 24, compact: 20, spacious: 28 }, states: { hover: { opacity: 0.7 }, focus: { outline: '2px solid currentColor' } } },
    action: { category: 'action', interactive: true, semanticMeaning: 'Action trigger', sizes: { default: 20, compact: 16, spacious: 24 }, states: { hover: { opacity: 0.7 }, active: { transform: 'scale(0.95)' } } },
    status: { category: 'status', interactive: false, semanticMeaning: 'Status indicator', sizes: { default: 16, compact: 12, spacious: 20 }, states: {} },
    decoration: { category: 'decoration', interactive: false, semanticMeaning: 'Decorative element', sizes: { default: 24, compact: 20, spacious: 28 }, states: {} },
  },
  sizeScales: {
    icon: { name: 'icon', base: 24, scale: [16, 20, 24, 28, 32, 36, 48], remBase: 1, usage: 'icon' },
    illustration: { name: 'illustration', base: 120, scale: [64, 96, 120, 160, 192, 240], remBase: 1, usage: 'illustration' },
    avatar: { name: 'avatar', base: 40, scale: [24, 32, 40, 48, 56, 64, 72, 96, 128], remBase: 1, usage: 'avatar' },
  },
  densityTokens: {
    compact: { name: 'compact', multiplier: 0.875, spacingScale: 0.875, borderScale: 1, radiusScale: 0.875, shadowScale: 0.875, description: 'Compact density' },
    comfortable: { name: 'comfortable', multiplier: 1, spacingScale: 1, borderScale: 1, radiusScale: 1, shadowScale: 1, description: 'Default comfortable density' },
    spacious: { name: 'spacious', multiplier: 1.125, spacingScale: 1.125, borderScale: 1, radiusScale: 1.125, shadowScale: 1.125, description: 'Spacious density' },
  },
}

const creativeContextMutations = [
  {
    id: 'reduced-motion',
    name: 'Reduced Motion',
    condition: (ctx: any) => ctx.reducedMotion,
    mutations: [
      { id: 'disable-transitions', target: 'transition-base', op: 'set' as const, value: '0ms', priority: 100 },
      { id: 'disable-easing', target: 'easing-ease-in-out', op: 'set' as const, value: { type: 'linear' }, priority: 100 },
      { id: 'disable-animations', target: 'keyframe-float', op: 'set' as const, value: { duration: '0s' }, priority: 100 },
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
]

// ============================================
// CREATIVE GENOTYPE
// ============================================

export const creativeDNA: DNAGenotype = {
  id: 'creative',
  name: 'Creative',
  version: '1.0.0',
  description: 'Playful, organic, expressive design language',
  primitives: {
    ...allPrimitives,
    ...creativeColorPrimitives,
    ...creativeSpacingPrimitives,
    ...creativeRadiusPrimitives,
    ...creativeShadowPrimitives,
    ...creativeTypographyPrimitives,
    ...creativeTransitionPrimitives,
    ...creativeEasingPrimitives,
    ...creativeDensityPrimitives,
  },
  molecules: creativeMolecules,
  organisms: creativeOrganisms,
  ecosystems: creativeEcosystems,
  svg: creativeSVG,
  contextMutations: creativeContextMutations,
  versionHistory: [],
  metadata: {
    author: 'DNA System',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['creative', 'playful', 'expressive', 'organic'],
    category: 'creative',
    license: 'proprietary',
  },
}