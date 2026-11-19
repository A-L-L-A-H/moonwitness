import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { z } from "zod";
import { closeDb, defineModel, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, type AddonDefinition } from "./runtime.js";
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
        { manifest: { name: "__base", version: "1", autoInstall: true } },
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
        { manifest: { name: "__base", version: "1" } },
        {
          manifest: {
            name: "bad",
            version: "1",
            depends: ["__base"],
            provides: { extends: ["ghost.model"] },
          },
        },
      ]),
    ).rejects.toThrow(/extends 'ghost.model'/);
  });
});
