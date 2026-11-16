"use client";

import React, { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { SkinName } from "./compositions";

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
  readonly accentForeground: string;
  readonly focus: string;
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

export const MASTER_DNA_WORLDS: Readonly<Record<MasterDnaId, MasterDnaWorldSpec>> = {
  "01-imperium-lumen": {
    id: "01-imperium-lumen",
    numeral: "01",
    name: "IMPERIUM LUMEN",
    metaphor: "Monumental empire of light and impossible architecture",
    primaryIdentity: "A-L-L-A-H.COM / Empire of the Light",
    shapeLanguage: "Sharp chamfered bevels, 1px hairline brass borders, bilateral meridian symmetry",
    motionGrammar: "Luminous architectural reveal · dignified horizon parallax",
    mappedSkinPreset: "default",
    palette: {
      canvas: "#040509",
      surface: "#080b14",
      surfaceElevated: "#0e1322",
      text: "#f5efe2",
      mutedText: "#d8ceba",
      border: "#d6b46c",
      accent: "#d6b46c",
      accentForeground: "#040509",
      focus: "#fff4d2",
    },
    cardClass: "rounded-none border border-[#d6b46c]/45 bg-[#080b14] text-[#f5efe2]",
    buttonClass:
      "rounded-none border border-[#e6c987] bg-[#d6b46c] text-[#040509] font-semibold tracking-[0.14em] uppercase",
    badgeClass:
      "rounded-none border border-[#d6b46c]/55 bg-[#0e1322] text-[#f5dfa6] font-mono tracking-wider",
    inputClass:
      "rounded-none border border-[#d6b46c]/45 bg-[#040509] text-[#f5efe2] placeholder:text-[#d8ceba]/75",
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
    palette: {
      canvas: "#0b0d14",
      surface: "#121722",
      surfaceElevated: "#1a2233",
      text: "#edf2f9",
      mutedText: "#bac7dc",
      border: "#4e6d96",
      accent: "#5ab8ff",
      accentForeground: "#060a11",
      focus: "#bae0ff",
    },
    cardClass: "rounded-lg border border-[#4e6d96] bg-[#121722] text-[#edf2f9]",
    buttonClass:
      "rounded-md border border-[#8cd0ff] bg-[#5ab8ff] text-[#060a11] font-semibold tracking-wide",
    badgeClass:
      "rounded-full border border-[#5ab8ff]/60 bg-[#1a2233] text-[#bae0ff] font-mono",
    inputClass:
      "rounded-md border border-[#4e6d96] bg-[#0b0d14] text-[#edf2f9] placeholder:text-[#bac7dc]/75",
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
    palette: {
      canvas: "#100f14",
      surface: "#1a1821",
      surfaceElevated: "#24212d",
      text: "#f3efe6",
      mutedText: "#cac3b4",
      border: "#78664e",
      accent: "#f5b027",
      accentForeground: "#100f14",
      focus: "#ffe08a",
    },
    cardClass: "rounded-sm border border-[#78664e] bg-[#1a1821] text-[#f3efe6]",
    buttonClass:
      "rounded-sm border border-[#ffd066] bg-[#f5b027] text-[#100f14] font-bold uppercase tracking-wider",
    badgeClass:
      "rounded-sm border border-[#f5b027]/60 bg-[#24212d] text-[#ffe08a] font-mono",
    inputClass:
      "rounded-sm border border-[#78664e] bg-[#100f14] text-[#f3efe6] placeholder:text-[#cac3b4]/75",
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
    palette: {
      canvas: "#060a10",
      surface: "#0b121d",
      surfaceElevated: "#111c2d",
      text: "#e4f6fa",
      mutedText: "#a4d2df",
      border: "#267c96",
      accent: "#00e5ff",
      accentForeground: "#041016",
      focus: "#8cf4ff",
    },
    cardClass: "rounded-none border border-[#267c96] bg-[#0b121d] text-[#e4f6fa]",
    buttonClass:
      "rounded-none border border-[#8cf4ff] bg-[#00e5ff] text-[#041016] font-mono font-bold uppercase tracking-widest",
    badgeClass:
      "rounded-none border border-[#00e5ff]/65 bg-[#111c2d] text-[#8cf4ff] font-mono",
    inputClass:
      "rounded-none border border-[#267c96] bg-[#060a10] text-[#e4f6fa] font-mono placeholder:text-[#a4d2df]/75",
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
    palette: {
      canvas: "#0b0b10",
      surface: "#14141c",
      surfaceElevated: "#1e1e2b",
      text: "#f4eede",
      mutedText: "#cbc4b4",
      border: "#ff5c96",
      accent: "#ff5c96",
      accentForeground: "#0b0b10",
      focus: "#ffd21f",
    },
    cardClass:
      "rounded-md border-2 border-[#ff5c96] bg-[#14141c] text-[#f4eede] shadow-[4px_4px_0_#000000]",
    buttonClass:
      "rounded-md border-2 border-[#0b0b10] bg-[#ff5c96] text-[#0b0b10] font-bold uppercase tracking-wider shadow-[3px_3px_0_#ffd21f]",
    badgeClass:
      "rounded-sm border border-[#ffd21f] bg-[#1e1e2b] text-[#ffd21f] font-mono font-bold",
    inputClass:
      "rounded-md border-2 border-[#ff5c96] bg-[#0b0b10] text-[#f4eede] placeholder:text-[#cbc4b4]/75",
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
    palette: {
      canvas: "#080d0a",
      surface: "#101a14",
      surfaceElevated: "#17251d",
      text: "#e6f4eb",
      mutedText: "#a8ceb6",
      border: "#328455",
      accent: "#3ddc84",
      accentForeground: "#06140c",
      focus: "#a7f3c9",
    },
    cardClass: "rounded-2xl border border-[#328455] bg-[#101a14] text-[#e6f4eb]",
    buttonClass:
      "rounded-full border border-[#a7f3c9] bg-[#3ddc84] text-[#06140c] font-semibold tracking-wide",
    badgeClass:
      "rounded-full border border-[#3ddc84]/60 bg-[#17251d] text-[#a7f3c9] font-mono",
    inputClass:
      "rounded-xl border border-[#328455] bg-[#080d0a] text-[#e6f4eb] placeholder:text-[#a8ceb6]/75",
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
    palette: {
      canvas: "#0b1220",
      surface: "#121c31",
      surfaceElevated: "#192742",
      text: "#f8f1e4",
      mutedText: "#c9bead",
      border: "#b96d24",
      accent: "#f59e0b",
      accentForeground: "#0b1220",
      focus: "#fde68a",
    },
    cardClass: "rounded-xl border border-[#b96d24] bg-[#121c31] text-[#f8f1e4]",
    buttonClass:
      "rounded-lg border border-[#fde68a] bg-[#f59e0b] text-[#0b1220] font-semibold tracking-wide",
    badgeClass:
      "rounded-md border border-[#f59e0b]/60 bg-[#192742] text-[#fde68a] font-mono",
    inputClass:
      "rounded-lg border border-[#b96d24] bg-[#0b1220] text-[#f8f1e4] placeholder:text-[#c9bead]/75",
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
    "--dna-accent-fg": world.palette.accentForeground,
    "--dna-focus": world.palette.focus,
  } as CSSProperties;
}

const DnaWorldContext = createContext<MasterDnaWorldSpec>(
  MASTER_DNA_WORLDS["02-lunar-chronicles"],
);

export function useDnaWorld(): MasterDnaWorldSpec {
  return useContext(DnaWorldContext);
}

export interface SkinScopeProps {
  dnaId: MasterDnaId;
  children: ReactNode;
  className?: string;
}

export function SkinScope({ dnaId, children, className }: SkinScopeProps) {
  const world = getDnaWorld(dnaId);
  const vars = dnaWorldCssVariables(world);

  return (
    <DnaWorldContext.Provider value={world}>
      <div
        data-dna={world.id}
        data-skin-preset={world.mappedSkinPreset}
        className={className}
        style={{
          ...vars,
          backgroundColor: world.palette.canvas,
          color: world.palette.text,
        }}
      >
        {children}
      </div>
    </DnaWorldContext.Provider>
  );
}

export interface SkinRootProps {
  dnaId: MasterDnaId;
  children: ReactNode;
  className?: string;
}

export function SkinRoot({ dnaId, children, className }: SkinRootProps) {
  return (
    <SkinScope dnaId={dnaId} className={className}>
      {children}
    </SkinScope>
  );
}
