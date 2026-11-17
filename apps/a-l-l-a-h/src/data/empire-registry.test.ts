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
  ECOSYSTEM_RUNTIME_CATALOG,
  EIGHT_STORY_ERAS,
  EPISTEMIC_FEDERATION_DOMAINS,
  FIFTEEN_STORY_EPISODES,
  FOUR_CORPUS_CONCORDANCE,
  FOUR_CORPUS_POLICY,
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
  WORLD_PATCH_HIGHLIGHTS,
  WINGS_TEN_ARRAY,
} from "./empire-canon-codex";
import {
  COVENANT_PILLARS,
  DOCK_TELEMETRY_NODES,
  NAVIGATION_TABS,
  SIDRA_KNOWLEDGE_AXIOMS,
  WORLD_DOMAINS,
} from "./empire-registry";
import { LUMINOUS_NAMES_OF_ALLAH, TASBIH_PHRASES } from "./remembrance-sanctuary";

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

  it("defines all nine worlds with exact reconciled titles and taglines", () => {
    expect(WORLD_DOMAINS.map((world) => ({ name: world.name, tagline: world.tagline }))).toEqual([
      { name: "MOONWITNESS", tagline: "Stories · Knowledge · Archive" },
      { name: "ARSY", tagline: "Radio · Technology · Infrastructure" },
      { name: "HUMAN-PEN", tagline: "Think · Write · Create · Share" },
      { name: "SIDRA", tagline: "Connect · Explore · Learn" },
      { name: "ROCKSOUL DX", tagline: "Play · Create · Dream" },
      { name: "CRAYON", tagline: "Biar Hidup Lebih Berwarna!" },
      { name: "SIN CAN", tagline: "Reflect · Question · Understand" },
      { name: "MYTHOS", tagline: "Explore · Discover · Remember" },
      { name: "ANGEL WITH SHOTGUN", tagline: "Law · Justice · Society" },
    ]);
  });

  it("maintains dock telemetry coherence across all nine world gateways", () => {
    expect(DOCK_TELEMETRY_NODES).toHaveLength(9);
    const worldIds = new Set(WORLD_DOMAINS.map((world) => world.id));
    for (const node of DOCK_TELEMETRY_NODES) {
      expect(worldIds.has(node.worldId)).toBe(true);
      expect(node.integrityPercent).toBeNull();
      expect(node.latencyMs).toBeNull();
      if (node.state === "CANON_EXPLORER") {
        expect(node.runtimeTargetId).toBeNull();
      } else {
        expect(node.runtimeTargetId).not.toBeNull();
      }
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
    expect(SIXTEEN_STAGE_LOOP[2]).toBe("03 EVENT");
    expect(SIXTEEN_STAGE_LOOP[13]).toBe("14 SANITY'S LAST BREATH");
    expect(EIGHT_STORY_ERAS).toHaveLength(8);
    expect(EIGHT_STORY_ERAS[1]?.title).toBe("THE ARRIVAL");
    expect(ORIGINAL_CREW_ARCHETYPES).toHaveLength(15);
    expect(FIFTEEN_STORY_EPISODES).toHaveLength(15);
    expect(FIFTEEN_STORY_EPISODES[1]?.title).toContain("KALAUTIDAKSALAH");
    expect(WORLD_PATCH_HIGHLIGHTS.find((p) => p.patchNumber === "#007")?.title).toBe("MAROON 5");
    expect(WORLD_PATCH_HIGHLIGHTS.find((p) => p.patchNumber === "#014")?.title).toContain(
      "FAMILY WITHOUT FEAR",
    );
  });

  it("defines the 6+1 ROCKSOUL epistemic federation, SRGBL v8 stages, and 7 rotations", () => {
    expect(EPISTEMIC_FEDERATION_DOMAINS).toHaveLength(7);
    expect(SRGBL_V8_STAGES.map((stage) => stage.letter)).toEqual(["S", "R", "G", "B", "L"]);
    expect(SWING_SWING_KEY_ROTATIONS).toHaveLength(7);
    expect(SWING_SWING_KEY_ROTATIONS[0]).toContain("Direction Reversal");
  });

  it("enforces Prime Code PC01-PC09, WINGS 10, 100CENTER stewardship (99+1=100), and 14 concepts", () => {
    expect(PRIME_CODE_AXIOMS).toHaveLength(9);
    expect(PRIME_CODE_AXIOMS[0]?.title).toBe("SOURCE INTEGRITY");
    expect(WINGS_TEN_ARRAY).toHaveLength(10);
    expect(WINGS_TEN_ARRAY[0]?.callsign).toContain("SKYLINK");
    expect(WINGS_TEN_ARRAY[9]?.callsign).toContain("HAVEN");
    expect(SYAFAAT_BASE_STATES).toHaveLength(6);
    const total100CenterNodes = CENTER_100_STEWARDSHIP_CLUSTERS.reduce(
      (sum, cluster) => sum + cluster.nodeCount,
      0,
    );
    expect(total100CenterNodes).toBe(100);
    expect(SYSTEM_CONCEPTS_14).toHaveLength(14);
    expect(SYSTEM_CONCEPTS_14[0]).toContain("MoonWitness OS");
  });

  it("models all 49 OX-DX levels across 7 zones and indexes 368 verified GitHub repos across 7 owners", () => {
    expect(OX_DX_SEVEN_ZONES).toHaveLength(7);
    expect(OX_DX_SEVEN_ZONES[0]?.zoneName).toContain("EXISTENCE");
    expect(OX_DX_SEVEN_ZONES[6]?.zoneName).toContain("REPRESENTATION");
    const totalOxLevels = OX_DX_SEVEN_ZONES.reduce((sum, zone) => sum + zone.levels.length, 0);
    expect(totalOxLevels).toBe(49);

    expect(CROSS_REPO_TOPOLOGY_ATLAS).toHaveLength(7);
    const totalRepos = CROSS_REPO_TOPOLOGY_ATLAS.reduce((sum, org) => sum + org.repoCount, 0);
    expect(totalRepos).toBe(368);

    const validDoorIds = new Set(FOUR_ENTRY_DOORS.map((door) => door.id));
    for (const item of CODEX_SEARCH_INDEX) {
      expect(validDoorIds.has(item.doorId)).toBe(true);
    }
  });
});

