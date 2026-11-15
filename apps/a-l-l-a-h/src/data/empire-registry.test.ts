import { describe, expect, it } from "vitest";
import {
  LIVING_LIGHT_MOTION,
  LIVING_LIGHT_PALETTE,
  LIVING_LIGHT_TYPOGRAPHY,
  SACRED_VISUAL_COVENANT,
} from "./design-tokens";
import {
  CENTER_100_STEWARDSHIP_CLUSTERS,
  CODEX_SEARCH_INDEX,
  CROSS_REPO_TOPOLOGY_ATLAS,
  DX_MANGA_FOUR_PANELS,
  EIGHT_STORY_ERAS,
  EPISTEMIC_FEDERATION_DOMAINS,
  FIFTEEN_STORY_EPISODES,
  FOUR_ENTRY_DOORS,
  GOD_PROMISE_THREE_TRACKS,
  ORIGINAL_CREW_ARCHETYPES,
  OWNER_FOUR_LINE_MANIFESTO,
  OX_DX_SEVEN_ZONES,
  PRIME_CODE_AXIOMS,
  SEVEN_STEP_PROMISE,
  SIXTEEN_STAGE_LOOP,
  SRGBL_V8_STAGES,
  SWING_SWING_KEY_ROTATIONS,
  SYAFAAT_BASE_STATES,
  SYSTEM_CONCEPTS_14,
  UNIVERSE_FOUR_LENSES,
  WINGS_TEN_ARRAY,
} from "./empire-canon-codex";
import {
  COVENANT_PILLARS,
  DOCK_TELEMETRY_NODES,
  NAVIGATION_TABS,
  SIDRA_KNOWLEDGE_AXIOMS,
  WORLD_DOMAINS,
} from "./empire-registry";

describe("Empire of the Light Registry", () => {
  it("defines the five primary navigation tabs including THE CODEX", () => {
    expect(NAVIGATION_TABS.map((tab) => tab.label)).toEqual([
      "THE GATE",
      "THE WORLDS",
      "THE CODEX",
      "THE DOCK",
      "ABOUT",
    ]);
  });

  it("defines all five worlds with exact reference titles and taglines", () => {
    expect(WORLD_DOMAINS.map((world) => ({ name: world.name, tagline: world.tagline }))).toEqual([
      { name: "MOONWITNESS", tagline: "Stories · Knowledge · Archive" },
      { name: "ARSY", tagline: "Radio · Technology · Infrastructure" },
      { name: "QALAM", tagline: "Create · Write · Share" },
      { name: "SIDRA", tagline: "Connect · Explore · Learn" },
      { name: "ROCKSOUL DX", tagline: "Play · Create · Dream" },
    ]);
  });

  it("maintains dock telemetry coherence across all five world gateways", () => {
    expect(DOCK_TELEMETRY_NODES).toHaveLength(5);
    const worldIds = new Set(WORLD_DOMAINS.map((world) => world.id));
    for (const node of DOCK_TELEMETRY_NODES) {
      expect(worldIds.has(node.worldId)).toBe(true);
      expect(node.integrityPercent).toBeGreaterThanOrEqual(99.9);
    }
  });

  it("connects Sidra knowledge axioms in a valid symmetric graph", () => {
    const axiomIds = new Set(SIDRA_KNOWLEDGE_AXIOMS.map((axiom) => axiom.id));
    for (const axiom of SIDRA_KNOWLEDGE_AXIOMS) {
      expect(axiom.connectedIds.length).toBeGreaterThan(0);
      for (const targetId of axiom.connectedIds) {
        expect(axiomIds.has(targetId)).toBe(true);
      }
    }
  });

  it("encodes the three covenant pillars matching the hero motto", () => {
    expect(COVENANT_PILLARS.map((pillar) => pillar.heading)).toEqual([
      "A WORLD TO WITNESS",
      "A WORLD TO LEARN",
      "A WORLD TO BUILD",
    ]);
  });
});

