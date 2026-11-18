import { describe, expect, it } from "vitest";
import {
  auditAllDnaWorlds,
  auditAllDnaWorldsAndModes,
  auditAllSkinPalettesAndModes,
} from "./contrast";

describe("WCAG 2.1 AA Contrast Gate across all 7 Master DNA identities & 10 Skin palettes (dark + light)", () => {
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
