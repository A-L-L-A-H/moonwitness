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
  doctorModels,
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

describe("ORM FK validation and doctor CLI", () => {
  beforeEach(() => {
    modelRegistry.clearForTests();
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearForTests();
  });

  it("detects missing FK on model table and reports in syncModels missingFks", async () => {
    await initDb("file::memory:?cache=shared");

    const author = defineModel({
      name: "sync.author",
      table: "sync_authors",
      schema: z.object({
        name: z.string().min(1),
      }),
    });
    await syncModels([author]);

    const book = defineModel({
      name: "sync.book",
      table: "sync_books",
      schema: z.object({
        title: z.string().min(1),
        author_id: z.string().optional(),
      }),
      relations: {
        author: { type: "many2one", model: "sync.author", targetField: "id", onDelete: "set null" },
      },
    });

    // Create book table WITHOUT the FK constraint (simulating drift)
    await getDb().exec(
      `CREATE TABLE IF NOT EXISTS sync_books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author_id TEXT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        create_date TEXT NOT NULL,
        write_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        source TEXT NOT NULL DEFAULT 'api'
      )`,
    );

    const report = await syncModels([author, book]);
    // The FK should be missing and reported, not created
    expect(report.missingFks).toHaveLength(1);
    expect(report.missingFks[0].kind).toBe("missing");
    expect(report.missingFks[0].table).toBe("sync_books");
    expect(report.missingFks[0].column).toBe("author_id");
    expect(report.missingFks[0].targetTable).toBe("sync_authors");
    expect(report.missingFks[0].targetColumn).toBe("id");
    expect(report.missingFks[0].expectedOnDelete).toBe("SET NULL");
  });

  it("detects ON DELETE mismatch and reports as ondelete_mismatch", async () => {
    await initDb("file::memory:?cache=shared");

    const author = defineModel({
      name: "sync.author2",
      table: "sync_authors2",
      schema: z.object({
        name: z.string().min(1),
      }),
    });
    await syncModels([author]);

    // Create book table WITH a FK that has ON DELETE RESTRICT (but model expects SET NULL)
    await getDb().exec(
      `CREATE TABLE IF NOT EXISTS sync_books2 (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author_id TEXT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        create_date TEXT NOT NULL,
        write_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        source TEXT NOT NULL DEFAULT 'api'
      )`,
    );
    await getDb().exec(
      `ALTER TABLE sync_books2 ADD CONSTRAINT fk_books2_author_id FOREIGN KEY (author_id) REFERENCES sync_authors2(id) ON DELETE RESTRICT`,
    );

    const book = defineModel({
      name: "sync.book2",
      table: "sync_books2",
      schema: z.object({
        title: z.string().min(1),
        author_id: z.string().optional(),
      }),
      relations: {
        author: { type: "many2one", model: "sync.author2", targetField: "id", onDelete: "set null" },
      },
    });

    const report = await syncModels([author, book]);
    expect(report.missingFks).toHaveLength(1);
    expect(report.missingFks[0].kind).toBe("ondelete_mismatch");
    expect(report.missingFks[0].table).toBe("sync_books2");
    expect(report.missingFks[0].column).toBe("author_id");
    expect(report.missingFks[0].expectedOnDelete).toBe("SET NULL");
    expect(report.missingFks[0].existingOnDelete).toBe("RESTRICT");
  });

  it("doctorModels detects missing FK without mutating database", async () => {
    await initDb("file::memory:?cache=shared");

    const author = defineModel({
      name: "sync.author3",
      table: "sync_authors3",
      schema: z.object({
        name: z.string().min(1),
      }),
    });
    await syncModels([author]);

    const book = defineModel({
      name: "sync.book3",
      table: "sync_books3",
      schema: z.object({
        title: z.string().min(1),
        author_id: z.string().optional(),
      }),
      relations: {
        author: { type: "many2one", model: "sync.author3", targetField: "id", onDelete: "set null" },
      },
    });

    // Create book table WITHOUT the FK constraint
    await getDb().exec(
      `CREATE TABLE IF NOT EXISTS sync_books3 (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author_id TEXT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        create_date TEXT NOT NULL,
        write_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        source TEXT NOT NULL DEFAULT 'api'
      )`,
    );

    const result = await doctorModels([author, book]);
    expect(result.ok).toBe(false);
    expect(result.missingFks).toHaveLength(1);
    expect(result.missingFks[0].kind).toBe("missing");
    expect(result.missingFks[0].table).toBe("sync_books3");
    expect(result.missingFks[0].column).toBe("author_id");
  });

  it("doctorModels detects ON DELETE mismatch", async () => {
    await initDb("file::memory:?cache=shared");

    const author = defineModel({
      name: "sync.author4",
      table: "sync_authors4",
      schema: z.object({
        name: z.string().min(1),
      }),
    });
    await syncModels([author]);

    // Create book table WITH a FK that has ON DELETE RESTRICT
    await getDb().exec(
      `CREATE TABLE IF NOT EXISTS sync_books4 (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author_id TEXT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        create_date TEXT NOT NULL,
        write_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        source TEXT NOT NULL DEFAULT 'api'
      )`,
    );
    await getDb().exec(
      `ALTER TABLE sync_books4 ADD CONSTRAINT fk_books4_author_id FOREIGN KEY (author_id) REFERENCES sync_authors4(id) ON DELETE RESTRICT`,
    );

    const book = defineModel({
      name: "sync.book4",
      table: "sync_books4",
      schema: z.object({
        title: z.string().min(1),
        author_id: z.string().optional(),
      }),
      relations: {
        author: { type: "many2one", model: "sync.author4", targetField: "id", onDelete: "set null" },
      },
    });

    const result = await doctorModels([author, book]);
    expect(result.ok).toBe(false);
    expect(result.missingFks).toHaveLength(1);
    expect(result.missingFks[0].kind).toBe("ondelete_mismatch");
    expect(result.missingFks[0].expectedOnDelete).toBe("SET NULL");
    expect(result.missingFks[0].existingOnDelete).toBe("RESTRICT");
  });

  it("doctorModels detects deprecated columns", async () => {
    await initDb("file::memory:?cache=shared");

    // Create table with extra column
    await getDb().exec(
      `CREATE TABLE IF NOT EXISTS sync_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        extra_col TEXT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        create_date TEXT NOT NULL,
        write_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        source TEXT NOT NULL DEFAULT 'api'
      )`,
    );

    const item = defineModel({
      name: "sync.item",
      table: "sync_items",
      schema: z.object({
        name: z.string().min(1),
      }),
    });

    const result = await doctorModels([item]);
    expect(result.deprecatedColumns).toHaveLength(1);
    expect(result.deprecatedColumns[0].table).toBe("sync_items");
    expect(result.deprecatedColumns[0].column).toBe("extra_col");
  });

  it("doctorModels detects many2many join table FK drift", async () => {
    await initDb("file::memory:?cache=shared");

    const user = defineModel({
      name: "sync.user",
      table: "sync_users",
      schema: z.object({
        name: z.string().min(1),
      }),
    });
    await syncModels([user]);

    const group = defineModel({
      name: "sync.group",
      table: "sync_groups",
      schema: z.object({
        name: z.string().min(1),
      }),
    });
    await syncModels([group]);

    const tag = defineModel({
      name: "sync.tag",
      table: "sync_tags",
      schema: z.object({
        name: z.string().min(1),
        user_ids: z.array(z.string()).optional(),
      }),
      relations: {
        users: { type: "many2many", model: "sync.user", through: "sync_user_tags" },
      },
    });
    await syncModels([tag]);

    // Create join table with wrong FK (ON DELETE CASCADE instead of RESTRICT)
    await getDb().exec(
      `CREATE TABLE IF NOT EXISTS sync_user_tags (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL
      )`,
    );
    await getDb().exec(
      `ALTER TABLE sync_user_tags ADD CONSTRAINT fk_user_tags_source FOREIGN KEY (source_id) REFERENCES sync_users(id) ON DELETE CASCADE`,
    );

    const result = await doctorModels([user, tag]);
    const joinFkIssues = result.missingFks.filter((fk) => fk.table === "sync_user_tags");
    expect(joinFkIssues.length).toBeGreaterThan(0);
    // At least one side should have ondelete_mismatch
    const hasMismatch = joinFkIssues.some((fk) => fk.kind === "ondelete_mismatch");
    expect(hasMismatch).toBe(true);
  });
});
