import { execFile } from "node:child_process";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { copyFile, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { getDb, type OrmDriverHandle } from "./driver.js";
import { isPostgresUrl } from "./drivers/postgres.driver.js";

const execFileAsync = promisify(execFile);

export type ExternalCommandRunner = (
  command: string,
  args: string[],
  options?: { env?: Record<string, string | undefined> },
) => Promise<void>;

export interface BackupCommandOptions {
  /** Override PostgreSQL connection URL instead of reading active driver URL. */
  connectionString?: string;
  /** Override subprocess invocation (`pg_dump` / `pg_restore`), primarily for tests. */
  runCommand?: ExternalCommandRunner;
}

async function defaultCommandRunner(
  command: string,
  args: string[],
  options: { env?: Record<string, string | undefined> } = {},
): Promise<void> {
  await execFileAsync(command, args, {
    maxBuffer: 16 * 1024 * 1024,
    ...(options.env ? { env: options.env } : {}),
  });
}

function preparePostgresCommandConnection(connectionString: string): {
  connectionString: string;
  options?: { env: Record<string, string | undefined> };
} {
  const url = new URL(connectionString);
  let password = url.password ? decodeURIComponent(url.password) : "";
  url.password = "";
  if (url.searchParams.has("password")) {
    if (!password) password = url.searchParams.get("password") ?? "";
    url.searchParams.delete("password");
  }
  return {
    connectionString: url.toString(),
    ...(password ? { options: { env: { ...process.env, PGPASSWORD: password } } } : {}),
  };
}

function getOptionalActiveDb(): OrmDriverHandle | null {
  try {
    return getDb();
  } catch {
    return null;
  }
}

function isPostgresHandle(db: OrmDriverHandle | null | undefined): boolean {
  return (db?.kind ?? db?.dialect) === "postgres";
}

/**
 * List user tables on the currently initialized database handle across SQLite and PostgreSQL.
 */
export async function listDatabaseTables(): Promise<string[]> {
  const db = getDb();
  if (isPostgresHandle(db)) {
    const rows = await db.all<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name ASC",
    );
    return rows.map((row) => String(row.table_name));
  }

  const rows = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC",
  );
  return rows.map((row) => String(row.name));
}

/**
 * Verify database integrity and constraint validity across SQLite (`PRAGMA`)
 * and PostgreSQL (`pg_index` + `pg_constraint` system catalog checks).
 */
