import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { DOCTOR_EXIT_DRIFT, DOCTOR_EXIT_OK, runDoctor } from "../doctor-cli.js";
import {
  closeDb,
  getDb,
  initPostgresDb,
  inspectSchemaDrift,
  isPostgresUrl,
  normalizePgType,
  syncModels,
} from "../index.js";
import { DOCTOR_FIXTURE_TABLES } from "./fixtures/doctor-models.js";

const POSTGRES_URL =
  process.env.TEST_POSTGRES_URL?.trim() || process.env.POSTGRES_TEST_URL?.trim() || "";

describe("schema drift normalization", () => {
  it("treats equivalent PostgreSQL type spellings as equal", () => {
    expect(normalizePgType("INT4")).toBe("integer");
    expect(normalizePgType("Integer")).toBe("integer");
    expect(normalizePgType("float4")).toBe("real");
    expect(normalizePgType("  TEXT ")).toBe("text");
    expect(normalizePgType("double   precision")).toBe("double precision");
    expect(normalizePgType("text")).not.toBe(normalizePgType("integer"));
  });

  it("rejects non-PostgreSQL URLs", () => {
    expect(isPostgresUrl("file:test.db")).toBe(false);
  });
});

const T = DOCTOR_FIXTURE_TABLES;

async function dropFixtureTables(): Promise<void> {
  const db = getDb();
  for (const table of [T.join, T.child, T.parent, T.tag]) {
    await db.exec(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }
}

async function catalogSnapshot(): Promise<string> {
  const rows = await getDb().all<{ entry: string }>(
    `SELECT c.relname || ':' || a.attname || ':' || format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull::text AS entry
     FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname LIKE 'doctor_fx_%' AND a.attnum > 0 AND NOT a.attisdropped
     UNION ALL
     SELECT 'idx:' || indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'doctor_fx_%'
     UNION ALL
     SELECT 'con:' || conname || ':' || contype::text FROM pg_constraint WHERE conname LIKE 'doctor_fx_%'
        OR conrelid::regclass::text LIKE 'doctor_fx_%'
     ORDER BY 1`,
  );
  return rows.map((row) => row.entry).join("\n");
}

describe.skipIf(!POSTGRES_URL)("schema drift inspector (live PostgreSQL)", () => {
  beforeAll(async () => {
    await initPostgresDb(POSTGRES_URL);
    await dropFixtureTables();
  });

  afterEach(async () => {
    await dropFixtureTables();
  });

  afterAll(() => {
    closeDb();
  });

  const models = ["doctor_fx.tag", "doctor_fx.parent", "doctor_fx.child"];

  it("reports no errors for a freshly synced schema and does not mutate the catalog", async () => {
    await syncModels(models);
    const before = await catalogSnapshot();
    const report = await inspectSchemaDrift(models);
    expect(report.ok).toBe(true);
    expect(report.findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(report.models).toHaveLength(3);
    for (const summary of report.models) {
      expect(summary.descriptorHash).toMatch(/^[0-9a-f]{64}$/);
      expect(summary.catalogFingerprint).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(await catalogSnapshot()).toBe(before);
  });

  it("reports missing tables, including the many2many join table", async () => {
    const report = await inspectSchemaDrift(models);
    const missing = report.findings.filter((f) => f.code === "TABLE_MISSING").map((f) => f.table);
    expect(missing.sort()).toEqual([T.child, T.join, T.parent, T.tag].sort());
    expect(report.ok).toBe(false);
    expect(report.models.every((m) => m.catalogFingerprint === null)).toBe(true);
  });

  it("reports dropped column, altered type, altered nullability, extra column", async () => {
    await syncModels(models);
    const db = getDb();
    await db.exec(`ALTER TABLE ${T.child} DROP COLUMN weight`);
    await db.exec(`ALTER TABLE ${T.child} ALTER COLUMN title TYPE VARCHAR(40)`);
    await db.exec(`ALTER TABLE ${T.tag} ALTER COLUMN label DROP NOT NULL`);
    await db.exec(`ALTER TABLE ${T.parent} ADD COLUMN legacy_note TEXT`);
    const before = await catalogSnapshot();
    const report = await inspectSchemaDrift(models);
    const codes = report.findings.map((f) => `${f.code}:${f.table}:${f.objectName}`).sort();
    expect(codes).toEqual(
      [
        `COLUMN_EXTRA:${T.parent}:legacy_note`,
        `COLUMN_MISSING:${T.child}:weight`,
        `COLUMN_NULLABILITY_MISMATCH:${T.tag}:label`,
        `COLUMN_TYPE_MISMATCH:${T.child}:title`,
      ].sort(),
    );
    const typed = report.findings.find((f) => f.code === "COLUMN_TYPE_MISMATCH");
    expect(typed?.expected).toBe("text NOT NULL");
    expect(typed?.observed).toBe("character varying(40) NOT NULL");
    expect(typed?.model).toBe("doctor_fx.child");
    expect(typed?.objectKind).toBe("column");
    expect(report.ok).toBe(false);
    expect(await catalogSnapshot()).toBe(before);
  });

  it("reports dropped and uniqueness-altered indexes and foreign key drift, tolerating renamed equivalents", async () => {
    await syncModels(models);
    const db = getDb();
    await db.exec(`ALTER INDEX idx_${T.child}_title RENAME TO renamed_equivalent_title_idx`);
    expect((await inspectSchemaDrift(models)).ok).toBe(true);

    await db.exec(`DROP INDEX renamed_equivalent_title_idx`);
    await db.exec(`CREATE INDEX plain_title_idx ON ${T.child} (title)`);
    let report = await inspectSchemaDrift(models);
    expect(report.findings.map((f) => f.code)).toEqual(["INDEX_UNIQUENESS_MISMATCH"]);

    await db.exec(`DROP INDEX plain_title_idx`);
    report = await inspectSchemaDrift(models);
    expect(report.findings.map((f) => f.code)).toEqual(["INDEX_MISSING"]);

    await syncModels(models);
    const fk = await db.get<{ conname: string }>(
      `SELECT conname FROM pg_constraint WHERE contype = 'f' AND conrelid = '${T.child}'::regclass`,
    );
    await db.exec(`ALTER TABLE ${T.child} DROP CONSTRAINT "${fk?.conname}"`);
    report = await inspectSchemaDrift(models);
    expect(report.findings.map((f) => f.code)).toContain("FOREIGN_KEY_MISSING");

    await db.exec(
      `ALTER TABLE ${T.child} ADD CONSTRAINT fx_fk FOREIGN KEY (parent_id) REFERENCES ${T.parent}(id) ON DELETE RESTRICT`,
    );
    report = await inspectSchemaDrift(models);
    const mismatch = report.findings.find((f) => f.code === "FOREIGN_KEY_MISMATCH");
    expect(mismatch?.expected).toContain("ON DELETE SET NULL");
    expect(mismatch?.observed).toContain("ON DELETE RESTRICT");
  });

  it("reports many2many join table structural drift", async () => {
    await syncModels(models);
    const db = getDb();
    await db.exec(`DROP INDEX idx_${T.join}_unique`);
    await db.exec(`ALTER TABLE ${T.join} DROP COLUMN tag_id`);
    const report = await inspectSchemaDrift(["doctor_fx.child"]);
    const codes = report.findings.filter((f) => f.table === T.join).map((f) => f.code);
    expect(codes).toContain("COLUMN_MISSING");
    expect(codes).toContain("INDEX_MISSING");
  });

  it("rejects unknown models", async () => {
    await expect(inspectSchemaDrift(["doctor_fx.unknown"])).rejects.toThrow(/unknown model/);
  });
});

describe.skipIf(!POSTGRES_URL)("doctor CLI (live PostgreSQL)", () => {
  const models = ["doctor_fx.tag", "doctor_fx.parent", "doctor_fx.child"];
  const T = DOCTOR_FIXTURE_TABLES;
  const FIXTURE_PATH = fileURLToPath(new URL("./fixtures/doctor-models.ts", import.meta.url));

  function capture(): {
    io: { stdout: (t: string) => void; stderr: (t: string) => void };
    out: () => string;
    err: () => string;
  } {
    let stdout = "";
    let stderr = "";
    return {
      io: {
        stdout: (text) => {
          stdout += text;
        },
        stderr: (text) => {
          stderr += text;
        },
      },
      out: () => stdout,
      err: () => stderr,
    };
  }
  const args = (extra: string[] = []) => [
    "--models",
    FIXTURE_PATH,
    ...models.flatMap((m) => ["--model", m]),
    ...extra,
  ];

  async function drop(): Promise<void> {
    for (const table of [T.join, T.child, T.parent, T.tag]) {
      await getDb().exec(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
  }

  beforeAll(async () => {
    await initPostgresDb(POSTGRES_URL);
    await drop();
  });
  afterEach(drop);
  afterAll(() => closeDb());

  async function runAgainstLive(
    argv: string[],
  ): Promise<{ code: number; out: string; err: string }> {
    const sink = capture();
    closeDb();
    const code = await runDoctor(argv, { DATABASE_URL: POSTGRES_URL }, sink.io);
    await initPostgresDb(POSTGRES_URL);
    return { code, out: sink.out(), err: sink.err() };
  }

  it("exits 0 for a clean schema and closes the connection", async () => {
    await syncModels(models);
    const result = await runAgainstLive(args());
    expect(result.code).toBe(DOCTOR_EXIT_OK);
    expect(result.out).toContain("no drift");
  });

  it("exits 1 with versioned JSON when drift is found and leaves the schema untouched", async () => {
    await syncModels(models);
    await getDb().exec(`ALTER TABLE ${T.child} DROP COLUMN weight`);
    const result = await runAgainstLive(args(["--json"]));
    expect(result.code).toBe(DOCTOR_EXIT_DRIFT);
    const report = JSON.parse(result.out) as {
      version: number;
      ok: boolean;
      findings: Array<{ code: string; table: string; objectName: string }>;
    };
    expect(report.version).toBe(1);
    expect(report.ok).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({ code: "COLUMN_MISSING", table: T.child, objectName: "weight" }),
    );
    expect(result.out).not.toContain(POSTGRES_URL);
    const still = await getDb().all(
      `SELECT 1 FROM information_schema.columns WHERE table_name = '${T.child}' AND column_name = 'weight'`,
    );
    expect(still).toHaveLength(0);
  });

  it("prints human-readable findings and exits 1 for a missing table", async () => {
    const result = await runAgainstLive(args());
    expect(result.code).toBe(DOCTOR_EXIT_DRIFT);
    expect(result.out).toContain("TABLE_MISSING");
    const created = await getDb().all(
      `SELECT 1 FROM information_schema.tables WHERE table_name = '${T.tag}'`,
    );
    expect(created).toHaveLength(0);
  });
});
