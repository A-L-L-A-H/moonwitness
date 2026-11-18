import { describe, expect, it } from "vitest";
import {
  CanonEntitySchema,
  CanonRelationshipSchema,
  CanonTermSchema,
  ChronicleEpisodeSchema,
  ChronicleEraSchema,
  ChronicleEventSchema,
  ChronicleStorySchema,
  DEFERRED_WRITE_MODELS,
  EpistemicKindSchema,
  KnowledgeCitationSchema,
  KnowledgeRevisionSchema,
  KnowledgeSourceSchema,
  PublicationCorrectionSchema,
  PublicationExportSchema,
  ResearchFindingSchema,
  ResearchHypothesisSchema,
  ResearchMethodSchema,
  ResearchQuestionSchema,
  ResearchRunSchema,
  ResearchSourceSetSchema,
  Sha256HashSchema,
  SidraEdgeSchema,
  SidraNodeSchema,
  SidraProjectionSchema,
  WitnessClaimSchema,
  WitnessEvidenceSchema,
  WitnessObservationSchema,
} from "./index";

const ISO_NOW = "2026-11-18T00:00:00.000Z";
const VALID_SHA256 = "a".repeat(64);
const AUTHOR = { id: "usr-1", name: "Archivist", role: "owner" as const };
const LIFECYCLE = { createdAt: ISO_NOW, updatedAt: ISO_NOW };

describe("canon contracts (MW-0401..0402)", () => {
  it("validates entity, term, and relationship", () => {
    const entity = CanonEntitySchema.parse({
      id: "ent-1",
      slug: "moon-witness",
      kind: "project",
      name: "MoonWitness",
      status: "active",
      classification: "public",
      author: AUTHOR,
      lifecycle: LIFECYCLE,
    });
    expect(entity.aliases).toEqual([]);

    const term = CanonTermSchema.parse({
      id: "term-1",
      term: "Epistemic Kind",
      definition: "Classification of witness statement modality.",
      status: "active",
      classification: "internal",
      author: AUTHOR,
      lifecycle: LIFECYCLE,
    });
    expect(term.term).toBe("Epistemic Kind");

    const rel = CanonRelationshipSchema.parse({
      id: "rel-1",
      subjectId: "ent-1",
      predicate: "defines",
      objectId: "term-1",
      status: "active",
      classification: "public",
      author: AUTHOR,
      lifecycle: LIFECYCLE,
    });
    expect(rel.predicate).toBe("defines");
  });
});

describe("knowledge contracts (MW-0403..0404)", () => {
  it("validates source, revision, sha256, and citation", () => {
    expect(Sha256HashSchema.safeParse("not-a-hash").success).toBe(false);

    const source = KnowledgeSourceSchema.parse({
      id: "src-1",
      title: "Field Notes",
      kind: "document",
      classification: "internal",
      ingestionState: "indexed",
      sha256: VALID_SHA256,
      createdAt: ISO_NOW,
      updatedAt: ISO_NOW,
    });
    expect(source.sha256).toBe(VALID_SHA256);

    const rev = KnowledgeRevisionSchema.parse({
      id: "rev-1",
      sourceId: "src-1",
      revisionNumber: 1,
      sha256: VALID_SHA256,
      byteSize: 1024,
      mimeType: "text/markdown",
      ingestionState: "indexed",
      ingestedAt: ISO_NOW,
    });
    expect(rev.revisionNumber).toBe(1);

    const citation = KnowledgeCitationSchema.parse({
      id: "cit-1",
      sourceId: "src-1",
      revisionId: "rev-1",
      locator: "line:42",
      citedAt: ISO_NOW,
    });
    expect(citation.locator).toBe("line:42");
  });
});

describe("witness contracts (MW-0405..0406)", () => {
  it("supports all 9 epistemic kinds and rejects unknown kinds", () => {
    const kinds = [
      "observation",
      "report",
      "fact",
      "interpretation",
      "hypothesis",
      "dream",
      "fiction",
      "joke",
      "unknown",
    ];
    for (const kind of kinds) {
      expect(EpistemicKindSchema.safeParse(kind).success).toBe(true);
    }
    expect(EpistemicKindSchema.safeParse("rumor").success).toBe(false);
  });

  it("validates observation, claim, and evidence with provenance", () => {
    const provenance = {
      witnessId: "wit-1",
      channel: "direct" as const,
      recordedAt: ISO_NOW,
    };

    const obs = WitnessObservationSchema.parse({
      id: "obs-1",
      epistemicKind: "observation",
      statement: "The gate was locked at midnight.",
      provenance,
    });
    expect(obs.epistemicKind).toBe("observation");

    const claim = WitnessClaimSchema.parse({
      id: "clm-1",
      epistemicKind: "interpretation",
      proposition: "Access was restricted after 23:00.",
      evidenceIds: ["ev-1"],
      provenance,
    });
    expect(claim.evidenceIds).toEqual(["ev-1"]);

    const ev = WitnessEvidenceSchema.parse({
      id: "ev-1",
      epistemicKind: "fact",
      summary: "Lock log entry.",
      stance: "supports",
      observationIds: ["obs-1"],
      provenance,
    });
    expect(ev.stance).toBe("supports");
  });
});

