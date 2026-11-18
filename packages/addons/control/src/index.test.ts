import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon } from "@moonwitness/addon-audit";
import { authAddon } from "@moonwitness/addon-auth";
import { controlAddon } from "./index.js";

describe("@moonwitness/addon-control", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-ctrl-"));
    dirs.push(dir);
    await initDb(join(dir, "ctrl.db"));
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

  it("syncs control_command_history without SQL migrations", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      controlAddon,
    ]);
    expect(syncReport.createdTables).toContain("control_command_history");
    const view = await runtime.getViewDescriptor("control.command", "admin");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/control/audit");
  });
});
