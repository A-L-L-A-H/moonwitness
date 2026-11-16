import { z } from "zod";
import {
  applyMigrations,
  createActorContext,
  defineModel,
  getDb,
  type ActorContext,
  type Migration,
} from "@moonwitness/orm";

export const providerConfigSchema = z.object({
  profile_key: z.string().min(1).max(100),
  label: z.string().min(1).max(120),
  provider: z.literal("ollama"),
  enabled: z.boolean(),
  preferred_model: z.string().max(200).nullable(),
});

const providerConfigModel = defineModel({
  name: "riot_ai.provider_config",
  table: "riot_ai_provider_configs",
  schema: providerConfigSchema,
  indexes: [{ fields: ["profile_key"], unique: true }],
});

export const usageSummarySchema = z.object({
  actor_id: z.string().min(1).max(200),
  provider: z.literal("ollama"),
  model: z.string().min(1).max(200),
  outcome: z.enum(["success", "failure"]),
  duration_ms: z.number().int().nonnegative(),
  prompt_tokens: z.number().int().nonnegative().nullable(),
  completion_tokens: z.number().int().nonnegative().nullable(),
  total_tokens: z.number().int().nonnegative().nullable(),
  error_code: z.string().max(100).nullable(),
  occurred_at: z.string().datetime(),
});

const usageSummaryModel = defineModel({
  name: "riot_ai.usage_summary",
  table: "riot_ai_usage_summaries",
  schema: usageSummarySchema,
  indexes: [{ fields: ["actor_id", "occurred_at"] }, { fields: ["occurred_at"] }],
});

export const riotAiMigrations: Migration[] = [
  { id: "001_create_riot_ai_provider_configs", up: providerConfigModel.ddl },
  { id: "002_create_riot_ai_usage_summaries", up: usageSummaryModel.ddl },
];

export interface ProviderConfigInput {
  profileKey: string;
  label: string;
  enabled: boolean;
  preferredModel: string | null;
}

export async function getProviderConfig(profileKey: string) {
  const rows = await providerConfigModel.repository.find({ profile_key: profileKey });
  return rows[0] ?? null;
}

async function ensureRiotAiAuditTable(): Promise<void> {
  await getDb().run(`
    CREATE TABLE IF NOT EXISTS _orm_audit_log (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changed_by TEXT,
      changed_at TEXT NOT NULL,
      diff TEXT NOT NULL,
      entity_version INTEGER NOT NULL,
      source TEXT NOT NULL,
      request_id TEXT
    )
  `);
  await getDb().run(
    "CREATE INDEX IF NOT EXISTS idx_audit_model_entity ON _orm_audit_log (model, entity_id, changed_at)",
  );
}

