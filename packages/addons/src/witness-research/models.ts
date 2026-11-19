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
