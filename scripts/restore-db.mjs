#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { isPostgresTarget } from "./backup-db.mjs";
import { safeRemove } from "./backup-sqlite.mjs";
import { decryptBackupBytes, restoreDatabaseFile } from "./restore-sqlite.mjs";

const execFileAsync = promisify(execFile);

async function defaultCommandRunner(command, args) {
  await execFileAsync(command, args, { maxBuffer: 32 * 1024 * 1024 });
}

/**
 * Restore either an encrypted PostgreSQL `.pgdump.enc` archive via `pg_restore`
 * or an encrypted SQLite `.bak.enc` snapshot onto the target path.
 */
export async function restoreTarget({
  encryptedBackupPath,
  target,
  decryptionKey,
  expectedPlaintextHash,
  runCommand = defaultCommandRunner,
}) {
  if (!isPostgresTarget(target)) {
    return restoreDatabaseFile({
      encryptedBackupPath,
      targetDbPath: target,
      decryptionKey,
      expectedPlaintextHash,
    });
  }

  const payload = await readFile(encryptedBackupPath);
  const { decryptedBytes, plaintextHash } = decryptBackupBytes(
    payload,
    decryptionKey,
    expectedPlaintextHash,
  );
  const tempDump = join(dirname(resolve(encryptedBackupPath)), `restore-${Date.now()}.tmp.pgdump`);
  await mkdir(dirname(tempDump), { recursive: true });
  await writeFile(tempDump, decryptedBytes);

  try {
    await runCommand("pg_restore", [
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-acl",
      "-d",
      target,
      tempDump,
    ]);
    return {
      dialect: "postgres",
      plaintextHash,
      restoredAt: new Date().toISOString(),
    };
  } finally {
    await safeRemove(tempDump);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? "")) {
  const args = process.argv.slice(2);
  const backupIdx = args.indexOf("--backup");
  const targetIdx = args.indexOf("--target");
  const keyIdx = args.indexOf("--key");
  const backupFile = backupIdx !== -1 ? args[backupIdx + 1] : null;
  const target = targetIdx !== -1 ? args[targetIdx + 1] : process.env.DATABASE_URL;
  const key = keyIdx !== -1 ? args[keyIdx + 1] : process.env.MW_BACKUP_ENCRYPTION_KEY;

  if (!backupFile || !target || !key) {
    console.error(
      "Usage: node restore-db.mjs --backup <file.enc> --target <postgres://...|sqlite.db> --key <secret>",
    );
    process.exit(1);
  }

  restoreTarget({ encryptedBackupPath: backupFile, target, decryptionKey: key })
    .then((res) => {
      console.log(`Restore complete (${res.dialect ?? "sqlite"}, sha256=${res.plaintextHash}).`);
    })
    .catch((err) => {
      console.error("Restore failed:", err);
      process.exit(1);
    });
}
