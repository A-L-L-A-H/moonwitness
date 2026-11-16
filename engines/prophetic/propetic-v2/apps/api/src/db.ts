import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const RELEASE_VERSION = "2.3.2";
const DB_SCHEMA_VERSION = "2.3";
const DATA_SCHEMA_VERSION = "2.0";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface SqliteStore {
  db: DatabaseSync;
  getDataset(): Record<string, unknown>;
  getProphet(id: string): Record<string, unknown> | null;
  listProphets(): Array<Record<string, unknown>>;
  getLeaderboards(): Record<string, unknown>;
  getCorpus(): Record<string, unknown>;
  getDocs(): Record<string, unknown>;
  getDocument(id: string): Json;
  health(): Record<string, unknown>;
}

function parseJson(text: unknown): Json {
  if (typeof text !== "string") return {};
  return JSON.parse(text) as Json;
}

function parseJsonRecord(text: unknown): Record<string, unknown> {
  const value = parseJson(text);
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function seedFiles(root: string) {
  return {
    dataset: resolve(root, "src/data/prophet-identity-graph.v2.0.json"),
    leaderboards: resolve(root, "web/public/leaderboards.v2.0.json"),
    corpus: resolve(root, "src/data/v2/corpus-registry.v2.0.json"),
    docs: resolve(root, "src/data/v2/documentation-registry.v2.3.json"),
    optional: [
      ["provenance", "web/public/provenance-index.v2.0.json"],
      ["timeline", "web/public/timeline.v2.0.json"],
      ["events", "web/public/events.v2.0.json"],
      ["genealogy", "web/public/genealogy.v2.0.json"],
      ["uncertainty", "web/public/uncertainty.v2.0.json"],
      ["validation", "web/public/validation.v2.0.json"],
      ["profile-audit", "web/public/profile-audit.v2.0.json"],
      ["scoring-audit", "web/public/scoring-audit.v2.3.json"],
      ["source-editions", "web/public/source-editions.v2.0.json"],
      ["conflicts", "web/public/conflicts.v2.0.json"],
      ["human-preference", "web/public/human-preference-report.v2.0.json"],
      ["relation-scores", "web/public/relation-scores.v2.0.json"],
      ["profile-data-scores", "web/public/profile-data-scores.v2.0.json"],
    ] as Array<[string, string]>,
  };
}

function seedFingerprint(root: string): string {
  const files = seedFiles(root);
  const hash = createHash("sha256");
  for (const path of [files.dataset, files.leaderboards, files.corpus, files.docs]) {
    if (!existsSync(path)) throw new Error(`Missing seed input: ${path}`);
    hash.update(path.replace(root, ""));
    hash.update(readFileSync(path));
  }
  for (const [, relative] of files.optional) {
    const path = resolve(root, relative);
    if (!existsSync(path)) continue;
    hash.update(relative);
    hash.update(readFileSync(path));
  }
  return hash.digest("hex");
}

function metaValue(db: DatabaseSync, key: string): string | null {
  try {
    const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  } catch {
    return null;
  }
}

function schemaFingerprint(root: string): string {
  const schemaPath = resolve(root, "apps/api/schema.sql");
  return createHash("sha256").update(readFileSync(schemaPath)).digest("hex");
}

function initializeSchema(db: DatabaseSync, root: string): string {
  const schemaPath = resolve(root, "apps/api/schema.sql");
  if (!existsSync(schemaPath)) throw new Error(`Missing SQLite schema: ${schemaPath}`);

  // v2.2 created tables inline without JSON checks/indexes. The database is a derived
  // read model, so an incompatible read-model schema is rebuilt rather than migrated in place.
  const canonicalSchemaFingerprint = schemaFingerprint(root);
  const existingVersion = metaValue(db, "db_schema_version");
  const existingSchemaFingerprint = metaValue(db, "schema_fingerprint");
  if (existingVersion !== DB_SCHEMA_VERSION || existingSchemaFingerprint !== canonicalSchemaFingerprint) {
    db.exec("PRAGMA foreign_keys = OFF;");
    db.exec("DROP TABLE IF EXISTS documents; DROP TABLE IF EXISTS prophets; DROP TABLE IF EXISTS meta;");
    db.exec("PRAGMA foreign_keys = ON;");
  }
  db.exec(readFileSync(schemaPath, "utf8"));
  return canonicalSchemaFingerprint;
}

export function openStore(root = process.cwd()): SqliteStore {
  const dbPath = resolve(root, "data/sqlite/prophet-research-v2.3.sqlite");
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);

  const canonicalSchemaFingerprint = initializeSchema(db, root);

  const fingerprint = seedFingerprint(root);
  const count = Number((db.prepare("SELECT COUNT(*) AS n FROM prophets").get() as { n: number }).n);
  const storedFingerprint = metaValue(db, "seed_fingerprint");
  const storedRelease = metaValue(db, "release_version");
  if (count !== 25 || storedFingerprint !== fingerprint || storedRelease !== RELEASE_VERSION) {
    seed(db, root, fingerprint, canonicalSchemaFingerprint);
  }

  return {
    db,
    getDataset() {
      const row = db.prepare("SELECT payload_json FROM documents WHERE id = ?").get("dataset") as { payload_json: string } | undefined;
      return row ? parseJsonRecord(row.payload_json) : {};
    },
    getProphet(id) {
      const row = db.prepare("SELECT payload_json FROM prophets WHERE id = ?").get(id) as { payload_json: string } | undefined;
      return row ? parseJsonRecord(row.payload_json) : null;
    },
    listProphets() {
      return db.prepare("SELECT id, display_name, quranic_name, rid_root FROM prophets ORDER BY rowid").all() as Array<Record<string, unknown>>;
    },
    getLeaderboards() {
      const row = db.prepare("SELECT payload_json FROM documents WHERE id = ?").get("leaderboards") as { payload_json: string } | undefined;
      return row ? parseJsonRecord(row.payload_json) : {};
    },
    getCorpus() {
      const row = db.prepare("SELECT payload_json FROM documents WHERE id = ?").get("corpus") as { payload_json: string } | undefined;
      return row ? parseJsonRecord(row.payload_json) : {};
    },
    getDocs() {
      const row = db.prepare("SELECT payload_json FROM documents WHERE id = ?").get("docs") as { payload_json: string } | undefined;
      return row ? parseJsonRecord(row.payload_json) : {};
    },
    getDocument(id) {
      const row = db.prepare("SELECT payload_json FROM documents WHERE id = ?").get(id) as { payload_json: string } | undefined;
      return row ? parseJson(row.payload_json) : {};
    },
    health() {
      const prophetCount = (db.prepare("SELECT COUNT(*) AS n FROM prophets").get() as { n: number }).n;
      return {
        ok: true,
        version: metaValue(db, "release_version") ?? "unknown",
        database: "sqlite",
        prophetCount,
        dbSchemaVersion: metaValue(db, "db_schema_version") ?? "unknown",
        dataSchemaVersion: metaValue(db, "data_schema_version") ?? "unknown",
        seedFingerprint: metaValue(db, "seed_fingerprint") ?? "unknown",
        schemaFingerprint: metaValue(db, "schema_fingerprint") ?? "unknown",
      };
    },
  };
}

