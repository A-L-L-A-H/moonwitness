import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, getDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { probeNodeModel, probesAddon } from "./index.js";

describe("../probes", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-probes-"));
    dirs.push(dir);
    await initDb(join(dir, "probes.db"));
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

  it("syncs probe models cleanly and imports legacy igate_nodes", async () => {
    await getDb().run(
      `CREATE TABLE igate_nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        category TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1
      )`,
    );
    await getDb().run(
      `INSERT INTO igate_nodes (id, name, target_url, category, enabled)
       VALUES ('edge-1', 'Edge API', 'https://api.moonwitness.biz.id/health', 'api', 1)`,
    );

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      probesAddon,
    ]);

    const rows = await probeNodeModel.repository.find({ node_key: "edge-1" });
    expect(rows).toHaveLength(1);
    const view = await runtime.getViewDescriptor("probe.node", "editor");
    expect(view?.actionBindings.createUrl).toBe("/api/v1/probes/targets");
  });
});