export async function maintainUsageRetention(retentionDays: number): Promise<number> {
  if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
    throw new RangeError("retentionDays must be a positive integer");
  }
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  await ensureRiotAiAuditTable();
  return getDb().transaction(async (transaction) => {
    const rows = await transaction.all<Record<string, unknown>>(
      `SELECT id, actor_id, provider, model, outcome, duration_ms, prompt_tokens,
              completion_tokens, total_tokens, error_code, occurred_at
         FROM riot_ai_usage_summaries
        WHERE occurred_at < ? AND status != 'deleted'`,
      [cutoff],
    );
    let removed = 0;
    for (const row of rows) {
      const current = await transaction.get<Record<string, unknown>>(
        "SELECT * FROM riot_ai_usage_summaries WHERE id = ? AND status != 'deleted'",
        [row.id],
      );
      if (!current) continue;
      const now = new Date().toISOString();
      const version = Number(current.version) + 1;
      const actor = createActorContext("system:retention", "migration");
      const result = await transaction.run(
        `UPDATE riot_ai_usage_summaries
            SET status = 'deleted', deleted_uid = ?, deleted_date = ?,
                write_uid = ?, write_date = ?, version = ?, source = ?
          WHERE id = ? AND version = ?`,
        [actor.actorId, now, actor.actorId, now, version, actor.source, row.id, current.version],
      );
      if (result.rowsAffected !== 1) continue;
      const auditEntry = usageSummaryModel.auditHook(
        {
          ...current,
          status: "deleted",
          deleted_uid: actor.actorId,
          deleted_date: new Date(now),
          write_uid: actor.actorId,
          write_date: new Date(now),
          version,
          source: actor.source,
        },
        "DELETE",
        current,
      );
      await transaction.run(
        `INSERT INTO _orm_audit_log (
           id, model, entity_id, action, changed_by, changed_at, diff,
           entity_version, source, request_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditEntry.id,
          auditEntry.model,
          auditEntry.entity_id,
          auditEntry.action,
          actor.actorId,
          auditEntry.changed_at,
          auditEntry.diff,
          auditEntry.entity_version,
          actor.source,
          actor.requestId ?? null,
        ],
      );
      removed += 1;
    }
    return removed;
  });
}

export async function initializeRiotAiPersistence(): Promise<void> {
  await applyMigrations(riotAiMigrations);
}

export async function upsertProviderConfig(input: ProviderConfigInput, actor: ActorContext) {
  await ensureRiotAiAuditTable();
  await getDb().transaction(async (transaction) => {
    const existing = await transaction.get<Record<string, unknown>>(
      `SELECT * FROM riot_ai_provider_configs
        WHERE profile_key = ? AND status != 'deleted'`,
      [input.profileKey],
    );
    if (existing) {
      const currentVersion = Number(existing.version);
      const now = new Date();
      const next = {
        ...existing,
        label: input.label,
        provider: "ollama",
        enabled: input.enabled ? 1 : 0,
        preferred_model: input.preferredModel,
        write_uid: actor.actorId,
        write_date: now.toISOString(),
        version: currentVersion + 1,
        source: actor.source,
      };
      const result = await transaction.run(
        `UPDATE riot_ai_provider_configs
            SET label = ?, provider = ?, enabled = ?, preferred_model = ?,
          write_uid = ?, write_date = ?, version = ?, source = ?
          WHERE id = ? AND version = ?`,
        [
          next.label,
          next.provider,
          next.enabled,
          next.preferred_model,
          next.write_uid,
          next.write_date,
          next.version,
          next.source,
          existing.id,
          currentVersion,
        ],
      );
      if (result.rowsAffected !== 1) {
        throw new Error("Provider configuration changed during update");
      }
      const entry = providerConfigModel.auditHook(next, "UPDATE", existing);
      const auditEntry = {
        ...entry,
        changed_by: actor.actorId,
        source: actor.source,
        request_id: actor.requestId ?? null,
      };
      await transaction.run(
        `INSERT INTO _orm_audit_log (
           id, model, entity_id, action, changed_by, changed_at, diff,
           entity_version, source, request_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditEntry.id,
          auditEntry.model,
          auditEntry.entity_id,
          auditEntry.action,
          auditEntry.changed_by,
          auditEntry.changed_at,
          auditEntry.diff,
          auditEntry.entity_version,
          auditEntry.source,
          auditEntry.request_id,
        ],
      );
      return;
    }

    const now = new Date();
    const record = {
      profile_key: input.profileKey,
      label: input.label,
      provider: "ollama",
      enabled: input.enabled,
      preferred_model: input.preferredModel,
      id: crypto.randomUUID(),
      create_uid: actor.actorId,
      create_date: now,
      write_uid: actor.actorId,
      write_date: now,
      status: "active",
      deleted_uid: null,
      deleted_date: null,
      version: 1,
      source: actor.source,
      source_ref: null,
    };
    const parsed = providerConfigModel.fullSchema.parse(record) as typeof record;
    await transaction.run(
      `INSERT INTO riot_ai_provider_configs (
         profile_key, label, provider, enabled, preferred_model, id, create_uid,
         create_date, write_uid, write_date, status, deleted_uid, deleted_date,
         version, source, source_ref
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsed.profile_key,
        parsed.label,
        parsed.provider,
        parsed.enabled ? 1 : 0,
        parsed.preferred_model,
        parsed.id,
        parsed.create_uid,
        parsed.create_date.toISOString(),
        parsed.write_uid,
        parsed.write_date.toISOString(),
        parsed.status,
        parsed.deleted_uid,
        parsed.deleted_date,
        parsed.version,
        parsed.source,
        parsed.source_ref,
      ],
    );
    const entry = providerConfigModel.auditHook(parsed, "CREATE", null);
    await transaction.run(
      `INSERT INTO _orm_audit_log (
         id, model, entity_id, action, changed_by, changed_at, diff,
         entity_version, source, request_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.model,
        entry.entity_id,
        entry.action,
        actor.actorId,
        entry.changed_at,
        entry.diff,
        entry.entity_version,
        entry.source,
        actor.requestId ?? null,
      ],
    );
  });
  const config = await getProviderConfig(input.profileKey);
  if (!config) throw new Error("Provider configuration could not be reloaded");
  return config;
}

export async function listProviderConfigHistory(profileKey: string) {
  const config = await getProviderConfig(profileKey);
  if (!config) return [];
  return providerConfigModel.repository.history(config.id);
}

export async function getProviderConfigHistory(profileKey: string) {
  return listProviderConfigHistory(profileKey);
}

export async function writeUsageSummary(input: {
  actorId: string;
  provider: "ollama";
  model: string;
  outcome: "success" | "failure";
  durationMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  errorCode?: string;
  occurredAt: string;
}): Promise<void> {
  await usageSummaryModel.repository.create(
    {
      actor_id: input.actorId,
      provider: input.provider,
      model: input.model,
      outcome: input.outcome,
      duration_ms: input.durationMs,
      prompt_tokens: input.promptTokens,
      completion_tokens: input.completionTokens,
      total_tokens: input.totalTokens,
      error_code: input.errorCode ?? null,
      occurred_at: input.occurredAt,
    },
    createActorContext(input.actorId, "api"),
  );
}

export async function listOperatorUsageSummary(options: { limit: number; since: string }) {
  const rows = await getDb().all<Record<string, unknown>>(
    `SELECT actor_id, provider, model, outcome, duration_ms, prompt_tokens,
            completion_tokens, total_tokens, error_code, occurred_at
       FROM riot_ai_usage_summaries
      WHERE status != 'deleted' AND occurred_at >= ?
      ORDER BY occurred_at DESC, id DESC
      LIMIT ?`,
    [options.since, options.limit],
  );
  return rows.map((row) => ({
    actorId: String(row.actor_id),
    provider: String(row.provider),
    model: String(row.model),
    outcome: String(row.outcome) as "success" | "failure",
    durationMs: Number(row.duration_ms),
    promptTokens: row.prompt_tokens === null ? null : Number(row.prompt_tokens),
    completionTokens: row.completion_tokens === null ? null : Number(row.completion_tokens),
    totalTokens: row.total_tokens === null ? null : Number(row.total_tokens),
    errorCode: row.error_code === null ? null : String(row.error_code),
    occurredAt: String(row.occurred_at),
  }));
}
