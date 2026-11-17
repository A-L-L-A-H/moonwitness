#!/usr/bin/env node
import { createDecipheriv, createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient } from "@libsql/client";

/**
 * MoonWitness Canonical SQLite Restore Utility
 * Decrypts AES-256-GCM encrypted backup files, verifies SHA-256 integrity,
 * verifies SQLite B-Tree and foreign key constraints,
 * and safely replaces the target database.
 */

function deriveKey(keyInput) {
  if (!keyInput) {
    throw new Error("Restore decryption key required. Set MW_BACKUP_ENCRYPTION_KEY or pass --key.");
  }
  return createHash("sha256").update(keyInput).digest();
}

async function safeRemove(filePath, retries = 10, delayMs = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      await rm(filePath, { force: true });
      return;
    } catch (err) {
      if (i === retries - 1) return;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function restoreDatabaseFile({
  encryptedBackupPath,
  targetDbPath,
  decryptionKey,
  expectedPlaintextHash,
}) {
  if (!existsSync(encryptedBackupPath)) {
    throw new Error(`Backup file does not exist: ${encryptedBackupPath}`);
  }

  const payload = await readFile(encryptedBackupPath);
  if (payload.length < 28) {
    throw new Error("Invalid backup payload (too short for IV + AuthTag)");
  }

  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);

  const key = deriveKey(decryptionKey);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decryptedBytes;
  try {
    decryptedBytes = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err) {
    throw new Error(`Decryption failed: bad key or tampered ciphertext: ${err}`);
  }

  // Verify expected plaintext hash if provided
  const computedHash = createHash("sha256").update(decryptedBytes).digest("hex");
  if (expectedPlaintextHash && computedHash !== expectedPlaintextHash) {
    throw new Error(
      `Plaintext hash mismatch: expected ${expectedPlaintextHash}, got ${computedHash}`,
    );
  }

  await mkdir(dirname(resolve(targetDbPath)), { recursive: true });

  // If target already exists, preserve a rollback copy before overwriting
  const backupTargetCopy = `${targetDbPath}.pre-restore.bak`;
  if (existsSync(targetDbPath)) {
    await copyFile(targetDbPath, backupTargetCopy);
  }

  // Clean up any stray WAL sidecars before writing restored database
  await safeRemove(`${targetDbPath}-wal`);
  await safeRemove(`${targetDbPath}-shm`);

  // Write restored bytes directly to target path
  await writeFile(targetDbPath, decryptedBytes);

  // Run SQLite integrity checks on the restored file
  const testClient = createClient({
    url: `file:${resolve(targetDbPath).replace(/\\/g, "/")}`,
  });
  try {
    const integrityRows = await testClient.execute("PRAGMA integrity_check");
    const integrityValue = integrityRows.rows[0]?.integrity_check ?? integrityRows.rows[0]?.[0];
    if (integrityValue !== "ok") {
      // Revert if backup copy exists
      if (existsSync(backupTargetCopy)) {
        await copyFile(backupTargetCopy, targetDbPath);
      }
      throw new Error(`Restored database failed integrity check: ${integrityValue}`);
    }

    const fkRows = await testClient.execute("PRAGMA foreign_key_check");
    if (fkRows.rows.length > 0) {
      if (existsSync(backupTargetCopy)) {
        await copyFile(backupTargetCopy, targetDbPath);
      }
      throw new Error(`Restored database failed foreign key check: ${JSON.stringify(fkRows.rows)}`);
    }
  } finally {
    testClient.close();
  }

  // Remove pre-restore backup upon successful verification
  if (existsSync(backupTargetCopy)) {
    await safeRemove(backupTargetCopy);
  }

  return {
    targetDbPath,
    plaintextHash: computedHash,
    restoredAt: new Date().toISOString(),
  };
}

// CLI entry point
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? "")) {
  const args = process.argv.slice(2);
  const backupIndex = args.indexOf("--backup");
  const targetIndex = args.indexOf("--target");
  const keyIndex = args.indexOf("--key");

  const backupFile = backupIndex !== -1 ? args[backupIndex + 1] : null;
  const targetPath = targetIndex !== -1 ? args[targetIndex + 1] : null;
  const key = keyIndex !== -1 ? args[keyIndex + 1] : process.env.MW_BACKUP_ENCRYPTION_KEY;

  if (!backupFile || !targetPath || !key) {
    console.error(
      "Usage: node restore-sqlite.mjs --backup <file.bak.enc> --target <target.db> --key <encryption-key>",
    );
    process.exit(1);
  }

  restoreDatabaseFile({
    encryptedBackupPath: backupFile,
    targetDbPath,
    decryptionKey: key,
  })
    .then((result) => {
      console.log(`Database successfully restored to ${result.targetDbPath}`);
    })
    .catch((err) => {
      console.error("Restore failed:", err);
      process.exit(1);
    });
}
