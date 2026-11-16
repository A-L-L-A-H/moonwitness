import { describe, expect, it } from "vitest";
import { auditAllDnaWorlds } from "./contrast";

describe("7 Master DNA WCAG Contrast Gate (ui:contrast)", () => {
  it("passes WCAG 2.1 contrast thresholds for every pair across all 7 Master DNA Worlds", () => {
    const audits = auditAllDnaWorlds();
    expect(audits).toHaveLength(7);

    for (const audit of audits) {
      for (const pair of audit.pairs) {
        expect(
          pair.passed,
          `${audit.dnaId} [${pair.pairName}] ${pair.foreground} on ${pair.background} measured ${pair.ratio}:1 (< ${pair.minimumRequired}:1)`,
        ).toBe(true);
      }
    }
  });
});
