import { afterEach, describe, expect, it } from "vitest";
import { applyMigrations, closeDb, createActorContext, getDb, initDb } from "@moonwitness/orm";
import { domainMigrations } from "./domain";
import { recordAuditLog } from "../audit/audit-log";
import { opsEventModel } from "./domain/ops-events";

describe("domain migrations (P0)", () => {
  afterEach(() => {
    closeDb();
  });

  it("applies all domain migrations idempotently and creates expected tables", async () => {
    await initDb(`file:${crypto.randomUUID()}.db`);
    const first = await applyMigrations(domainMigrations);
    expect(first.applied.length).toBeGreaterThan(0);

    const second = await applyMigrations(domainMigrations);
    expect(second.applied).toHaveLength(0);
    expect(second.skipped.length).toBe(domainMigrations.length);

    const tables = await getDb().all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = tables.map((t) => t.name);

    // legacy/core tables still present
    for (const t of [
      "users",
      "sessions",
      "bff_oauth_tokens",
      "command_center_workflows",
      "command_center_alerts",
      "igate_nodes",
      "igate_probe_events",
      "riot_ai_provider_configs",
      "riot_ai_usage_summaries",
    ]) {
      expect(names, `missing legacy table ${t}`).toContain(t);
    }

    // new domain tables
    for (const t of [
      "ops_audit_logs",
      "identity_user_profiles",
      "identity_sessions",
      "identity_oauth_tokens",
      "identity_auth_events",
      "storage_buckets",
      "storage_objects",
      "storage_upload_sessions",
      "ops_events",
      "orm_probe_nodes",
      "orm_probe_events",
      "command_center_workflows_orm",
      "command_center_alerts_orm",
      "control_command_history",
      "memory_records",
      "syslog_entries",
      "snmp_devices",
      "snmp_targets",
      "snmp_samples",
      "radius_clients",
      "radius_sessions",
    ]) {
      expect(names, `missing domain table ${t}`).toContain(t);
    }
  });

  it("supports audit log and ops event smoke writes", async () => {
    await initDb(`file:${crypto.randomUUID()}.db`);
    await applyMigrations(domainMigrations);

    await recordAuditLog({
      domain: "test",
      entity: "thing",
      entityId: "1",
      action: "CREATE",
      outcome: "success",
      occurredAt: new Date().toISOString(),
    });
    const audit = await getDb().all<Record<string, unknown>>("SELECT * FROM ops_audit_logs");
    expect(audit).toHaveLength(1);
    expect(audit[0]?.domain).toBe("test");

    const actor = createActorContext(null, "api");
    await opsEventModel.repository.create(
      {
        event_key: "evt-smoke-1",
        kind: "PROJECT",
        title: "Smoke event",
        era: null,
        date: "2026-11-17",
        excerpt: null,
        body: null,
        location: null,
        tags_json: null,
        sources_count: 0,
        notes_count: 0,
        image_key: null,
        image_position: null,
        related_json: null,
        payload_json: null,
      } as any,
      actor,
    );
    const found = await opsEventModel.repository.find({ event_key: "evt-smoke-1" } as any);
    expect(found).toHaveLength(1);
    expect((found[0] as any).title).toBe("Smoke event");
  });
});