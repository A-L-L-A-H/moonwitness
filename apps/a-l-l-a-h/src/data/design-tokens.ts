/**
 * Design System Contract — A-L-L-A-H.COM (The Living Light)
 * Creative Direction: SACRED MINIMALISM × CINEMATIC IMMERSION × INFINITE LIGHT
 */

export type RenderingCapabilityTier = "webgl2-full" | "canvas-2d" | "reduced-motion";

export interface SpringPhysicsPreset {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
  readonly maxDisplacementPx: number;
}

export const LIVING_LIGHT_PALETTE = {
  cosmicBlack: "#040509",
  midnightBlue: "#080a12",
  obsidianSanctum: "#0b0e17",
  warmIvory: "#f5efe2",
  sacredGold: "#dfc07b",
  luminousGold: "#fff4d2",
  softWhiteLight: "#fffdf7",
  subtleSilver: "#c8d0de",
  deepAmber: "#9c732b",
  translucentVeil: "rgba(4, 5, 9, 0.78)",
} as const;

export const LIVING_LIGHT_TYPOGRAPHY = {
  displayFamily:
    'var(--font-cinzel), "Cinzel", "Cormorant Garamond", "Palatino Linotype", Georgia, serif',
  editorialFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
  interfaceFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  telemetryFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  scale: {
    monument: "clamp(2.25rem, 6.2vw, 5.4rem)",
    chapterHeading: "clamp(1.75rem, 3.8vw, 3.1rem)",
    sanctumTitle: "clamp(1.35rem, 2.2vw, 1.95rem)",
    editorialLead: "clamp(0.95rem, 1.35vw, 1.18rem)",
    sacredKicker: "clamp(0.65rem, 0.9vw, 0.78rem)",
  },
} as const;

export const LIVING_LIGHT_MOTION = {
  durationsMs: {
    instant: 0,
    micro: 180,
    scene: 520,
    entrance: 2200,
  },
  easings: {
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
  capabilityTiers: ["webgl2-full", "canvas-2d", "reduced-motion"] as const,
} as const;

export const SACRED_VISUAL_COVENANT = {
  direction: "SACRED MINIMALISM × CINEMATIC IMMERSION × INFINITE LIGHT",
  depictionOfAllahForbidden: true,
  humanFacesForbidden: true,
  cartoonAndAnimeForbidden: true,
  decorativeSacredTextTexturesForbidden: true,
  requiresReducedMotionBypass: true,
  minimumInteractiveTargetPx: 44,
  allowedMotifs: [
    "abstract cosmic light",
    "celestial spherical geometry",
    "monumental symmetrical archways",
    "obsidian reflective basins",
    "girih star tessellations",
  ],
} as const;
