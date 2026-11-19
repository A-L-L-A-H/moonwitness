import { describe, expect, it } from "vitest";
import {
  auditAllDnaWorlds,
  auditAllDnaWorldsAndModes,
  auditAllSkinPalettesAndModes,
} from "./contrast";

describe("WCAG 2.1 token contrast: 7 DNA worlds and 9 skin surface palettes in dark/light modes", () => {

  it("uses separate 4.5:1 text and 3:1 focus thresholds across the documented palette matrix", () => {
    const dnaResults = auditAllDnaWorldsAndModes();
    const skinResults = auditAllSkinPalettesAndModes();

    expect(dnaResults).toHaveLength(14); // 7 DNA worlds × dark/light
    expect(skinResults).toHaveLength(18); // 9 surface palettes × dark/light

    for (const result of [...dnaResults, ...skinResults]) {
      const textPairs = result.pairs.filter(
        (pair) => pair.pairName.startsWith("text") ||
          pair.pairName.startsWith("mutedText") ||
          pair.pairName.startsWith("accentForeground") ||
          pair.pairName.startsWith("success"),
      );
      const focusPairs = result.pairs.filter((pair) => pair.pairName.startsWith("focus"));

      expect(textPairs.length, `${result.dnaId} must include text contrast pairs`).toBeGreaterThan(0);
      expect(
        textPairs.every((pair) => pair.minimumRequired === 4.5),
        `${result.dnaId} text pairs must use 4.5:1`,
      ).toBe(true);
      expect(focusPairs, `${result.dnaId} must include both focus pair checks`).toHaveLength(2);
      expect(
        focusPairs.every((pair) => pair.minimumRequired === 3.0),
        `${result.dnaId} focus pairs must use 3:1`,
      ).toBe(true);
    }
  });

  it("keeps foreground, accent, muted, and focus pairs compliant", () => {
    const darkResults = auditAllDnaWorlds();
    const allResults = auditAllDnaWorldsAndModes();
    const skinResults = auditAllSkinPalettesAndModes();
    expect(darkResults).toHaveLength(7);
    expect(allResults).toHaveLength(14);
    expect(skinResults).toHaveLength(18);
    for (const result of [...allResults, ...skinResults]) {
      const failed = result.pairs.filter((pair) => !pair.passed);
      expect(
        failed,
        `${result.dnaId} (${result.dnaName}) failed WCAG AA contrast: ${JSON.stringify(failed)}`,
      ).toEqual([]);
      expect(result.passed).toBe(true);
    }
  });
});
