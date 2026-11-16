import { getDb } from "@moonwitness/orm";

export interface UsageSummaryInput {
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
}

export type TokenMeasurement = {
  value: number | null;
  measurement: "measured" | "estimated" | "unavailable";
};

export interface UsageSummaryRecord {
  actorId: string;
  provider: "ollama";
  model: string;
  outcome: "success" | "failure";
  durationMs: number;
  promptTokens: TokenMeasurement;
  completionTokens: TokenMeasurement;
  totalTokens: TokenMeasurement;
  errorCode: string | null;
  occurredAt: string;
}

function measured(value: number | null): TokenMeasurement {
  return value === null
    ? { value: null, measurement: "unavailable" }
    : { value, measurement: "measured" };
}

export async function writeUsageSummary(input: UsageSummaryInput): Promise<void> {
  await getDb().run(
    `INSERT INTO riot_ai_usage_summaries (
       actor_id, provider, model, outcome, duration_ms, prompt_tokens,
       completion_tokens, total_tokens, error_code, occurred_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.actorId,
      input.provider,
      input.model,
      input.outcome,
      input.durationMs,
      input.promptTokens,
      input.completionTokens,
      input.totalTokens,
      input.errorCode ?? null,
      input.occurredAt,
    ],
  );
}

export async function listUsageSummary(
  actorId: string,
  options: { limit: number; since: string },
): Promise<UsageSummaryRecord[]> {
  const rows = await getDb().all<Record<string, unknown>>(
    `SELECT actor_id, provider, model, outcome, duration_ms, prompt_tokens, completion_tokens,
            total_tokens, error_code, occurred_at
       FROM riot_ai_usage_summaries
      WHERE actor_id = ? AND occurred_at >= ?
      ORDER BY occurred_at DESC, rowid DESC
      LIMIT ?`,
    [actorId, options.since, options.limit],
  );
  return rows.map((row) => ({
    actorId: String(row.actor_id),
    provider: "ollama",
    model: String(row.model),
    outcome: String(row.outcome) as UsageSummaryRecord["outcome"],
    durationMs: Number(row.duration_ms),
    promptTokens: measured(row.prompt_tokens === null ? null : Number(row.prompt_tokens)),
    completionTokens: measured(
      row.completion_tokens === null ? null : Number(row.completion_tokens),
    ),
    totalTokens: measured(row.total_tokens === null ? null : Number(row.total_tokens)),
    errorCode: row.error_code === null ? null : String(row.error_code),
    occurredAt: String(row.occurred_at),
  }));
}

export async function purgeUsageSummaries(before: string): Promise<number> {
  const result = await getDb().run("DELETE FROM riot_ai_usage_summaries WHERE occurred_at < ?", [
    before,
  ]);
  return result.rowsAffected;
}
