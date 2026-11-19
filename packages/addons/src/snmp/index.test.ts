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
import { createSnmpAddon, snmpAddon } from "./index.js";

describe("../snmp", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-snmp-"));
    dirs.push(dir);
    await initDb(join(dir, "snmp.db"));
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

  it("syncs SNMP tables and exposes proxy actionBindings", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      snmpAddon,
    ]);
    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining(["snmp_devices", "snmp_targets", "snmp_samples"]),
    );
    const view = await runtime.getViewDescriptor("snmp.device", "editor");
    expect(view?.extensible).toBe(true);
    expect(view?.actionBindings.listUrl).toBe("/api/v1/snmp/devices");
    expect(view?.actionBindings.createUrl).toBe("/api/v1/snmp/devices");
  });

  it("self-mounts /api/v1/snmp/devices from createSnmpAddon(host)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ devices: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
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
        createSnmpAddon({ prefix: "/api/v1", auth: testAuth }),
      ],
      app,
    );
    await app.ready();
    try {
      const res = await app.inject({ method: "GET", url: "/api/v1/snmp/devices" });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});
