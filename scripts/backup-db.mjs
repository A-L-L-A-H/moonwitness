#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { backupDatabaseFile, encryptBackupBytes, safeRemove } from "./backup-sqlite.mjs";

const execFileAsync = promisify(execFile);

/**
 * MoonWitness Dialect-Aware Database Backup CLI Helper.
 * Supports both PostgreSQL (`pg_dump --format=custom`) and SQLite/libSQL (`VACUUM INTO`),
 * encrypting snapshots with AES-256-GCM and writing a JSON integrity manifest.
 */
export function isPostgresTarget(target) {
  return /^postgres(ql)?:\/\//i.test(String(target ?? "").trim());
}

async function defaultCommandRunner(command, args) {
  await execFileAsync(command, args, { maxBuffer: 32 * 1024 * 1024 });
}

export async function backupPostgresUrl({
  connectionString,
  outputDir,
  encryptionKey,
  runCommand = defaultCommandRunner,
}) {
  if (!isPostgresTarget(connectionString)) {
    throw new Error("Valid postgres:// connection URL required for PostgreSQL backup.");
  }
  await mkdir(outputDir, { recursive: true });
  const parsedUrl = new URL(connectionString);
  const dbName = parsedUrl.pathname.replace(/^\/+/, "") || "postgres";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tempDump = join(outputDir, `${dbName}.${timestamp}.tmp.pgdump`);
  const finalEncrypted = join(outputDir, `${dbName}.${timestamp}.pgdump.enc`);

  try {
    await runCommand("pg_dump", [
      "--format=custom",
      "--no-owner",
      "--no-acl",
      "-f",
      tempDump,
      connectionString,
    ]);
    const plaintextBytes = await readFile(tempDump);
    const plaintextHash = createHash("sha256").update(plaintextBytes).digest("hex");
    const payload = encryptBackupBytes(plaintextBytes, encryptionKey);
    await writeFile(finalEncrypted, payload);
    const encryptedHash = createHash("sha256").update(payload).digest("hex");

    const report = {
      dialect: "postgres",
      dbName,
      backupFile: basename(finalEncrypted),
      fullPath: finalEncrypted,
      sizeBytes: plaintextBytes.length,
      plaintextHash,
      encryptedHash,
      createdAt: new Date().toISOString(),
    };
    const manifestPath = join(outputDir, `pg-backup-manifest-${timestamp}.json`);
    await writeFile(manifestPath, JSON.stringify({ version: "1.0", ...report }, null, 2), "utf-8");
    return { report, manifestPath };
  } finally {
    await safeRemove(tempDump);
  }
}

export async function backupTarget({ target, outputDir, encryptionKey, runCommand }) {
  if (isPostgresTarget(target)) {
    return backupPostgresUrl({
      connectionString: target,
      outputDir,
      encryptionKey,
      runCommand,
    });
  }
  const report = await backupDatabaseFile({
    sourceDbPath: target,
    outputDir,
    encryptionKey,
  });
  return { report: { dialect: "sqlite", ...report }, manifestPath: null };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? "")) {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf("--target");
  const outIdx = args.indexOf("--out");
  const keyIdx = args.indexOf("--key");
  const target = targetIdx !== -1 ? args[targetIdx + 1] : process.env.DATABASE_URL;
  const outputDir = outIdx !== -1 ? args[outIdx + 1] : "./backups";
  const key = keyIdx !== -1 ? args[keyIdx + 1] : process.env.MW_BACKUP_ENCRYPTION_KEY;

  if (!target || !key) {
    console.error(
      "Usage: node backup-db.mjs --target <postgres://...|sqlite.db> --out <dir> --key <secret>",
    );
    process.exit(1);
  }

  backupTarget({ target, outputDir, encryptionKey: key })
    .then(({ report, manifestPath }) => {
      console.log(
        `Backup (${report.dialect}) complete: ${report.fullPath}${manifestPath ? ` (manifest: ${manifestPath})` : ""}`,
      );
    })
    .catch((err) => {
      console.error("Backup failed:", err);
      process.exit(1);
    });
}