function seed(db: DatabaseSync, root: string, fingerprint: string, schemaFingerprintValue: string) {
  const files = seedFiles(root);
  if (!existsSync(files.dataset)) throw new Error(`Missing dataset: ${files.dataset}`);

  const dataset = readJsonFile(files.dataset) as { prophets: Record<string, Record<string, unknown>> };
  const leaderboards = existsSync(files.leaderboards) ? readJsonFile(files.leaderboards) : {};
  const corpus = existsSync(files.corpus) ? readJsonFile(files.corpus) : {};
  const docs = existsSync(files.docs) ? readJsonFile(files.docs) : {};

  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("DELETE FROM documents; DELETE FROM prophets;");

    const prophetStmt = db.prepare("INSERT INTO prophets(id,display_name,quranic_name,rid_root,payload_json) VALUES (?,?,?,?,?)");
    for (const [id, raw] of Object.entries(dataset.prophets)) {
      const rid = typeof raw.rid === "object" && raw.rid !== null ? raw.rid as Record<string, unknown> : {};
      prophetStmt.run(id, raw.display_name ?? id, raw.quranic_name ?? "", rid.root ?? "", JSON.stringify(raw));
    }

    const docStmt = db.prepare("INSERT INTO documents(id,kind,payload_json) VALUES (?,?,?)");
    docStmt.run("dataset", "dataset", JSON.stringify(dataset));
    docStmt.run("leaderboards", "leaderboard", JSON.stringify(leaderboards));
    docStmt.run("corpus", "corpus", JSON.stringify(corpus));
    docStmt.run("docs", "documentation", JSON.stringify(docs));
    for (const [id, relative] of files.optional) {
      const path = resolve(root, relative);
      if (existsSync(path)) docStmt.run(id, id, readFileSync(path, "utf8"));
    }

    const metaStmt = db.prepare("INSERT OR REPLACE INTO meta(key,value) VALUES (?,?)");
    metaStmt.run("release_version", RELEASE_VERSION);
    metaStmt.run("db_schema_version", DB_SCHEMA_VERSION);
    metaStmt.run("data_schema_version", DATA_SCHEMA_VERSION);
    metaStmt.run("seed_fingerprint", fingerprint);
    metaStmt.run("schema_fingerprint", schemaFingerprintValue);
    db.exec("COMMIT");
    db.exec("PRAGMA optimize;");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
