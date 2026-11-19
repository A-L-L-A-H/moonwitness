import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { z } from "zod";
import { closeDb, createActorContext, defineModel, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController } from "./runtime.js";
import { registerBaseAddon } from "./index.js";
import type { BaseAddonAuthBridge } from "./generic-crud.js";

const itemModel = defineModel({
  name: "crud.item",
  table: "crud_items",
  schema: z.object({ label: z.string().min(1) }),
  restEnabled: true,
});

const internalModel = defineModel({
  name: "crud.internal",
  table: "crud_internal",
  schema: z.object({ secret: z.string().min(1) }),
  restEnabled: false,
});

const roleAuth: BaseAddonAuthBridge = {
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
  getActorId: () => "crud-tester",
};

describe("registerGenericModelRoutes", () => {
  const createdDirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-crud-"));
    createdDirs.push(dir);
    await initDb(join(dir, "crud.db"));
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

  it("blocks models without restEnabled and returns 409 on stale version", async () => {
    const runtime = new AddonRuntimeController();
    const app = Fastify();
    await runtime.syncAll(
      [
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "crud_demo",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["crud.item", "crud.internal"] },
          },
          models: [itemModel, internalModel],
          rules: [
            {
              model_name: "crud.item",
              role: "editor",
              can_read: true,
              can_create: true,
              can_update: true,
            },
          ],
        },
      ],
      app,
    );
    await registerBaseAddon(app, { runtime, auth: roleAuth, apiPrefix: "/api/v1" });
    await app.ready();

    const hidden = await app.inject({
      url: "/api/v1/m/crud.internal",
      headers: { "x-role": "admin" },
    });
    expect(hidden.statusCode).toBe(404);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/m/crud.item",
      headers: { "x-role": "editor" },
      payload: { label: "v1" },
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id as string;

    const okUpdate = await app.inject({
      method: "PATCH",
      url: `/api/v1/m/crud.item/${id}`,
      headers: { "x-role": "editor" },
      payload: { label: "v2", version: 1 },
    });
    expect(okUpdate.statusCode).toBe(200);
    expect(okUpdate.json().data.version).toBe(2);

    const stale = await app.inject({
      method: "PATCH",
      url: `/api/v1/m/crud.item/${id}`,
      headers: { "x-role": "editor" },
      payload: { label: "v3", version: 1 },
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().code).toBe("CONFLICT");

    await app.close();
  });

  it("isolates REST CRUD reads, mutations, and audit history per tenant", async () => {
    const runtime = new AddonRuntimeController();
    const app = Fastify();
    const tenantBridge: BaseAddonAuthBridge = {
      ...roleAuth,
      getActorTenant: (request) => {
        const hdr = request.headers["x-tenant-id"];
        return typeof hdr === "string" && hdr.trim() ? hdr.trim() : "default";
      },
    };
    await runtime.syncAll(
      [
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "crud_tenant_demo",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["crud.item"] },
          },
          models: [itemModel],
          rules: [
            {
              model_name: "crud.item",
              role: "editor",
              can_read: true,
              can_create: true,
              can_update: true,
              can_delete: true,
            },
          ],
        },
      ],
      app,
    );
    await registerBaseAddon(app, { runtime, auth: tenantBridge, apiPrefix: "/api/v1" });
    await app.ready();

    const createdA = await app.inject({
      method: "POST",
      url: "/api/v1/m/crud.item",
      headers: { "x-role": "editor", "x-tenant-id": "acme" },
      payload: { label: "acme-secret" },
    });
    expect(createdA.statusCode).toBe(201);
    const idA = createdA.json().data.id as string;
    expect(createdA.json().data.tenant_id).toBe("acme");

    const listB = await app.inject({
      method: "GET",
      url: "/api/v1/m/crud.item",
      headers: { "x-role": "editor", "x-tenant-id": "beta" },
    });
    expect(listB.statusCode).toBe(200);
    expect(listB.json().total).toBe(0);

    const getFromB = await app.inject({
      method: "GET",
      url: `/api/v1/m/crud.item/${idA}`,
      headers: { "x-role": "editor", "x-tenant-id": "beta" },
    });
    expect(getFromB.statusCode).toBe(404);

    const patchFromB = await app.inject({
      method: "PATCH",
      url: `/api/v1/m/crud.item/${idA}`,
      headers: { "x-role": "editor", "x-tenant-id": "beta" },
      payload: { label: "hijacked" },
    });
    expect(patchFromB.statusCode).toBe(404);

    const historyFromB = await app.inject({
      method: "GET",
      url: `/api/v1/m/crud.item/${idA}/history`,
      headers: { "x-role": "editor", "x-tenant-id": "beta" },
    });
    expect(historyFromB.statusCode).toBe(404);

    await app.close();
  });

  it("returns 503 ADDON_DISABLED on /m/:model when the owning addon is disabled", async () => {
    const runtime = new AddonRuntimeController();
    const app = Fastify();
    await runtime.syncAll(
      [
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "crud_toggle_demo",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["crud.item"] },
          },
          models: [itemModel],
          rules: [
            {
              model_name: "crud.item",
              role: "editor",
              can_read: true,
              can_create: true,
              can_update: true,
            },
          ],
        },
      ],
      app,
    );
    await registerBaseAddon(app, { runtime, auth: roleAuth, apiPrefix: "/api/v1" });
    await app.ready();

    await runtime.disable("crud_toggle_demo");

    const disabledGet = await app.inject({
      method: "GET",
      url: "/api/v1/m/crud.item",
      headers: { "x-role": "editor" },
    });
    expect(disabledGet.statusCode).toBe(503);
    expect(disabledGet.json().code).toBe("ADDON_DISABLED");

    const disabledPost = await app.inject({
      method: "POST",
      url: "/api/v1/m/crud.item",
      headers: { "x-role": "editor" },
      payload: { label: "blocked" },
    });
    expect(disabledPost.statusCode).toBe(503);
    expect(disabledPost.json().code).toBe("ADDON_DISABLED");

    await runtime.enable("crud_toggle_demo");
    const enabledGet = await app.inject({
      method: "GET",
      url: "/api/v1/m/crud.item",
      headers: { "x-role": "editor" },
    });
    expect(enabledGet.statusCode).toBe(200);

    await app.close();
  });

  it("enforces actor tenant requirement, transaction-safe record rules, and field-level permissions across CRUD and RPC (#491-#494)", async () => {
    const deptModel = defineModel({
      name: "crud.dept",
      table: "crud_depts",
      restEnabled: true,
      schema: z.object({
        name: z.string().min(1),
        budget_secret: z.string().default("top-secret"),
      }),
    });

    const recordModel = defineModel({
      name: "crud.doc",
      table: "crud_docs",
      restEnabled: true,
      searchFields: ["title", "secret_note"],
      schema: z.object({
        owner_id: z.string(),
        dept_id: z.string().nullable().default(null),
        title: z.string().min(1),
        secret_note: z.string().default("confidential"),
        salary: z.number().int().default(100),
        api_token: z.string().default("tok-123"),
      }),
      defaults: {
        owner_id: (actor) => actor.actorId ?? "anon",
      },
      relations: {
        dept_id: { model: "crud.dept", targetField: "id", onDelete: "ignore" },
      },
      fieldPolicies: {
        secret_note: { readRoles: ["admin"], writeRoles: ["admin"] },
        salary: { readRoles: ["editor", "admin"], writeRoles: ["admin"] },
      },
      actions: {
        inspect_doc: {
          scope: "record",
          operation: "read",
          roles: ["viewer", "editor", "admin"],
          handler: async ({ record }) => record,
        },
        ping_count: {
          scope: "model",
          roles: ["viewer", "editor", "admin"],
          handler: async ({ repository }) => ({ total: await repository.count() }),
        },
        rename_doc: {
          scope: "record",
          roles: ["editor", "admin"],
          handler: async ({ record, repository, actor }) =>
            repository.update(String(record!.id), { title: "renamed-via-rpc" }, actor),
        },
      },
    });

    const bridge: BaseAddonAuthBridge = {
      ...roleAuth,
      getActorId: (req) => String(req.headers["x-actor-id"] ?? "actor-1"),
      resolveActorContext: (req, source = "api") => {
        const tenantHdr = req.headers["x-tenant-id"];
        const tenantId = typeof tenantHdr === "string" ? tenantHdr : undefined;
        return createActorContext(
          String(req.headers["x-actor-id"] ?? "actor-1"),
          source,
          req.id,
          tenantId,
        );
      },
    };

    const runtime = new AddonRuntimeController();
    const app = Fastify();
    await runtime.syncAll(
      [
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "crud_policy_demo",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["crud.dept", "crud.doc"] },
          },
          models: [deptModel, recordModel],
          rules: [
            {
              rule_key: "crud.dept.all",
              model_name: "crud.dept",
              role: "viewer",
              can_read: true,
              can_create: true,
            },
            {
              rule_key: "crud.doc.global_tenant",
              model_name: "crud.doc",
              scope: "global",
              can_read: true,
              can_create: true,
              can_update: true,
              can_delete: true,
              domain: { tenant_id: "$actor.tenantId" },
            },
            {
              rule_key: "crud.doc.viewer",
              model_name: "crud.doc",
              scope: "group",
              groups: ["base.group_viewer"],
              can_read: true,
              domain: { owner_id: "$actor.id" },
            },
            {
              rule_key: "crud.doc.editor",
              model_name: "crud.doc",
              scope: "group",
              groups: ["base.group_editor"],
              can_read: true,
              can_create: true,
              can_update: true,
              can_delete: true,
              domain: { owner_id: "$actor.id" },
            },
          ],
        },
      ],
      app,
    );
    await registerBaseAddon(app, { runtime, auth: bridge, apiPrefix: "/api/v1" });
    await app.ready();

    try {
      // Missing tenantId returns 403 TENANT_REQUIRED
      const missingTenant = await app.inject({
        method: "GET",
        url: "/api/v1/m/crud.doc",
        headers: { "x-role": "editor", "x-actor-id": "u1" },
      });
      expect(missingTenant.statusCode).toBe(403);
      expect(missingTenant.json().code).toBe("TENANT_REQUIRED");

      // Admin creates a dept and a doc owned by u1
      const deptRes = await app.inject({
        method: "POST",
        url: "/api/v1/m/crud.dept",
        headers: { "x-role": "admin", "x-actor-id": "admin-1", "x-tenant-id": "acme" },
        payload: { name: "Engineering" },
      });
      expect(deptRes.statusCode).toBe(201);
      const deptId = deptRes.json().data.id as string;
      expect(deptRes.json().data.budget_secret).toBeUndefined();

      // Editor attempting to write write-restricted field `salary` gets 403 FIELD_WRITE_FORBIDDEN
      const forbiddenWrite = await app.inject({
        method: "POST",
        url: "/api/v1/m/crud.doc",
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: { title: "Blocked", salary: 999 },
      });
      expect(forbiddenWrite.statusCode).toBe(403);
      expect(forbiddenWrite.json().code).toBe("FIELD_WRITE_FORBIDDEN");

      // Editor attempting to create a record owned by another actor gets 403 RULE_FORBIDDEN
      const forgedOwner = await app.inject({
        method: "POST",
        url: "/api/v1/m/crud.doc",
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: { title: "Forged", owner_id: "u2" },
      });
      expect(forgedOwner.statusCode).toBe(403);
      expect(forgedOwner.json().code).toBe("RULE_FORBIDDEN");

      // Editor creates valid record (defaults owner_id=u1); response strips unreadable fields
      const created = await app.inject({
        method: "POST",
        url: "/api/v1/m/crud.doc",
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: { title: "Valid Doc", dept_id: deptId },
      });
      expect(created.statusCode).toBe(201);
      const docId = created.json().data.id as string;
      expect(created.json().data.salary).toBe(100);
      expect(created.json().data.secret_note).toBeUndefined();
      expect(created.json().data.api_token).toBeUndefined();

      // Editor attempting ownership escape via PATCH gets 403 RULE_FORBIDDEN
      const escapePatch = await app.inject({
        method: "PATCH",
        url: `/api/v1/m/crud.doc/${docId}`,
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: { owner_id: "u2" },
      });
      expect(escapePatch.statusCode).toBe(403);
      expect(escapePatch.json().code).toBe("RULE_FORBIDDEN");

      // Editor attempting PATCH on sensitive/writeRoles field gets 403 FIELD_WRITE_FORBIDDEN
      const fieldPatch = await app.inject({
        method: "PATCH",
        url: `/api/v1/m/crud.doc/${docId}`,
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: { salary: 200 },
      });
      expect(fieldPatch.statusCode).toBe(403);
      expect(fieldPatch.json().code).toBe("FIELD_WRITE_FORBIDDEN");

      // Unreadable field in filter, orderBy, domain, or groupBy returns 403 FIELD_READ_FORBIDDEN
      const filterForbidden = await app.inject({
        method: "GET",
        url: "/api/v1/m/crud.doc?secret_note=confidential",
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
      });
      expect(filterForbidden.statusCode).toBe(403);
      expect(filterForbidden.json().code).toBe("FIELD_READ_FORBIDDEN");

      const sortForbidden = await app.inject({
        method: "GET",
        url: "/api/v1/m/crud.doc?orderBy=secret_note%20ASC",
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
      });
      expect(sortForbidden.statusCode).toBe(403);
      expect(sortForbidden.json().code).toBe("FIELD_READ_FORBIDDEN");

      const domainForbidden = await app.inject({
        method: "GET",
        url: `/api/v1/m/crud.doc?domain=${encodeURIComponent(JSON.stringify([["salary", ">", 0]]))}`,
        headers: { "x-role": "viewer", "x-actor-id": "u1", "x-tenant-id": "acme" },
      });
      expect(domainForbidden.statusCode).toBe(403);
      expect(domainForbidden.json().code).toBe("FIELD_READ_FORBIDDEN");

      const groupForbidden = await app.inject({
        method: "GET",
        url: "/api/v1/m/crud.doc/read-group?groupBy=secret_note",
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
      });
      expect(groupForbidden.statusCode).toBe(403);
      expect(groupForbidden.json().code).toBe("FIELD_READ_FORBIDDEN");

      // Hydrated relation strips unreadable fields on both parent and $dept_id
      const hydrated = await app.inject({
        method: "GET",
        url: `/api/v1/m/crud.doc/${docId}?with=dept_id`,
        headers: { "x-role": "viewer", "x-actor-id": "u1", "x-tenant-id": "acme" },
      });
      expect(hydrated.statusCode).toBe(200);
      expect(hydrated.json().data.salary).toBeUndefined();
      expect(hydrated.json().data.secret_note).toBeUndefined();
      expect(hydrated.json().data.$dept_id.name).toBe("Engineering");
      expect(hydrated.json().data.$dept_id.budget_secret).toBeUndefined();

      // History strips unreadable fields from diff
      const historyRes = await app.inject({
        method: "GET",
        url: `/api/v1/m/crud.doc/${docId}/history`,
        headers: { "x-role": "viewer", "x-actor-id": "u1", "x-tenant-id": "acme" },
      });
      expect(historyRes.statusCode).toBe(200);
      const diff = JSON.parse(historyRes.json().data[0].diff) as Record<string, unknown>;
      expect(diff.title).toBeDefined();
      expect(diff.salary).toBeUndefined();
      expect(diff.secret_note).toBeUndefined();
      expect(diff.api_token).toBeUndefined();

      // Record action with operation: "read" works for viewer and sanitizes output
      const inspectCall = await app.inject({
        method: "POST",
        url: `/api/v1/m/crud.doc/${docId}/call/inspect_doc`,
        headers: { "x-role": "viewer", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: {},
      });
      expect(inspectCall.statusCode).toBe(200);
      expect(inspectCall.json().data.title).toBe("Valid Doc");
      expect(inspectCall.json().data.salary).toBeUndefined();
      expect(inspectCall.json().data.secret_note).toBeUndefined();

      // Record action defaulting to operation: "update" respects rule domain and strips unreadable fields
      const rpcOther = await app.inject({
        method: "POST",
        url: "/api/v1/rpc",
        headers: { "x-role": "editor", "x-actor-id": "u2", "x-tenant-id": "acme" },
        payload: { model: "crud.doc", method: "rename_doc", id: docId },
      });
      expect(rpcOther.statusCode).toBe(404);

      const rpcOwn = await app.inject({
        method: "POST",
        url: "/api/v1/rpc",
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: { model: "crud.doc", method: "rename_doc", id: docId },
      });
      expect(rpcOwn.statusCode).toBe(200);
      expect(rpcOwn.json().result.title).toBe("renamed-via-rpc");
      expect(rpcOwn.json().result.secret_note).toBeUndefined();

      // Primitive/non-record action output stays untouched
      const pingRpc = await app.inject({
        method: "POST",
        url: "/api/v1/rpc",
        headers: { "x-role": "viewer", "x-actor-id": "u1", "x-tenant-id": "acme" },
        payload: { model: "crud.doc", method: "ping_count" },
      });
      expect(pingRpc.statusCode).toBe(200);
      expect(pingRpc.json().result).toEqual({ total: 1 });

      // Other actor cannot archive/delete outside rule domain (404)
      const archiveOther = await app.inject({
        method: "POST",
        url: `/api/v1/m/crud.doc/${docId}/archive`,
        headers: { "x-role": "editor", "x-actor-id": "u2", "x-tenant-id": "acme" },
      });
      expect(archiveOther.statusCode).toBe(404);

      const deleteOther = await app.inject({
        method: "DELETE",
        url: `/api/v1/m/crud.doc/${docId}`,
        headers: { "x-role": "editor", "x-actor-id": "u2", "x-tenant-id": "acme" },
      });
      expect(deleteOther.statusCode).toBe(404);

      // Owner can archive, restore, and delete, with fields sanitized
      const archiveOwn = await app.inject({
        method: "POST",
        url: `/api/v1/m/crud.doc/${docId}/archive`,
        headers: { "x-role": "editor", "x-actor-id": "u1", "x-tenant-id": "acme" },
      });
      expect(archiveOwn.statusCode).toBe(200);
      expect(archiveOwn.json().data.secret_note).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it("enforces group-aware readGroups and writeGroups (with implied groups and role OR group matching) across every CRUD, search, projection, read-group, upsert, relation hydration, action, RPC, history, and view descriptor surface", async () => {
    const targetModel = defineModel({
      name: "grp.dept",
      table: "grp_depts",
      restEnabled: true,
      schema: z.object({
        name: z.string().min(1),
        audit_budget: z.number().int().default(500),
        secret_ledger: z.string().default("ledger-hidden"),
      }),
      fieldPolicies: {
        audit_budget: { readGroups: ["ops.group_auditor"], writeGroups: ["ops.group_auditor"] },
        secret_ledger: { sensitive: true, readGroups: ["ops.group_lead"] },
      },
    });

    const itemModel = defineModel({
      name: "grp.item",
      table: "grp_items",
      restEnabled: true,
      schema: z.object({
        code: z.string().min(1),
        dept_id: z.string().nullable().default(null),
        title: z.string().min(1),
        category: z.string().default("ops"),
        audit_note: z.string().default("audit-classified"),
        clearance_tag: z.string().default("clearance-alpha"),
        restricted_pin: z.string().default("pin-007"),
      }),
      indexes: [{ fields: ["code"], unique: true }],
      relations: {
        dept_id: { model: "grp.dept", targetField: "id", onDelete: "ignore" },
      },
      fieldPolicies: {
        // Role OR Group grant: editor role OR ops.group_auditor group
        audit_note: {
          readRoles: ["editor", "admin"],
          readGroups: ["ops.group_auditor"],
          writeRoles: ["admin"],
          writeGroups: ["ops.group_auditor"],
        },
        // Group-only grant
        clearance_tag: {
          readGroups: ["ops.group_auditor"],
          writeGroups: ["ops.group_auditor"],
        },
        // Sensitive field overridden by explicit lead group
        restricted_pin: {
          sensitive: true,
          readGroups: ["ops.group_lead"],
          writeGroups: ["ops.group_lead"],
        },
      },
      actions: {
        patch_meta: {
          scope: "record",
          operation: "update",
          roles: ["viewer", "editor", "admin"],
          handler: async ({ record, input, repository, actor }) => {
            const body = input as { title?: string; audit_note?: string };
            return repository.update(
              String(record!.id),
              {
                ...(body.title ? { title: body.title } : {}),
                ...(body.audit_note ? { audit_note: body.audit_note } : {}),
              },
              actor,
            );
          },
        },
      },
    });

    const bridge: BaseAddonAuthBridge = {
      ...roleAuth,
      getActorId: (req) => String(req.headers["x-actor-id"] ?? "actor-1"),
      getActorGroups: (req) => {
        const raw = req.headers["x-groups"];
        if (typeof raw !== "string" || !raw.trim()) return [];
        return raw
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);
      },
      resolveActorContext: (req, source = "api") =>
        createActorContext(String(req.headers["x-actor-id"] ?? "actor-1"), source, req.id, "acme"),
    };

    const runtime = new AddonRuntimeController();
    const app = Fastify();
    await runtime.syncAll(
      [
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "grp_policy_addon",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["grp.dept", "grp.item"] },
          },
          models: [targetModel, itemModel],
          data: [
            {
              id: "grp_ops_auditor",
              model: "res.groups",
              key: { group_key: "ops.group_auditor" },
              values: {
                group_key: "ops.group_auditor",
                name: "Ops Auditor",
                category: "ops",
                implied_ids_json: '["base.group_viewer"]',
              },
            },
            {
              id: "grp_ops_lead",
              model: "res.groups",
              key: { group_key: "ops.group_lead" },
              values: {
                group_key: "ops.group_lead",
                name: "Ops Lead",
                category: "ops",
                implied_ids_json: '["ops.group_auditor"]',
              },
            },
          ],
          rules: [
            {
              rule_key: "grp.dept.viewer",
              model_name: "grp.dept",
              scope: "group",
              groups: ["base.group_viewer"],
              can_read: true,
              can_create: true,
            },
            {
              rule_key: "grp.item.viewer",
              model_name: "grp.item",
              scope: "group",
              groups: ["base.group_viewer"],
              can_read: true,
              can_create: true,
              can_update: true,
            },
          ],
        },
      ],
      app,
    );
    await registerBaseAddon(app, { runtime, auth: bridge, apiPrefix: "/api/v1" });
    await app.ready();

    try {
      const nonMemberHeaders = { "x-role": "viewer", "x-actor-id": "v-plain" };
      const editorHeaders = { "x-role": "editor", "x-actor-id": "e-plain" };
      const auditorViewerHeaders = {
        "x-role": "viewer",
        "x-actor-id": "v-auditor",
        "x-groups": "ops.group_auditor",
      };
      const leadViewerHeaders = {
        "x-role": "viewer",
        "x-actor-id": "v-lead",
        "x-groups": "ops.group_lead",
      };

      const deptRes = await app.inject({
        method: "POST",
        url: "/api/v1/m/grp.dept",
        headers: leadViewerHeaders,
        payload: { name: "Treasury", audit_budget: 9000 },
      });
      expect(deptRes.statusCode).toBe(201);
      const deptId = deptRes.json().data.id as string;
      expect(deptRes.json().data.audit_budget).toBe(9000);
      expect(deptRes.json().data.secret_ledger).toBe("ledger-hidden");

      // Non-member viewer cannot write group-only or sensitive fields
      const deniedCreate = await app.inject({
        method: "POST",
        url: "/api/v1/m/grp.item",
        headers: nonMemberHeaders,
        payload: { code: "ITM-1", title: "Blocked", clearance_tag: "x" },
      });
      expect(deniedCreate.statusCode).toBe(403);
      expect(deniedCreate.json().code).toBe("FIELD_WRITE_FORBIDDEN");

      // Editor without group cannot write writeGroups-only field even though readRoles includes editor
      const deniedEditorWrite = await app.inject({
        method: "POST",
        url: "/api/v1/m/grp.item",
        headers: editorHeaders,
        payload: { code: "ITM-1", title: "Blocked", audit_note: "nope" },
      });
      expect(deniedEditorWrite.statusCode).toBe(403);
      expect(deniedEditorWrite.json().code).toBe("FIELD_WRITE_FORBIDDEN");

      // Viewer with implied ops.group_lead (implies ops.group_auditor) writes both auditor & lead fields
      const created = await app.inject({
        method: "POST",
        url: "/api/v1/m/grp.item",
        headers: leadViewerHeaders,
        payload: {
          code: "ITM-1",
          dept_id: deptId,
          title: "Implied Group Item",
          audit_note: "needle-secret-audit",
          clearance_tag: "tier-blue",
          restricted_pin: "pin-999",
        },
      });
      expect(created.statusCode).toBe(201);
      const itemId = created.json().data.id as string;
      expect(created.json().data.audit_note).toBe("needle-secret-audit");
      expect(created.json().data.clearance_tag).toBe("tier-blue");
      expect(created.json().data.restricted_pin).toBe("pin-999");

      // Non-member viewer reads list + relation hydration: restricted fields stripped on BOTH models
      const nonMemberHydrated = await app.inject({
        method: "GET",
        url: `/api/v1/m/grp.item/${itemId}?with=dept_id`,
        headers: nonMemberHeaders,
      });
      expect(nonMemberHydrated.statusCode).toBe(200);
      expect(nonMemberHydrated.json().data.title).toBe("Implied Group Item");
      expect(nonMemberHydrated.json().data.audit_note).toBeUndefined();
      expect(nonMemberHydrated.json().data.clearance_tag).toBeUndefined();
      expect(nonMemberHydrated.json().data.restricted_pin).toBeUndefined();
      expect(nonMemberHydrated.json().data.$dept_id.name).toBe("Treasury");
      expect(nonMemberHydrated.json().data.$dept_id.audit_budget).toBeUndefined();
      expect(nonMemberHydrated.json().data.$dept_id.secret_ledger).toBeUndefined();

      // Editor role grants read on audit_note (role OR group), denies clearance_tag (group-only)
      const editorGet = await app.inject({
        method: "GET",
        url: `/api/v1/m/grp.item/${itemId}?with=dept_id`,
        headers: editorHeaders,
      });
      expect(editorGet.statusCode).toBe(200);
      expect(editorGet.json().data.audit_note).toBe("needle-secret-audit");
      expect(editorGet.json().data.clearance_tag).toBeUndefined();
      expect(editorGet.json().data.$dept_id.audit_budget).toBeUndefined();

      // Viewer in ops.group_auditor reads audit_note, clearance_tag, and target model's audit_budget, but NOT lead-only restricted_pin / secret_ledger
      const auditorGet = await app.inject({
        method: "GET",
        url: `/api/v1/m/grp.item/${itemId}?with=dept_id`,
        headers: auditorViewerHeaders,
      });
      expect(auditorGet.statusCode).toBe(200);
      expect(auditorGet.json().data.audit_note).toBe("needle-secret-audit");
      expect(auditorGet.json().data.clearance_tag).toBe("tier-blue");
      expect(auditorGet.json().data.restricted_pin).toBeUndefined();
      expect(auditorGet.json().data.$dept_id.audit_budget).toBe(9000);
      expect(auditorGet.json().data.$dept_id.secret_ledger).toBeUndefined();

      // Implied group ops.group_lead -> ops.group_auditor can read all including sensitive override
      const leadGet = await app.inject({
        method: "GET",
        url: `/api/v1/m/grp.item/${itemId}?with=dept_id`,
        headers: leadViewerHeaders,
      });
      expect(leadGet.statusCode).toBe(200);
      expect(leadGet.json().data.restricted_pin).toBe("pin-999");
      expect(leadGet.json().data.$dept_id.secret_ledger).toBe("ledger-hidden");

      // Projection (?fields=) denies unreadable field and permits group-granted field
      const deniedProjection = await app.inject({
        method: "GET",
        url: "/api/v1/m/grp.item?fields=title,clearance_tag",
        headers: nonMemberHeaders,
      });
      expect(deniedProjection.statusCode).toBe(403);
      expect(deniedProjection.json().code).toBe("FIELD_READ_FORBIDDEN");

      const allowedProjection = await app.inject({
        method: "GET",
        url: "/api/v1/m/grp.item?fields=title,clearance_tag",
        headers: auditorViewerHeaders,
      });
      expect(allowedProjection.statusCode).toBe(200);
      expect(allowedProjection.json().data).toEqual([
        { title: "Implied Group Item", clearance_tag: "tier-blue" },
      ]);

      // Search (?q=) on list and read-group cannot infer unreadable fields
      const nonMemberSearchList = await app.inject({
        method: "GET",
        url: "/api/v1/m/grp.item?q=needle-secret-audit",
        headers: nonMemberHeaders,
      });
      expect(nonMemberSearchList.statusCode).toBe(200);
      expect(nonMemberSearchList.json().total).toBe(0);

      const nonMemberSearchGroup = await app.inject({
        method: "GET",
        url: "/api/v1/m/grp.item/read-group?groupBy=category&q=needle-secret-audit",
        headers: nonMemberHeaders,
      });
      expect(nonMemberSearchGroup.statusCode).toBe(200);
      expect(nonMemberSearchGroup.json().groups).toEqual([]);

      const auditorSearchGroup = await app.inject({
        method: "GET",
        url: "/api/v1/m/grp.item/read-group?groupBy=category&q=needle-secret-audit",
        headers: auditorViewerHeaders,
      });
      expect(auditorSearchGroup.statusCode).toBe(200);
      expect(auditorSearchGroup.json().groups).toEqual([{ category: "ops", count: 1 }]);

      // read-group grouping by restricted field is denied for non-member, allowed for group member
      const deniedReadGroup = await app.inject({
        method: "GET",
        url: "/api/v1/m/grp.item/read-group?groupBy=clearance_tag",
        headers: nonMemberHeaders,
      });
      expect(deniedReadGroup.statusCode).toBe(403);

      const allowedReadGroup = await app.inject({
        method: "GET",
        url: "/api/v1/m/grp.item/read-group?groupBy=clearance_tag",
        headers: auditorViewerHeaders,
      });
      expect(allowedReadGroup.statusCode).toBe(200);
      expect(allowedReadGroup.json().groups).toEqual([{ clearance_tag: "tier-blue", count: 1 }]);

      // Upsert enforces writeGroups on values & sanitizes output
      const deniedUpsert = await app.inject({
        method: "POST",
        url: "/api/v1/m/grp.item/upsert",
        headers: nonMemberHeaders,
        payload: { where: { code: "ITM-1" }, values: { audit_note: "hacked" } },
      });
      expect(deniedUpsert.statusCode).toBe(403);
      expect(deniedUpsert.json().code).toBe("FIELD_WRITE_FORBIDDEN");

      const allowedUpsert = await app.inject({
        method: "POST",
        url: "/api/v1/m/grp.item/upsert",
        headers: auditorViewerHeaders,
        payload: { where: { code: "ITM-1" }, values: { audit_note: "auditor-upserted" } },
      });
      expect(allowedUpsert.statusCode).toBe(200);
      expect(allowedUpsert.json().data.audit_note).toBe("auditor-upserted");
      expect(allowedUpsert.json().data.restricted_pin).toBeUndefined();

      // Custom action /call/:action & /rpc enforce writeGroups on input and sanitize output
      const deniedRpcInput = await app.inject({
        method: "POST",
        url: "/api/v1/rpc",
        headers: nonMemberHeaders,
        payload: {
          model: "grp.item",
          method: "patch_meta",
          id: itemId,
          kwargs: { audit_note: "forged-via-rpc" },
        },
      });
      expect(deniedRpcInput.statusCode).toBe(403);
      expect(deniedRpcInput.json().code).toBe("FIELD_WRITE_FORBIDDEN");

      const allowedAction = await app.inject({
        method: "POST",
        url: `/api/v1/m/grp.item/${itemId}/call/patch_meta`,
        headers: auditorViewerHeaders,
        payload: { audit_note: "auditor-action-ok" },
      });
      expect(allowedAction.statusCode).toBe(200);
      expect(allowedAction.json().data.audit_note).toBe("auditor-action-ok");
      expect(allowedAction.json().data.restricted_pin).toBeUndefined();

      // History strips fields unless granted by group
      const nonMemberHist = await app.inject({
        method: "GET",
        url: `/api/v1/m/grp.item/${itemId}/history`,
        headers: nonMemberHeaders,
      });
      expect(nonMemberHist.statusCode).toBe(200);
      const nonMemberDiff = JSON.parse(nonMemberHist.json().data[0].diff) as Record<
        string,
        unknown
      >;
      expect(nonMemberDiff.audit_note).toBeUndefined();
      expect(nonMemberDiff.restricted_pin).toBeUndefined();

      const leadHist = await app.inject({
        method: "GET",
        url: `/api/v1/m/grp.item/${itemId}/history`,
        headers: leadViewerHeaders,
      });
      expect(leadHist.statusCode).toBe(200);
      const leadDiff = JSON.parse(leadHist.json().data[0].diff) as Record<string, unknown>;
      expect(leadDiff.audit_note).toBeDefined();
      expect(leadDiff.restricted_pin).toBeDefined();

      // View descriptor filters fields according to actor groups
      const nonMemberView = await app.inject({
        method: "GET",
        url: "/api/v1/_meta/views/grp.item",
        headers: nonMemberHeaders,
      });
      expect(nonMemberView.statusCode).toBe(200);
      const nonMemberViewFields = nonMemberView
        .json()
        .fields.map((f: { field_name: string }) => f.field_name);
      expect(nonMemberViewFields).not.toContain("clearance_tag");
      expect(nonMemberViewFields).not.toContain("restricted_pin");

      const leadView = await app.inject({
        method: "GET",
        url: "/api/v1/_meta/views/grp.item",
        headers: leadViewerHeaders,
      });
      expect(leadView.statusCode).toBe(200);
      const leadViewFields = leadView
        .json()
        .fields.map((f: { field_name: string }) => f.field_name);
      expect(leadViewFields).toContain("clearance_tag");
      expect(leadViewFields).toContain("restricted_pin");
    } finally {
      await app.close();
    }
  });
});
