import { describe, expect, it } from "vitest";
import { SKIN_SURFACE_PALETTES } from "../dna/canonical";
import { MASTER_DNA_IDS } from "../skin/dna-worlds";
import {
  auditAllDnaWorlds,
  auditAllDnaWorldsAndModes,
  auditAllSkinPalettesAndModes,
} from "./contrast";

/**
 * Deterministic semantic-token matrix:
 * - 7 registered DNA worlds in dark mode and all 7 again in light mode.
 * - Every registered skin palette in dark and light mode.
 * - Text pairs require 4.5:1; focus/non-text indicators require 3:1.
 *
 * These are token-pair regression checks, not a complete rendered-page WCAG audit.
 */
describe("semantic token contrast matrix (token-level regression checks)", () => {
  const darkResults = auditAllDnaWorlds();
  const dnaResults = auditAllDnaWorldsAndModes();
  const skinResults = auditAllSkinPalettesAndModes();
  const allResults = [...dnaResults, ...skinResults];

  it("covers every registered DNA world in dark and light mode", () => {
    const expectedIds = [
      ...MASTER_DNA_IDS,
      ...MASTER_DNA_IDS.map((id) => `${id}:light`),
    ].sort();

    expect(darkResults.map((result) => result.dnaId).sort()).toEqual(
      [...MASTER_DNA_IDS].sort(),
    );
    expect(dnaResults.map((result) => result.dnaId).sort()).toEqual(expectedIds);
  });

  it("covers every registered skin palette in dark and light mode", () => {
    const expectedIds = Object.keys(SKIN_SURFACE_PALETTES)
      .flatMap((skinName) => [
        `skin:${skinName}:dark`,
        `skin:${skinName}:light`,
      ])
      .sort();

    expect(skinResults.map((result) => result.dnaId).sort()).toEqual(expectedIds);
  });

  it("uses separate text and focus/non-text contrast thresholds", () => {
    for (const result of allResults) {
      const focusPairs = result.pairs.filter((pair) => pair.pairName.startsWith("focus "));
      const textPairs = result.pairs.filter((pair) => !pair.pairName.startsWith("focus "));

      expect(
        focusPairs,
        `${result.dnaId} must expose both focus indicator pairs`,
      ).toHaveLength(2);
      expect(
        focusPairs.every((pair) => pair.minimumRequired === 3.0),
        `${result.dnaId} focus/non-text pairs must use the 3:1 threshold`,
      ).toBe(true);
      expect(
        textPairs.every((pair) => pair.minimumRequired === 4.5),
        `${result.dnaId} text pairs must use the 4.5:1 threshold`,
      ).toBe(true);
    }
  });

  it("keeps every resolved semantic pair above its documented threshold", () => {
    for (const result of allResults) {
      const failed = result.pairs.filter((pair) => !pair.passed);
      const failureMessage =
        `${result.dnaId} (${result.dnaName}) failed semantic token contrast`;
      expect(failed, failureMessage).toEqual([]);
      expect(result.passed, `${result.dnaId} (${result.dnaName}) must pass`).toBe(true);
    }
  });
});
