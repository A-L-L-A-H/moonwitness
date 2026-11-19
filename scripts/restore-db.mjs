#!/usr/bin/env node
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import {
  assertPostgresTarget,
  preparePostgresCommandConnection,
  verifyPostgresBackupManifest,
} from "./backup-db.mjs";
import { safeRemove } from "./backup-sqlite.mjs";
import { decryptBackupBytes } from "./restore-sqlite.mjs";

const execFileAsync = promisify(execFile);

async function defaultCommandRunner(command, args, options = {}) {
  await execFileAsync(command, args, {
    maxBuffer: 32 * 1024 * 1024,
    umask: 0o077,
    ...(options.env ? { env: options.env } : {}),
  });
}

/**
 * Restore an encrypted PostgreSQL custom-format archive via `pg_restore`.
 * SQLite/libSQL file targets are rejected by this operational CLI.
 */
export async function restoreTarget({
  encryptedBackupPath,
  manifestPath,
  target,
  decryptionKey,
  expectedPlaintextHash,
  runCommand = defaultCommandRunner,
}) {
  target = assertPostgresTarget(target, "Restore");
  const commandConnection = preparePostgresCommandConnection(target);
  if (!manifestPath) {
    throw new Error("A signed PostgreSQL backup manifest is required for restore.");
  }

  const [payload, manifestText] = await Promise.all([
    readFile(encryptedBackupPath),
    readFile(manifestPath, "utf-8"),
  ]);
  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    throw new Error("Backup manifest is not valid JSON.");
  }
  verifyPostgresBackupManifest({
    manifest,
    payload,
    backupPath: encryptedBackupPath,
    encryptionKey: decryptionKey,
  });

  if (expectedPlaintextHash && expectedPlaintextHash !== manifest.plaintextHash) {
    throw new Error("Requested plaintext hash does not match the signed backup manifest.");
  }
  const { decryptedBytes, plaintextHash } = decryptBackupBytes(
    payload,
    decryptionKey,
    manifest.plaintextHash,
  );
  const tempDump = join(
    dirname(resolve(encryptedBackupPath)),
    `restore-${randomUUID()}.tmp.pgdump`,
  );
  await mkdir(dirname(tempDump), { recursive: true });
  await writeFile(tempDump, decryptedBytes, { mode: 0o600 });

  try {
    await runCommand(
      "pg_restore",
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-acl",
        "-d",
        commandConnection.connectionString,
        tempDump,
      ],
      commandConnection.options,
    );
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
  const manifestIdx = args.indexOf("--manifest");
  const backupFile = backupIdx !== -1 ? args[backupIdx + 1] : null;
  const manifestFile = manifestIdx !== -1 ? args[manifestIdx + 1] : null;
  const target = process.env.ISOLATED_RESTORE_DATABASE_URL;
  const sourceTarget = process.env.DATABASE_URL;
  const key = process.env.MW_BACKUP_ENCRYPTION_KEY;

  if (args.includes("--target") || args.includes("--key")) {
    console.error(
      "Do not pass database URLs or encryption keys as CLI arguments. Set ISOLATED_RESTORE_DATABASE_URL and MW_BACKUP_ENCRYPTION_KEY in the process environment.",
    );
    process.exit(1);
  }

  if (!backupFile || !manifestFile || !target || !key) {
    console.error(
      "Set ISOLATED_RESTORE_DATABASE_URL and MW_BACKUP_ENCRYPTION_KEY, then run: node restore-db.mjs --backup <file.pgdump.enc> --manifest <manifest.json>",
    );
    process.exit(1);
  }

  if (sourceTarget && samePostgresDatabase(target, sourceTarget)) {
    console.error(
      "ISOLATED_RESTORE_DATABASE_URL must identify a different database from DATABASE_URL.",
    );
    process.exit(1);
  }

  restoreTarget({
    encryptedBackupPath: backupFile,
    manifestPath: manifestFile,
    target,
    decryptionKey: key,
  })
    .then((res) => {
      console.log(`PostgreSQL restore complete (sha256=${res.plaintextHash}).`);
    })
    .catch((err) => {
      console.error("Restore failed:", err);
      process.exit(1);
    });
}

export function samePostgresDatabase(left, right) {
  const a = assertPostgresTarget(left, "Restore source");
  const b = assertPostgresTarget(right, "Configured source");
  const leftUrl = new URL(a);
  const rightUrl = new URL(b);
  return (
    leftUrl.hostname.toLowerCase() === rightUrl.hostname.toLowerCase() &&
    leftUrl.port === rightUrl.port &&
    leftUrl.pathname === rightUrl.pathname
  );
}
