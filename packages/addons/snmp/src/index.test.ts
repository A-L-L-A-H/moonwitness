import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon } from "@moonwitness/addon-audit";
import { authAddon } from "@moonwitness/addon-auth";
import { snmpAddon } from "./index.js";

describe("@moonwitness/addon-snmp", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-snmp-"));
    dirs.push(dir);
    await initDb(join(dir, "snmp.db"));
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

  it("syncs SNMP tables and exposes proxy actionBindings", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      snmpAddon,
    ]);
    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining(["snmp_devices", "snmp_targets", "snmp_samples"]),
    );
    const view = await runtime.getViewDescriptor("snmp.device", "editor");
    expect(view?.extensible).toBe(true);
    expect(view?.actionBindings.createUrl).toBe("/api/v1/snmp/devices");
  });
});
