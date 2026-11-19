import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import { timelineAddon, TimelineRepository } from "../timeline";
import { canonLoreAddon } from "./index.js";

describe("../canon-lore", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-canon-"));
    dirs.push(dir);
    await initDb(join(dir, "canon.db"));
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

  it("extends timeline.event cleanly with canon columns and creates canon tables", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      timelineAddon,
      canonLoreAddon,
    ]);

    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining(["canon_codex_entries", "canon_entities", "canon_episodes"]),
    );
    const tlView = await runtime.getViewDescriptor("timeline.event", "viewer");
    const fieldNames = tlView?.fields.map((f) => f.field_name) ?? [];
    expect(fieldNames).toEqual(
      expect.arrayContaining(["canon_tier", "episode_code", "witness_status"]),
    );

    const repo = new TimelineRepository();
    const evt = await repo.createEvent({
      kind: "STORY",
      date: "2026-11-18",
      era: "origins",
      title: "Canon Tier Event",
      excerpt: "Test",
      body: "Body",
      location: "Vault",
      tags: [],
      sources: 1,
      notes: 0,
      image: "hero-witness",
      related: [],
      canon_tier: "apocrypha",
    } as Parameters<TimelineRepository["createEvent"]>[0]);
    expect(evt.id).toBeTruthy();
  });
});
