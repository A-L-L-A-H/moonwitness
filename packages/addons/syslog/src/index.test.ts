import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon } from "@moonwitness/addon-audit";
import { authAddon } from "@moonwitness/addon-auth";
import { syslogAddon } from "./index.js";

describe("@moonwitness/addon-syslog", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-syslog-"));
    dirs.push(dir);
    await initDb(join(dir, "syslog.db"));
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

  it("syncs syslog_entries table without SQL migrations", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      syslogAddon,
    ]);
    expect(syncReport.createdTables).toContain("syslog_entries");
  });
});
