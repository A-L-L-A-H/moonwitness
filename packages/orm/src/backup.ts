import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { getDb } from "./driver.js";

/**
 * Verify SQLite database integrity and foreign key constraints on the active database handle.
 */
export async function verifyIntegrity(): Promise<{ ok: boolean; errors: string[] }> {
  const db = getDb();
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

/**
 * Create a consistent snapshot of the live database using SQLite's
 * `VACUUM INTO`, which writes a compacted, transactionally-consistent copy
 * without stopping readers. WAL sidecars are not needed for the backup file.
 *
 * `destination` is a filesystem path (not a `file:` URL).
 */
export async function backupDatabase(destination: string): Promise<void> {
  if (!destination || destination.trim() === "") {
    throw new Error("backup destination must be a non-empty path");
  }
  // VACUUM INTO does not accept bound parameters; escape single quotes.
  const escaped = destination.replace(/'/g, "''");
  await getDb().exec(`VACUUM INTO '${escaped}'`);
}

/**
 * Restore a database by copying a backup file over a target path. The target
 * database must be closed before restoring.
 */
export async function restoreDatabase(backupPath: string, targetPath: string): Promise<void> {
  if (!backupPath || !targetPath) {
    throw new Error("restore requires both a backup path and a target path");
  }
  const { copyFile } = await import("node:fs/promises");
  await copyFile(backupPath, targetPath);
}

/**
 * Encrypt a SQLite backup file using AES-256-GCM.
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
 * Decrypt an AES-256-GCM encrypted SQLite backup file.
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
