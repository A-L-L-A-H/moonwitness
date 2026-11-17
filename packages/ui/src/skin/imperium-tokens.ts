/**
 * Pure Design Token Module for 01-imperium-lumen (EMPIRE OF THE LIGHT — THE ILLUSTRATED UNIVERSE).
 *
 * This module is intentionally free of `"use client"` so it can be imported safely
 * by Server Components, build-time scripts, CSS parity tests, and client components alike.
 */

export type RenderingCapabilityTier = "webgl2-full" | "canvas-2d" | "reduced-motion";

export interface SpringPhysicsPreset {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
  readonly maxDisplacementPx: number;
}

export const IMPERIUM_LUMEN_TOKENS = {
  brand: {
    ink: "#08090d",
    paper: "#f4ecd8",
    yellow: "#f6d438",
    pink: "#ed149b",
    blue: "#2ea8ff",
    white: "#fff8e8",
  },
  semantic: {
    canvas: "#08090d",
    surface: "#10121a",
    surfaceElevated: "#171a26",
    text: "#fff8e8",
    textMuted: "#d8d0c0",
    border: "#f6d438",
    accent: "#f6d438",
    accentSecondary: "#ed149b",
    accentForeground: "#08090d",
    focus: "#f6d438",
    success: "#3ddc84",
    warning: "#f6d438",
    danger: "#ff3b3b",
  },
  accessibility: {
    minimumTargetPx: 44,
    minimumTargetCss: "44px",
    focusRingWidth: "2px",
    focusRingOffset: "3px",
    focusRingColor: "#f6d438",
  },
  typography: {
    display: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    editorial: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    label: 'var(--font-cinzel), "Cinzel", "Palatino Linotype", Georgia, serif',
    technical:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    scale: {
      monument: "clamp(2.5rem, 6.2vw, 5.4rem)",
      chapterHeading: "clamp(1.75rem, 3.8vw, 3.1rem)",
      sanctumTitle: "clamp(1.35rem, 2.2vw, 1.95rem)",
      editorialLead: "clamp(1rem, 1.35vw, 1.18rem)",
      sacredKicker: "clamp(0.75rem, 0.9vw, 0.85rem)",
      bodyBase: "1rem",
    },
  },
  layout: {
    spacingScale: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2.5rem",
      "2xl": "4rem",
    },
    contentWidth: "80rem",
    sectionSpacing: "clamp(3.5rem, 6vw, 6rem)",
    pageGutters: "clamp(1rem, 3vw, 4rem)",
    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    radius: {
      none: "0px",
      sm: "2px",
      md: "6px",
      lg: "8px",
    },
    aspectRatios: {
      hero: "16 / 9",
      worldTile: "16 / 10",
      editorialPlate: "16 / 9",
      square: "1 / 1",
    },
    focalPositions: {
      heroCrowd: "61% center",
      center: "50% 50%",
      upper: "50% 25%",
    },
  },
  motion: {
    durationsMs: {
      instant: 0,
      micro: 180,
      scene: 520,
      entrance: 700,
    },
    easings: {
      crispOut: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      sacredOut: "cubic-bezier(0.22, 1, 0.36, 1)",
      celestialInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    },
    springs: {
      gentle: {
        stiffness: 120,
        damping: 20,
        mass: 1,
        maxDisplacementPx: 6,
      },
      magnetic: {
        stiffness: 190,
        damping: 22,
        mass: 0.9,
        maxDisplacementPx: 8,
      },
      spatialTilt: {
        stiffness: 160,
        damping: 24,
        mass: 1,
        maxDisplacementPx: 5,
      },
    } satisfies Record<string, SpringPhysicsPreset>,
    entrance: {
      transformFrom: "translate3d(0, 12px, 0)",
      transformTo: "translate3d(0, 0, 0)",
      durationMs: 560,
    },
    hover: {
      tileLiftPx: -2,
      actionShiftPx: 1,
      durationMs: 160,
    },
    reducedMotion: {
      disableAnimations: true,
      instantTransitions: true,
    },
    capabilityTiers: ["webgl2-full", "canvas-2d", "reduced-motion"] as const,
  },
} as const;

