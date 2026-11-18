import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { createI18nAddon } from "./index.js";

describe("@moonwitness/addon-i18n", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-i18n-"));
    dirs.push(dir);
    await initDb(join(dir, "i18n.db"));
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

  it("syncs locale/term tables, seeds defaults, and serves bundles", async () => {
    const app = Fastify();
    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        createI18nAddon({ prefix: "/api/v1" }),
      ],
      app,
    );
    await app.ready();

    const localesRes = await app.inject({ url: "/api/v1/i18n/locales" });
    expect(localesRes.statusCode).toBe(200);
    const codes = localesRes.json().locales.map((l: { code: string }) => l.code);
    expect(codes).toEqual(["en", "id"]);
    await app.close();
  });
});
