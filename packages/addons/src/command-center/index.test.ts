import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, getDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { commandCenterAddon, workflowModel } from "./index.js";

describe("../command-center", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-cc-"));
    dirs.push(dir);
    await initDb(join(dir, "cc.db"));
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

  it("backfills legacy workflows and publishes state-machine actionBindings", async () => {
    await getDb().run(
      `CREATE TABLE command_center_workflows (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        name TEXT NOT NULL,
        detail TEXT NOT NULL,
        status TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )`,
    );
    await getDb().run(
      `INSERT INTO command_center_workflows (id, actor_id, name, detail, status, sort_order)
       VALUES ('wf-legacy-1', '1', 'Build Index', 'Syncing shards', 'Queued', 0)`,
    );

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      commandCenterAddon,
    ]);

    const rows = await workflowModel.repository.find({ workflow_key: "wf-legacy-1" });
    expect(rows).toHaveLength(1);
    const view = await runtime.getViewDescriptor("command.workflow", "editor");
    expect(view?.actionBindings.customActions?.[0]?.id).toBe("advance");
  });
});
