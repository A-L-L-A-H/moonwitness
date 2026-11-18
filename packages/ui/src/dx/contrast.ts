import {
  MASTER_DNA_LIGHT_PALETTES,
  SKIN_SURFACE_PALETTES,
  type CanonicalDnaId,
} from "../dna/canonical";
import { listDnaWorlds, type DnaWorldPalette, type MasterDnaWorldSpec } from "../skin/dna-worlds";

export interface ContrastPairResult {
  readonly pairName: string;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly minimumRequired: number;
  readonly passed: boolean;
}

export interface ContrastAuditResult {
  readonly dnaId: string;
  readonly dnaName: string;
  readonly passed: boolean;
  readonly pairs: readonly ContrastPairResult[];
}

export function hexToRgb(hex: string): readonly [number, number, number] {
  const clean = hex.replace(/^#/, "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  const num = Number.parseInt(normalized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function measureContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function auditPaletteContrast(
  dnaId: string,
  dnaName: string,
  p: DnaWorldPalette,
): ContrastAuditResult {
  const checks: readonly (readonly [string, string, string, number])[] = [
    ["text on canvas", p.text, p.canvas, 4.5],
    ["text on surface", p.text, p.surface, 4.5],
    ["text on surfaceElevated", p.text, p.surfaceElevated, 4.5],
    ["mutedText on surface", p.mutedText, p.surface, 4.5],
    ["mutedText on surfaceElevated", p.mutedText, p.surfaceElevated, 4.5],
    ...(p.success
      ? ([
          ["success on surface", p.success, p.surface, 4.5],
          ["success on surfaceElevated", p.success, p.surfaceElevated, 4.5],
        ] as const)
      : []),
    ["accentForeground on accent", p.accentForeground, p.accent, 4.5],
    ["focus on canvas", p.focus, p.canvas, 3.0],
    ["focus on surface", p.focus, p.surface, 3.0],
  ];

  const pairs: ContrastPairResult[] = checks.map(([pairName, foreground, background, minReq]) => {
    const ratio = measureContrastRatio(foreground, background);
    return {
      pairName,
      foreground,
      background,
      ratio,
      minimumRequired: minReq,
      passed: ratio >= minReq,
    };
  });

  return {
    dnaId,
    dnaName,
    passed: pairs.every((pair) => pair.passed),
    pairs,
  };
}

export function auditDnaContrast(world: MasterDnaWorldSpec): ContrastAuditResult {
  return auditPaletteContrast(world.id, world.name, world.palette);
}

export function auditAllDnaWorlds(): readonly ContrastAuditResult[] {
  return listDnaWorlds().map(auditDnaContrast);
}

export function auditAllDnaWorldsAndModes(): readonly ContrastAuditResult[] {
  const dark = auditAllDnaWorlds();
  const light = listDnaWorlds().map((world) =>
    auditPaletteContrast(
      `${world.id}:light`,
      `${world.name} (Light)`,
      MASTER_DNA_LIGHT_PALETTES[world.id as CanonicalDnaId],
    ),
  );
  return [...dark, ...light];
}

export function auditAllSkinPalettesAndModes(): readonly ContrastAuditResult[] {
  const results: ContrastAuditResult[] = [];
  for (const [skinName, modes] of Object.entries(SKIN_SURFACE_PALETTES)) {
    results.push(auditPaletteContrast(`skin:${skinName}:dark`, `${skinName} (Dark)`, modes.dark));
    results.push(
      auditPaletteContrast(`skin:${skinName}:light`, `${skinName} (Light)`, modes.light),
    );
  }
  return results;
}
