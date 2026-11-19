import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  SYSTEM_ACTOR,
  backupDatabase,
  closeDb,
  defineModel,
  extendModel,
  getDb,
  initDb,
  listDatabaseTables,
  syncModels,
  verifyIntegrity,
} from "../index.js";

const execFileAsync = promisify(execFile);
const POSTGRES_TEST_URL = process.env.POSTGRES_TEST_URL?.trim() ?? "";

async function hasPgDumpBinary(): Promise<boolean> {
  try {
    await execFileAsync("pg_dump", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!POSTGRES_TEST_URL)("PostgreSQL live integration", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    closeDb();
  });

  afterAll(async () => {
    for (const dir of tempDirs) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("executes syncModels, extendModel, transactions, verifyIntegrity, and optional pg_dump against live PostgreSQL", async () => {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
    const modelName = `live.pg_widget_${suffix}`;
    const tableName = `live_pg_widget_${suffix}`;

    const widgetModel = defineModel({
      name: modelName,
      table: tableName,
      schema: z.object({
        slug: z.string().min(1),
        weight: z.number().int().default(1),
      }),
      extensible: true,
      indexes: [{ fields: ["slug"], unique: true }],
    });

    extendModel(modelName, {
      addon: "live-pg-test",
      fields: z.object({
        pg_note: z.string().nullable().default(null),
      }),
    });

    await initDb(POSTGRES_TEST_URL);
    try {
      const report = await syncModels([modelName]);
      expect(report.createdTables).toContain(tableName);

      const created = await widgetModel.repository.create(
        {
          slug: "alpha-one",
          weight: 7,
          pg_note: "verified",
        },
        SYSTEM_ACTOR,
      );
      expect(created.slug).toBe("alpha-one");
      expect(created.weight).toBe(7);

      const listed = await widgetModel.repository.find({ slug: "alpha-one" });
      expect(listed).toHaveLength(1);
      expect((listed[0] as Record<string, unknown> | undefined)?.pg_note).toBe("verified");

      const tables = await listDatabaseTables();
      expect(tables).toContain(tableName);

      const integrity = await verifyIntegrity();
      expect(integrity).toEqual({ ok: true, errors: [] });

      if (await hasPgDumpBinary()) {
        const dir = await mkdtemp(join(tmpdir(), "mw-pg-backup-"));
        tempDirs.push(dir);
        const dumpPath = join(dir, "live.pgdump");
        await backupDatabase(dumpPath);
        expect(existsSync(dumpPath)).toBe(true);
      }
    } finally {
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${tableName}`)
        .catch(() => {});
      closeDb();
    }
  });
});
