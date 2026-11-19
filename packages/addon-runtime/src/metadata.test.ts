import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { z } from "zod";
import { closeDb, defineModel, initDb, modelRegistry } from "@moonwitness/orm";
import { createMetadataRegistry, registerMetadataRoutes } from "./metadata.js";
import { AddonRuntimeController } from "./runtime.js";
import { registerBaseAddon } from "./index.js";

function fakeFastify() {
  const routes = new Map<string, (request: unknown, reply: unknown) => unknown>();
  const fastify = {
    get: (path: string, handler: (request: unknown, reply: unknown) => unknown) => {
      routes.set(path, handler);
    },
  };
  return { fastify, routes };
}

function fakeReply() {
  const reply = {
    code: vi.fn(() => reply),
    send: vi.fn((body: unknown) => body),
    type: vi.fn(() => reply),
  };
  return reply;
}

describe("metadata registry", () => {
  it("rejects duplicate model names", () => {
    expect(() =>
      createMetadataRegistry([
        { name: "a", publicFields: [] },
        { name: "a", publicFields: [] },
      ]),
    ).toThrow(/Duplicate metadata model/);
  });
});

describe("registerMetadataRoutes", () => {
  it("lists only registered models", async () => {
    const { fastify, routes } = fakeFastify();
    await registerMetadataRoutes(
      fastify as never,
      createMetadataRegistry([
        { name: "timeline.event", publicFields: [{ name: "title", type: "string" }] },
      ]),
    );
    const list = (await routes.get("/_meta/models")!({}, fakeReply())) as { models: string[] };
    expect(list.models).toEqual(["timeline.event"]);
  });

  it("exposes only approved fields for a model", async () => {
    const { routes } = createRoutes();
    const handler = routes.get("/_meta/models/:name")!;
    const reply = fakeReply();
    const result = (await handler({ params: { name: "timeline.event" } }, reply)) as {
      fields: { name: string }[];
    };
    expect(result.fields.map((f) => f.name)).toEqual(["title", "date"]);
  });

  it("returns 404 for unknown models", async () => {
    const { fastify, routes } = fakeFastify();
    await registerMetadataRoutes(fastify as never, createMetadataRegistry([]));
    const reply = fakeReply();
    await routes.get("/_meta/models/:name")!({ params: { name: "nope" } }, reply);
    expect(reply.code).toHaveBeenCalledWith(404);
  });

  it("exposes /_meta/openapi.json with registered model schemas", async () => {
    const { routes } = createRoutes();
    const spec = (await routes.get("/_meta/openapi.json")!({}, fakeReply())) as {
      openapi: string;
      paths: Record<string, unknown>;
      components: { schemas: Record<string, { properties: Record<string, unknown> }> };
    };
    expect(spec.openapi).toBe("3.0.0");
    expect(spec.paths["/_meta/models"]).toBeDefined();
    expect(spec.components.schemas["timeline.event"]?.properties).toHaveProperty("title");
  });
});

describe("dynamic modelRegistry metadata & apiPrefix mount", () => {
  const createdDirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-meta-"));
    createdDirs.push(dir);
    await initDb(join(dir, "meta.db"));
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
        // Ignore transient Windows SQLite lock on cleanup.
      }
    }
  });

  it("mounts /_meta/models under apiPrefix and derives public fields from modelRegistry excluding disabled addons and sensitive fields", async () => {
    const publicUserModel = defineModel({
      name: "meta.user",
      table: "meta_users",
      schema: z.object({
        username: z.string(),
        password_hash: z.string(),
        access_token: z.string(),
        refresh_token: z.string(),
        display_name: z.string(),
        internal_notes: z.string().default(""),
        hidden_pin: z.string().default(""),
      }),
      fieldPolicies: {
        internal_notes: { readRoles: ["admin"] },
        hidden_pin: { sensitive: true },
      },
      publicFields: [
        "username",
        "password_hash",
        "access_token",
        "refresh_token",
        "display_name",
        "internal_notes",
        "hidden_pin",
      ],
    });
    const secretModel = defineModel({
      name: "meta.secret_only",
      table: "meta_secret_only",
      schema: z.object({ token: z.string() }),
    });
    const leafModel = defineModel({
      name: "meta.leaf",
      table: "meta_leaves",
      schema: z.object({ slug: z.string() }),
      publicFields: ["slug"],
    });

    const runtime = new AddonRuntimeController();
    const app = Fastify();
    await runtime.syncAll(
      [
        { manifest: { name: "__base", version: "1.0.0", autoInstall: true } },
        {
          manifest: {
            name: "meta_core",
            version: "1.0.0",
            depends: ["__base"],
            provides: { models: ["meta.user", "meta.secret_only"] },
          },
          models: [publicUserModel, secretModel],
        },
        {
          manifest: {
            name: "meta_leaf",
            version: "1.0.0",
            depends: ["meta_core"],
            provides: { models: ["meta.leaf"] },
          },
          models: [leafModel],
        },
      ],
      app,
    );
    await registerBaseAddon(app, { runtime, apiPrefix: "/api/v1" });
    await app.ready();

    const listRes = await app.inject({ url: "/api/v1/_meta/models" });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().models).toContain("meta.user");
    expect(listRes.json().models).toContain("meta.leaf");
    expect(listRes.json().models).not.toContain("meta.secret_only");

    const userRes = await app.inject({ url: "/api/v1/_meta/models/meta.user" });
    expect(userRes.statusCode).toBe(200);
    const fieldNames = userRes.json().fields.map((f: { name: string }) => f.name);
    expect(fieldNames).toEqual(["username", "display_name"]);

    await runtime.disable("meta_leaf");
    const listAfterDisable = await app.inject({ url: "/api/v1/_meta/models" });
    expect(listAfterDisable.json().models).not.toContain("meta.leaf");

    await app.close();
  });
});

function createRoutes() {
  const { fastify, routes } = fakeFastify();
  void registerMetadataRoutes(
    fastify as never,
    createMetadataRegistry([
      {
        name: "timeline.event",
        publicFields: [
          { name: "title", type: "string" },
          { name: "date", type: "string" },
        ],
      },
    ]),
  );
  return { fastify, routes };
}
