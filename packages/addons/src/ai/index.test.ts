import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  defaultFailClosedAuthBridge,
  type AddonHostContext,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import { createPlatformAddons } from "../index.js";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { aiAddon, createAiAddon } from "./index.js";

describe("../ai", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-ai-"));
    dirs.push(dir);
    await initDb(join(dir, "ai.db"));
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  afterAll(() => {
    for (const dir of dirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on cleanup.
      }
    }
  });

  it("syncs riot_ai and memory_records tables cleanly via zero-migration syncModels", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      aiAddon,
    ]);
    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining([
        "riot_ai_provider_configs",
        "riot_ai_usage_summaries",
        "memory_records",
      ]),
    );
    const view = await runtime.getViewDescriptor("memory.record", "editor");
    expect(view?.extensible).toBe(true);
    expect(view?.actionBindings.createUrl).toBe("/api/v1/memory/entries");

    const aiView = await runtime.getViewDescriptor("riot_ai.provider_config", "admin");
    expect(aiView?.actionBindings.listUrl).toBe("/api/v1/riot-ai/config");
  });

  it("self-mounts /api/v1/riot-ai/* and /api/v1/memory/* from createAiAddon(host) and isolates memory entries by tenantId", async () => {
    const app = Fastify({ logger: false });
    const testAuth: BaseAddonAuthBridge = {
      ...defaultFailClosedAuthBridge,
      authenticate: async (req) => {
        (req as { user?: { id: string; role: string } }).user = { id: "1", role: "admin" };
      },
      requireRole: () => async () => undefined,
      getActorId: () => "1",
      getActorRole: () => "admin",
      getActorTenant: (req) => String(req.headers["x-tenant-id"] ?? "default"),
      resolveActorContext: (req, source = "api") =>
        createActorContext("1", source, req.id, String(req.headers["x-tenant-id"] ?? "default")),
    };
    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        auditAddon,
        authAddon,
        createAiAddon({ prefix: "/api/v1", auth: testAuth }),
      ],
      app,
    );
    await app.ready();

    try {
      const cfgRes = await app.inject({ method: "GET", url: "/api/v1/riot-ai/config" });
      expect(cfgRes.statusCode).toBe(200);

      const createA = await app.inject({
        method: "POST",
        url: "/api/v1/memory/entries",
        headers: { "x-tenant-id": "tenant-a" },
        payload: {
          record_key: "mem-a-1",
          scope: "global",
          kind: "note",
          title: "Tenant A Note",
          content: "Secret for tenant A",
        },
      });
      expect(createA.statusCode).toBe(201);

      const listA = await app.inject({
        method: "GET",
        url: "/api/v1/memory/entries",
        headers: { "x-tenant-id": "tenant-a" },
      });
      expect(listA.statusCode).toBe(200);
      expect(listA.json().data).toHaveLength(1);
      expect(listA.json().data[0]?.record_key).toBe("mem-a-1");

      const listB = await app.inject({
        method: "GET",
        url: "/api/v1/memory/entries",
        headers: { "x-tenant-id": "tenant-b" },
      });
      expect(listB.statusCode).toBe(200);
      expect(listB.json().data).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it("createPlatformAddons(host) returns all 26 domain addons in valid dependency order", async () => {
    const host: AddonHostContext = {
      prefix: "/api/v1",
      auth: defaultFailClosedAuthBridge,
      seedDemo: false,
    };
    const addons = createPlatformAddons(host);
    expect(addons).toHaveLength(26);

    const runtime = new AddonRuntimeController();
    const { order, syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      ...addons,
    ]);
    expect(order).toHaveLength(27);
    expect(syncReport.createdTables.length).toBeGreaterThan(20);
  });
});
