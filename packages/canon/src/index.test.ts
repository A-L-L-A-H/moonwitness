import { describe, expect, it } from "vitest";
import {
  AETHERION_100_LEVELS,
  AETHERION_REALMS,
  AMANAH_25_ATLAS,
  CENTER_100_STEWARDSHIP_CLUSTERS,
  CODEX_SEARCH_INDEX,
  CROSS_REPO_TOPOLOGY_ATLAS,
  DHGS_13_STEPS,
  DX_MANGA_FOUR_PANELS,
  ECOSYSTEM_RUNTIME_CATALOG,
  EIGHT_STORY_ERAS,
  EPISTEMIC_FEDERATION_DOMAINS,
  FIFTEEN_STORY_EPISODES,
  FOUR_CORPUS_CONCORDANCE,
  FOUR_CORPUS_POLICY,
  FOUR_ENTRY_DOORS,
  GOD_99_DEPARTMENTS,
  GOD_99_DIRECTORY,
  GOD_PROMISE_THREE_TRACKS,
  MASTER_DNA_WORLDS_META,
  MONWITNESS_XII_FACELESS_GUIDES,
  NINE_CANON_CHARACTERS,
  ORIGINAL_CREW_ARCHETYPES,
  OWNER_FOUR_LINE_MANIFESTO,
  OX_DX_SEVEN_ZONES,
  P18_KEY_WITNESS_SPEC,
  PARADISE_V3_AURAS,
  PARADISE_V3_CHAMPIONS_META,
  PARADISE_V3_GUILDS,
  PRIME_CODE_AXIOMS,
  QUARANTINED_AMBIGUITY_LEDGER,
  RGBL_FOUR_LEVELS,
  SEVEN_STEP_PROMISE,
  SIXTEEN_STAGE_LOOP,
  SRGBL_V8_STAGES,
  SWING_SWING_KEY_ROTATIONS,
  SYAFAAT_BASE_STATES,
  SYSTEM_CONCEPTS_14,
  THIRTEEN_PLATFORM_FUNCTIONS,
  UNIVERSE_FOUR_LENSES,
  WHCMT_VS_BASSHUNTER_SPEC,
  WINGS_TEN_ARRAY,
  WORLD_PATCH_HIGHLIGHTS,
  WORLD_PATCHES_REGISTRY,
} from "./index";

