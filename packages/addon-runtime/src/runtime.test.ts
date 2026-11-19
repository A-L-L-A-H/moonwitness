import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { z } from "zod";
import {
  closeDb,
  createActorContext,
  defineModel,
  getDb,
  initDb,
  listAppliedMigrations,
  modelRegistry,
  PolicyError,
} from "@moonwitness/orm";
import { irAddonModel } from "./ir-models.js";
import {
  AddonRuntimeController,
  evaluateModelRecordRules,
  type AddonDefinition,
  type IrRuleRecordLike,
} from "./runtime.js";
import { registerBaseAddon } from "./index.js";
import type { BaseAddonAuthBridge } from "./generic-crud.js";

const headerAuth: BaseAddonAuthBridge = {
  authenticate: async (request, reply) => {
    if (!request.headers["x-role"]) await reply.code(401).send({ error: "Not authenticated" });
  },
  requireRole:
    (...roles) =>
    async (request, reply) => {
      const role = request.headers["x-role"] as string | undefined;
      if (!role) return void (await reply.code(401).send({ error: "Not authenticated" }));
      if (!roles.includes(role as "admin" | "editor" | "viewer")) {
        await reply.code(403).send({ error: "Forbidden" });
      }
    },
  getActorRole: (request) => {
    const role = request.headers["x-role"];
    return role === "admin" || role === "editor" || role === "viewer" ? role : "public";
  },
  getActorId: () => "actor-1",
};

const noteModel = defineModel({
  name: "demo.note",
  table: "demo_notes",
  schema: z.object({
    title: z.string().min(1),
    body: z.string().default(""),
  }),
  extensible: true,
  restEnabled: true,
});

function buildAddon(): AddonDefinition {
  return {
    manifest: {
      name: "demo",
      version: "1.0.0",
      depends: ["__base"],
      provides: { models: ["demo.note"] },
    },
    models: [noteModel],
    rules: [
      { model_name: "demo.note", role: "viewer", can_read: true },
      {
        model_name: "demo.note",
        role: "editor",
        can_read: true,
        can_create: true,
        can_update: true,
      },
    ],
    menus: [
      { menu_key: "demo.notes", label: "Notes", href: "/models/demo.note", min_role: "viewer" },
    ],
    registerRoutes: (scope) => {
      scope.get("/demo/ping", async () => ({ pong: true }));
    },
  };
}

