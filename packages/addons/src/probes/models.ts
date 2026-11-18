import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const probeNodeSchema = z.object({
  node_key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  target_url: z.string().url().max(1000),
  category: z.string().min(1).max(80),
  enabled: z.boolean().default(true),
  metadata_json: z.string().nullable().default(null),
});

export const probeNodeModel = defineModel({
  name: "probe.node",
  table: "orm_probe_nodes",
  schema: probeNodeSchema,
  extensible: true,
  restEnabled: false,
  publicFields: ["node_key", "name", "target_url", "category", "enabled"],
  indexes: [
    { fields: ["node_key"], unique: true },
    { fields: ["category"] },
    { fields: ["enabled"] },
  ],
});

export const probeEventSchema = z.object({
  node_key: z.string().min(1).max(120),
  status_code: z.number().int(),
  ok: z.boolean(),
  latency_ms: z.number().int().nonnegative(),
  actor_sub: z.string().max(200).nullable().default(null),
  checked_at: z.string(),
  error_message: z.string().max(1000).nullable().default(null),
});

export const probeEventModel = defineModel({
  name: "probe.event",
  table: "orm_probe_events",
  schema: probeEventSchema,
  softDelete: false,
  restEnabled: false,
  indexes: [{ fields: ["node_key", "checked_at"] }, { fields: ["checked_at"] }, { fields: ["ok"] }],
});

export const opsEventSchema = z.object({
  event_key: z.string().min(1).max(200),
  kind: z.string().min(1).max(80),
  era: z.string().max(80).nullable().default(null),
  date: z.string().max(40).nullable().default(null),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(2000).nullable().default(null),
  body: z.string().nullable().default(null),
  location: z.string().max(300).nullable().default(null),
  tags_json: z.string().nullable().default(null),
  sources_count: z.number().int().nonnegative().default(0),
  notes_count: z.number().int().nonnegative().default(0),
  image_key: z.string().max(120).nullable().default(null),
  image_position: z.string().max(120).nullable().default(null),
  related_json: z.string().nullable().default(null),
  payload_json: z.string().nullable().default(null),
});

export const opsEventModel = defineModel({
  name: "ops.event",
  table: "ops_events",
  schema: opsEventSchema,
  restEnabled: true,
  publicFields: ["event_key", "kind", "title", "date"],
  indexes: [
    { fields: ["event_key"], unique: true },
    { fields: ["kind"] },
    { fields: ["era"] },
    { fields: ["date"] },
  ],
});
