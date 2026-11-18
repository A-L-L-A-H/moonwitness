import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { closeDb, createActorContext, defineModel, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon, listAuditLogs } from "./index.js";

const sampleEntity = defineModel({
  name: "sample.record",
  table: "sample_records",
  schema: z.object({ label: z.string().min(1) }),
});

describe("@moonwitness/addon-audit", () => {
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
});
