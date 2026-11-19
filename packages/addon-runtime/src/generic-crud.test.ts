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
});