/** Compatibility palette export derived from centralized IMPERIUM_LUMEN_TOKENS */
export const LIVING_LIGHT_PALETTE = {
  cosmicBlack: IMPERIUM_LUMEN_TOKENS.brand.ink,
  midnightBlue: IMPERIUM_LUMEN_TOKENS.semantic.surface,
  obsidianSanctum: IMPERIUM_LUMEN_TOKENS.semantic.surfaceElevated,
  warmIvory: IMPERIUM_LUMEN_TOKENS.brand.paper,
  sacredGold: IMPERIUM_LUMEN_TOKENS.brand.yellow,
  luminousGold: IMPERIUM_LUMEN_TOKENS.brand.white,
  softWhiteLight: IMPERIUM_LUMEN_TOKENS.brand.white,
  subtleSilver: IMPERIUM_LUMEN_TOKENS.semantic.textMuted,
  deepAmber: IMPERIUM_LUMEN_TOKENS.brand.pink,
  electricBlue: IMPERIUM_LUMEN_TOKENS.brand.blue,
  translucentVeil: "rgba(8, 9, 13, 0.88)",
} as const;

/** Compatibility typography export derived from centralized IMPERIUM_LUMEN_TOKENS */
export const LIVING_LIGHT_TYPOGRAPHY = {
  displayFamily: IMPERIUM_LUMEN_TOKENS.typography.display,
  editorialFamily: IMPERIUM_LUMEN_TOKENS.typography.editorial,
  interfaceFamily: IMPERIUM_LUMEN_TOKENS.typography.body,
  labelFamily: IMPERIUM_LUMEN_TOKENS.typography.label,
  telemetryFamily: IMPERIUM_LUMEN_TOKENS.typography.technical,
  scale: IMPERIUM_LUMEN_TOKENS.typography.scale,
} as const;

/** Compatibility motion export derived from centralized IMPERIUM_LUMEN_TOKENS */
export const LIVING_LIGHT_MOTION = IMPERIUM_LUMEN_TOKENS.motion;

/** Reformed visual covenant for 01-imperium-lumen (EMPIRE OF THE LIGHT — THE ILLUSTRATED UNIVERSE) */
export const SACRED_VISUAL_COVENANT = {
  direction: "PLAYFUL ILLUSTRATED UNIVERSE × REFINED USER EXPERIENCE × ACCESSIBLE DESIGN",
  depictionOfAllahForbidden: true,
  humanFacesForbidden: true,
  cartoonAndAnimeForbidden: false,
  originalIllustrationsAllowed: true,
  copyrightImitationForbidden: true,
  violentImageryForbidden: true,
  decorativeSacredTextTexturesForbidden: true,
  requiresReducedMotionBypass: true,
  minimumInteractiveTargetPx: IMPERIUM_LUMEN_TOKENS.accessibility.minimumTargetPx,
  allowedMotifs: [
    "original illustrated fantasy worlds",
    "faceless silhouettes and back-facing travelers",
    "graphic editorial compositions",
    "hand-drawn visual accents",
    "celestial spherical geometry",
    "monumental archways and landscapes",
  ],
} as const;

/**
 * Server-safe `--dna-*` and `--brand-*` custom-property map for 01-imperium-lumen.
 * Apply to an element that also carries `data-dna="01-imperium-lumen"` so page-level
 * surfaces (body, skip link) consume semantic variables instead of literals.
 */
export function imperiumLumenCssVariables(): Readonly<Record<`--${string}`, string>> {
  const { brand, semantic } = IMPERIUM_LUMEN_TOKENS;
  return {
    "--dna-canvas": semantic.canvas,
    "--dna-surface": semantic.surface,
    "--dna-surface-elevated": semantic.surfaceElevated,
    "--dna-text": semantic.text,
    "--dna-muted": semantic.textMuted,
    "--dna-border": semantic.border,
    "--dna-accent": semantic.accent,
    "--dna-accent-secondary": semantic.accentSecondary,
    "--dna-accent-fg": semantic.accentForeground,
    "--dna-focus": semantic.focus,
    "--dna-success": semantic.success,
    "--dna-warning": semantic.warning,
    "--dna-danger": semantic.danger,
    "--brand-ink": brand.ink,
    "--brand-paper": brand.paper,
    "--brand-yellow": brand.yellow,
    "--brand-pink": brand.pink,
    "--brand-blue": brand.blue,
    "--brand-white": brand.white,
  };
}
