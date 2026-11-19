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
import { createSyslogAddon, syslogAddon } from "./index.js";

describe("../syslog", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-syslog-"));
    dirs.push(dir);
    await initDb(join(dir, "syslog.db"));
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

  it("syncs syslog_entries table without SQL migrations", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      syslogAddon,
    ]);
    expect(syncReport.createdTables).toContain("syslog_entries");
    const view = await runtime.getViewDescriptor("syslog.entry", "viewer");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/syslog/messages");
  });

  it("self-mounts /api/v1/syslog/messages from createSyslogAddon(host)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ messages: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const app = Fastify({ logger: false });
    const testAuth: BaseAddonAuthBridge = {
      ...defaultFailClosedAuthBridge,
      authenticate: async (req) => {
        (req as { user?: { id: string; role: string } }).user = { id: "1", role: "viewer" };
      },
    };
    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        auditAddon,
        authAddon,
        createSyslogAddon({ prefix: "/api/v1", auth: testAuth }),
      ],
      app,
    );
    await app.ready();
    try {
      const res = await app.inject({ method: "GET", url: "/api/v1/syslog/messages" });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});
