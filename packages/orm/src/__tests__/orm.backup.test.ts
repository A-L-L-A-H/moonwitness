import { afterAll, afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import {
  backupDatabase,
  closeDb,
  decryptBackupFile,
  encryptBackupFile,
  getDb,
  initDb,
  initPostgresDb,
  listDatabaseTables,
  restoreDatabase,
  verifyIntegrity,
  type PoolLike,
} from "../index.js";

const dirs: string[] = [];

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "mw-orm-backup-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  closeDb();
});

afterAll(async () => {
  for (const dir of dirs) {
    await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }).catch(() => {});
  }
});

describe("backup and restore", () => {
  it("snapshots a live database and restores it into a fresh one", async () => {
    const dir = await tempDir();
    const source = join(dir, "source.db");
    const backup = join(dir, "backup.db");
    const restored = join(dir, "restored.db");

    await initDb(source);
    await getDb().exec("CREATE TABLE widgets(id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    await getDb().run("INSERT INTO widgets(id, name) VALUES (?, ?)", ["w1", "sprocket"]);
    await getDb().run("INSERT INTO widgets(id, name) VALUES (?, ?)", ["w2", "flange"]);

    const integrity = await verifyIntegrity();
    expect(integrity.ok).toBe(true);

    await backupDatabase(backup);
    expect(existsSync(backup)).toBe(true);
    closeDb();

    await restoreDatabase(backup, restored);
    await initDb(restored);
    const rows = await getDb().all<{ id: string; name: string }>(
      "SELECT id, name FROM widgets ORDER BY id",
    );
    expect(rows).toEqual([
      { id: "w1", name: "sprocket" },
      { id: "w2", name: "flange" },
    ]);
  });

  it("encrypts and decrypts backup snapshot with AES-256-GCM", async () => {
    const dir = await tempDir();
    const source = join(dir, "source.db");
    const snapshot = join(dir, "snapshot.db");
    const encrypted = join(dir, "backup.db.enc");
    const decrypted = join(dir, "decrypted.db");
    const key = randomBytes(32);

    await initDb(source);
    await getDb().exec("CREATE TABLE secure_items(id TEXT PRIMARY KEY, secret TEXT NOT NULL)");
    await getDb().run("INSERT INTO secure_items(id, secret) VALUES (?, ?)", ["s1", "classified"]);
    await backupDatabase(snapshot);
    closeDb();

    await encryptBackupFile(snapshot, encrypted, key);
    expect(existsSync(encrypted)).toBe(true);

    await decryptBackupFile(encrypted, decrypted, key);
    expect(existsSync(decrypted)).toBe(true);

    await initDb(decrypted);
    const integrity = await verifyIntegrity();
    expect(integrity.ok).toBe(true);

    const rows = await getDb().all<{ id: string; secret: string }>(
      "SELECT id, secret FROM secure_items",
    );
    expect(rows).toEqual([{ id: "s1", secret: "classified" }]);
  });

  it("fails decryption with wrong key or tampered ciphertext", async () => {
    const dir = await tempDir();
    const source = join(dir, "source.db");
    const snapshot = join(dir, "snapshot.db");
    const encrypted = join(dir, "backup.db.enc");
    const target = join(dir, "decrypted.db");
    const key = randomBytes(32);
    const wrongKey = randomBytes(32);

    await initDb(source);
    await getDb().exec("CREATE TABLE t(id INT)");
    await backupDatabase(snapshot);
    closeDb();

    await encryptBackupFile(snapshot, encrypted, key);

    await expect(decryptBackupFile(encrypted, target, wrongKey)).rejects.toThrow();
  });

  it("rejects empty backup/restore paths", async () => {
    await expect(backupDatabase("")).rejects.toThrow();
    await expect(restoreDatabase("", "x.db")).rejects.toThrow();
  });

  it("verifies PostgreSQL index & constraint integrity and dispatches pg_dump/pg_restore", async () => {
    let invalidIndexes: Array<{ index_name: string }> = [];
    let unvalidatedConstraints: Array<{ constraint_name: string }> = [];

    const mockPool: PoolLike = {
      query: async (sql: string) => {
        if (sql.includes("SELECT 1 AS ok")) {
          return { rows: [{ ok: 1 }], rowCount: 1 };
        }
        if (sql.includes("pg_index")) {
          return { rows: invalidIndexes, rowCount: invalidIndexes.length };
        }
        if (sql.includes("pg_constraint")) {
          return { rows: unvalidatedConstraints, rowCount: unvalidatedConstraints.length };
        }
        if (sql.includes("information_schema.tables")) {
          return { rows: [{ table_name: "users" }, { table_name: "ir_addons" }], rowCount: 2 };
        }
        return { rows: [], rowCount: 0 };
      },
      connect: async () => ({
        query: async () => ({ rows: [], rowCount: 0 }),
        release: () => {},
      }),
      end: async () => {},
    };

    const pgUrl = "postgres://moonwitness:secret@localhost:5432/moonwitness";
    await initPostgresDb(pgUrl, mockPool);

    expect(await listDatabaseTables()).toEqual(["users", "ir_addons"]);
    expect(await verifyIntegrity()).toEqual({ ok: true, errors: [] });

    invalidIndexes = [{ index_name: "idx_broken" }];
    unvalidatedConstraints = [{ constraint_name: "fk_broken" }];
    const broken = await verifyIntegrity();
    expect(broken.ok).toBe(false);
    expect(broken.errors).toEqual([
      "invalid or unready postgres index: idx_broken",
      "unvalidated postgres constraint: fk_broken",
    ]);

    const invocations: Array<{
      command: string;
      args: string[];
      password?: string;
    }> = [];
    await backupDatabase("/tmp/mw.pgdump", {
      runCommand: async (command, args, options) => {
        invocations.push({ command, args, password: options?.env?.PGPASSWORD });
      },
    });
    await restoreDatabase("/tmp/mw.pgdump", pgUrl, {
      runCommand: async (command, args, options) => {
        invocations.push({ command, args, password: options?.env?.PGPASSWORD });
      },
    });

    const safeUrl = "postgres://moonwitness@localhost:5432/moonwitness";
    expect(invocations).toEqual([
      {
        command: "pg_dump",
        args: ["--format=custom", "--no-owner", "--no-acl", "-f", "/tmp/mw.pgdump", safeUrl],
        password: "secret",
      },
      {
        command: "pg_restore",
        args: ["--clean", "--if-exists", "--no-owner", "--no-acl", "-d", safeUrl, "/tmp/mw.pgdump"],
        password: "secret",
      },
    ]);
  });
});