describe("Living Light Design Tokens & Visual Covenant", () => {
  it("re-exports centralized illustrated-universe tokens from @moonwitness/ui", () => {
    expect(LIVING_LIGHT_PALETTE.cosmicBlack).toBe("#08090d");
    expect(LIVING_LIGHT_PALETTE.midnightBlue).toBe("#10121a");
    expect(LIVING_LIGHT_PALETTE.warmIvory).toBe("#f4ecd8");
    expect(LIVING_LIGHT_PALETTE.sacredGold).toBe("#f6d438");
    expect(LIVING_LIGHT_PALETTE.luminousGold).toBe("#fff8e8");
    expect(LIVING_LIGHT_PALETTE.softWhiteLight).toBe("#fff8e8");
    expect(LIVING_LIGHT_PALETTE.deepAmber).toBe("#ed149b");
    expect(LIVING_LIGHT_PALETTE.electricBlue).toBe("#2ea8ff");
  });

  it("defines bounded spring physics and progressive capability tiers", () => {
    expect(LIVING_LIGHT_MOTION.durationsMs.instant).toBe(0);
    expect(LIVING_LIGHT_MOTION.durationsMs.entrance).toBe(700);
    expect(LIVING_LIGHT_MOTION.springs.magnetic.maxDisplacementPx).toBeLessThanOrEqual(10);
    expect(LIVING_LIGHT_MOTION.springs.spatialTilt.maxDisplacementPx).toBeLessThanOrEqual(8);
    expect(LIVING_LIGHT_MOTION.capabilityTiers).toEqual([
      "webgl2-full",
      "canvas-2d",
      "reduced-motion",
    ]);
  });

  it("enforces reformed illustrated-universe visual boundaries and accessibility minimums", () => {
    expect(SACRED_VISUAL_COVENANT.depictionOfAllahForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.humanFacesForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.cartoonAndAnimeForbidden).toBe(false);
    expect(SACRED_VISUAL_COVENANT.originalIllustrationsAllowed).toBe(true);
    expect(SACRED_VISUAL_COVENANT.copyrightImitationForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.violentImageryForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.decorativeSacredTextTexturesForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.requiresReducedMotionBypass).toBe(true);
    expect(SACRED_VISUAL_COVENANT.minimumInteractiveTargetPx).toBeGreaterThanOrEqual(44);
    expect(LIVING_LIGHT_TYPOGRAPHY.displayFamily).toContain("Impact");
  });
});

describe("Remembrance Sanctuary Registry", () => {
  it("defines 9 Luminous Attributes linked to valid sanctuary worlds", () => {
    const worldIds = new Set(WORLD_DOMAINS.map((world) => world.id));
    expect(LUMINOUS_NAMES_OF_ALLAH).toHaveLength(9);

    const attributeIds = new Set(LUMINOUS_NAMES_OF_ALLAH.map((item) => item.id));
    expect(attributeIds.size).toBe(LUMINOUS_NAMES_OF_ALLAH.length);

    for (const attribute of LUMINOUS_NAMES_OF_ALLAH) {
      expect(attribute.arabic.length).toBeGreaterThan(0);
      expect(attribute.transliteration.length).toBeGreaterThan(0);
      expect(attribute.meaning.length).toBeGreaterThan(0);
      expect(attribute.worldLabel.length).toBeGreaterThan(0);
      expect(attribute.contemplation.length).toBeGreaterThan(0);
      expect(attribute.practicePrompt.length).toBeGreaterThan(0);
      expect(worldIds.has(attribute.linkedWorldId)).toBe(true);
    }
  });

  it("defines 5 Tasbih phrases standardized at 33-bead cycles", () => {
    expect(TASBIH_PHRASES).toHaveLength(5);
    const phraseIds = new Set(TASBIH_PHRASES.map((phrase) => phrase.id));
    expect(phraseIds.size).toBe(TASBIH_PHRASES.length);

    for (const phrase of TASBIH_PHRASES) {
      expect(phrase.arabic.length).toBeGreaterThan(0);
      expect(phrase.transliteration.length).toBeGreaterThan(0);
      expect(phrase.translation.length).toBeGreaterThan(0);
      expect(phrase.targetCount).toBe(33);
    }
  });

  it("exposes all four revealed scriptures neutrally alongside live ecosystem topology", () => {
    expect(FOUR_CORPUS_POLICY.corpora.map((c) => c.name)).toEqual([
      "TAURAT",
      "ZABUR",
      "INJIL",
      "AL-QURAN",
    ]);
    expect(FOUR_CORPUS_POLICY.neutralityPrinciple.toLowerCase()).toContain("zero ranking");
    expect(FOUR_CORPUS_CONCORDANCE).toHaveLength(4);
    expect(ECOSYSTEM_RUNTIME_CATALOG.liveEdges.some((e) => e.hostname === "a-l-l-a-h.com")).toBe(
      true,
    );
    expect(
      ECOSYSTEM_RUNTIME_CATALOG.liveEdges.some((e) => e.hostname === "codex.a-l-l-a-h.com"),
    ).toBe(true);
  });
});
