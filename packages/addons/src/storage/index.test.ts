import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  defaultFailClosedAuthBridge,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { createStorageAddon, storageAddon } from "./index.js";

describe("../storage", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-storage-"));
    dirs.push(dir);
    await initDb(join(dir, "storage.db"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it("syncs storage tables cleanly and exposes proxy actionBindings", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      storageAddon,
    ]);
    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining(["storage_buckets", "storage_objects", "storage_upload_sessions"]),
    );
    const view = await runtime.getViewDescriptor("storage.bucket", "editor");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/storage/buckets");
    expect(view?.actionBindings.createUrl).toBeUndefined();
  });

  it("self-mounts /api/v1/storage/buckets and /api/v1/storage/health from createStorageAddon(host)", async () => {
    const prevAccess = process.env.STORAGE_ACCESS_KEY;
    const prevSecret = process.env.STORAGE_SECRET_KEY;
    process.env.STORAGE_ACCESS_KEY = "test-storage-access";
    process.env.STORAGE_SECRET_KEY = "test-storage-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response('<?xml version="1.0"?><ListAllMyBucketsResult/>', {
            status: 200,
            headers: { "content-type": "application/xml" },
          }),
        ),
      ),
    );
    const app = Fastify({ logger: false });
    const testAuth: BaseAddonAuthBridge = {
      ...defaultFailClosedAuthBridge,
      authenticate: async (req) => {
        (req as { user?: { id: string; role: string } }).user = { id: "1", role: "admin" };
      },
      requireRole: () => async () => undefined,
    };
    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        auditAddon,
        authAddon,
        createStorageAddon({ prefix: "/api/v1", auth: testAuth }),
      ],
      app,
    );
    await app.ready();
    try {
      const healthRes = await app.inject({ method: "GET", url: "/api/v1/storage/health" });
      expect(healthRes.statusCode).toBe(200);
      const res = await app.inject({ method: "GET", url: "/api/v1/storage/buckets" });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
      if (prevAccess === undefined) delete process.env.STORAGE_ACCESS_KEY;
      else process.env.STORAGE_ACCESS_KEY = prevAccess;
      if (prevSecret === undefined) delete process.env.STORAGE_SECRET_KEY;
      else process.env.STORAGE_SECRET_KEY = prevSecret;
    }
  });
});
