import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const surfaces = [
  "../src/components/command-center/hero.tsx",
  "../src/components/command-center/ideas.tsx",
  "../src/components/command-center/status.tsx",
  "../../../packages/ui/src/composites/world-map.tsx",
];

describe("console artwork scrim contract", () => {
  for (const surface of surfaces) {
    it(`${surface} follows the ink token instead of a fixed dark palette`, () => {
      const source = readFileSync(new URL(surface, import.meta.url), "utf8");
      expect(source).not.toMatch(/rgba\(7,\s*7,\s*12,/);
      expect(source).toMatch(/color-mix\(in_srgb,var\(--ink\)|ScenePanel|AtlasStage/);
    });
  }
});
