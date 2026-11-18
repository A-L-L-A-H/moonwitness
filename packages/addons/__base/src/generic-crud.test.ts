import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { z } from "zod";
import { closeDb, defineModel, initDb, modelRegistry } from "@moonwitness/orm";
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
        { manifest: { name: "__base", version: "1", autoInstall: true } },
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
});
