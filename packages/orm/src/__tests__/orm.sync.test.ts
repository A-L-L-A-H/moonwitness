import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  closeDb,
  defineModel,
  extendModel,
  getDb,
  initDb,
  modelRegistry,
  syncModels,
  translateSqlForPostgres,
} from "../index.js";

describe("ORM zero-migration syncModels engine", () => {
  beforeEach(() => {
    modelRegistry.clearForTests();
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearForTests();
  });

  it("creates missing tables and indexes idempotently without migration files", async () => {
    await initDb("file::memory:?cache=shared");

    const widget = defineModel({
      name: "sync.widget",
      table: "sync_widgets",
      schema: z.object({
        slug: z.string().min(1),
        count: z.number().int().default(0),
      }),
      indexes: [{ fields: ["slug"], unique: true }],
    });

    const first = await syncModels([widget]);
    expect(first.createdTables).toEqual(["sync_widgets"]);
    expect(first.createdIndexes).toEqual(["idx_sync_widgets_slug"]);
    expect(first.schemaHashes["sync.widget"]).toMatch(/^[a-f0-9]{64}$/);

    const second = await syncModels([widget]);
    expect(second.createdTables).toEqual([]);
    expect(second.addedColumns).toEqual([]);
    expect(second.createdIndexes).toEqual([]);
  });

  it("adds nullable and defaulted columns via ALTER TABLE while preserving existing rows and marking removed columns deprecated", async () => {
    await initDb("file::memory:?cache=shared");

    const v1 = defineModel({
      name: "sync.doc",
      table: "sync_docs",
      schema: z.object({
        title: z.string().min(1),
        legacy_tag: z.string().optional(),
      }),
    });
    await syncModels([v1]);
    const inserted = await v1.repository.create({ title: "Genesis", legacy_tag: "v1" });

    // Simulate updated code schema without legacy_tag and with new fields + index
    modelRegistry.clearForTests();
    const v2 = defineModel({
      name: "sync.doc",
      table: "sync_docs",
      extensible: true,
      schema: z.object({
        title: z.string().min(1),
        summary: z.string().nullable(),
        state: z.enum(["draft", "published"]).default("draft"),
      }),
      indexes: [{ fields: ["state"] }],
    });

    const report = await syncModels([v2]);
    expect(report.createdTables).toEqual([]);
    expect(report.addedColumns).toEqual([
      { table: "sync_docs", column: "summary" },
      { table: "sync_docs", column: "state" },
      { table: "sync_docs", column: "_attrs" },
    ]);
    expect(report.deprecatedColumns).toEqual([{ table: "sync_docs", column: "legacy_tag" }]);
    expect(report.createdIndexes).toContain("idx_sync_docs_state");

    const loaded = (await v2.repository.findOne(inserted.id)) as unknown as {
      title: string;
      state: string;
      _attrs: Record<string, unknown>;
    } | null;
    expect(loaded?.title).toBe("Genesis");
    expect(loaded?.state).toBe("draft");
    expect(loaded?._attrs).toEqual({});
  });

  it("rejects adding a non-nullable column without default on an existing table", async () => {
    await initDb("file::memory:?cache=shared");

    const v1 = defineModel({
      name: "sync.strict",
      table: "sync_strict_tbl",
      schema: z.object({
        name: z.string().min(1),
      }),
    });
    await syncModels([v1]);

    modelRegistry.clearForTests();
    const v2 = defineModel({
      name: "sync.strict",
      table: "sync_strict_tbl",
      schema: z.object({
        name: z.string().min(1),
        required_code: z.string().min(1),
      }),
    });

    await expect(syncModels([v2])).rejects.toThrow(
      /Cannot auto-sync non-nullable column 'required_code'.*sync_strict_tbl/,
    );
  });

  it("syncs extendModel() columns onto the target physical table", async () => {
    await initDb("file::memory:?cache=shared");

    const event = defineModel({
      name: "sync.event",
      table: "sync_events",
      schema: z.object({
        title: z.string().min(1),
      }),
    });
    await syncModels([event]);

    extendModel("sync.event", {
      addon: "lore-ext",
      fields: z.object({
        era_code: z.string().default("origins"),
      }),
      indexes: [{ fields: ["era_code"] }],
    });

    const report = await syncModels([event]);
    expect(report.addedColumns).toEqual([{ table: "sync_events", column: "era_code" }]);
    expect(report.createdIndexes).toEqual(["idx_sync_events_era_code"]);
  });

  it("backfills BaseMetadata on legacy tables when legacyBackfill is enabled", async () => {
    await initDb("file::memory:?cache=shared");
    await getDb().exec("CREATE TABLE legacy_items (code TEXT NOT NULL, label TEXT NOT NULL)");
    await getDb().run("INSERT INTO legacy_items (code, label) VALUES (?, ?)", ["L1", "First"]);

    const adopted = defineModel({
      name: "legacy.item",
      table: "legacy_items",
      schema: z.object({
        code: z.string().min(1),
        label: z.string().min(1),
      }),
    });

    const report = await syncModels([adopted], { legacyBackfill: true });
    expect(report.addedColumns.some((c) => c.column === "id")).toBe(true);
    expect(report.addedColumns.some((c) => c.column === "version")).toBe(true);

    const rows = await adopted.repository.find({ code: "L1" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBeTruthy();
    expect(rows[0]?.status).toBe("active");
    expect(rows[0]?.version).toBe(1);
  });

  it("translates PRAGMA index_list(table) to pg_indexes query in Postgres dialect", () => {
    const translated = translateSqlForPostgres("PRAGMA index_list(timeline_events)");
    expect(translated.sql).toBe(
      "SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'timeline_events'",
    );
  });
});
