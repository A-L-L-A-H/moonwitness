import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const timelineEventCanonExtension = z.object({
  canon_tier: z.enum(["canonical", "apocrypha", "draft"]).default("canonical"),
  episode_code: z.string().max(40).nullable().default(null),
  witness_status: z.enum(["corroborated", "disputed", "unverified"]).default("corroborated"),
});

export const canonCodexModel = defineModel({
  name: "canon.codex",
  table: "canon_codex_entries",
  schema: z.object({
    slug: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    summary: z.string().max(1000).default(""),
    body: z.string().default(""),
    era_key: z.string().max(80).nullable().default(null),
    canon_tier: z.enum(["canonical", "apocrypha", "draft"]).default("canonical"),
  }),
  extensible: true,
  restEnabled: true,
  publicFields: ["slug", "title", "summary", "era_key", "canon_tier"],
  indexes: [{ fields: ["slug"], unique: true }, { fields: ["era_key"] }],
});

export const canonEntityModel = defineModel({
  name: "canon.entity",
  table: "canon_entities",
  schema: z.object({
    slug: z.string().min(1).max(120),
    name: z.string().min(1).max(200),
    entity_kind: z.enum(["person", "faction", "location", "artifact", "signal"]).default("person"),
    faction: z.string().max(120).nullable().default(null),
    bio: z.string().default(""),
  }),
  extensible: true,
  restEnabled: true,
  publicFields: ["slug", "name", "entity_kind", "faction"],
  indexes: [{ fields: ["slug"], unique: true }, { fields: ["entity_kind"] }],
});

export const canonEpisodeModel = defineModel({
  name: "canon.episode",
  table: "canon_episodes",
  schema: z.object({
    code: z.string().min(1).max(40),
    title: z.string().min(1).max(200),
    arc: z.string().max(120).default("Season 1"),
    release_order: z.number().int().default(1),
    synopsis: z.string().default(""),
  }),
  extensible: true,
  restEnabled: true,
  publicFields: ["code", "title", "arc", "release_order"],
  indexes: [{ fields: ["code"], unique: true }, { fields: ["release_order"] }],
});
