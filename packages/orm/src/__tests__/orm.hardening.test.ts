import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyMigrations,
  closeDb,
  createActorContext,
  defineModel,
  getDb,
  initDb,
  isSystemActor,
  listAppliedMigrations,
  PolicyError,
  requireActorTenantId,
  SYSTEM_ACTOR,
} from "../index.js";

const noteSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
});

const noteModel = defineModel({
  name: "test.note",
  table: "test_notes",
  schema: noteSchema,
  indexes: [{ fields: ["title"] }],
});

let dir = "";

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "mw-orm-hardening-"));
  await initDb(join(dir, "orm.db"));
  await getDb().exec(noteModel.ddl);
});

afterEach(async () => {
  closeDb();
  if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
});

describe("BaseRepository list/count and soft-delete consistency", () => {
  it("count and list respect soft-delete the same as find/findOne", async () => {
    const a = await noteModel.repository.create({ title: "a" });
    await noteModel.repository.create({ title: "b" });
    await noteModel.repository.delete(a.id, createActorContext("u", "api"));

    expect(await noteModel.repository.count()).toBe(1);
    expect((await noteModel.repository.list()).map((r) => r.title)).toEqual(["b"]);
    expect(await noteModel.repository.findOne(a.id)).toBeNull();

    expect(await noteModel.repository.count({}, { includeDeleted: true })).toBe(2);
    await expect(noteModel.repository.list({}, { includeDeleted: true })).resolves.toHaveLength(2);
  });

  it("count applies filters and excludes deleted rows", async () => {
    const a = await noteModel.repository.create({ title: "same", body: "x" });
    await noteModel.repository.create({ title: "same", body: "y" });
    await noteModel.repository.delete(a.id);

    expect(await noteModel.repository.count({ title: "same" })).toBe(1);
    expect(await noteModel.repository.count({ title: "same" }, { includeDeleted: true })).toBe(2);
  });
});

