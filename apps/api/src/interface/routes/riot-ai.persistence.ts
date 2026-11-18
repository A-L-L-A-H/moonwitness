import {
  createActorContext,
  syncModels,
  type ActorContext,
} from "@moonwitness/orm";
import {
  providerConfigModel,
  providerConfigSchema,
  usageSummaryModel,
  usageSummarySchema,
} from "@moonwitness/addons/ai";

export { providerConfigSchema, usageSummarySchema };

export interface ProviderConfigInput {
  profileKey: string;
  label: string;
  enabled: boolean;
  preferredModel: string | null;
}

export async function initializeRiotAiPersistence(): Promise<void> {
  await syncModels([providerConfigModel, usageSummaryModel]);
}

export async function getProviderConfig(profileKey: string, tenantId?: string) {
  const rows = await providerConfigModel.repository.find(
    { profile_key: profileKey },
    tenantId ? { limit: 1, tenantId } : { limit: 1 },
  );
  return rows[0] ?? null;
}

export async function maintainUsageRetention(retentionDays: number): Promise<number> {
  if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
    throw new RangeError("retentionDays must be a positive integer");
  }
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const rows = await usageSummaryModel.repository.find({
    occurred_at: { $lt: cutoff },
    status: { $ne: "deleted" },
  });
  const retentionActor = createActorContext("system:retention", "migration");
  let removed = 0;
  for (const row of rows) {
    const deleted = await usageSummaryModel.repository.delete(row.id, retentionActor);
    if (deleted) removed += 1;
  }
  return removed;
}

export async function upsertProviderConfig(input: ProviderConfigInput, actor: ActorContext) {
  return providerConfigModel.repository.upsert(
    { profile_key: input.profileKey },
    {
      profile_key: input.profileKey,
      label: input.label,
      provider: "ollama",
      enabled: input.enabled,
      preferred_model: input.preferredModel,
    },
    actor,
  );
}

export async function listProviderConfigHistory(profileKey: string, tenantId?: string) {
  const config = await getProviderConfig(profileKey, tenantId);
  if (!config) return [];
  return providerConfigModel.repository.history(config.id);
}

export async function getProviderConfigHistory(profileKey: string, tenantId?: string) {
  return listProviderConfigHistory(profileKey, tenantId);
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
  tenantId?: string;
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
    createActorContext(input.actorId, "api", undefined, input.tenantId),
  );
}

export async function listOperatorUsageSummary(options: {
  limit: number;
  since: string;
  tenantId?: string;
}) {
  const rows = await usageSummaryModel.repository.find(
    {
      occurred_at: { $gte: options.since },
      status: { $ne: "deleted" },
    },
    {
      limit: options.limit,
      orderBy: [
        { field: "occurred_at", direction: "DESC" },
        { field: "id", direction: "DESC" },
      ],
      ...(options.tenantId ? { tenantId: options.tenantId } : {}),
    },
  );
  return rows.map((row) => ({
    actorId: row.actor_id,
    provider: row.provider,
    model: row.model,
    outcome: row.outcome,
    durationMs: row.duration_ms,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    errorCode: row.error_code,
    occurredAt: row.occurred_at,
  }));
}