describe("chronicle contracts (MW-0407)", () => {
  it("validates era, event, episode, and story", () => {
    const era = ChronicleEraSchema.parse({ id: "era-1", name: "Founding", order: 0 });
    const event = ChronicleEventSchema.parse({
      id: "evt-1",
      eraId: era.id,
      title: "First Light",
      occurredAt: ISO_NOW,
    });
    const episode = ChronicleEpisodeSchema.parse({
      id: "ep-1",
      storyId: "sty-1",
      order: 0,
      title: "Prologue",
      eventIds: [event.id],
    });
    const story = ChronicleStorySchema.parse({
      id: "sty-1",
      title: "Origins",
      eraIds: [era.id],
      episodeIds: [episode.id],
    });
    expect(story.status).toBe("draft");
  });
});

describe("research contracts (MW-0408)", () => {
  it("validates question, sourceSet, method, hypothesis, finding, and run", () => {
    const q = ResearchQuestionSchema.parse({
      id: "q-1",
      prompt: "What caused the discrepancy?",
      createdAt: ISO_NOW,
    });
    const ss = ResearchSourceSetSchema.parse({
      id: "ss-1",
      name: "Primary Logs",
      sourceIds: ["src-1"],
      createdAt: ISO_NOW,
    });
    const m = ResearchMethodSchema.parse({
      id: "m-1",
      name: "Cross-check",
      strategy: "verification",
    });
    const h = ResearchHypothesisSchema.parse({
      id: "h-1",
      questionId: q.id,
      statement: "Clock drift.",
      status: "proposed",
    });
    const f = ResearchFindingSchema.parse({
      id: "f-1",
      runId: "run-1",
      summary: "Confirmed 5s drift.",
      hypothesisIds: [h.id],
      createdAt: ISO_NOW,
    });
    const r = ResearchRunSchema.parse({
      id: "run-1",
      questionId: q.id,
      sourceSetId: ss.id,
      methodId: m.id,
      status: "completed",
      startedAt: ISO_NOW,
      findingIds: [f.id],
    });
    expect(r.status).toBe("completed");
  });
});

describe("sidra contracts (MW-0409)", () => {
  it("validates projection nodes and edges referencing canonical records", () => {
    const node = SidraNodeSchema.parse({
      id: "n-1",
      label: "MoonWitness",
      kind: "entity",
      canonicalRef: { domain: "canon", recordType: "entity", recordId: "ent-1" },
    });
    const edge = SidraEdgeSchema.parse({
      id: "e-1",
      fromNodeId: node.id,
      toNodeId: "n-2",
      relation: "references",
    });
    const proj = SidraProjectionSchema.parse({
      nodes: [node],
      edges: [edge],
      projectedAt: ISO_NOW,
    });
    expect(proj.nodes).toHaveLength(1);
  });
});

describe("publication contracts (MW-0410) & deferred models (MW-0411)", () => {
  it("validates selective export and correction/retraction", () => {
    const exp = PublicationExportSchema.parse({
      id: "pub-1",
      title: "Public Release 1",
      status: "approved",
      items: [{ domain: "canon", recordId: "ent-1" }],
      approval: { approvedBy: "usr-1", approvedAt: ISO_NOW, scope: "single" },
    });
    expect(exp.status).toBe("approved");

    const corr = PublicationCorrectionSchema.parse({
      id: "cor-1",
      exportId: exp.id,
      action: "retraction",
      reason: "Superseded by revised canon.",
      issuedBy: "usr-1",
      issuedAt: ISO_NOW,
    });
    expect(corr.action).toBe("retraction");
  });

  it("documents deferred write models", () => {
    expect(DEFERRED_WRITE_MODELS).toEqual(["works", "signal", "justice"]);
  });
});