describe("Cross-Repo Master Canon Codex", () => {
  it("encodes the exact 4-line owner manifesto, 4 DX panels, and 3 GOD-PROMISE tracks", () => {
    expect(OWNER_FOUR_LINE_MANIFESTO).toHaveLength(4);
    expect(DX_MANGA_FOUR_PANELS).toHaveLength(4);
    expect(GOD_PROMISE_THREE_TRACKS).toHaveLength(3);
  });

  it("unifies MoonWitness II and XII narrative structures across 99 chapters", () => {
    expect(FOUR_ENTRY_DOORS).toHaveLength(4);
    expect(UNIVERSE_FOUR_LENSES).toHaveLength(4);
    const totalChapters = UNIVERSE_FOUR_LENSES.reduce((sum, lens) => sum + lens.chapterCount, 0);
    expect(totalChapters).toBe(99);
    expect(SEVEN_STEP_PROMISE).toHaveLength(7);
    expect(SIXTEEN_STAGE_LOOP).toHaveLength(16);
    expect(EIGHT_STORY_ERAS).toHaveLength(8);
    expect(ORIGINAL_CREW_ARCHETYPES).toHaveLength(15);
    expect(FIFTEEN_STORY_EPISODES).toHaveLength(15);
  });

  it("defines the 6+1 ROCKSOUL epistemic federation, SRGBL v8 stages, and 7 rotations", () => {
    expect(EPISTEMIC_FEDERATION_DOMAINS).toHaveLength(7);
    expect(SRGBL_V8_STAGES.map((stage) => stage.letter)).toEqual(["S", "R", "G", "B", "L"]);
    expect(SWING_SWING_KEY_ROTATIONS).toHaveLength(7);
  });

  it("enforces Prime Code PC01-PC09, WINGS 10, 100CENTER stewardship (99+1=100), and 14 concepts", () => {
    expect(PRIME_CODE_AXIOMS).toHaveLength(9);
    expect(WINGS_TEN_ARRAY).toHaveLength(10);
    expect(SYAFAAT_BASE_STATES).toHaveLength(6);
    const total100CenterNodes = CENTER_100_STEWARDSHIP_CLUSTERS.reduce(
      (sum, cluster) => sum + cluster.nodeCount,
      0
    );
    expect(total100CenterNodes).toBe(100);
    expect(SYSTEM_CONCEPTS_14).toHaveLength(14);
  });

  it("models all 49 OX-DX levels across 7 zones and indexes 194+ GitHub repos", () => {
    expect(OX_DX_SEVEN_ZONES).toHaveLength(7);
    const totalOxLevels = OX_DX_SEVEN_ZONES.reduce((sum, zone) => sum + zone.levels.length, 0);
    expect(totalOxLevels).toBe(49);

    const totalRepos = CROSS_REPO_TOPOLOGY_ATLAS.reduce((sum, org) => sum + org.repoCount, 0);
    expect(totalRepos).toBe(194);

    const validDoorIds = new Set(FOUR_ENTRY_DOORS.map((door) => door.id));
    for (const item of CODEX_SEARCH_INDEX) {
      expect(validDoorIds.has(item.doorId)).toBe(true);
    }
  });
});

describe("Living Light Design Tokens & Visual Covenant", () => {
  it("defines coherent cosmic obsidian, warm ivory, and sacred gold palette tokens", () => {
    expect(LIVING_LIGHT_PALETTE.cosmicBlack).toBe("#040509");
    expect(LIVING_LIGHT_PALETTE.midnightBlue).toBe("#080a12");
    expect(LIVING_LIGHT_PALETTE.warmIvory).toBe("#f5efe2");
    expect(LIVING_LIGHT_PALETTE.sacredGold).toBe("#dfc07b");
    expect(LIVING_LIGHT_PALETTE.luminousGold).toBe("#fff4d2");
    expect(LIVING_LIGHT_PALETTE.softWhiteLight).toBe("#fffdf7");
    expect(LIVING_LIGHT_PALETTE.subtleSilver).toBe("#c8d0de");
  });

  it("defines bounded spring physics and progressive capability tiers", () => {
    expect(LIVING_LIGHT_MOTION.durationsMs.instant).toBe(0);
    expect(LIVING_LIGHT_MOTION.durationsMs.entrance).toBe(2200);
    expect(LIVING_LIGHT_MOTION.springs.magnetic.maxDisplacementPx).toBeLessThanOrEqual(10);
    expect(LIVING_LIGHT_MOTION.springs.spatialTilt.maxDisplacementPx).toBeLessThanOrEqual(8);
    expect(LIVING_LIGHT_MOTION.capabilityTiers).toEqual([
      "webgl2-full",
      "canvas-2d",
      "reduced-motion",
    ]);
  });

  it("enforces sacred visual boundaries and accessibility target minimums", () => {
    expect(SACRED_VISUAL_COVENANT.depictionOfAllahForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.humanFacesForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.cartoonAndAnimeForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.decorativeSacredTextTexturesForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.requiresReducedMotionBypass).toBe(true);
    expect(SACRED_VISUAL_COVENANT.minimumInteractiveTargetPx).toBeGreaterThanOrEqual(44);
    expect(LIVING_LIGHT_TYPOGRAPHY.displayFamily).toContain("Cinzel");
  });
});
