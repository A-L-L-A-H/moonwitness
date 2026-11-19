"use client";

import React, { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { SkinName } from "./compositions";
import {
  canonicalTokensToCssVariables,
  resolveCanonicalTokens,
  type CanonicalDensity,
  type CanonicalThemeMode,
} from "../dna/canonical";
import { IMPERIUM_LUMEN_TOKENS, MASTER_DNA_PALETTES } from "./imperium-tokens";

export type MasterDnaId =
  | "01-imperium-lumen"
  | "02-lunar-chronicles"
  | "03-rocksoul"
  | "04-nexus-paradox"
  | "05-riot-anarchy"
  | "06-mycelium"
  | "09-simpul-nusantara";

export interface DnaWorldPalette {
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

export interface MasterDnaWorldSpec {
  readonly id: MasterDnaId;
  readonly numeral: string;
  readonly name: string;
  readonly metaphor: string;
  readonly primaryIdentity: string;
  readonly shapeLanguage: string;
  readonly motionGrammar: string;
  readonly mappedSkinPreset: SkinName;
  readonly palette: DnaWorldPalette;
  readonly cardClass: string;
  readonly buttonClass: string;
  readonly badgeClass: string;
  readonly inputClass: string;
}

export const MASTER_DNA_IDS: readonly MasterDnaId[] = [
  "01-imperium-lumen",
  "02-lunar-chronicles",
  "03-rocksoul",
  "04-nexus-paradox",
  "05-riot-anarchy",
  "06-mycelium",
  "09-simpul-nusantara",
] as const;

export function isValidDnaId(value: string): value is MasterDnaId {
  return value in MASTER_DNA_WORLDS;
}

export const MASTER_DNA_WORLDS: Readonly<Record<MasterDnaId, MasterDnaWorldSpec>> = {
  "01-imperium-lumen": {
    id: "01-imperium-lumen",
    numeral: "01",
    name: "IMPERIUM LUMEN",
    metaphor: "Illustrated universe of electric light, graphic editorial worlds, and sacred orientation",
    primaryIdentity: "A-L-L-A-H.COM / Empire of the Light",
    shapeLanguage:
      "Graphic editorial frames, bold ink borders, electric yellow & magenta offset accents, clear reading planes",
    motionGrammar: "Crisp transform/opacity entrance · tactile hover lift · static reduced-motion parity",
    mappedSkinPreset: "default",
    palette: MASTER_DNA_PALETTES["01-imperium-lumen"],
    cardClass:
      "rounded-none border-2 border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)] shadow-[4px_4px_0_var(--dna-accent-secondary)]",
    buttonClass:
      "rounded-none border-2 border-[var(--dna-canvas)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] font-bold tracking-[0.08em] uppercase shadow-[4px_4px_0_var(--dna-accent-secondary)]",
    badgeClass:
      "rounded-none border border-[var(--dna-border)] bg-[var(--dna-surface-elevated)] text-[var(--dna-accent)] font-mono tracking-wider",
    inputClass:
      "rounded-none border border-[var(--dna-border)]/60 bg-[var(--dna-canvas)] text-[var(--dna-text)] placeholder:text-[var(--dna-muted)]/75",
  },
  "02-lunar-chronicles": {
    id: "02-lunar-chronicles",
    numeral: "02",
    name: "LUNAR CHRONICLES",
    metaphor: "Living lunar observatory, celestial chronicle, and universe archive",
    primaryIdentity: "MoonWitness Universe & ID",
    shapeLanguage: "Observatory radii, ruled archival ledgers, polar orbital rings",
    motionGrammar: "Steady astronomical drift · tabular clarity",
    mappedSkinPreset: "transmission",
    palette: MASTER_DNA_PALETTES["02-lunar-chronicles"],
    cardClass: "rounded-lg border border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)]",
    buttonClass:
      "rounded-md border border-[var(--dna-focus)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] font-semibold tracking-wide",
    badgeClass:
      "rounded-full border border-[var(--dna-accent)]/60 bg-[var(--dna-surface-elevated)] text-[var(--dna-focus)] font-mono",
    inputClass:
      "rounded-md border border-[var(--dna-border)] bg-[var(--dna-canvas)] text-[var(--dna-text)] placeholder:text-[var(--dna-muted)]/75",
  },
  "03-rocksoul": {
    id: "03-rocksoul",
    numeral: "03",
    name: "ROCKSOUL",
    metaphor: "Silent cinematic storyteller and alternative-music journey (NOISE x SILENCE)",
    primaryIdentity: "ROCKSOUL DX Signature Narrative",
    shapeLanguage: "Widescreen letterbox slabs, guitar-fret hairlines, warm tungsten highlight",
    motionGrammar: "Acoustic resonance fade · zero noisy bounce",
    mappedSkinPreset: "editorial",
    palette: MASTER_DNA_PALETTES["03-rocksoul"],
    cardClass: "rounded-sm border border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)]",
    buttonClass:
      "rounded-sm border border-[var(--dna-focus)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] font-bold uppercase tracking-wider",
    badgeClass:
      "rounded-sm border border-[var(--dna-accent)]/60 bg-[var(--dna-surface-elevated)] text-[var(--dna-focus)] font-mono",
    inputClass:
      "rounded-sm border border-[var(--dna-border)] bg-[var(--dna-canvas)] text-[var(--dna-text)] placeholder:text-[var(--dna-muted)]/75",
  },
  "04-nexus-paradox": {
    id: "04-nexus-paradox",
    numeral: "04",
    name: "NEXUS PARADOX",
    metaphor: "Interface from another reality; diegetic spatial technology",
    primaryIdentity: "Command Center / Control Plane",
    shapeLanguage: "Notched diagnostic corners, monochrome vector reticules, split HUD dividers",
    motionGrammar: "Crisp telemetry snap · deterministic state transitions",
    mappedSkinPreset: "technical",
    palette: MASTER_DNA_PALETTES["04-nexus-paradox"],
    cardClass: "rounded-none border border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)]",
    buttonClass:
      "rounded-none border border-[var(--dna-focus)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] font-mono font-bold uppercase tracking-widest",
    badgeClass:
      "rounded-none border border-[var(--dna-accent)]/65 bg-[var(--dna-surface-elevated)] text-[var(--dna-focus)] font-mono",
    inputClass:
      "rounded-none border border-[var(--dna-border)] bg-[var(--dna-canvas)] text-[var(--dna-text)] font-mono placeholder:text-[var(--dna-muted)]/75",
  },
  "05-riot-anarchy": {
    id: "05-riot-anarchy",
    numeral: "05",
    name: "RIOT ANARCHY",
    metaphor: "Underground wall of manga, punk, xerox, and anti-design",
    primaryIdentity: "MoonWitness Zine / RIOT Intelligence",
    shapeLanguage: "Hard ink strokes, hard offset shadows, torn-sticker highlights, high contrast",
    motionGrammar: "Snap cut · print punch · reduced-motion static ink",
    mappedSkinPreset: "riot",
    palette: MASTER_DNA_PALETTES["05-riot-anarchy"],
    cardClass:
      "rounded-md border-2 border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)] shadow-[4px_4px_0_var(--dna-canvas)]",
    buttonClass:
      "rounded-md border-2 border-[var(--dna-canvas)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] font-bold uppercase tracking-wider shadow-[3px_3px_0_var(--dna-focus)]",
    badgeClass:
      "rounded-sm border border-[var(--dna-focus)] bg-[var(--dna-surface-elevated)] text-[var(--dna-focus)] font-mono font-bold",
    inputClass:
      "rounded-md border-2 border-[var(--dna-border)] bg-[var(--dna-canvas)] text-[var(--dna-text)] placeholder:text-[var(--dna-muted)]/75",
  },
  "06-mycelium": {
    id: "06-mycelium",
    numeral: "06",
    name: "MYCELIUM",
    metaphor: "Digital ecosystem behaving like a living organism",
    primaryIdentity: "World Observatory & Memory Network",
    shapeLanguage: "Organic pill nodes, bioluminescent hairline filaments, soft membrane layers",
    motionGrammar: "Gentle breathing pulse (pauses on reduced motion)",
    mappedSkinPreset: "archive",
    palette: MASTER_DNA_PALETTES["06-mycelium"],
    cardClass: "rounded-2xl border border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)]",
    buttonClass:
      "rounded-full border border-[var(--dna-focus)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] font-semibold tracking-wide",
    badgeClass:
      "rounded-full border border-[var(--dna-accent)]/60 bg-[var(--dna-surface-elevated)] text-[var(--dna-focus)] font-mono",
    inputClass:
      "rounded-xl border border-[var(--dna-border)] bg-[var(--dna-canvas)] text-[var(--dna-text)] placeholder:text-[var(--dna-muted)]/75",
  },
  "09-simpul-nusantara": {
    id: "09-simpul-nusantara",
    numeral: "07",
    name: "SIMPUL NUSANTARA",
    metaphor: "Service atlas showing abstract neighborhood network routes",
    primaryIdentity: "E-ISP Storefront & Nusantara Operations",
    shapeLanguage: "Route-line connectors, archipelago station cards, warm copper signal markers",
    motionGrammar: "Waypoint hops · clean signal transitions",
    mappedSkinPreset: "technical",
    palette: MASTER_DNA_PALETTES["09-simpul-nusantara"],
    cardClass: "rounded-xl border border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)]",
    buttonClass:
      "rounded-lg border border-[var(--dna-focus)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] font-semibold tracking-wide",
    badgeClass:
      "rounded-md border border-[var(--dna-accent)]/60 bg-[var(--dna-surface-elevated)] text-[var(--dna-focus)] font-mono",
    inputClass:
      "rounded-lg border border-[var(--dna-border)] bg-[var(--dna-canvas)] text-[var(--dna-text)] placeholder:text-[var(--dna-muted)]/75",
  },
};

export function getDnaWorld(id: MasterDnaId | string): MasterDnaWorldSpec {
  if (id in MASTER_DNA_WORLDS) {
    return MASTER_DNA_WORLDS[id as MasterDnaId];
  }
  return MASTER_DNA_WORLDS["02-lunar-chronicles"];
}

export function listDnaWorlds(): readonly MasterDnaWorldSpec[] {
  return MASTER_DNA_IDS.map((id) => MASTER_DNA_WORLDS[id]);
}

export function dnaWorldCssVariables(world: MasterDnaWorldSpec): CSSProperties {
  return {
    "--dna-canvas": world.palette.canvas,
    "--dna-surface": world.palette.surface,
    "--dna-surface-elevated": world.palette.surfaceElevated,
    "--dna-text": world.palette.text,
    "--dna-muted": world.palette.mutedText,
    "--dna-border": world.palette.border,
    "--dna-accent": world.palette.accent,
    "--dna-accent-secondary": world.palette.accentSecondary ?? world.palette.accent,
    "--dna-accent-fg": world.palette.accentForeground,
    "--dna-focus": world.palette.focus,
    "--dna-success": world.palette.success ?? IMPERIUM_LUMEN_TOKENS.semantic.success,
    "--dna-warning": world.palette.warning ?? world.palette.accent,
    "--dna-danger": world.palette.danger ?? IMPERIUM_LUMEN_TOKENS.semantic.danger,
  } as CSSProperties;
}

const DnaWorldContext = createContext<MasterDnaWorldSpec | null>(null);

export function useDnaWorld(): MasterDnaWorldSpec {
  return useContext(DnaWorldContext) ?? MASTER_DNA_WORLDS["02-lunar-chronicles"];
}

export function useOptionalDnaWorld(): MasterDnaWorldSpec | null {
  return useContext(DnaWorldContext);
}

export interface SkinScopeProps {
  dnaId: MasterDnaId;
  skin?: SkinName | undefined;
  mode?: CanonicalThemeMode | undefined;
  density?: CanonicalDensity | undefined;
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function SkinScope({
  dnaId,
  skin,
  mode = "dark",
  density = "comfortable",
  children,
  className,
  style,
}: SkinScopeProps) {
  const world = getDnaWorld(dnaId);
  const resolvedSkin = skin ?? world.mappedSkinPreset;
  const resolved = resolveCanonicalTokens({
    dnaId: world.id,
    skin: resolvedSkin,
    mode,
    density,
  });
  const canonicalVars = canonicalTokensToCssVariables(resolved);
  const vars = dnaWorldCssVariables(world);

  return (
    <DnaWorldContext.Provider value={world}>
      <div
        data-dna={world.id}
        data-skin={resolvedSkin}
        data-skin-preset={world.mappedSkinPreset}
        data-theme={resolved.mode}
        data-density={resolved.density}
        className={className}
        style={{
          ...vars,
          ...(canonicalVars as CSSProperties),
          backgroundColor: resolved.semantic.canvas,
          color: resolved.semantic.foreground,
          ...style,
        }}
      >
        {children}
      </div>
    </DnaWorldContext.Provider>
  );
}

export interface SkinRootProps {
  dnaId: MasterDnaId;
  skin?: SkinName | undefined;
  mode?: CanonicalThemeMode | undefined;
  density?: CanonicalDensity | undefined;
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function SkinRoot({
  dnaId,
  skin,
  mode,
  density,
  children,
  className,
  style,
}: SkinRootProps) {
  return (
    <SkinScope dnaId={dnaId} skin={skin} mode={mode} density={density} className={className} style={style}>
      {children}
    </SkinScope>
  );
}
