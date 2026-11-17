import { afterEach, describe, expect, it } from "vitest";
import { applyMigrations, closeDb, createActorContext, getDb, initDb } from "@moonwitness/orm";
describe("RIOT Intelligence persistence", () => {
  afterEach(() => {
    closeDb();
  });

  it("migrates idempotently and isolates provider configuration audit ownership", async () => {
    await initDb(`file:${crypto.randomUUID()}.db`);
    const persistence = await import("./riot-ai.persistence");
    await applyMigrations(persistence.riotAiMigrations);
    await persistence.initializeRiotAiPersistence();
    await persistence.initializeRiotAiPersistence();

    const migrations = await getDb().all<{ id: string }>(
      "SELECT id FROM _orm_schema_migrations ORDER BY id",
    );
    expect(migrations.map((migration) => migration.id)).toEqual([
      "riotai_001_create_riot_ai_provider_configs",
      "riotai_002_create_riot_ai_usage_summaries",
    ]);

    const config = await persistence.upsertProviderConfig(
      {
        profileKey: "default",
        label: "Local runtime",
        enabled: true,
        preferredModel: "llama3.2",
      },
      createActorContext("operator-1", "api", "request-1"),
    );
    expect(config.create_uid).toBe("operator-1");
    expect(await persistence.getProviderConfig("default")).toMatchObject({
      enabled: true,
      preferred_model: "llama3.2",
    });
    const history = await persistence.getProviderConfigHistory("default");
    expect(history[0]).toMatchObject({
      action: "CREATE",
      changed_by: "operator-1",
      request_id: "request-1",
    });
    await persistence.upsertProviderConfig(
      {
        profileKey: "default",
        label: "Updated runtime",
        enabled: false,
        preferredModel: "llama3.2",
      },
      createActorContext("operator-2", "api", "request-2"),
    );
    const updatedHistory = await persistence.getProviderConfigHistory("default");
    expect(updatedHistory.find((entry) => entry.action === "UPDATE")).toMatchObject({
      action: "UPDATE",
      changed_by: "operator-2",
      request_id: "request-2",
    });
  });

  it("stores measured or unavailable usage per actor and applies retention", async () => {
    await closeDb();
    await initDb(`file:${crypto.randomUUID()}.db`);
    const persistence = await import("./riot-ai.persistence");
    await applyMigrations(persistence.riotAiMigrations);
    await persistence.initializeRiotAiPersistence();
    const now = new Date();
    await persistence.writeUsageSummary({
      actorId: "operator-1",
      provider: "ollama",
      model: "llama3.2",
      outcome: "success",
      durationMs: 120,
      promptTokens: 10,
      completionTokens: null,
      totalTokens: null,
      occurredAt: now.toISOString(),
    });
    await persistence.writeUsageSummary({
      actorId: "operator-2",
      provider: "ollama",
      model: "llama3.2",
      outcome: "failure",
      durationMs: 50,
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      occurredAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const entries = await persistence.listOperatorUsageSummary({
      limit: 10,
      since: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const recentEntries = entries.filter((entry) => entry.actorId === "operator-1");
    expect(recentEntries).toHaveLength(1);
    expect(recentEntries[0]).toMatchObject({
      actorId: "operator-1",
      promptTokens: 10,
      completionTokens: null,
    });

    const removed = await persistence.maintainUsageRetention(90);
    expect(removed).toBe(1);
    const remaining = await getDb().all<{ status: string }>(
      "SELECT status FROM riot_ai_usage_summaries WHERE status != 'deleted' ORDER BY occurred_at",
    );
    expect(remaining.map((row) => row.status)).toEqual(["active"]);
    const retained = await getDb().all<{ status: string }>(
      "SELECT status FROM riot_ai_usage_summaries ORDER BY occurred_at",
    );
    expect(retained.map((row) => row.status)).toEqual(["deleted", "active"]);
    const auditRows = await getDb().all<{ action: string; model: string }>(
      "SELECT action, model FROM _orm_audit_log WHERE model = 'riot_ai.usage_summary'",
    );
    expect(auditRows).toHaveLength(3);
    const retentionAudit = await getDb().get<{
      changed_by: string;
      source: string;
    }>(
      "SELECT changed_by, source FROM _orm_audit_log WHERE model = 'riot_ai.usage_summary' AND action = 'DELETE'",
    );
    expect(retentionAudit).toMatchObject({
      changed_by: "system:retention",
      source: "migration",
    });
  });
});
