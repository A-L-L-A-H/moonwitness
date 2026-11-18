import { describe, expect, it } from "vitest";
import { auditAllDnaWorlds, auditAllDnaWorldsAndModes } from "./contrast";

describe("WCAG 2.1 AA Contrast Gate across all 7 Master DNA identities (dark + light)", () => {
  it("keeps foreground, accent, muted, and focus pairs compliant", () => {
    const darkResults = auditAllDnaWorlds();
    const allResults = auditAllDnaWorldsAndModes();
    expect(darkResults).toHaveLength(7);
    expect(allResults).toHaveLength(14);
    for (const result of allResults) {
      const failed = result.pairs.filter((pair) => !pair.passed);
      expect(
        failed,
        `${result.dnaId} (${result.dnaName}) failed WCAG AA contrast: ${JSON.stringify(failed)}`,
      ).toEqual([]);
      expect(result.passed).toBe(true);
    }
  });
});
