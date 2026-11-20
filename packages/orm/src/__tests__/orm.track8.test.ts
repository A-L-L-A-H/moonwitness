import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  applyMigrations,
  closeDb,
  compileTupleDomainToFilter,
  createActorContext,
  defineModel,
  getDb,
  initDb,
  initPostgresDb,
  matchesFilter,
  MAX_DOMAIN_CLAUSES,
  MAX_DOMAIN_DEPTH,
  MAX_IN_LIST_SIZE,
  MAX_STRING_VALUE_LEN,
  modelRegistry,
  onModelWrite,
  PolicyError,
  preflightRelationIntegrity,
  syncModels,
  validateAttrsPayload,
  verifyBackupIntegrity,
  withQueryBudget,
  type PoolLike,
} from "../index.js";

const actorA = createActorContext("u-a", "api", "req-a", "tenant-a");
const actorB = createActorContext("u-b", "api", "req-b", "tenant-b");

describe("Track 8 ORM hardening & capabilities (#495-#502, #505, #507, #508)", () => {
  beforeEach(async () => {
    modelRegistry.clearForTests();
    await initDb("file::memory:?cache=shared");
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearForTests();
  });

  describe("#507 Safe Odoo domain expression contract", () => {
    it("compiles unary '!', 'in', 'not in', null/false, and like/ilike/not like/not ilike across SQL & JS", async () => {
      const item = defineModel({
        name: "t507.item",
        table: "t507_items",
        schema: z.object({
          code: z.string(),
          active: z.boolean(),
          note: z.string().nullable(),
          group_tag: z.string(),
        }),
      });
      await syncModels([item]);

      await item.repository.create(
        { code: "A1", active: true, note: "Alpha Signal", group_tag: "core" },
        actorA,
      );
      await item.repository.create(
        { code: "B2", active: false, note: null, group_tag: "edge" },
        actorA,
      );
      await item.repository.create(
        { code: "C3", active: false, note: "Beta Log", group_tag: "legacy" },
        actorA,
      );

      const notActiveFilter = compileTupleDomainToFilter(["!", ["active", "=", true]]);
      expect(notActiveFilter).toEqual({ $not: { active: true } });
      const sqlNotActive = await item.repository.find(notActiveFilter, {
        tenantId: "tenant-a",
        orderBy: "code ASC",
      });
      expect(sqlNotActive.map((r) => r.code)).toEqual(["B2", "C3"]);
      expect(
        sqlNotActive.every((r) =>
          matchesFilter(r as unknown as Record<string, unknown>, notActiveFilter),
        ),
      ).toBe(true);

      const falseRows = await item.repository.find(
        compileTupleDomainToFilter([["active", "=", false]]),
        { tenantId: "tenant-a", orderBy: "code ASC" },
      );
      expect(falseRows.map((r) => r.code)).toEqual(["B2", "C3"]);

      const nullRows = await item.repository.find(
        compileTupleDomainToFilter([["note", "=", null]]),
        { tenantId: "tenant-a" },
      );
      expect(nullRows.map((r) => r.code)).toEqual(["B2"]);

      const nonNullRows = await item.repository.find(
        compileTupleDomainToFilter([["note", "!=", null]]),
        { tenantId: "tenant-a", orderBy: "code ASC" },
      );
      expect(nonNullRows.map((r) => r.code)).toEqual(["A1", "C3"]);

      const notInFilter = compileTupleDomainToFilter([["group_tag", "not in", ["edge", "legacy"]]]);
      expect(notInFilter).toEqual({ $not: { group_tag: { $in: ["edge", "legacy"] } } });
      const notInRows = await item.repository.find(notInFilter, { tenantId: "tenant-a" });
      expect(notInRows.map((r) => r.code)).toEqual(["A1"]);
      expect(matchesFilter(notInRows[0] as unknown as Record<string, unknown>, notInFilter)).toBe(
        true,
      );

      const notIlikeFilter = compileTupleDomainToFilter([["note", "not ilike", "signal"]]);
      const notIlikeRows = await item.repository.find(notIlikeFilter, { tenantId: "tenant-a" });
      expect(notIlikeRows.map((r) => r.code)).toEqual(["C3"]);

      const exactLikeFilter = compileTupleDomainToFilter([["note", "=like", "Beta%"]]);
      const exactLikeRows = await item.repository.find(exactLikeFilter, { tenantId: "tenant-a" });
      expect(exactLikeRows.map((r) => r.code)).toEqual(["C3"]);

      const notLikeFilter = compileTupleDomainToFilter([["code", "not like", "B"]]);
      const notLikeRows = await item.repository.find(notLikeFilter, {
        tenantId: "tenant-a",
        orderBy: "code ASC",
      });
      expect(notLikeRows.map((r) => r.code)).toEqual(["A1", "C3"]);
    });

    it("enforces domain safety bounds and rejects malformed domains", () => {
      expect(() => compileTupleDomainToFilter("not-array" as unknown as unknown[])).toThrow();
      expect(() => compileTupleDomainToFilter([["a", "=", 1, 2]])).toThrow();
      expect(() => compileTupleDomainToFilter([["a", "eval", 1]])).toThrow(/Unsupported/);
      expect(() => compileTupleDomainToFilter(["!"])).toThrow(/Malformed/);
      expect(() => compileTupleDomainToFilter(["|", ["a", "=", 1]])).toThrow(/Malformed/);

      const tooManyClauses = Array.from({ length: MAX_DOMAIN_CLAUSES + 1 }, (_, i) => [
        "a",
        "=",
        i,
      ]);
      expect(() => compileTupleDomainToFilter(tooManyClauses)).toThrow(/maximum clause count/);

      const atLimitClauses = Array.from({ length: MAX_DOMAIN_CLAUSES }, (_, i) => ["a", "=", i]);
      expect(compileTupleDomainToFilter(atLimitClauses)).toHaveProperty("$and");

      const tooDeep = [...Array.from({ length: MAX_DOMAIN_DEPTH }, () => "!"), ["a", "=", 1]];
      expect(() => compileTupleDomainToFilter(tooDeep)).toThrow(/maximum nesting depth/);

      const maxIn = Array.from({ length: MAX_IN_LIST_SIZE }, (_, i) => i);
      expect(compileTupleDomainToFilter([["a", "in", maxIn]])).toEqual({ a: { $in: maxIn } });
      expect(() => compileTupleDomainToFilter([["a", "in", [...maxIn, 999]]])).toThrow(
        /maximum list size/,
      );

      const maxStr = "x".repeat(MAX_STRING_VALUE_LEN);
      expect(compileTupleDomainToFilter([["a", "=", maxStr]])).toEqual({ a: maxStr });
      expect(() => compileTupleDomainToFilter([["a", "=", `${maxStr}x`]])).toThrow(
        /maximum length/,
      );
    });
  });

  describe("#505 Closed-world _attrs custom fields", () => {
    it("rejects unknown keys in _attrs by default and supports opt-in allowFreeformExtra._extra", async () => {
      expect(validateAttrsPayload({}, [])).toEqual({});
      expect(() => validateAttrsPayload({ surprise: "x" }, [])).toThrow();
      expect(() => validateAttrsPayload({ _extra: { a: 1 } }, [])).toThrow();

      expect(
        validateAttrsPayload({ _extra: { note: "ok" } }, [], { allowFreeformExtra: true }),
      ).toEqual({ _extra: { note: "ok" } });
      expect(() =>
        validateAttrsPayload({ sneaky: 1, _extra: { note: "ok" } }, [], {
          allowFreeformExtra: true,
        }),
      ).toThrow();

      const ticket = defineModel({
        name: "t505.ticket",
        table: "t505_tickets",
        extensible: true,
        allowFreeformExtra: true,
        schema: z.object({ title: z.string(), owner_id: z.string() }),
        relations: { owner_id: { model: "t505.owner" } },
      });
      defineModel({
        name: "t505.owner",
        table: "t505_owners",
        schema: z.object({ name: z.string() }),
      });

      // Collision checks against baseFields, METADATA_NAMES, relations, and reserved keys
      expect(() =>
        modelRegistry.setRuntimeCustomFields("t505.ticket", [
          { field_name: "title", field_type: "text" },
        ]),
      ).toThrow(/collides/);
      expect(() =>
        modelRegistry.setRuntimeCustomFields("t505.ticket", [
          { field_name: "tenant_id", field_type: "text" },
        ]),
      ).toThrow(/collides/);
      expect(() =>
        modelRegistry.setRuntimeCustomFields("t505.ticket", [
          { field_name: "_extra", field_type: "text" },
        ]),
      ).toThrow(/reserved/);

      modelRegistry.setRuntimeCustomFields("t505.ticket", [
        { field_name: "tier", field_type: "text", required: false },
      ]);

      await syncModels(["t505.owner", "t505.ticket"]);
      const owner = await modelRegistry.get("t505.owner")!;
      expect(owner).toBeDefined();
      await getDb().run(
        `INSERT INTO t505_owners (id, create_date, write_date, status, version, source, tenant_id, name) VALUES (?, ?, ?, 'active', 1, 'api', 'tenant-a', ?)`,
        ["o1", new Date().toISOString(), new Date().toISOString(), "Alice"],
      );

      await expect(
        ticket.repository.create(
          { title: "t1", owner_id: "o1", _attrs: { unknown_key: 123 } },
          actorA,
        ),
      ).rejects.toThrow();

      const created = (await ticket.repository.create(
        { title: "t2", owner_id: "o1", _attrs: { tier: "gold", _extra: { trace: 42 } } },
        actorA,
      )) as unknown as { _attrs: Record<string, unknown> };
      expect(created._attrs).toEqual({ tier: "gold", _extra: { trace: 42 } });
    });
  });

  describe("#498 & #499 Computed-field DAG and stored computed fields", () => {
    it("detects dependency cycles with exact path and unknown dependencies at registration time", () => {
      expect(() =>
        defineModel({
          name: "t498.cycle",
          table: "t498_cycles",
          schema: z.object({ base: z.number().int() }),
          computed: {
            c: { depends: ["a"], compute: (r) => r.a },
            a: { depends: ["b"], compute: (r) => r.b },
            b: { depends: ["a"], compute: (r) => r.a },
          },
        }),
      ).toThrow(/Cyclic computed field dependency.*a -> b -> a/);

      expect(() =>
        defineModel({
          name: "t498.missing_dep",
          table: "t498_missing_deps",
          schema: z.object({ base: z.number().int() }),
          computed: {
            derived: { depends: ["nonexistent"], compute: () => 1 },
          },
        }),
      ).toThrow(/Unknown dependency 'nonexistent'/);
    });

    it("evaluates computed DAG in topological order, propagates errors, rejects direct writes, and persists stored computed fields", async () => {
      const orderModel = defineModel({
        name: "t499.order",
        table: "t499_orders",
        schema: z.object({
          unit_price: z.number().int(),
          qty: z.number().int(),
        }),
        computed: {
          subtotal: {
            depends: ["unit_price", "qty"],
            compute: (r) => Number(r.unit_price) * Number(r.qty),
            stored: true,
            type: "integer",
          },
          tax: {
            depends: ["subtotal"],
            compute: (r) => Math.round(Number(r.subtotal) * 0.1),
            stored: true,
            type: "integer",
          },
          summary_label: {
            depends: ["subtotal", "tax"],
            compute: (r) => `sub=${String(r.subtotal)},tax=${String(r.tax)}`,
          },
        },
      });
      expect(orderModel.ddl).toContain('"subtotal" INTEGER');
      expect(orderModel.ddl).toContain('"tax" INTEGER');

      await syncModels([orderModel]);

      await expect(
        orderModel.repository.create({ unit_price: 100, qty: 2, subtotal: 999 }, actorA),
      ).rejects.toThrow(/Cannot directly write computed field 'subtotal'/);

      const created = (await orderModel.repository.create(
        { unit_price: 100, qty: 3 },
        actorA,
      )) as unknown as Record<string, unknown>;
      expect(created.subtotal).toBe(300);
      expect(created.tax).toBe(30);
      expect(created.summary_label).toBe("sub=300,tax=30");

      // Stored columns can be filtered in SQL directly
      const queried = await orderModel.repository.find(
        { subtotal: { $gte: 300 } },
        { tenantId: "tenant-a" },
      );
      expect(queried).toHaveLength(1);

      await expect(
        orderModel.repository.update(String(created.id), { tax: 0 }, actorA),
      ).rejects.toThrow(/Cannot directly write computed field 'tax'/);

      const updated = (await orderModel.repository.update(
        String(created.id),
        { qty: 5 },
        actorA,
      )) as unknown as Record<string, unknown>;
      expect(updated.subtotal).toBe(500);
      expect(updated.tax).toBe(50);
      expect(updated.summary_label).toBe("sub=500,tax=50");

      const failingModel = defineModel({
        name: "t498.failing",
        table: "t498_failing",
        schema: z.object({ v: z.number().int() }),
        computed: {
          boom: {
            depends: ["v"],
            compute: () => {
              throw new Error("compute explosion");
            },
          },
        },
      });
      await syncModels([failingModel]);
      await expect(failingModel.repository.create({ v: 1 }, actorA)).rejects.toThrow(
        /Failed to compute field 'boom' on model 't498\.failing': compute explosion/,
      );
    });
  });

  describe("#500 Lifecycle hooks before/after commit & bounded reentrancy", () => {
    it("rolls back on before* hook failure, captures after* hook failures without rollback, and bounds reentrancy", async () => {
      const events: string[] = [];
      let failBeforeArchive = false;
      let failAfterHook = false;

      const docModel = defineModel({
        name: "t500.doc",
        table: "t500_docs",
        schema: z.object({ title: z.string(), counter: z.number().int().default(0) }),
        hooks: {
          beforeSave: ({ action, values }) => {
            events.push(`beforeSave:${action}`);
            if (values.title === "reject-before") {
              throw new Error("beforeSave aborted");
            }
          },
          afterSave: async ({ action, values }) => {
            events.push(`afterSave:${action}`);
            if (failAfterHook) {
              throw new Error("afterSave boom");
            }
            const nextCounter = Number(values.counter ?? 0) + 1;
            if (values.title === "recurse") {
              await docModel.repository.update(String(values.id), { counter: nextCounter }, actorA);
            }
          },
          beforeArchive: () => {
            events.push("beforeArchive");
            if (failBeforeArchive) throw new Error("cannot archive");
          },
          afterArchive: () => {
            events.push("afterArchive");
            if (failAfterHook) throw new Error("afterArchive boom");
          },
          beforeRestore: () => {
            events.push("beforeRestore");
          },
          afterRestore: () => {
            events.push("afterRestore");
          },
          beforeDelete: () => {
            events.push("beforeDelete");
          },
          afterDelete: () => {
            events.push("afterDelete");
          },
        },
      });
      await syncModels([docModel]);

      await expect(docModel.repository.create({ title: "reject-before" }, actorA)).rejects.toThrow(
        /beforeSave aborted/,
      );
      expect(await docModel.repository.count({}, { tenantId: "tenant-a" })).toBe(0);

      failBeforeArchive = true;
      const doc = await docModel.repository.create({ title: "normal" }, actorA);
      await expect(docModel.repository.archive(doc.id, actorA)).rejects.toThrow(/cannot archive/);
      expect((await docModel.repository.findOne(doc.id, { tenantId: "tenant-a" }))?.status).toBe(
        "active",
      );

      failBeforeArchive = false;
      failAfterHook = true;
      const archived = await docModel.repository.archive(doc.id, actorA);
      expect(archived?.status).toBe("archived");
      expect(modelRegistry.getHookErrors()).toHaveLength(1);
      expect(modelRegistry.getHookErrors()[0]).toMatchObject({
        model: "t500.doc",
        hook: "afterArchive",
        error: "afterArchive boom",
      });

      failAfterHook = false;
      modelRegistry.clearHookErrors();
      await docModel.repository.restore(doc.id, actorA);
      await docModel.repository.delete(doc.id, actorA);
      expect(events).toEqual(
        expect.arrayContaining([
          "beforeArchive",
          "afterArchive",
          "beforeRestore",
          "afterRestore",
          "beforeDelete",
          "afterDelete",
        ]),
      );

      // Bounded reentrancy: recursive afterSave stops at MAX_HOOK_DEPTH = 4
      const recursive = await docModel.repository.create({ title: "recurse", counter: 0 }, actorA);
      const reloaded = await docModel.repository.findOne(recursive.id, { tenantId: "tenant-a" });
      expect(reloaded?.counter).toBe(4);
      expect(modelRegistry.getHookErrors().some((e) => e.error.includes("reentrancy depth"))).toBe(
        true,
      );
    });
  });

  describe("#501 Concurrency-safe upsert & atomic createMany", () => {
    it("rolls back entire createMany batch + audit + outbox on item N failure and fires after-commit hooks once committed", async () => {
      const afterSavedIds: string[] = [];
      const writeEvents: string[] = [];

      const batchModel = defineModel({
        name: "t501.batch",
        table: "t501_batches",
        schema: z.object({ code: z.string().min(1), rank: z.number().int() }),
        indexes: [{ fields: ["tenant_id", "code"], unique: true }],
        constrains: [
          ({ after }) => {
            if (Number(after.rank) < 0) {
              throw new Error("rank must be non-negative");
            }
          },
        ],
        hooks: {
          afterSave: ({ values }) => {
            afterSavedIds.push(String(values.id));
          },
        },
      });
      await syncModels([batchModel]);
      const unsub = onModelWrite("t501.batch", (ev) => {
        writeEvents.push(ev.entityId);
      });

      await expect(
        batchModel.repository.createMany(
          [
            { code: "k1", rank: 1 },
            { code: "k2", rank: 2 },
            { code: "k3", rank: -1 },
          ],
          actorA,
        ),
      ).rejects.toThrow(/rank must be non-negative/);

      expect(await batchModel.repository.count({}, { tenantId: "tenant-a" })).toBe(0);
      const audits = await getDb().all("SELECT * FROM _orm_audit_log WHERE model = 't501.batch'");
      const outbox = await getDb().all(
        "SELECT * FROM _orm_outbox_events WHERE model = 't501.batch'",
      );
      expect(audits).toHaveLength(0);
      expect(outbox).toHaveLength(0);
      expect(afterSavedIds).toHaveLength(0);
      expect(writeEvents).toHaveLength(0);

      const created = await batchModel.repository.createMany(
        [
          { code: "k1", rank: 1 },
          { code: "k2", rank: 2 },
        ],
        actorA,
      );
      expect(created).toHaveLength(2);
      expect(afterSavedIds).toHaveLength(2);
      expect(writeEvents).toHaveLength(2);
      unsub();

      // Concurrent upsert against same unique key produces single row without duplicates
      await Promise.all([
        batchModel.repository.upsert({ code: "concurrent-key" }, { rank: 10 }, actorA),
        batchModel.repository.upsert({ code: "concurrent-key" }, { rank: 20 }, actorA),
      ]);
      const rows = await batchModel.repository.find(
        { code: "concurrent-key" },
        { tenantId: "tenant-a" },
      );
      expect(rows).toHaveLength(1);
      expect([10, 20]).toContain(rows[0]?.rank);
    });
  });

  describe("#495 Postgres catalog inspection, advisory lock, & verifyBackupIntegrity", () => {
    it("inspects Postgres system catalogs without PRAGMA and acquires advisory lock during syncModels", async () => {
      closeDb();
      const queries: string[] = [];
      const txQueries: string[] = [];

      const pool: PoolLike = {
        query: async (sql: string) => {
          queries.push(sql);
          if (sql.includes("SELECT 1 AS ok")) return { rows: [{ ok: 1 }], rowCount: 1 };
          if (sql.includes("pg_index")) return { rows: [], rowCount: 0 };
          if (sql.includes("pg_constraint")) return { rows: [], rowCount: 0 };
          return { rows: [], rowCount: 0 };
        },
        connect: async () => ({
          query: async (sql: string) => {
            txQueries.push(sql);
            if (sql.includes("information_schema.columns")) {
              return { rows: [], rowCount: 0 };
            }
            if (sql.includes("pg_indexes")) {
              return { rows: [], rowCount: 0 };
            }
            if (sql.includes("pg_constraint")) {
              return { rows: [], rowCount: 0 };
            }
            return { rows: [], rowCount: 0 };
          },
          release: () => {},
        }),
        end: async () => {},
      };

      await initPostgresDb("postgres://mw:pw@localhost:5432/mw", pool);
      const pgModel = defineModel({
        name: "t495.pg",
        table: "t495_pgs",
        schema: z.object({ slug: z.string() }),
        indexes: [{ fields: ["slug"], unique: true }],
      });

      const report = await syncModels([pgModel]);
      expect(report.createdTables).toContain("t495_pgs");
      expect(txQueries.some((q) => q.includes("pg_advisory_xact_lock"))).toBe(true);
      expect(txQueries.some((q) => q.includes("information_schema.columns"))).toBe(true);
      expect(txQueries.some((q) => q.includes("pg_indexes"))).toBe(true);
      expect(txQueries.some((q) => q.includes("pg_constraint"))).toBe(true);
      expect(txQueries.some((q) => /\bPRAGMA\b/i.test(q))).toBe(false);

      await applyMigrations([{ id: "pg_m1", up: "CREATE TABLE pg_m1(id TEXT PRIMARY KEY)" }]);
      expect(queries.some((q) => q.includes("information_schema.columns"))).toBe(true);
      expect(queries.some((q) => /\bPRAGMA\b/i.test(q))).toBe(false);

      expect(await verifyBackupIntegrity()).toEqual({ ok: true, errors: [] });
    });
  });

  describe("#496, #497, #508 Relations, many2many, projection, and query budget", () => {
    it("enforces many2one onDelete rules, detects orphans/cross-tenant in preflight, batch-hydrates many2many within query budget, and projects fields", async () => {
      expect(() =>
        defineModel({
          name: "t496.bad_cascade",
          table: "t496_bad_cascades",
          schema: z.object({ parent_id: z.string() }),
          relations: {
            parent_id: { model: "t496.parent", onDelete: "cascade" as unknown as "restrict" },
          },
        }),
      ).toThrow(/destructive cascades are not allowed/);

      const parent = defineModel({
        name: "t496.parent",
        table: "t496_parents",
        schema: z.object({ name: z.string() }),
      });

      expect(() =>
        defineModel({
          name: "t496.bad_set_null",
          table: "t496_bad_set_nulls",
          schema: z.object({ parent_id: z.string() }),
          relations: { parent_id: { model: "t496.parent", onDelete: "set null" } },
        }),
      ).toThrow(/requires a nullable or optional column/);

      expect(() =>
        defineModel({
          name: "t496.bad_target_unique",
          table: "t496_bad_uniques",
          schema: z.object({ parent_name: z.string() }),
          relations: { parent_name: { model: "t496.parent", targetField: "name" } },
        }),
      ).toThrow(/non-unique column/);

      const childSetNull = defineModel({
        name: "t496.child",
        table: "t496_children",
        schema: z.object({ parent_id: z.string().nullable(), title: z.string() }),
        relations: { parent_id: { model: "t496.parent", onDelete: "set null" } },
      });
      expect(childSetNull.ddl).toContain("ON DELETE SET NULL");

      const tag = defineModel({
        name: "t497.tag",
        table: "t497_tags",
        schema: z.object({ name: z.string() }),
      });
      const post = defineModel({
        name: "t497.post",
        table: "t497_posts",
        schema: z.object({ title: z.string(), secret_col: z.string().default("hidden") }),
        relations: {
          tags: {
            model: "t497.tag",
            type: "many2many",
            through: "t497_post_tags",
            sourceKey: "post_id",
            targetKey: "tag_id",
          },
        },
      });

      const syncReport = await syncModels([parent, childSetNull, tag, post]);
      expect(syncReport.createdTables).toContain("t497_post_tags");

      const p1 = await parent.repository.create({ name: "P1" }, actorA);
      const c1 = await childSetNull.repository.create({ parent_id: p1.id, title: "C1" }, actorA);
      await parent.repository.delete(p1.id, actorA);
      const reloadedC1 = await childSetNull.repository.findOne(c1.id, { tenantId: "tenant-a" });
      expect(reloadedC1?.parent_id).toBeNull();

      // Preflight detects cross-tenant and orphan links
      await getDb().run(
        `INSERT INTO t496_parents (id, create_date, write_date, status, version, source, tenant_id, name) VALUES (?, ?, ?, 'active', 1, 'api', 'tenant-b', ?)`,
        ["p-b", new Date().toISOString(), new Date().toISOString(), "PB"],
      );
      await getDb().exec("PRAGMA foreign_keys = OFF");
      await getDb().run(
        `INSERT INTO t496_children (id, create_date, write_date, status, version, source, tenant_id, parent_id, title) VALUES (?, ?, ?, 'active', 1, 'api', 'tenant-a', ?, ?)`,
        ["c-cross", new Date().toISOString(), new Date().toISOString(), "p-b", "Cross"],
      );
      await getDb().run(
        `INSERT INTO t496_children (id, create_date, write_date, status, version, source, tenant_id, parent_id, title) VALUES (?, ?, ?, 'active', 1, 'api', 'tenant-a', ?, ?)`,
        ["c-orphan", new Date().toISOString(), new Date().toISOString(), "missing-p", "Orphan"],
      );
      await getDb().exec("PRAGMA foreign_keys = ON");

      const preflight = await preflightRelationIntegrity([parent, childSetNull]);
      expect(preflight.ok).toBe(false);
      expect(preflight.violations.map((v) => v.kind).sort()).toEqual(["cross_tenant", "orphan"]);

      // Many2many attach/detach/replace + cross-tenant guard + batch query budget + projection
      const t1 = await tag.repository.create({ name: "news" }, actorA);
      const t2 = await tag.repository.create({ name: "ops" }, actorA);
      const tOtherTenant = await tag.repository.create({ name: "foreign" }, actorB);
      const post1 = await post.repository.create({ title: "Post 1" }, actorA);
      const post2 = await post.repository.create({ title: "Post 2" }, actorA);

      await expect(
        post.repository.attachRelation(post1.id, "tags", tOtherTenant.id, actorA),
      ).rejects.toBeInstanceOf(PolicyError);

      expect(
        await post.repository.attachRelation(post1.id, "tags", [t1.id, t2.id], actorA),
      ).toEqual({
        attached: 2,
      });
      expect(await post.repository.attachRelation(post2.id, "tags", [t1.id], actorA)).toEqual({
        attached: 1,
      });

      // Hydrating N posts with many2many runs in constant 3 queries (posts + join + tags), zero N+1!
      const hydrated = await withQueryBudget(3, () =>
        post.repository.find({}, { tenantId: "tenant-a", with: ["tags"], fields: ["id", "title"] }),
      );
      expect(hydrated).toHaveLength(2);
      expect(Object.keys(hydrated[0] as unknown as Record<string, unknown>)).not.toContain(
        "secret_col",
      );
      const h1 = hydrated.find((r) => r.id === post1.id) as unknown as Record<string, unknown>;
      expect((h1.$tags as Array<{ name: string }>).map((t) => t.name).sort()).toEqual([
        "news",
        "ops",
      ]);

      await expect(
        withQueryBudget(1, () =>
          post.repository.find({}, { tenantId: "tenant-a", with: ["tags"] }),
        ),
      ).rejects.toThrow(/Query budget exceeded/);

      await expect(
        post.repository.find({}, { tenantId: "tenant-a", with: ["a.b.c"] }),
      ).rejects.toThrow(/exceeds maximum depth/);

      await expect(
        post.repository.find({}, { tenantId: "tenant-a", fields: ["nonexistent"] }),
      ).rejects.toThrow(/Unknown column/);

      expect(await post.repository.replaceRelation(post1.id, "tags", [t2.id], actorA)).toEqual({
        attached: 0,
        detached: 1,
      });
      expect(await post.repository.detachRelation(post1.id, "tags", [t2.id], actorA)).toEqual({
        detached: 1,
      });
    });
  });

  describe("#502 ORM outbox table & atomic sanitized write", () => {
    it("writes sanitized outbox rows inside transactions and leaves zero rows on rollback", async () => {
      const secretModel = defineModel({
        name: "t502.account",
        table: "t502_accounts",
        extensible: true,
        schema: z.object({
          username: z.string(),
          password_hash: z.string(),
          api_token: z.string(),
          client_secret: z.string(),
          encrypted_private_key: z.string(),
          sensitive_note: z.string().default("private"),
          settings: z
            .object({
              label: z.string(),
              nested: z.object({ refresh_token: z.string() }),
            })
            .default({ label: "default", nested: { refresh_token: "default-refresh" } }),
          providerData: z.array(z.object({ access_token: z.string() })).default([]),
        }),
        fieldPolicies: {
          sensitive_note: { sensitive: true },
        },
        constrains: [
          ({ after }) => {
            if (after.username === "bad-tx") {
              throw new Error("rolled back account");
            }
          },
        ],
      });
      await syncModels([secretModel]);

      await expect(
        secretModel.repository.create(
          {
            username: "bad-tx",
            password_hash: "h",
            api_token: "t",
            client_secret: "s",
            encrypted_private_key: "k",
          },
          actorA,
        ),
      ).rejects.toThrow(/rolled back account/);

      expect(
        await getDb().all("SELECT * FROM _orm_outbox_events WHERE model = 't502.account'"),
      ).toHaveLength(0);

      const created = await secretModel.repository.create(
        {
          username: "alice",
          password_hash: "hash-val",
          api_token: "tok-val",
          client_secret: "sec-val",
          encrypted_private_key: "priv-val",
          sensitive_note: "secret-note",
          settings: { label: "profile", nested: { refresh_token: "nested-token-val" } },
          providerData: [{ access_token: "array-token-val" }],
        },
        actorA,
      );
      await secretModel.repository.update(
        created.id,
        {
          username: "alice2",
          password_hash: "hash-val-2",
          api_token: "tok-val-2",
          client_secret: "sec-val-2",
          encrypted_private_key: "priv-val-2",
          sensitive_note: "secret-note-2",
          settings: {
            label: "profile-updated",
            nested: { refresh_token: "nested-token-val-2" },
          },
          providerData: [{ access_token: "array-token-val-2" }],
        },
        actorA,
      );
      await secretModel.repository.archive(created.id, actorA);
      await secretModel.repository.restore(created.id, actorA);
      await secretModel.repository.delete(created.id, actorA);

      const outboxRows = await getDb().all<{
        action: string;
        status: string;
        tenant_id: string;
        actor_id: string;
        request_id: string;
        event_version: number;
        payload_json: string;
      }>(
        "SELECT action, status, tenant_id, actor_id, request_id, event_version, payload_json FROM _orm_outbox_events WHERE model = 't502.account' AND entity_id = ? ORDER BY rowid ASC",
        [created.id],
      );
      expect(outboxRows.map((r) => r.action)).toEqual([
        "CREATE",
        "UPDATE",
        "ARCHIVE",
        "RESTORE",
        "DELETE",
      ]);
      for (const row of outboxRows) {
        expect(row.status).toBe("pending");
        expect(row.tenant_id).toBe("tenant-a");
        expect(row.actor_id).toBe("u-a");
        expect(row.request_id).toBe("req-a");
        expect(row.event_version).toBe(1);
        const payload = JSON.parse(row.payload_json) as { record: Record<string, unknown> };
        expect(payload.record.username).toBeTruthy();
        expect(payload.record).not.toHaveProperty("password_hash");
        expect(payload.record).not.toHaveProperty("api_token");
        expect(payload.record).not.toHaveProperty("client_secret");
        expect(payload.record).not.toHaveProperty("encrypted_private_key");
        expect(payload.record).not.toHaveProperty("sensitive_note");
        expect(
          (payload.record.settings as { nested: Record<string, unknown> }).nested,
        ).not.toHaveProperty("refresh_token");
      }

      const auditRows = await getDb().all<{ action: string; diff: string }>(
        "SELECT action, diff FROM _orm_audit_log WHERE model = 't502.account' AND entity_id = ? ORDER BY rowid ASC",
        [created.id],
      );
      expect(auditRows.map((row) => row.action)).toEqual([
        "CREATE",
        "UPDATE",
        "ARCHIVE",
        "RESTORE",
        "DELETE",
      ]);
      for (const row of auditRows) {
        for (const secret of [
          "hash-val",
          "tok-val",
          "sec-val",
          "priv-val",
          "secret-note",
          "nested-token-val",
          "array-token-val",
        ]) {
          expect(row.diff).not.toContain(secret);
        }
      }

      const createDiff = JSON.parse(auditRows[0]!.diff) as Record<string, unknown>;
      expect(createDiff.username).toEqual({ before: null, after: "alice" });
      expect(createDiff.password_hash).toEqual({ before: null, after: "[REDACTED]" });
      expect(createDiff.api_token).toEqual({ before: null, after: "[REDACTED]" });
      expect(createDiff.sensitive_note).toEqual({ before: null, after: "[REDACTED]" });
      expect(createDiff.settings).toEqual({
        before: null,
        after: { label: "profile", nested: { refresh_token: "[REDACTED]" } },
      });
      expect(createDiff.providerData).toEqual({
        before: null,
        after: [{ access_token: "[REDACTED]" }],
      });

      const updateDiff = JSON.parse(auditRows[1]!.diff) as Record<string, unknown>;
      expect(updateDiff.username).toEqual({ before: "alice", after: "alice2" });
      expect(updateDiff.password_hash).toEqual({
        before: "[REDACTED]",
        after: "[REDACTED]",
      });
      expect(updateDiff.settings).toEqual({
        before: { label: "profile", nested: { refresh_token: "[REDACTED]" } },
        after: { label: "profile-updated", nested: { refresh_token: "[REDACTED]" } },
      });
      expect(updateDiff.providerData).toEqual({
        before: [{ access_token: "[REDACTED]" }],
        after: [{ access_token: "[REDACTED]" }],
      });
    });
  });
});
