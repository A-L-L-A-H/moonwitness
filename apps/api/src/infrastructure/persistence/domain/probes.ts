import { z } from "zod";
import { defineModel, type Migration } from "@moonwitness/orm";

export const probeNodeSchema = z.object({
  node_key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  target_url: z.string().url().max(1000),
  category: z.string().min(1).max(80),
  enabled: z.boolean().default(true),
  metadata_json: z.string().nullable(),
});

export const probeEventSchema = z.object({
  node_key: z.string().min(1).max(120),
  status_code: z.number().int(),
  ok: z.boolean(),
  latency_ms: z.number().int().nonnegative(),
  actor_sub: z.string().max(200).nullable(),
  checked_at: z.string().datetime(),
  error_message: z.string().max(1000).nullable(),
});

export const probeNodeModel = defineModel({
  name: "probe.node",
  table: "orm_probe_nodes",
  schema: probeNodeSchema,
  indexes: [
    { fields: ["node_key"], unique: true },
    { fields: ["category"] },
    { fields: ["enabled"] },
  ],
});

export const probeEventModel = defineModel({
  name: "probe.event",
  table: "orm_probe_events",
  schema: probeEventSchema,
  softDelete: false,
  indexes: [{ fields: ["node_key", "checked_at"] }, { fields: ["checked_at"] }, { fields: ["ok"] }],
});

export const probeOrmMigrations: Migration[] = [
  { id: "050_create_orm_probe_nodes", up: probeNodeModel.ddl },
  { id: "051_create_orm_probe_events", up: probeEventModel.ddl },
];