describe("AddonRuntimeController", () => {
  const createdDirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-addon-base-"));
    createdDirs.push(dir);
    await initDb(join(dir, "runtime.db"));
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  afterAll(() => {
    for (const dir of createdDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on temp directory cleanup.
      }
    }
  });

  async function boot(extraAddons: AddonDefinition[] = []) {
    const runtime = new AddonRuntimeController();
    const app = Fastify();
    await runtime.syncAll(
      [
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        buildAddon(),
        ...extraAddons,
      ],
      app,
    );
    await registerBaseAddon(app, { runtime, auth: headerAuth, apiPrefix: "/api/v1" });
    await app.ready();
    return { runtime, app };
  }

  it("toggles addon routes live between 200 and 503", async () => {
    const { runtime, app } = await boot();
    expect((await app.inject({ url: "/demo/ping" })).statusCode).toBe(200);
    await runtime.disable("demo");
    const off = await app.inject({ url: "/demo/ping" });
    expect(off.statusCode).toBe(503);
    expect(off.json().code).toBe("ADDON_DISABLED");
    await runtime.enable("demo");
    expect((await app.inject({ url: "/demo/ping" })).statusCode).toBe(200);
    await app.close();
  });

  it("enforces ir_rules and supports CRUD, archive/restore, delete, and history", async () => {
    const { app } = await boot();
    const url = "/api/v1/m/demo.note";
    expect((await app.inject({ url })).statusCode).toBe(401);

    const viewerCreate = await app.inject({
      method: "POST",
      url,
      headers: { "x-role": "viewer" },
      payload: { title: "a" },
    });
    expect(viewerCreate.statusCode).toBe(403);

    const created = await app.inject({
      method: "POST",
      url,
      headers: { "x-role": "editor" },
      payload: { title: "alpha", body: "one" },
    });
    expect(created.statusCode, JSON.stringify(created.json())).toBe(201);
    const id = created.json().data.id as string;

    const list = await app.inject({ url, headers: { "x-role": "viewer" } });
    expect(list.json().total).toBe(1);

    const archived = await app.inject({
      method: "POST",
      url: `${url}/${id}/archive`,
      headers: { "x-role": "editor" },
    });
    expect(archived.statusCode).toBe(200);
    expect(archived.json().data.status).toBe("archived");

    const restored = await app.inject({
      method: "POST",
      url: `${url}/${id}/restore`,
      headers: { "x-role": "editor" },
    });
    expect(restored.statusCode).toBe(200);
    expect(restored.json().data.status).toBe("active");

    const history = await app.inject({
      url: `${url}/${id}/history`,
      headers: { "x-role": "viewer" },
    });
    expect(history.statusCode).toBe(200);
    expect(history.json().data.length).toBeGreaterThanOrEqual(3);

    const viewerDelete = await app.inject({
      method: "DELETE",
      url: `${url}/${id}`,
      headers: { "x-role": "editor" },
    });
    expect(viewerDelete.statusCode).toBe(403);

    const adminDelete = await app.inject({
      method: "DELETE",
      url: `${url}/${id}`,
      headers: { "x-role": "admin" },
    });
    expect(adminDelete.statusCode).toBe(200);
    expect((await app.inject({ url, headers: { "x-role": "viewer" } })).json().total).toBe(0);
    await app.close();
  });

  it("registers custom fields at runtime and validates _attrs", async () => {
    const { app } = await boot();
    const admin = { "x-role": "admin" };
    const field = await app.inject({
      method: "POST",
      url: "/_meta/models/demo.note/fields",
      headers: admin,
      payload: { field_name: "priority", field_type: "integer", required: true },
    });
    expect(field.statusCode).toBe(201);

    const bad = await app.inject({
      method: "POST",
      url: "/api/v1/m/demo.note",
      headers: admin,
      payload: { title: "x", _attrs: { priority: "high" } },
    });
    expect(bad.statusCode).toBe(400);

    const good = await app.inject({
      method: "POST",
      url: "/api/v1/m/demo.note",
      headers: admin,
      payload: { title: "x", _attrs: { priority: 3 } },
    });
    expect(good.statusCode).toBe(201);
    expect(good.json().data._attrs).toEqual({ priority: 3 });
    await app.close();
  });

  it("supports provides.extends columns across addons and exposes them in views", async () => {
    const { app } = await boot([
      {
        manifest: {
          name: "demo_ext",
          version: "1.0.0",
          depends: ["demo"],
          provides: { extends: ["demo.note"] },
        },
        extensions: [
          {
            target: "demo.note",
            fields: z.object({ ext_badge: z.string().default("none") }),
          },
        ],
      },
    ]);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/m/demo.note",
      headers: { "x-role": "editor" },
      payload: { title: "extended", ext_badge: "silver" },
    });
    expect(created.statusCode, JSON.stringify(created.json())).toBe(201);
    expect(created.json().data.ext_badge).toBe("silver");

    const view = await app.inject({
      url: "/_meta/views/demo.note",
      headers: { "x-role": "viewer" },
    });
    expect(view.statusCode).toBe(200);
    const fieldNames = view.json().fields.map((f: { field_name: string }) => f.field_name);
    expect(fieldNames).toContain("ext_badge");
    await app.close();
  });

  it("filters navigation by role and serves view descriptors", async () => {
    const { app } = await boot();
    expect((await app.inject({ url: "/_meta/navigation" })).statusCode).toBe(401);
    const nav = await app.inject({ url: "/_meta/navigation", headers: { "x-role": "viewer" } });
    expect(nav.json().menus.map((m: { menu_key: string }) => m.menu_key)).toContain("demo.notes");
    const view = await app.inject({
      url: "/_meta/views/demo.note",
      headers: { "x-role": "viewer" },
    });
    expect(view.statusCode).toBe(200);
    expect(view.json().acl.canRead).toBe(true);
    await app.close();
  });

  it("rejects extends of a model no dependency provides", async () => {
    const runtime = new AddonRuntimeController();
    await expect(
      runtime.syncAll([
        { manifest: { name: "__base", version: "1.0.0" } },
        {
          manifest: {
            name: "bad",
            version: "1.0.0",
            depends: ["__base"],
            provides: { extends: ["ghost.model"] },
          },
        },
      ]),
    ).rejects.toThrow(/extends 'ghost.model'/);
  });

  it("evaluates global (AND) and group (OR) record rules and throws INVALID_RULE_DOMAIN on malformed domains (#492)", async () => {
    const actor = createActorContext("u-1", "api", undefined, "acme");
    const rules: IrRuleRecordLike[] = [
      {
        rule_key: "r.global.tenant",
        model_name: "demo.doc",
        role: "public",
        scope: "global",
        groups_json: "[]",
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: false,
        domain_json: JSON.stringify({ tenant_id: "$actor.tenantId" }),
      },
      {
        rule_key: "r.global.active",
        model_name: "demo.doc",
        role: "public",
        scope: "global",
        groups_json: "[]",
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
        domain_json: JSON.stringify([["archived", "=", false]]),
      },
      {
        rule_key: "r.grp.viewer",
        model_name: "demo.doc",
        role: "viewer",
        scope: "group",
        groups_json: JSON.stringify(["base.group_viewer"]),
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
        domain_json: JSON.stringify({ visibility: "public" }),
      },
      {
        rule_key: "r.grp.editor",
        model_name: "demo.doc",
        role: "editor",
        scope: "group",
        groups_json: JSON.stringify(["base.group_editor"]),
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: false,
        domain_json: JSON.stringify({ owner_id: "$actor.id" }),
      },
    ];

    // Editor read combines both global rules (AND) with matching group rules (viewer OR editor)
    const editorRead = evaluateModelRecordRules({
      rules,
      role: "editor",
      actor,
      operation: "read",
    });
    expect(editorRead.allowed).toBe(true);
    expect(editorRead.domain).toEqual({
      $and: [
        { $and: [{ tenant_id: "acme" }, { archived: false }] },
        { $or: [{ visibility: "public" }, { owner_id: "u-1" }] },
      ],
    });

    // Global rule with can_update=false does not restrict update; group rule cannot widen global tenant rule
    const editorUpdate = evaluateModelRecordRules({
      rules,
      role: "editor",
      actor,
      operation: "update",
    });
    expect(editorUpdate.allowed).toBe(true);
    expect(editorUpdate.domain).toEqual({
      $and: [{ tenant_id: "acme" }, { owner_id: "u-1" }],
    });

    // Admin still gets global domain
    const adminRead = evaluateModelRecordRules({
      rules,
      role: "admin",
      actor,
      operation: "read",
    });
    expect(adminRead.allowed).toBe(true);
    expect(adminRead.domain).toEqual({
      $and: [{ tenant_id: "acme" }, { archived: false }],
    });

    // Malformed domain throws PolicyError INVALID_RULE_DOMAIN (400)
    expect(() =>
      evaluateModelRecordRules({
        rules: [
          {
            model_name: "demo.doc",
            role: "viewer",
            scope: "group",
            groups_json: "[]",
            can_read: true,
            can_create: false,
            can_update: false,
            can_delete: false,
            domain_json: "{not-json",
          },
        ],
        role: "viewer",
        actor,
        operation: "read",
      }),
    ).toThrowError(PolicyError);

    try {
      evaluateModelRecordRules({
        rules: [
          {
            model_name: "demo.doc",
            role: "viewer",
            scope: "group",
            groups_json: "[]",
            can_read: true,
            can_create: false,
            can_update: false,
            can_delete: false,
            domain_json: JSON.stringify({ $bogus: 1 }),
          },
        ],
        role: "viewer",
        actor,
        operation: "read",
      });
    } catch (err) {
      expect(err).toBeInstanceOf(PolicyError);
      expect((err as PolicyError).code).toBe("INVALID_RULE_DOMAIN");
      expect((err as PolicyError).statusCode).toBe(400);
    }
  });

  it("validates group references on syncAll and filters getViewDescriptor by fieldPolicies (#492/#494)", async () => {
    const policyModel = defineModel({
      name: "demo.secured",
      table: "demo_secured",
      restEnabled: true,
      schema: z.object({
        title: z.string(),
        internal_score: z.number().int().default(0),
        api_token: z.string().default("tok"),
        classified_note: z.string().default("hidden"),
      }),
      fieldPolicies: {
        internal_score: { readRoles: ["editor", "admin"], writeRoles: ["admin"] },
        classified_note: { sensitive: true },
      },
    });

    const badRuntime = new AddonRuntimeController();
    await expect(
      badRuntime.syncAll([
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "bad_grp_addon",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["demo.secured"] },
          },
          models: [policyModel],
          rules: [
            {
              rule_key: "demo.secured.bad",
              model_name: "demo.secured",
              groups: ["unknown.group"],
              can_read: true,
            },
          ],
        },
      ]),
    ).rejects.toThrow(/unknown group 'unknown\.group'/i);

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
      {
        manifest: {
          name: "secured_addon",
          version: "1.0.0",
          depends: ["__base"],
          provides: { models: ["demo.secured"] },
        },
        models: [policyModel],
        data: [
          {
            id: "grp_auditor",
            model: "res.groups",
            key: { group_key: "demo.auditors" },
            values: {
              group_key: "demo.auditors",
              name: "Auditors",
              category: "demo",
              implied_ids_json: '["base.group_viewer"]',
            },
          },
        ],
        rules: [
          {
            rule_key: "demo.secured.global",
            model_name: "demo.secured",
            scope: "global",
            can_read: true,
            domain: { tenant_id: "$actor.tenantId" },
          },
          {
            rule_key: "demo.secured.auditor",
            model_name: "demo.secured",
            scope: "group",
            groups: ["demo.auditors"],
            can_read: true,
          },
          {
            rule_key: "demo.secured.editor",
            model_name: "demo.secured",
            scope: "group",
            groups: ["base.group_editor"],
            can_read: true,
          },
        ],
      },
    ]);

    const viewerEval = await runtime.evaluateRuleForOperation(
      "demo.secured",
      "viewer",
      createActorContext("v1", "api", undefined, "t1"),
      "read",
    );
    expect(viewerEval.allowed).toBe(false);

    const auditorEval = await runtime.evaluateRuleForOperation(
      "demo.secured",
      "public",
      createActorContext("a1", "api", undefined, "t1"),
      "read",
      ["demo.auditors"],
    );
    expect(auditorEval.allowed).toBe(true);
    expect(auditorEval.domain).toEqual({ tenant_id: "t1" });

    // View descriptor filters unreadable fields and exposes fieldPolicies ONLY to admin
    const editorView = await runtime.getViewDescriptor("demo.secured", "editor");
    expect(editorView?.fields.map((f) => f.field_name)).toEqual(["title", "internal_score"]);
    expect(editorView?.fieldPolicies).toBeUndefined();

    const adminView = await runtime.getViewDescriptor("demo.secured", "admin");
    expect(adminView?.fields.map((f) => f.field_name)).toEqual(["title", "internal_score"]);
    expect(adminView?.fieldPolicies).toEqual({
      internal_score: { readRoles: ["editor", "admin"], writeRoles: ["admin"] },
      api_token: { sensitive: true },
      classified_note: { sensitive: true },
    });

    // Reject unknown group references on fieldPolicies in syncAll
    const badFieldPolicyModel = defineModel({
      name: "demo.bad_field_group",
      table: "demo_bad_field_group",
      restEnabled: true,
      schema: z.object({ secret_col: z.string() }),
      fieldPolicies: {
        secret_col: { readGroups: ["nonexistent.group"] },
      },
    });
    const badFieldPolicyRuntime = new AddonRuntimeController();
    await expect(
      badFieldPolicyRuntime.syncAll([
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "bad_field_grp_addon",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["demo.bad_field_group"] },
          },
          models: [badFieldPolicyModel],
        },
      ]),
    ).rejects.toThrow(/unknown group 'nonexistent\.group'/i);
  });

  it("validates and applies per-addon migrations in dependency order inside syncAll() and enable() (#503)", async () => {
    const runtime = new AddonRuntimeController();

    // Reject mismatch between manifest.provides.migrations and def.migrations
    await expect(
      runtime.syncAll([
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "bad_mig",
            version: "1.0.0",
            depends: ["__base"],
            provides: { migrations: ["m_declared"] },
          },
          migrations: [{ id: "m_actual", up: "CREATE TABLE t_bad (id TEXT PRIMARY KEY)" }],
        },
      ]),
    ).rejects.toThrow(/does not match migrations/);

    // Reject duplicate migration IDs across addons
    await expect(
      runtime.syncAll([
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "addon_a",
            version: "1.0.0",
            depends: ["__base"],
            provides: { migrations: ["shared_mig"] },
          },
          migrations: [{ id: "shared_mig", up: "CREATE TABLE t_a (id TEXT PRIMARY KEY)" }],
        },
        {
          manifest: {
            name: "addon_b",
            version: "1.0.0",
            depends: ["__base"],
            provides: { migrations: ["shared_mig"] },
          },
          migrations: [{ id: "shared_mig", up: "CREATE TABLE t_b (id TEXT PRIMARY KEY)" }],
        },
      ]),
    ).rejects.toThrow(/already claimed/);

    // Valid dependency-ordered migrations run before seed() and before route enablement
    const events: string[] = [];
    const optRuntime = new AddonRuntimeController();
    await optRuntime.syncAll([
      { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
      {
        manifest: {
          name: "core_mig",
          version: "1.0.0",
          depends: ["__base"],
          autoInstall: true,
          provides: { migrations: ["core_001_table"] },
        },
        migrations: [
          {
            id: "core_001_table",
            up: "CREATE TABLE IF NOT EXISTS mig_core_items (id TEXT PRIMARY KEY, label TEXT NOT NULL)",
          },
        ],
        seed: async () => {
          const row = await getDb().get<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'mig_core_items'",
          );
          expect(row?.name).toBe("mig_core_items");
          expect(optRuntime.isEnabled("core_mig")).toBe(false);
          events.push("core:seed");
        },
      },
      {
        manifest: {
          name: "leaf_mig",
          version: "1.0.0",
          depends: ["core_mig@^1.0.0"],
          autoInstall: false,
          defaultEnabled: false,
          provides: { migrations: ["leaf_001_col"] },
        },
        migrations: [
          {
            id: "leaf_001_col",
            up: "CREATE TABLE IF NOT EXISTS mig_leaf_items (id TEXT PRIMARY KEY, core_id TEXT NOT NULL)",
          },
        ],
        seed: async () => {
          events.push("leaf:seed");
        },
      },
    ]);

    expect(events).toEqual(["core:seed"]);
    expect(optRuntime.isEnabled("core_mig")).toBe(true);
    expect(optRuntime.isEnabled("leaf_mig")).toBe(false);

    const coreApplied = await listAppliedMigrations("core_mig");
    expect(coreApplied.map((m) => m.id)).toEqual(["core_001_table"]);
    expect(await listAppliedMigrations("leaf_mig")).toEqual([]);

    // Now enable leaf_mig -> runs leaf_001_col migration and seed before marking installed
    await optRuntime.enable("leaf_mig");
    expect(optRuntime.isEnabled("leaf_mig")).toBe(true);
    expect(events).toEqual(["core:seed", "leaf:seed"]);
    const leafApplied = await listAppliedMigrations("leaf_mig");
    expect(leafApplied.map((m) => m.id)).toEqual(["leaf_001_col"]);
  });

  it("plans dry-run upgrades without mutating the database (#506)", async () => {
    const runtime = new AddonRuntimeController();
    const addonsV1: AddonDefinition[] = [
      { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
      {
        manifest: {
          name: "core",
          version: "1.0.0",
          depends: ["__base@^1.0.0"],
          autoInstall: true,
          provides: { migrations: ["core_001"] },
        },
        migrations: [
          { id: "core_001", up: "CREATE TABLE IF NOT EXISTS dry_core (id TEXT PRIMARY KEY)" },
        ],
      },
      {
        manifest: {
          name: "plugin",
          version: "1.0.0",
          depends: ["core@>=1.0.0 <2.0.0"],
          autoInstall: true,
        },
      },
    ];

    // Dry-run before DB syncAll must not create ir_addons or any tables
    const initialPlan = await runtime.planUpgrade(addonsV1);
    expect(initialPlan.order).toEqual(["__base", "core", "plugin"]);
    expect(initialPlan.installs).toEqual(["__base", "core", "plugin"]);
    expect(initialPlan.declaredMigrationIds).toEqual(["core_001"]);
    const irTableBefore = await getDb().get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ir_addons'",
    );
    expect(irTableBefore).toBeUndefined();

    await runtime.syncAll(addonsV1);

    // Dry-run upgrade of core 1.0.0 -> 1.1.0 plus new addon 'ext'
    const addonsV2: AddonDefinition[] = [
      addonsV1[0]!,
      {
        manifest: {
          name: "core",
          version: "1.1.0",
          depends: ["__base@^1.0.0"],
          autoInstall: true,
          provides: { migrations: ["core_001", "core_002"] },
        },
        migrations: [
          { id: "core_001", up: "CREATE TABLE IF NOT EXISTS dry_core (id TEXT PRIMARY KEY)" },
          { id: "core_002", up: "CREATE TABLE IF NOT EXISTS dry_core_v2 (id TEXT PRIMARY KEY)" },
        ],
      },
      addonsV1[2]!,
      {
        manifest: {
          name: "ext",
          version: "0.1.0",
          depends: ["core@^1.1.0"],
          provides: { migrations: ["ext_001"] },
        },
        migrations: [
          { id: "ext_001", up: "CREATE TABLE IF NOT EXISTS dry_ext (id TEXT PRIMARY KEY)" },
        ],
      },
    ];

    const upgradePlan = await runtime.planUpgrade(addonsV2);
    expect(upgradePlan.unchanged).toEqual(["__base", "plugin"]);
    expect(upgradePlan.upgrades).toEqual(["core"]);
    expect(upgradePlan.installs).toEqual(["ext"]);
    expect(upgradePlan.affectedDependents.core).toEqual(["ext", "plugin"]);
    expect(upgradePlan.declaredMigrationIds).toEqual(["core_001", "core_002", "ext_001"]);

    // Verify DB was NOT mutated by dry-run
    const coreRow = (await irAddonModel.repository.find({ name: "core" }))[0];
    expect(coreRow?.addon_version).toBe("1.0.0");
    const extTable = await getDb().get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'dry_ext'",
    );
    expect(extTable).toBeUndefined();
  });

  it("enforces atomic install state machine, blocks dependents, fails closed with 503, and retries failed seeds (#504)", async () => {
    let failSeed = true;
    let coreSeedRuns = 0;
    let depSeedRuns = 0;
    let observedPreState: string | null = null;

    const buildAddons = (): AddonDefinition[] => [
      { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
      {
        manifest: {
          name: "flaky_core",
          version: "1.0.0",
          depends: ["__base"],
          autoInstall: true,
        },
        registerRoutes: (scope) => {
          scope.get("/flaky/ping", async () => ({ ok: true }));
        },
        seed: async () => {
          coreSeedRuns += 1;
          const row = (await irAddonModel.repository.find({ name: "flaky_core" }))[0];
          observedPreState = row?.state ?? null;
          if (failSeed) {
            throw new Error("seed boom token=supersecret");
          }
        },
      },
      {
        manifest: {
          name: "flaky_dep",
          version: "1.0.0",
          depends: ["flaky_core"],
          autoInstall: true,
        },
        registerRoutes: (scope) => {
          scope.get("/flaky-dep/ping", async () => ({ ok: true }));
        },
        seed: async () => {
          depSeedRuns += 1;
        },
      },
    ];

    const runtime = new AddonRuntimeController();
    const app = Fastify();
    await expect(runtime.syncAll(buildAddons(), app)).rejects.toThrow(/seed boom/);
    await app.ready();

    // Pre-commit state was "installing", failed phase recorded, secret redacted, routes fail closed with 503
    expect(observedPreState).toBe("installing");
    expect(coreSeedRuns).toBe(1);
    expect(depSeedRuns).toBe(0);
    expect(runtime.isEnabled("flaky_core")).toBe(false);
    expect(runtime.isEnabled("flaky_dep")).toBe(false);

    const coreErrRow = (await irAddonModel.repository.find({ name: "flaky_core" }))[0];
    expect(coreErrRow?.state).toBe("error");
    expect(coreErrRow?.failed_phase).toBe("seed");
    expect(coreErrRow?.last_error).toContain("seed boom");
    expect(coreErrRow?.last_error).not.toContain("supersecret");

    const depErrRow = (await irAddonModel.repository.find({ name: "flaky_dep" }))[0];
    expect(depErrRow?.state).toBe("error");
    expect(depErrRow?.last_error).toContain("flaky_core");

    expect((await app.inject({ url: "/flaky/ping" })).statusCode).toBe(503);
    expect((await app.inject({ url: "/flaky-dep/ping" })).statusCode).toBe(503);

    // Fix failure condition and reconcile without skipping previously failed seed!
    failSeed = false;
    const recCore = await runtime.reconcileAddon("flaky_core");
    expect(recCore.state).toBe("installed");
    expect(recCore.seeded).toBe(true);
    expect(coreSeedRuns).toBe(2);
    expect(runtime.isEnabled("flaky_core")).toBe(true);

    const coreOkRow = (await irAddonModel.repository.find({ name: "flaky_core" }))[0];
    expect(coreOkRow?.state).toBe("installed");
    expect(coreOkRow?.failed_phase).toBeNull();
    expect(coreOkRow?.last_error).toBeNull();

    const recDep = await runtime.reconcileAddon("flaky_dep");
    expect(recDep.state).toBe("installed");
    expect(recDep.seeded).toBe(true);
    expect(depSeedRuns).toBe(1);

    expect((await app.inject({ url: "/flaky/ping" })).statusCode).toBe(200);
    expect((await app.inject({ url: "/flaky-dep/ping" })).statusCode).toBe(200);

    // Clean restart preserves seed idempotency (seed counts must NOT increment!)
    const restartedRuntime = new AddonRuntimeController();
    await restartedRuntime.syncAll(buildAddons());
    expect(coreSeedRuns).toBe(2);
    expect(depSeedRuns).toBe(1);

    await app.close();
  });

  it("records upgrade_pending before upgrade and recovers migration failure via syncAll() (#503/#504)", async () => {
    const runtime = new AddonRuntimeController();
    let seedRuns = 0;

    await runtime.syncAll([
      { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
      {
        manifest: {
          name: "mig_up",
          version: "1.0.0",
          depends: ["__base"],
          autoInstall: true,
          provides: { migrations: ["m_v1"] },
        },
        migrations: [
          { id: "m_v1", up: "CREATE TABLE IF NOT EXISTS mig_up_tbl (id TEXT PRIMARY KEY)" },
        ],
        seed: () => {
          seedRuns += 1;
        },
      },
    ]);
    expect(seedRuns).toBe(1);

    // Attempt upgrade to 2.0.0 with failing SQL migration -> fails in "migrations" phase
    await expect(
      runtime.syncAll([
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "mig_up",
            version: "2.0.0",
            depends: ["__base"],
            autoInstall: true,
            provides: { migrations: ["m_v1", "m_v2"] },
          },
          migrations: [
            { id: "m_v1", up: "CREATE TABLE IF NOT EXISTS mig_up_tbl (id TEXT PRIMARY KEY)" },
            { id: "m_v2", up: "THIS IS INVALID SQL" },
          ],
          seed: () => {
            seedRuns += 1;
          },
        },
      ]),
    ).rejects.toThrow();

    expect(runtime.isEnabled("mig_up")).toBe(false);
    expect(seedRuns).toBe(1);
    const errRow = (await irAddonModel.repository.find({ name: "mig_up" }))[0];
    expect(errRow?.state).toBe("error");
    expect(errRow?.failed_phase).toBe("migrations");
    expect(errRow?.addon_version).toBe("1.0.0");

    // Retry via syncAll() with fixed v2 migration -> transitions cleanly to 2.0.0 installed and runs v2 seed
    await runtime.syncAll([
      { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
      {
        manifest: {
          name: "mig_up",
          version: "2.0.0",
          depends: ["__base"],
          autoInstall: true,
          provides: { migrations: ["m_v1", "m_v2"] },
        },
        migrations: [
          { id: "m_v1", up: "CREATE TABLE IF NOT EXISTS mig_up_tbl (id TEXT PRIMARY KEY)" },
          { id: "m_v2", up: "ALTER TABLE mig_up_tbl ADD COLUMN note TEXT" },
        ],
        seed: () => {
          seedRuns += 1;
        },
      },
    ]);

    expect(runtime.isEnabled("mig_up")).toBe(true);
    expect(seedRuns).toBe(2);
    const okRow = (await irAddonModel.repository.find({ name: "mig_up" }))[0];
    expect(okRow?.state).toBe("installed");
    expect(okRow?.failed_phase).toBeNull();
    expect(okRow?.last_error).toBeNull();
    expect(okRow?.addon_version).toBe("2.0.0");
  });
});
