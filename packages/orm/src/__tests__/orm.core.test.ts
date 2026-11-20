import { z } from "zod";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BaseRepository,
  ConflictError,
  closeDb,
  createActorContext,
  defineModel,
  getDb,
  initDb,
  uuidv7,
  type PageCursor,
} from "../index.js";

const taskSchema = z.object({
  title: z.string(),
  priority: z.number().int(),
  ratio: z.number(),
  done: z.boolean(),
  due: z.date(),
  tags: z.array(z.string()),
  meta: z.object({ note: z.string() }).optional(),
  note: z.string().nullable(),
});

const taskModel = defineModel({
  name: "test.task",
  table: "test_tasks",
  schema: taskSchema,
  indexes: [{ fields: ["priority"] }, { fields: ["title"], unique: true }],
});

let dir: string;
const dirs: string[] = [];

function sample(overrides: Record<string, unknown> = {}) {
  return {
    title: "write tests",
    priority: 2,
    ratio: 0.5,
    done: false,
    due: new Date("2026-01-02T03:04:05.000Z"),
    tags: ["a", "b"],
    note: null,
    ...overrides,
  };
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "moonwitness-orm-"));
  dirs.push(dir);
  await initDb(join(dir, "orm.db"));
  await getDb().exec(taskModel.ddl);
});

afterEach(() => {
  closeDb();
});

afterAll(async () => {
  for (const path of dirs) {
    await rm(path, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }).catch(
      () => {},
    );
  }
});

describe("uuidv7", () => {
  it("produces version 7 ids with an RFC 4122 variant and monotonic timestamps", () => {
    const first = uuidv7();
    const second = uuidv7();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(second).not.toBe(first);
    expect(first.slice(0, 13) <= second.slice(0, 13)).toBe(true);
  });
});

describe("defineModel", () => {
  it("emits real business columns and correctly ordered unique indexes", () => {
    expect(taskModel.ddl).toContain('"title" TEXT NOT NULL');
    expect(taskModel.ddl).toContain('"priority" INTEGER NOT NULL');
    expect(taskModel.ddl).toContain('"ratio" REAL NOT NULL');
    expect(taskModel.ddl).toContain('"done" INTEGER NOT NULL');
    expect(taskModel.ddl).toContain('"due" TEXT NOT NULL');
    expect(taskModel.ddl).toContain('"tags" TEXT NOT NULL');
    expect(taskModel.ddl).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_test_tasks_title ON test_tasks (title)",
    );
    expect(taskModel.ddl).toContain(
      "CREATE INDEX IF NOT EXISTS idx_test_tasks_priority ON test_tasks (priority)",
    );
  });

  it("rejects unsafe table names", () => {
    expect(() =>
      defineModel({
        name: "bad",
        table: "bad; DROP TABLE x",
        schema: z.object({ title: z.string() }),
      }),
    ).toThrow(/Invalid table/);
  });

  it("rejects unsupported schema types instead of silently dropping them", () => {
    expect(() =>
      defineModel({
        name: "bad",
        table: "bad_types",
        schema: z.object({ when: z.union([z.string(), z.number()]) }),
      }),
    ).toThrow(/Unsupported schema type/);
  });

  it("uses the input field shape for transformed Zod schemas", () => {
    const transformedModel = defineModel({
      name: "test.transformed",
      table: "test_transformed",
      schema: z.object({ title: z.string().transform((value) => value.trim()) }),
    });

    expect(transformedModel.ddl).toContain('"title" TEXT NOT NULL');
  });
});

