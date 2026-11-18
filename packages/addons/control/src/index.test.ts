import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon } from "@moonwitness/addon-audit";
import { authAddon } from "@moonwitness/addon-auth";
import { controlAddon, createControlScheduler, processControlSchedulerJob } from "./index.js";

describe("@moonwitness/addon-control", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-ctrl-"));
    dirs.push(dir);
    await initDb(join(dir, "ctrl.db"));
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

  it("syncs control_command_history without SQL migrations", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      controlAddon,
    ]);
    expect(syncReport.createdTables).toContain("control_command_history");
    const view = await runtime.getViewDescriptor("control.command", "admin");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/control/audit");
  });

  it("supports pluggable ARSY HTTP and durable queue control scheduler backends", async () => {
    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      controlAddon,
    ]);

    const calls: Array<{ url: string; headers: Record<string, string> }> = [];
    const arsyBackend = createControlScheduler({
      mode: "arsy",
      arsyBaseUrl: "http://127.0.0.1:8787",
      arsyAdminToken: "admin-tok",
      fetchImpl: async (url, init) => {
        calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
        return new Response(JSON.stringify({ planId: "p-1" }), { status: 200 });
      },
    });
    const arsyRes = await arsyBackend.dispatch({
      action: "plan",
      resourceKind: "systemd",
      payload: { unit: "moonwitness-api.service" },
      traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    });
    expect(arsyRes.accepted).toBe(true);
    expect(calls[0]?.url).toBe("http://127.0.0.1:8787/v1/plan");
    expect(calls[0]?.headers.authorization).toBe("Bearer admin-tok");

    const queueBackend = createControlScheduler({ mode: "queue" });
    const queued = await queueBackend.dispatch({
      action: "apply",
      resourceKind: "dockercompose",
      targetPath: "/srv/moonwitness",
      payload: { confirm: "abc123" },
    });
    expect(queued.accepted).toBe(true);
    expect(queued.statusCode).toBe(202);
    expect(queued.jobId).toBeTruthy();

    const executed: string[] = [];
    const processed = await processControlSchedulerJob("worker-1", async (req) => {
      executed.push(`${req.action}:${req.resourceKind}:${req.targetPath}`);
      return { applied: true };
    });
    expect(processed).toBe(true);
    expect(executed).toEqual(["apply:dockercompose:/srv/moonwitness"]);
  });
});
