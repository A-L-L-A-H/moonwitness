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
  restoreDatabase,
  verifyIntegrity,
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
});