describe("migrations", () => {
  it("applies migrations deterministically and is idempotent on rerun", async () => {
    await getDb().run(`
      CREATE TABLE IF NOT EXISTS _orm_schema_migrations (
        id TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);
    const migrations = [
      {
        id: "001_create_extra",
        up: "CREATE TABLE IF NOT EXISTS extra(id TEXT PRIMARY KEY, v TEXT)",
      },
      { id: "002_seed_extra", up: "INSERT OR IGNORE INTO extra(id, v) VALUES ('1','a')" },
    ];

    const first = await applyMigrations(migrations);
    expect(first.applied).toEqual(["001_create_extra", "002_seed_extra"]);
    expect(first.skipped).toEqual([]);

    const second = await applyMigrations(migrations);
    expect(second.applied).toEqual([]);
    expect(second.skipped).toEqual(["001_create_extra", "002_seed_extra"]);

    const rows = await getDb().all<{ id: string; v: string }>("SELECT * FROM extra");
    expect(rows).toEqual([{ id: "1", v: "a" }]);

    const applied = await listAppliedMigrations();
    expect(applied.map((m) => m.id)).toEqual(["001_create_extra", "002_seed_extra"]);
  });

  it("rejects modified migration content (checksum mismatch) without applying it", async () => {
    await applyMigrations([{ id: "001_x", up: "CREATE TABLE mx(id TEXT PRIMARY KEY)" }]);
    await expect(
      applyMigrations([{ id: "001_x", up: "CREATE TABLE mx(id TEXT PRIMARY KEY, extra TEXT)" }]),
    ).rejects.toThrow(/checksum mismatch/i);
  });

  it("rolls back a failed migration and does not record it", async () => {
    const bad = {
      id: "002_bad",
      up: "CREATE TABLE ok(id TEXT PRIMARY KEY); INSERT INTO nope VALUES (1);",
    };
    await expect(applyMigrations([bad])).rejects.toThrow();
    const applied = await listAppliedMigrations();
    expect(applied.find((m) => m.id === "002_bad")).toBeUndefined();
    // table from first statement should not persist because migration runs in a transaction
    const tables = await getDb().all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ok'",
    );
    expect(tables).toHaveLength(0);
  });
});

describe("multi-tenant isolation on BaseRepository", () => {
  it("isolates records across tenants for find, findOne, count, upsert, update, and delete", async () => {
    const actorA = createActorContext("user-a", "api", "req-a", "tenant-a");
    const actorB = createActorContext("user-b", "api", "req-b", "tenant-b");

    const rowA = await noteModel.repository.create(
      { title: "alpha-doc", body: "secret-a" },
      actorA,
    );
    const rowB = await noteModel.repository.create({ title: "beta-doc", body: "secret-b" }, actorB);

    expect(rowA.tenant_id).toBe("tenant-a");
    expect(rowB.tenant_id).toBe("tenant-b");

    expect(await noteModel.repository.count({}, { tenantId: "tenant-a" })).toBe(1);
    expect(
      (await noteModel.repository.list({}, { tenantId: "tenant-a" })).map((r) => r.id),
    ).toEqual([rowA.id]);
    expect(await noteModel.repository.findOne(rowA.id, { tenantId: "tenant-b" })).toBeNull();
    expect(await noteModel.repository.findOne(rowA.id, { tenantId: "tenant-a" })).not.toBeNull();

    // Cross-tenant update and delete fail closed
    expect(await noteModel.repository.update(rowA.id, { title: "hijacked" }, actorB)).toBeNull();
    expect(await noteModel.repository.delete(rowA.id, actorB)).toBeNull();

    // Tenant B upsert with same business title creates an isolated Tenant B copy
    const upsertedB = await noteModel.repository.upsert(
      { title: "alpha-doc" },
      { body: "owned-by-b" },
      actorB,
    );
    expect(upsertedB.id).not.toBe(rowA.id);
    expect(upsertedB.tenant_id).toBe("tenant-b");

    // Tenant A record remains untouched
    const reloadedA = await noteModel.repository.findOne(rowA.id, { tenantId: "tenant-a" });
    expect(reloadedA?.body).toBe("secret-a");
  });
});

describe("ScopedRepository and actor tenant enforcement (#491)", () => {
  it("validates isSystemActor and requireActorTenantId", () => {
    expect(isSystemActor(SYSTEM_ACTOR)).toBe(true);
    expect(isSystemActor(createActorContext(null, "migration"))).toBe(true);
    expect(isSystemActor(createActorContext(null, "api"))).toBe(false);
    expect(isSystemActor(createActorContext("u1", "seed"))).toBe(false);

    expect(() => requireActorTenantId(createActorContext("u1", "api"))).toThrowError(PolicyError);
    try {
      requireActorTenantId(createActorContext("u1", "api", undefined, "   "));
    } catch (err) {
      expect(err).toBeInstanceOf(PolicyError);
      expect((err as PolicyError).code).toBe("TENANT_REQUIRED");
      expect((err as PolicyError).statusCode).toBe(403);
    }
    expect(requireActorTenantId(createActorContext("u1", "api", undefined, " acme "))).toBe("acme");
  });

  it("enforces tenant binding on forActor(), rejects conflicting tenantId, and scopes history", async () => {
    expect(() => noteModel.repository.forActor(createActorContext("u1", "api"))).toThrowError(
      PolicyError,
    );
    expect(() => noteModel.repository.forActor(createActorContext(null, "api"))).toThrowError(
      PolicyError,
    );

    const actorA = createActorContext("user-a", "api", "req-a", "tenant-a");
    const actorB = createActorContext("user-b", "api", "req-b", "tenant-b");
    const scopedA = noteModel.repository.forActor(actorA);
    const scopedB = noteModel.repository.forActor(actorB);
    const scopedSystem = noteModel.repository.forActor(SYSTEM_ACTOR);

    const createdA = await scopedA.create({ title: "scoped-a", body: "secret" });
    const createdB = await scopedB.create({ title: "scoped-b", body: "secret-b" });

    // System actor without tenantId can read across tenants
    expect(await scopedSystem.count()).toBe(2);

    // Explicit system actor with tenantId is pinned to that tenant
    const scopedSystemA = noteModel.repository.forActor(
      createActorContext(null, "seed", undefined, "tenant-a"),
    );
    expect(await scopedSystemA.count()).toBe(1);

    // Conflicting opts.tenantId is rejected with TENANT_MISMATCH
    await expect(scopedA.find({}, { tenantId: "tenant-b" })).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
      statusCode: 403,
    });
    await expect(scopedA.findOne(createdA.id, { tenantId: "tenant-b" })).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
      statusCode: 403,
    });
    await expect(scopedA.count({}, { tenantId: "tenant-b" })).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
      statusCode: 403,
    });
    await expect(
      scopedA.readGroup({ groupBy: ["title"], tenantId: "tenant-b" }),
    ).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
      statusCode: 403,
    });

    // Cross-tenant create and update tenant_id mutation are rejected
    await expect(
      noteModel.repository.create({ title: "x", tenant_id: "tenant-b" }, actorA),
    ).rejects.toMatchObject({ code: "TENANT_MISMATCH", statusCode: 403 });
    await expect(scopedA.create({ title: "x", tenant_id: "tenant-b" })).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
      statusCode: 403,
    });
    await expect(
      noteModel.repository.update(createdA.id, { tenant_id: "tenant-b" }, actorA),
    ).rejects.toMatchObject({ code: "TENANT_MISMATCH", statusCode: 403 });
    await expect(scopedA.update(createdA.id, { tenant_id: "tenant-b" })).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
      statusCode: 403,
    });

    // History returns [] for records outside actor's tenant
    expect(await scopedA.history(createdA.id)).toHaveLength(1);
    expect(await scopedB.history(createdA.id)).toEqual([]);
    expect(await scopedB.history(createdB.id)).toHaveLength(1);
  });

  it("isolates relation hydration per tenant even without explicit opts.tenantId", async () => {
    const parentModel = defineModel({
      name: "test.rel_parent",
      table: "test_rel_parents",
      schema: z.object({ code: z.string(), label: z.string() }),
    });
    const childModel = defineModel({
      name: "test.rel_child",
      table: "test_rel_children",
      schema: z.object({ parent_code: z.string(), title: z.string() }),
      relations: {
        parent_code: { model: "test.rel_parent", targetField: "code" },
      },
    });
    await getDb().exec(parentModel.ddl);
    await getDb().exec(childModel.ddl);

    const actorA = createActorContext("u-a", "api", undefined, "tenant-a");
    const actorB = createActorContext("u-b", "api", undefined, "tenant-b");
    await parentModel.repository.create({ code: "shared-code", label: "Parent A" }, actorA);
    await parentModel.repository.create({ code: "shared-code", label: "Parent B" }, actorB);
    await childModel.repository.create({ parent_code: "shared-code", title: "Child A" }, actorA);
    await childModel.repository.create({ parent_code: "shared-code", title: "Child B" }, actorB);

    const allChildren = await childModel.repository.find(
      {},
      { with: ["parent_code"], orderBy: "title ASC" },
    );
    expect(allChildren).toHaveLength(2);
    const hydratedA = (allChildren[0] as unknown as Record<string, unknown>).$parent_code as Record<
      string,
      unknown
    >;
    const hydratedB = (allChildren[1] as unknown as Record<string, unknown>).$parent_code as Record<
      string,
      unknown
    >;
    expect(hydratedA.label).toBe("Parent A");
    expect(hydratedA.tenant_id).toBe("tenant-a");
    expect(hydratedB.label).toBe("Parent B");
    expect(hydratedB.tenant_id).toBe("tenant-b");
  });
});
