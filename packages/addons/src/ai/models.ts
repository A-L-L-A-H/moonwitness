import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const providerConfigSchema = z.object({
  profile_key: z.string().min(1).max(100),
  label: z.string().min(1).max(120),
  provider: z.literal("ollama"),
  enabled: z.boolean().default(true),
  preferred_model: z.string().max(200).nullable().default(null),
});

export const providerConfigModel = defineModel({
  name: "riot_ai.provider_config",
  table: "riot_ai_provider_configs",
  schema: providerConfigSchema,
  restEnabled: false,
  publicFields: ["profile_key", "label", "provider", "enabled", "preferred_model"],
  indexes: [{ fields: ["tenant_id", "profile_key"], unique: true }],
});

export const usageSummarySchema = z.object({
  actor_id: z.string().min(1).max(200),
  provider: z.literal("ollama"),
  model: z.string().min(1).max(200),
  outcome: z.enum(["success", "failure"]),
  duration_ms: z.number().int().nonnegative(),
  prompt_tokens: z.number().int().nonnegative().nullable().default(null),
  completion_tokens: z.number().int().nonnegative().nullable().default(null),
  total_tokens: z.number().int().nonnegative().nullable().default(null),
  error_code: z.string().max(100).nullable().default(null),
  occurred_at: z.string(),
});

export const usageSummaryModel = defineModel({
  name: "riot_ai.usage_summary",
  table: "riot_ai_usage_summaries",
  schema: usageSummarySchema,
  softDelete: false,
  restEnabled: false,
  indexes: [{ fields: ["actor_id", "occurred_at"] }, { fields: ["occurred_at"] }],
});

export const memoryRecordSchema = z.object({
  record_key: z.string().min(1).max(200),
  owner_id: z.string().max(200).nullable().default(null),
  scope: z.string().min(1).max(80).default("global"),
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(300),
  summary: z.string().max(4000).nullable().default(null),
  content: z.string().nullable().default(null),
  tags_json: z.string().nullable().default(null),
  metadata_json: z.string().nullable().default(null),
  retention_days: z.number().int().positive().nullable().default(null),
  expires_at: z.string().nullable().default(null),
});

export const memoryRecordModel = defineModel({
  name: "memory.record",
  table: "memory_records",
  schema: memoryRecordSchema,
  extensible: true,
  restEnabled: true,
  publicFields: ["record_key", "kind", "title", "scope"],
  indexes: [
    { fields: ["tenant_id", "record_key"], unique: true },
    { fields: ["owner_id", "scope"] },
    { fields: ["kind"] },
    { fields: ["expires_at"] },
  ],
});
