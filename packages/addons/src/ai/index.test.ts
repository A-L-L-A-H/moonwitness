import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { aiAddon } from "./index.js";

describe("../ai", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-ai-"));
    dirs.push(dir);
    await initDb(join(dir, "ai.db"));
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

  it("syncs riot_ai and memory_records tables cleanly via zero-migration syncModels", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      aiAddon,
    ]);
    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining([
        "riot_ai_provider_configs",
        "riot_ai_usage_summaries",
        "memory_records",
      ]),
    );
    const view = await runtime.getViewDescriptor("memory.record", "editor");
    expect(view?.extensible).toBe(true);
    expect(view?.actionBindings.createUrl).toBe("/api/v1/memory/entries");
  });
});
