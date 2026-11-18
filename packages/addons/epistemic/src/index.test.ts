import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-base";
import { auditAddon } from "@moonwitness/addon-audit";
import { createEpistemicAddon } from "./index.js";

const editorAuth: BaseAddonAuthBridge = {
  authenticate: async () => {},
  requireRole: () => async () => {},
  getActorRole: () => "editor",
  getActorId: () => "ed-1",
};

describe("@moonwitness/addon-epistemic", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-epistemic-"));
    dirs.push(dir);
    await initDb(join(dir, "epistemic.db"));
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

  it("evaluates crayon RGBL & divine-text and records reproducible computation ledger", async () => {
    const app = Fastify();
    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        auditAddon,
        createEpistemicAddon({ prefix: "/api/v1", auth: editorAuth }),
      ],
      app,
    );
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/epistemic/evaluate",
      payload: { engine: "crayon", r: 255, g: 255, b: 255 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().output.luminance).toBeCloseTo(1, 4);
    expect(res.json().output.contrastVsBlack).toBe(21);
    await app.close();
  });
});