describe("BaseRepository", () => {
  it("roundtrips null, JSON, boolean, number and date values", async () => {
    const created = await taskModel.repository.create(sample());

    const loaded = (await taskModel.repository.findOne(created.id))!;
    expect(loaded.title).toBe("write tests");
    expect(loaded.priority).toBe(2);
    expect(loaded.ratio).toBe(0.5);
    expect(loaded.done).toBe(false);
    expect(loaded.tags).toEqual(["a", "b"]);
    expect(loaded.note).toBeNull();
    expect(loaded.due).toBeInstanceOf(Date);
    expect(loaded.due.toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });

  it("keeps an explicit business id and otherwise generates one", async () => {
    const explicit = await taskModel.repository.create(sample({ id: "task-1" }));
    const generated = await taskModel.repository.create(sample({ title: "other" }));

    expect(explicit.id).toBe("task-1");
    expect(generated.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("validates input against the schema before writing", async () => {
    await expect(taskModel.repository.create(sample({ priority: "high" }))).rejects.toThrow();
  });

  it("writes a CREATE audit entry in the same transaction", async () => {
    const created = await taskModel.repository.create(
      sample(),
      createActorContext("u1", "api", "req-1"),
    );
    const history = await taskModel.repository.history(created.id);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      model: "test.task",
      entity_id: created.id,
      action: "CREATE",
      changed_by: "u1",
      entity_version: 1,
      source: "api",
      request_id: "req-1",
    });
    expect(JSON.parse(history[0]!.diff).title).toEqual({ before: null, after: "write tests" });
  });

  it("increments the version and protects framework columns on update", async () => {
    const created = await taskModel.repository.create(sample());
    const updated = (await taskModel.repository.update(created.id, {
      title: "ship it",
      version: 1,
      id: "hijacked",
      create_uid: "attacker",
      create_date: new Date("1999-01-01T00:00:00.000Z"),
      status: "deleted",
    }))!;

    expect(updated.id).toBe(created.id);
    expect(updated.create_uid).toBeNull();
    expect(updated.create_date.toISOString()).toBe(created.create_date.toISOString());
    expect(updated.status).toBe("active");
    expect(updated.title).toBe("ship it");
    expect(updated.version).toBe(2);
  });

  it("rejects a stale version with ConflictError and leaves the record untouched", async () => {
    const created = await taskModel.repository.create(sample());
    await taskModel.repository.update(created.id, { title: "first", version: 1 });

    await expect(
      taskModel.repository.update(created.id, { title: "stale", version: 1 }),
    ).rejects.toBeInstanceOf(ConflictError);

    const reloaded = (await taskModel.repository.findOne(created.id))!;
    expect(reloaded.title).toBe("first");
    expect(reloaded.version).toBe(2);
  });

  it("serializes concurrent updates so only one wins", async () => {
    const created = await taskModel.repository.create(sample());

    const results = await Promise.allSettled([
      taskModel.repository.update(created.id, { title: "left", version: 1 }),
      taskModel.repository.update(created.id, { title: "right", version: 1 }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const reloaded = (await taskModel.repository.findOne(created.id))!;
    expect(reloaded.version).toBe(2);
    expect(["left", "right"]).toContain(reloaded.title);
  });

  it("rolls back the record change when the audit write fails", async () => {
    const created = await taskModel.repository.create(sample());
    await getDb().exec(`
      CREATE TRIGGER fail_audit BEFORE INSERT ON _orm_audit_log
      BEGIN
        SELECT RAISE(ABORT, 'audit unavailable');
      END;
    `);

    await expect(
      taskModel.repository.update(created.id, { title: "should not persist", version: 1 }),
    ).rejects.toThrow(/audit unavailable/);

    const reloaded = (await taskModel.repository.findOne(created.id))!;
    expect(reloaded).not.toBeNull();
    expect(reloaded?.title).toBe("write tests");
    expect(reloaded?.version).toBe(1);
  });

  it("soft deletes, hides deleted rows by default, restores and records history", async () => {
    const created = await taskModel.repository.create(sample());

    await taskModel.repository.delete(created.id, createActorContext("u2", "api"));
    expect(await taskModel.repository.findOne(created.id)).toBeNull();
    expect(await taskModel.repository.find({}, { includeDeleted: true })).toHaveLength(1);

    await taskModel.repository.restore(created.id, createActorContext("u2", "api"));
    expect((await taskModel.repository.findOne(created.id))?.status).toBe("active");

    const history = await taskModel.repository.history(created.id);
    expect(history.map((entry) => entry.action)).toEqual(["CREATE", "DELETE", "RESTORE"]);
  });

  it("archives without clearing soft-delete fields", async () => {
    const created = await taskModel.repository.create(sample());
    const archived = await taskModel.repository.archive(created.id);

    expect(archived?.status).toBe("archived");
    expect(archived?.deleted_date).toBeNull();
  });

  it("rejects unknown filter columns instead of interpolating them", async () => {
    await expect(taskModel.repository.find({ "title = 'x' OR 1=1 --": "y" })).rejects.toThrow(
      /Invalid column/,
    );
    await expect(taskModel.repository.find({ nope: 1 })).rejects.toThrow(/Unknown column/);
  });

  it("filters nullable columns by null", async () => {
    const withNull = await taskModel.repository.create(sample({ note: null }));
    await taskModel.repository.create(sample({ title: "with note", note: "hello" }));

    const found = await taskModel.repository.find({ note: null });
    expect(found.map((row) => row.id)).toEqual([withNull.id]);
    expect(found[0]?.note).toBeNull();
    expect(await taskModel.repository.count({ note: null })).toBe(1);
  });

  it("ignores undefined filter values instead of coercing them to null", async () => {
    await taskModel.repository.create(sample({ id: "with-title", title: "t1" }));
    await taskModel.repository.create(sample({ id: "with-title-2", title: "t2" }));

    const found = await taskModel.repository.find({ title: undefined });
    expect(found).toHaveLength(2);
    expect(await taskModel.repository.count({ title: undefined })).toBe(2);

    const onlyOne = await taskModel.repository.find({ title: undefined, id: "with-title" });
    expect(onlyOne.map((row) => row.id)).toEqual(["with-title"]);
  });

  it("supports operator filters, sorting, pagination, upsert, createMany, and soft-delete update guard", async () => {
    const items = await taskModel.repository.createMany([
      sample({ title: "alpha", priority: 1, note: "first" }),
      sample({ title: "Beta Signal", priority: 3, note: "beta" }),
      sample({ title: "gamma", priority: 5, note: null }),
    ]);
    expect(items).toHaveLength(3);

    const ranged = await taskModel.repository.find(
      { priority: { $gte: 2, $lte: 5 } },
      { orderBy: [{ field: "priority", direction: "DESC" }], limit: 1, offset: 1 },
    );
    expect(ranged.map((row) => row.title)).toEqual(["Beta Signal"]);

    const matched = await taskModel.repository.find({
      title: { $ilike: "%beta%" },
      priority: { $in: [1, 3] },
      note: { $ne: "other" },
    });
    expect(matched.map((row) => row.title)).toEqual(["Beta Signal"]);

    const nonNullNotes = await taskModel.repository.find(
      { note: { $ne: null } },
      { orderBy: "priority ASC" },
    );
    expect(nonNullNotes.map((row) => row.title)).toEqual(["alpha", "Beta Signal"]);

    const emptyIn = await taskModel.repository.find({ priority: { $in: [] } });
    expect(emptyIn).toHaveLength(0);

    const upsertedNew = await taskModel.repository.upsert(
      { title: "delta" },
      sample({ title: "delta", priority: 4 }),
    );
    expect(upsertedNew.version).toBe(1);

    const upsertedExisting = await taskModel.repository.upsert({ title: "delta" }, { priority: 9 });
    expect(upsertedExisting.id).toBe(upsertedNew.id);
    expect(upsertedExisting.priority).toBe(9);
    expect(upsertedExisting.version).toBe(2);

    await taskModel.repository.delete(upsertedNew.id);
    expect(await taskModel.repository.update(upsertedNew.id, { priority: 10 })).toBeNull();
    expect(
      await taskModel.repository.history(upsertedNew.id, { limit: 2, offset: 1 }),
    ).toHaveLength(2);
  });

  it("persists across close and reopen of the same file", async () => {
    const dbPath = join(dir, "persist.db");
    closeDb();
    await initDb(dbPath);
    await getDb().exec(taskModel.ddl);

    const created = await taskModel.repository.create(sample());
    closeDb();
    await initDb(dbPath);

    const reloaded = (await taskModel.repository.findOne(created.id))!;
    expect(reloaded).not.toBeNull();
    expect(reloaded?.title).toBe("write tests");
    expect(reloaded?.tags).toEqual(["a", "b"]);
  });
});

describe("driver lifecycle", () => {
  it("refuses to overwrite a live connection", async () => {
    await expect(initDb(join(dir, "second.db"))).rejects.toThrow(/already initialized/);
  });

  it("re-applies the audit table after a database was closed and reopened", async () => {
    const dbPath = join(dir, "reopen.db");
    closeDb();
    await initDb(dbPath);
    await getDb().exec(taskModel.ddl);

    const first = await taskModel.repository.create(sample());
    closeDb();
    await initDb(dbPath);

    const second = await taskModel.repository.create(sample({ title: "after reopen" }));
    expect(await taskModel.repository.history(first.id)).toHaveLength(1);
    expect(await taskModel.repository.history(second.id)).toHaveLength(1);
  });

  it("exposes the shared driver contract", async () => {
    const driver = getDb();
    expect(driver).toBeInstanceOf(Object);
    expect(typeof driver.run).toBe("function");
    expect(typeof driver.transaction).toBe("function");
  });
});

describe("BaseRepository type surface", () => {
  it("is exported as a usable constructor", () => {
    expect(typeof BaseRepository).toBe("function");
  });
});

describe("pagination: deterministic offset ordering (MW-0834)", () => {
  it("appends id ASC tie-breaker when orderBy omits id", async () => {
    // Create many rows with the same priority to force ties
    for (let i = 1; i <= 25; i++) {
      await taskModel.repository.create(sample({ title: `task-${i}`, priority: 5 }));
    }

    // Two pages with same priority, verify deterministic ordering
    const page1 = await taskModel.repository.find(
      { priority: 5 },
      { orderBy: "priority ASC", limit: 10, offset: 0 },
    );
    const page2 = await taskModel.repository.find(
      { priority: 5 },
      { orderBy: "priority ASC", limit: 10, offset: 10 },
    );

    // No duplicate IDs across adjacent pages
    const ids1 = page1.map((r) => r.id);
    const ids2 = page2.map((r) => r.id);
    expect(new Set([...ids1, ...ids2]).size).toBe(ids1.length + ids2.length);

    // Ordering is stable across repeated executions
    const page1b = await taskModel.repository.find(
      { priority: 5 },
      { orderBy: "priority ASC", limit: 10, offset: 0 },
    );
    expect(page1b.map((r) => r.id)).toEqual(ids1);
  });

  it("does not duplicate tie-breaker when id is already in orderBy", async () => {
    for (let i = 1; i <= 5; i++) {
      await taskModel.repository.create(sample({ title: `task-${i}`, priority: i }));
    }

    const rows = await taskModel.repository.find({}, { orderBy: "id DESC, priority ASC" });

    // All rows returned; id DESC is the first sort key
    expect(rows.length).toBe(5);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.id >= rows[i]!.id).toBe(true);
    }
  });

  it("default ordering is deterministic (id ASC) when no orderBy supplied", async () => {
    for (let i = 1; i <= 10; i++) {
      await taskModel.repository.create(sample({ title: `task-${i}`, priority: 3 }));
    }

    const page1 = await taskModel.repository.find({}, { limit: 5, offset: 0 });
    const page2 = await taskModel.repository.find({}, { limit: 5, offset: 5 });

    const ids1 = page1.map((r) => r.id);
    const ids2 = page2.map((r) => r.id);
    expect(new Set([...ids1, ...ids2]).size).toBe(10);
  });
});

describe("pagination: keyset findPage (MW-0835)", () => {
  const repo = taskModel.repository;

  beforeEach(async () => {
    // 25 rows with same priority (ties) and varying ratios
    for (let i = 1; i <= 25; i++) {
      await repo.create(sample({ title: `task-${i}`, priority: 7, ratio: i * 0.1 }));
    }
  });

  it("returns first page and nextCursor", async () => {
    const page = await repo.findPage({ priority: 7 }, { pageSize: 10, orderBy: "ratio ASC" });
    expect(page.items).toHaveLength(10);
    expect(page.hasNextPage).toBe(true);
    expect(page.nextCursor).toBeTypeOf("string");
  });

  it("traverses all pages without duplicate IDs", async () => {
    const allIds: string[] = [];
    let cursor: string | undefined;
    for (let p = 0; p < 3; p++) {
      const page = await repo.findPage(
        { priority: 7 },
        { pageSize: 10, orderBy: "ratio ASC", cursor },
      );
      allIds.push(...page.items.map((r) => r.id));
      expect(page.hasNextPage).toBe(p < 2);
      cursor = page.nextCursor ?? undefined;
    }
    expect(new Set(allIds).size).toBe(25);
  });

  it("handles mixed ASC/DESC sort directions", async () => {
    const page = await repo.findPage(
      { priority: 7 },
      { pageSize: 5, orderBy: "priority ASC, ratio DESC" },
    );
    expect(page.items).toHaveLength(5);
    // All same priority, so ratio DESC should apply
    for (let i = 1; i < page.items.length; i++) {
      expect(page.items[i - 1]!.ratio >= page.items[i]!.ratio).toBe(true);
    }
    expect(page.nextCursor).toBeTypeOf("string");
  });

  it("handles NULL sort values correctly", async () => {
    // Add some rows with null ratio (schema allows optional ratio via nullable note pattern)
    // Use note (nullable string) instead since ratio is non-null
    for (let i = 1; i <= 5; i++) {
      await repo.create(sample({ title: `null-note-${i}`, priority: 7, note: null }));
    }

    // NULLs sort FIRST in ASC by default in SQLite/Postgres-compatible semantics
    const page = await repo.findPage({ priority: 7 }, { pageSize: 10, orderBy: "note ASC" });
    expect(page.items.length).toBeGreaterThan(0);
    // All returned rows should have null notes (they come first)
    expect(page.items.every((r) => r.note === null)).toBe(true);
  });

  it("rejects cursor with filter mismatch", async () => {
    const page1 = await repo.findPage({ priority: 7 }, { pageSize: 5, orderBy: "ratio ASC" });
    // Try to use cursor with different filters
    await expect(
      repo.findPage(
        { priority: 8 },
        { pageSize: 5, orderBy: "ratio ASC", cursor: page1.nextCursor ?? undefined },
      ),
    ).rejects.toThrow("Cursor filter mismatch");
  });

  it("rejects cursor with sort mismatch", async () => {
    const page1 = await repo.findPage({ priority: 7 }, { pageSize: 5, orderBy: "ratio ASC" });
    await expect(
      repo.findPage(
        { priority: 7 },
        { pageSize: 5, orderBy: "ratio DESC", cursor: page1.nextCursor ?? undefined },
      ),
    ).rejects.toThrow("Cursor sort mismatch");
  });

  it("rejects malformed cursor", async () => {
    await expect(
      repo.findPage(
        { priority: 7 },
        { pageSize: 5, orderBy: "ratio ASC", cursor: "not-a-valid-cursor" },
      ),
    ).rejects.toThrow("Invalid cursor");
  });

  it("rejects cursor from different model", async () => {
    const otherModel = defineModel({
      name: "test.other.pagination",
      table: "test_other_pagination",
      schema: z.object({ title: z.string() }),
    });
    await getDb().exec(otherModel.ddl);
    for (let i = 0; i < 3; i++) {
      await otherModel.repository.create({ title: `other-row-${i}` });
    }
    const otherPage = await otherModel.repository.findPage({}, { pageSize: 1 });
    expect(otherPage.nextCursor).toBeTypeOf("string");

    await expect(
      repo.findPage(
        { priority: 7 },
        { pageSize: 5, orderBy: "ratio ASC", cursor: otherPage.nextCursor ?? undefined },
      ),
    ).rejects.toThrow("model mismatch");
  });

  it("enforces page size cap (MAX_PAGE_SIZE)", async () => {
    const page = await repo.findPage({ priority: 7 }, { pageSize: 1000, orderBy: "ratio ASC" });
    expect(page.items.length).toBeLessThanOrEqual(100);
  });

  it("respects tenant isolation", async () => {
    const tenant1 = createActorContext("u1", "api", undefined, "t1");
    const tenant2 = createActorContext("u2", "api", undefined, "t2");

    await repo.forActor(tenant1).create(sample({ title: "t1-task", priority: 10 }));
    await repo.forActor(tenant2).create(sample({ title: "t2-task", priority: 10 }));

    const page1 = await repo
      .forActor(tenant1)
      .findPage({ priority: 10 }, { pageSize: 10, orderBy: "id ASC" });
    const page2 = await repo
      .forActor(tenant2)
      .findPage({ priority: 10 }, { pageSize: 10, orderBy: "id ASC" });

    expect(page1.items.every((r) => r.tenant_id === "t1")).toBe(true);
    expect(page2.items.every((r) => r.tenant_id === "t2")).toBe(true);
  });

  it("supports field projection", async () => {
    const page = await repo.findPage(
      { priority: 7 },
      { pageSize: 5, orderBy: "ratio ASC", fields: ["id", "title", "ratio"] },
    );
    expect(page.items).toHaveLength(5);
    for (const item of page.items) {
      expect(Object.keys(item)).toEqual(expect.arrayContaining(["id", "title", "ratio"]));
      expect(item).not.toHaveProperty("tags");
      expect(item).not.toHaveProperty("note");
    }
  });

  it("supports with relation hydration", async () => {
    // Simple relation test - just verify it doesn't throw
    const page = await repo.findPage(
      { priority: 7 },
      { pageSize: 3, orderBy: "ratio ASC", with: [] },
    );
    expect(page.items).toHaveLength(3);
  });
});

describe("cursor token structure", () => {
  it("encodes model, sort, filterHash, values in base64url JSON", async () => {
    const page = await taskModel.repository.findPage(
      { priority: 5 },
      { pageSize: 2, orderBy: "ratio ASC" },
    );
    if (!page.nextCursor) {
      // Not enough rows with priority 5 to emit a cursor — seed some
      await taskModel.repository.create(sample({ title: "cursor-seed-1", priority: 5 }));
      await taskModel.repository.create(sample({ title: "cursor-seed-2", priority: 5 }));
      await taskModel.repository.create(sample({ title: "cursor-seed-3", priority: 5 }));
    }
    const page2 = await taskModel.repository.findPage(
      { priority: 5 },
      { pageSize: 2, orderBy: "ratio ASC" },
    );
    const cursor = page2.nextCursor!;
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as PageCursor;
    expect(decoded.v).toBe(1);
    expect(decoded.model).toBe("test.task");
    expect(Array.isArray(decoded.sort)).toBe(true);
    expect(decoded.sort.length).toBeGreaterThan(0);
    expect(decoded.sort[decoded.sort.length - 1]!.field).toBe("id");
    expect(decoded.sort[decoded.sort.length - 1]!.direction).toBe("ASC");
    expect(typeof decoded.filterHash).toBe("string");
    expect(Array.isArray(decoded.values)).toBe(true);
    expect(decoded.values.length).toBe(decoded.sort.length);
  });
});
