import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { closeDb, createActorContext, defineModel, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import { auditAddon, auditLogModel, listAuditLogs, recordAuditLog } from "./index.js";

const sampleEntity = defineModel({
  name: "sample.record",
  table: "sample_records",
  schema: z.object({ label: z.string().min(1) }),
});

describe("../audit", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-audit-"));
    dirs.push(dir);
    await initDb(join(dir, "audit.db"));
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  afterAll(() => {
    for (const dir of dirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on cleanup.
      }
    }
  });

  it("captures ORM mutations via outbox hook into ops_audit_logs", async () => {
    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      {
        manifest: {
          name: "sample_mod",
          version: "0.1.0",
          depends: ["__base", "audit"],
          provides: { models: ["sample.record"] },
        },
        models: [sampleEntity],
      },
    ]);

    const actor = createActorContext("user-1", "api", "req-audit-1");
    const created = await sampleEntity.repository.create({ label: "hello" }, actor);
    const logs = await listAuditLogs({ domain: "sample" });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.entityId).toBe(created.id);
    expect(logs[0]?.action).toBe("CREATE");
  });

  it("isolates audit logs by tenantId and maps model domain prefixes", async () => {
    const authProbeModel = defineModel({
      name: "auth.probe",
      table: "audit_test_auth_probes",
      schema: z.object({ label: z.string().min(1) }),
    });
    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      {
        manifest: {
          name: "auth_probe_mod",
          version: "0.1.0",
          depends: ["__base", "audit"],
          provides: { models: ["auth.probe"] },
        },
        models: [authProbeModel],
      },
    ]);

    const actorAlpha = createActorContext("user-alpha", "api", "req-alpha", "tenant-alpha");
    await authProbeModel.repository.create({ label: "alpha-item" }, actorAlpha);

    await recordAuditLog({
      domain: "identity",
      entity: "custom.note",
      entityId: "note-beta",
      action: "EXECUTE",
      actor: createActorContext("user-beta", "api", "req-beta", "tenant-beta"),
      tenantId: "tenant-beta",
    });

    const alphaLogs = await listAuditLogs({ domain: "identity", tenantId: "tenant-alpha" });
    expect(alphaLogs).toHaveLength(1);
    expect(alphaLogs[0]?.entity).toBe("auth.probe");
    expect(alphaLogs[0]?.actorId).toBe("user-alpha");

    const betaLogs = await listAuditLogs({ domain: "identity", tenantId: "tenant-beta" });
    expect(betaLogs).toHaveLength(1);
    expect(betaLogs[0]?.entityId).toBe("note-beta");

    const storedAlpha = await auditLogModel.repository.find({}, { tenantId: "tenant-alpha" });
    expect(storedAlpha).toHaveLength(1);
    expect(storedAlpha[0]?.tenant_id).toBe("tenant-alpha");
  });
});