describe("@moonwitness/canon SSOT invariants", () => {
  it("preserves Door I narrative structures, 100 AETHERION levels & PARADISE V3 taxonomy", () => {
    expect(OWNER_FOUR_LINE_MANIFESTO).toHaveLength(4);
    expect(DX_MANGA_FOUR_PANELS).toHaveLength(4);
    expect(GOD_PROMISE_THREE_TRACKS).toHaveLength(3);
    expect(FOUR_ENTRY_DOORS).toHaveLength(4);
    expect(UNIVERSE_FOUR_LENSES.reduce((sum, l) => sum + l.chapterCount, 0)).toBe(99);
    expect(SEVEN_STEP_PROMISE).toHaveLength(7);
    expect(SIXTEEN_STAGE_LOOP).toHaveLength(16);
    expect(EIGHT_STORY_ERAS).toHaveLength(8);
    expect(THIRTEEN_PLATFORM_FUNCTIONS).toHaveLength(13);
    expect(NINE_CANON_CHARACTERS).toHaveLength(9);
    expect(MONWITNESS_XII_FACELESS_GUIDES).toHaveLength(4);
    expect(ORIGINAL_CREW_ARCHETYPES).toHaveLength(15);
    expect(FIFTEEN_STORY_EPISODES).toHaveLength(15);

    expect(AETHERION_REALMS).toHaveLength(10);
    expect(AETHERION_100_LEVELS).toHaveLength(100);
    expect(AETHERION_100_LEVELS.filter((l) => l.accessState === "OPEN")).toHaveLength(33);
    expect(AETHERION_100_LEVELS.filter((l) => l.accessState === "SEALED")).toHaveLength(67);
    expect(AETHERION_100_LEVELS[32]?.title).toBe("Ascension Gateway");

    expect(PARADISE_V3_AURAS).toHaveLength(3);
    expect(PARADISE_V3_GUILDS).toHaveLength(10);
    expect(PARADISE_V3_CHAMPIONS_META.totalChampions).toBe(105);

    expect(WORLD_PATCH_HIGHLIGHTS).toHaveLength(6);
    const conflict14 = WORLD_PATCHES_REGISTRY.filter((p) => p.patchNumber === "#014");
    expect(conflict14).toHaveLength(2);
    expect(WORLD_PATCHES_REGISTRY.every((p) => p.divineApprovals === 0)).toBe(true);
  });

  it("enforces Door II P18 Key Witness, Four-Corpus Policy & WHCMT boundary", () => {
    expect(EPISTEMIC_FEDERATION_DOMAINS).toHaveLength(7);
    expect(RGBL_FOUR_LEVELS).toHaveLength(4);
    expect(SRGBL_V8_STAGES).toHaveLength(5);
    expect(SWING_SWING_KEY_ROTATIONS).toHaveLength(7);
    expect(P18_KEY_WITNESS_SPEC.corpusSpine9Layers).toHaveLength(9);
    expect(P18_KEY_WITNESS_SPEC.witnessTypes6).toHaveLength(6);
    expect(P18_KEY_WITNESS_SPEC.controlledKeys5Families.flatMap((f) => f.keys)).toHaveLength(20);
    expect(P18_KEY_WITNESS_SPEC.relations12).toHaveLength(12);
    expect(P18_KEY_WITNESS_SPEC.mandatoryFrameDimensions5).toHaveLength(5);
    expect(FOUR_CORPUS_POLICY.corpora).toHaveLength(4);
    expect(FOUR_CORPUS_POLICY.corpora.map((c) => c.code)).toEqual([
      "SRC-TOR",
      "SRC-ZAB",
      "SRC-INJ",
      "SRC-QUR",
    ]);
    expect(FOUR_CORPUS_POLICY.neutralityPrinciple.toLowerCase()).toContain("zero ranking");
    expect(FOUR_CORPUS_CONCORDANCE).toHaveLength(4);
    for (const theme of FOUR_CORPUS_CONCORDANCE) {
      expect(theme.tauratWitness.length).toBeGreaterThan(20);
      expect(theme.zaburWitness.length).toBeGreaterThan(20);
      expect(theme.injilWitness.length).toBeGreaterThan(20);
      expect(theme.quranWitness.length).toBeGreaterThan(20);
    }
    expect(ECOSYSTEM_RUNTIME_CATALOG.liveEdges.length).toBeGreaterThanOrEqual(3);
    expect(ECOSYSTEM_RUNTIME_CATALOG.workspaceNodes.length).toBeGreaterThanOrEqual(6);
    expect(WHCMT_VS_BASSHUNTER_SPEC.bassHunter.scoringStatus).toBe("UNKNOWN");
  });

  it("enforces Door III Prime Code, WINGS 10, 99 UNASSIGNED G.O.D. nodes & 25 Amanah", () => {
    expect(PRIME_CODE_AXIOMS).toHaveLength(9);
    expect(WINGS_TEN_ARRAY).toHaveLength(10);
    expect(SYAFAAT_BASE_STATES).toHaveLength(6);
    expect(CENTER_100_STEWARDSHIP_CLUSTERS.reduce((sum, c) => sum + c.nodeCount, 0)).toBe(100);
    expect(SYSTEM_CONCEPTS_14).toHaveLength(14);

    expect(GOD_99_DEPARTMENTS).toHaveLength(9);
    expect(GOD_99_DIRECTORY).toHaveLength(99);
    const uniqueGodIds = new Set(GOD_99_DIRECTORY.map((g) => g.slotId));
    expect(uniqueGodIds.size).toBe(99);
    for (const slot of GOD_99_DIRECTORY) {
      expect(slot.status).toBe("UNASSIGNED");
      expect(slot.powers).toBe("NONE");
      expect(slot.relationship).toBe("ETHICAL_ANALOGY_NOT_IDENTITY");
    }

    expect(AMANAH_25_ATLAS).toHaveLength(25);
    expect(AMANAH_25_ATLAS.find((a) => a.number === 19)?.rejectedFlag).toBe(true);
  });

  it("enforces Door IV OX-DX 49 levels, 13 DHGS steps, Quarantine ledger, 7 DNA & 368 repos", () => {
    expect(OX_DX_SEVEN_ZONES.reduce((sum, z) => sum + z.levels.length, 0)).toBe(49);
    expect(DHGS_13_STEPS).toHaveLength(13);
    expect(DHGS_13_STEPS[0]?.code).toBe("RECEIVE");
    expect(DHGS_13_STEPS[12]?.code).toBe("LEARN");
    expect(QUARANTINED_AMBIGUITY_LEDGER).toHaveLength(4);
    expect(CROSS_REPO_TOPOLOGY_ATLAS.reduce((sum, o) => sum + o.repoCount, 0)).toBe(368);
    expect(MASTER_DNA_WORLDS_META).toHaveLength(7);

    const doorIds = new Set(FOUR_ENTRY_DOORS.map((d) => d.id));
    for (const item of CODEX_SEARCH_INDEX) {
      expect(doorIds.has(item.doorId)).toBe(true);
    }
  });
});
