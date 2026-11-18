import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon } from "@moonwitness/addon-audit";
import { authAddon } from "@moonwitness/addon-auth";
import { storageAddon } from "./index.js";

describe("@moonwitness/addon-storage", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-storage-"));
    dirs.push(dir);
    await initDb(join(dir, "storage.db"));
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

  it("syncs storage tables cleanly and exposes proxy actionBindings", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      storageAddon,
    ]);
    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining(["storage_buckets", "storage_objects", "storage_upload_sessions"]),
    );
    const view = await runtime.getViewDescriptor("storage.bucket", "editor");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/storage/buckets");
  });
});
