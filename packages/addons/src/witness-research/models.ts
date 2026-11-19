import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const knowledgeSourceModel = defineModel({
  name: "knowledge.source",
  table: "wr_knowledge_sources",
  schema: z.object({
    source_key: z.string().min(1).max(120),
    title: z.string().min(1).max(240),
    tier: z.enum(["tier1", "tier2", "tier3"]).default("tier2"),
    url: z.string().max(1000).nullable().default(null),
    digest: z.string().max(128).nullable().default(null),
    verified: z.boolean().default(false),
  }),
  extensible: true,
  restEnabled: true,
  publicFields: ["source_key", "title", "tier", "verified"],
  indexes: [{ fields: ["source_key"], unique: true }, { fields: ["tier"] }],
});

export const witnessClaimModel = defineModel({
  name: "witness.claim",
  table: "wr_witness_claims",
  schema: z.object({
    claim_key: z.string().min(1).max(120),
    statement: z.string().min(1).max(2000),
    tier: z.enum(["tier1", "tier2", "tier3"]).default("tier2"),
    source_key: z.string().max(120).nullable().default(null),
    confidence: z.number().min(0).max(1).default(0.5),
    verdict: z.enum(["supported", "contested", "open"]).default("open"),
  }),
  extensible: true,
  restEnabled: true,
  searchFields: ["claim_key", "statement", "source_key"],
  publicFields: ["claim_key", "statement", "tier", "confidence", "verdict"],
  actions: {
    verify_claim: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Verify Witness Claim",
      input: z
        .object({
          verdict: z.enum(["supported", "contested", "open"]).default("supported"),
          confidence: z.number().min(0).max(1).optional(),
        })
        .optional(),
      handler: async ({ record, input, repository, actor }) => {
        const body = (input as { verdict?: string; confidence?: number } | undefined) ?? {};
        return repository.update(
          String(record!.id),
          {
            verdict: body.verdict ?? "supported",
            ...(body.confidence !== undefined ? { confidence: body.confidence } : {}),
          },
          actor,
        );
      },
    },
  },
  indexes: [{ fields: ["claim_key"], unique: true }, { fields: ["verdict"] }],
});

export const researchRunModel = defineModel({
  name: "research.run",
  table: "wr_research_runs",
  schema: z.object({
    run_key: z.string().min(1).max(120),
    topic: z.string().min(1).max(240),
    mode: z.enum(["sidra", "verification", "synthesis"]).default("verification"),
    status_state: z.enum(["queued", "running", "completed", "failed"]).default("completed"),
    summary: z.string().max(4000).default(""),
  }),
  extensible: true,
  restEnabled: true,
  publicFields: ["run_key", "topic", "mode", "status_state"],
  indexes: [{ fields: ["run_key"], unique: true }, { fields: ["status_state"] }],
});

export const sidraEdgeModel = defineModel({
  name: "sidra.edge",
  table: "wr_sidra_edges",
  schema: z.object({
    from_key: z.string().min(1).max(120),
    to_key: z.string().min(1).max(120),
    relation: z.enum(["supports", "contradicts", "cites", "derives"]).default("cites"),
    weight: z.number().default(1),
  }),
  restEnabled: true,
  publicFields: ["from_key", "to_key", "relation", "weight"],
  indexes: [{ fields: ["from_key", "to_key"] }],
});

export const wxPassageModel = defineModel({
  name: "wx.passage",
  table: "wx_passages",
  schema: z.object({
    reference: z.string().min(1).max(120),
    scripture_code: z.enum(["QURAN", "TORAH", "ZABUR", "INJIL", "HADITH"]).default("QURAN"),
    book_code: z.string().max(60).default(""),
    chapter_num: z.number().int().min(0).default(1),
    verse_num: z.number().int().min(0).default(1),
    arabic_text: z.string().max(8000).default(""),
    translation_text: z.string().max(8000).default(""),
    root_keys_json: z.string().default("[]"),
  }),
  extensible: true,
  restEnabled: true,
  searchFields: ["reference", "arabic_text", "translation_text"],
  publicFields: ["reference", "scripture_code", "chapter_num", "verse_num", "translation_text"],
  indexes: [{ fields: ["reference"], unique: true }, { fields: ["scripture_code"] }],
});

export const wxRootModel = defineModel({
  name: "wx.root",
  table: "wx_roots",
  schema: z.object({
    root_key: z.string().min(1).max(40),
    arabic_letters: z.string().min(1).max(40),
    transliteration: z.string().min(1).max(80),
    core_meaning: z.string().min(1).max(400),
    occurrence_count: z.number().int().min(0).default(0),
  }),
  softDelete: false,
  restEnabled: true,
  searchFields: ["root_key", "transliteration", "core_meaning"],
  publicFields: [
    "root_key",
    "arabic_letters",
    "transliteration",
    "core_meaning",
    "occurrence_count",
  ],
  indexes: [{ fields: ["root_key"], unique: true }],
});

export const wxFigureModel = defineModel({
  name: "wx.figure",
  table: "wx_figures",
  schema: z.object({
    figure_key: z.string().min(1).max(120),
    canonical_name: z.string().min(1).max(200),
    arabic_name: z.string().max(200).nullable().default(null),
    era_label: z.string().max(120).default(""),
    role_category: z
      .enum(["prophet", "companion", "scholar", "ruler", "witness"])
      .default("witness"),
    summary: z.string().max(2000).default(""),
  }),
  extensible: true,
  restEnabled: true,
  searchFields: ["figure_key", "canonical_name", "summary"],
  publicFields: ["figure_key", "canonical_name", "role_category", "era_label"],
  indexes: [{ fields: ["figure_key"], unique: true }, { fields: ["role_category"] }],
});

export const wxAsmaulHusnaModel = defineModel({
  name: "wx.asmaul.husna",
  table: "wx_asmaul_husna",
  schema: z.object({
    number_order: z.number().int().min(1).max(99),
    arabic: z.string().min(1).max(120),
    transliteration: z.string().min(1).max(120),
    meaning_en: z.string().min(1).max(300),
    meaning_id: z.string().max(300).default(""),
    quran_refs_json: z.string().default("[]"),
  }),
  softDelete: false,
  restEnabled: true,
  searchFields: ["transliteration", "meaning_en", "meaning_id"],
  publicFields: ["number_order", "arabic", "transliteration", "meaning_en", "meaning_id"],
  indexes: [{ fields: ["number_order"], unique: true }],
});

export const wxEngineRunModel = defineModel({
  name: "wx.engine.run",
  table: "wx_engine_runs",
  schema: z.object({
    run_key: z.string().min(1).max(120),
    module_code: z.string().min(1).max(80),
    module_version: z.string().max(40).default("1.0.0"),
    input_json: z.string().default("{}"),
    output_json: z.string().default("{}"),
    findings_count: z.number().int().min(0).default(0),
    digest: z.string().min(16).max(128),
    run_status: z.enum(["completed", "failed"]).default("completed"),
  }),
  softDelete: false,
  restEnabled: true,
  searchFields: ["run_key", "module_code", "digest"],
  publicFields: ["run_key", "module_code", "findings_count", "digest", "run_status"],
  indexes: [{ fields: ["run_key"], unique: true }, { fields: ["module_code"] }],
});