export async function verifyIntegrity(): Promise<{ ok: boolean; errors: string[] }> {
  const db = getDb();
  if (isPostgresHandle(db)) {
    const errors: string[] = [];
    const ping = await db.get<{ ok: number }>("SELECT 1 AS ok");
    if (Number(ping?.ok) !== 1) {
      errors.push("PostgreSQL connectivity health probe returned unexpected result");
    }

    const invalidIndexes = await db.all<{ index_name: string }>(
      `SELECT c.relname AS index_name
       FROM pg_index i
       JOIN pg_class c ON c.oid = i.indexrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND (NOT i.indisvalid OR NOT i.indisready)
       ORDER BY c.relname ASC`,
    );
    for (const row of invalidIndexes) {
      errors.push(`invalid or unready postgres index: ${row.index_name}`);
    }

    const unvalidatedConstraints = await db.all<{ constraint_name: string }>(
      `SELECT con.conname AS constraint_name
       FROM pg_constraint con
       JOIN pg_namespace n ON n.oid = con.connamespace
       WHERE n.nspname = 'public' AND NOT con.convalidated
       ORDER BY con.conname ASC`,
    );
    for (const row of unvalidatedConstraints) {
      errors.push(`unvalidated postgres constraint: ${row.constraint_name}`);
    }

    return { ok: errors.length === 0, errors };
  }

  const integrityRows = await db.all<{ integrity_check: string }>("PRAGMA integrity_check");
  const fkRows = await db.all<Record<string, unknown>>("PRAGMA foreign_key_check");

  const errors: string[] = [];
  for (const row of integrityRows) {
    if (row.integrity_check !== "ok") {
      errors.push(`integrity_check failed: ${row.integrity_check}`);
    }
  }
  if (fkRows.length > 0) {
    errors.push(`foreign_key_check failed with ${fkRows.length} violations`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export const verifyBackupIntegrity = verifyIntegrity;

/**
 * Create a consistent snapshot of the live database.
 * - SQLite / libSQL: online `VACUUM INTO` snapshot without stopping readers.
 * - PostgreSQL: custom-format `pg_dump --format=custom --no-owner --no-acl`.
 */
export async function backupDatabase(
  destination: string,
  options: BackupCommandOptions = {},
): Promise<void> {
  if (!destination || destination.trim() === "") {
    throw new Error("backup destination must be a non-empty path");
  }

  const db = getOptionalActiveDb();
  const pgUrl = options.connectionString?.trim() || db?.getConnectionString?.()?.trim() || "";
  if (isPostgresHandle(db) || isPostgresUrl(pgUrl)) {
    if (!isPostgresUrl(pgUrl)) {
      throw new Error("PostgreSQL backup requires an active postgres:// connection string");
    }
    const runner = options.runCommand ?? defaultCommandRunner;
    const commandConnection = preparePostgresCommandConnection(pgUrl);
    await runner(
      "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-acl",
        "-f",
        destination,
        commandConnection.connectionString,
      ],
      commandConnection.options,
    );
    return;
  }

  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }

  // VACUUM INTO does not accept bound parameters; escape single quotes.
  const escaped = destination.replace(/'/g, "''");
  await db.exec(`VACUUM INTO '${escaped}'`);
}

/**
 * Restore a database snapshot onto either a SQLite filesystem path or a PostgreSQL target URL.
 */
export async function restoreDatabase(
  backupPath: string,
  targetPathOrUrl: string,
  options: BackupCommandOptions = {},
): Promise<void> {
  if (!backupPath || !targetPathOrUrl) {
    throw new Error("restore requires both a backup path and a target path");
  }

  const pgTarget = options.connectionString?.trim() || targetPathOrUrl.trim();
  if (isPostgresUrl(pgTarget)) {
    const runner = options.runCommand ?? defaultCommandRunner;
    const commandConnection = preparePostgresCommandConnection(pgTarget);
    await runner(
      "pg_restore",
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-acl",
        "-d",
        commandConnection.connectionString,
        backupPath,
      ],
      commandConnection.options,
    );
    return;
  }

  await copyFile(backupPath, targetPathOrUrl);
  await rm(`${targetPathOrUrl}-wal`, { force: true }).catch(() => {});
  await rm(`${targetPathOrUrl}-shm`, { force: true }).catch(() => {});
}

/**
 * Encrypt a backup snapshot file using AES-256-GCM.
 * Output format: [12 bytes IV][16 bytes AuthTag][Ciphertext]
 */
export async function encryptBackupFile(
  inputPlaintextPath: string,
  outputEncryptedPath: string,
  key: Buffer,
): Promise<void> {
  if (key.length !== 32) {
    throw new Error("Encryption key must be exactly 32 bytes for AES-256-GCM");
  }
  const plaintext = await readFile(inputPlaintextPath);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const finalPayload = Buffer.concat([iv, authTag, encrypted]);
  await writeFile(outputEncryptedPath, finalPayload);
}

/**
 * Decrypt an AES-256-GCM encrypted backup file.
 */
export async function decryptBackupFile(
  inputEncryptedPath: string,
  outputPlaintextPath: string,
  key: Buffer,
): Promise<void> {
  if (key.length !== 32) {
    throw new Error("Encryption key must be exactly 32 bytes for AES-256-GCM");
  }
  const encryptedPayload = await readFile(inputEncryptedPath);
  if (encryptedPayload.length < 28) {
    throw new Error("Encrypted payload too short (must be at least 28 bytes for IV + AuthTag)");
  }
  const iv = encryptedPayload.subarray(0, 12);
  const authTag = encryptedPayload.subarray(12, 28);
  const ciphertext = encryptedPayload.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  await writeFile(outputPlaintextPath, decrypted);
}
