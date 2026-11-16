import { describe, expect, it } from "vitest";
import {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  dnaWorldCssVariables,
  getDnaWorld,
  listDnaWorlds,
} from "./dna-worlds";

describe("7 Master DNA Worlds Registry", () => {
  it("exposes all 7 canonical Master DNA IDs", () => {
    expect(MASTER_DNA_IDS).toEqual([
      "01-imperium-lumen",
      "02-lunar-chronicles",
      "03-rocksoul",
      "04-nexus-paradox",
      "05-riot-anarchy",
      "06-mycelium",
      "09-simpul-nusantara",
    ]);
    expect(listDnaWorlds()).toHaveLength(7);
  });

  it("falls back safely to 02-lunar-chronicles on unknown dna id", () => {
    const fallback = getDnaWorld("non-existent-world");
    expect(fallback.id).toBe("02-lunar-chronicles");
  });

  it("generates complete semantic CSS custom properties per world", () => {
    for (const id of MASTER_DNA_IDS) {
      const world = MASTER_DNA_WORLDS[id];
      const vars = dnaWorldCssVariables(world) as Record<string, string>;
      expect(vars["--dna-canvas"]).toBe(world.palette.canvas);
      expect(vars["--dna-text"]).toBe(world.palette.text);
      expect(vars["--dna-accent"]).toBe(world.palette.accent);
      expect(vars["--dna-focus"]).toBe(world.palette.focus);
    }
  });
});
