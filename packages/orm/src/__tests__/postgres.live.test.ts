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
  isPostgresUrl,
  listDatabaseTables,
  syncModels,
  verifyIntegrity,
} from "../index.js";

const execFileAsync = promisify(execFile);

function resolveLivePostgresUrl(): string {
  const candidates = [process.env.TEST_POSTGRES_URL?.trim(), process.env.POSTGRES_TEST_URL?.trim()];
  const requireConformance = process.env.MW_REQUIRE_POSTGRES_CONFORMANCE === "1";
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!isPostgresUrl(candidate)) {
      throw new Error("Live PostgreSQL test URL must use postgres:// or postgresql:// protocol.");
    }
    return candidate;
  }
  if (requireConformance) {
    throw new Error(
      "MW_REQUIRE_POSTGRES_CONFORMANCE=1 requires TEST_POSTGRES_URL or POSTGRES_TEST_URL.",
    );
  }
  return "";
}

const POSTGRES_TEST_URL = resolveLivePostgresUrl();

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
    const childTableName = `live_pg_child_${suffix}`;
    const constraintName = `fk_live_pg_${suffix}`;
    const invalidIndexName = `idx_live_pg_bad_${suffix}`;

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

      // Unsupported PRAGMA statements fail closed on PostgreSQL
      await expect(getDb().all("PRAGMA integrity_check")).rejects.toThrow(
        /Unsupported PostgreSQL PRAGMA: integrity_check/i,
      );
      await expect(getDb().all("PRAGMA foreign_key_check")).rejects.toThrow(
        /Unsupported PostgreSQL PRAGMA: foreign_key_check/i,
      );
      await expect(getDb().exec("PRAGMA journal_mode = WAL")).rejects.toThrow(
        /Unsupported PostgreSQL PRAGMA statement/i,
      );

      // Verify PostgreSQL catalog integrity detection on real unvalidated constraint & invalid index
      await getDb().exec(
        `CREATE TABLE ${childTableName} (id TEXT PRIMARY KEY, widget_id TEXT, code TEXT)`,
      );
      await getDb().exec(
        `INSERT INTO ${childTableName} (id, widget_id, code) VALUES ('c1', '${created.id}', 'dup'), ('c2', '${created.id}', 'dup')`,
      );
      await getDb().exec(
        `ALTER TABLE ${childTableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY (widget_id) REFERENCES ${tableName}(id) NOT VALID`,
      );
      await expect(
        getDb().exec(
          `CREATE UNIQUE INDEX CONCURRENTLY ${invalidIndexName} ON ${childTableName} (code)`,
        ),
      ).rejects.toThrow();

      const brokenIntegrity = await verifyIntegrity();
      expect(brokenIntegrity.ok).toBe(false);
      expect(brokenIntegrity.errors).toContain(
        `unvalidated postgres constraint: ${constraintName}`,
      );
      expect(brokenIntegrity.errors).toContain(
        `invalid or unready postgres index: ${invalidIndexName}`,
      );

      await getDb().exec(`DROP INDEX IF EXISTS ${invalidIndexName}`);
      await getDb().exec(`ALTER TABLE ${childTableName} VALIDATE CONSTRAINT ${constraintName}`);
      const restoredIntegrity = await verifyIntegrity();
      expect(restoredIntegrity).toEqual({ ok: true, errors: [] });

      if (await hasPgDumpBinary()) {
        const dir = await mkdtemp(join(tmpdir(), "mw-pg-backup-"));
        tempDirs.push(dir);
        const dumpPath = join(dir, "live.pgdump");
        await backupDatabase(dumpPath);
        expect(existsSync(dumpPath)).toBe(true);
      }
    } finally {
      await getDb()
        .exec(`DROP INDEX IF EXISTS ${invalidIndexName}`)
        .catch(() => {});
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${childTableName}`)
        .catch(() => {});
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${tableName}`)
        .catch(() => {});
      closeDb();
    }
  });
});
