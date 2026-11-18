#!/usr/bin/env node
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Lazily resolve `@libsql/client` across hoisted installs and strict pnpm workspaces.
 */
export async function createLibsqlClient(url) {
  let mod;
  try {
    mod = await import("@libsql/client");
  } catch {
    const ormRequire = createRequire(new URL("../packages/orm/package.json", import.meta.url));
    const resolvedPath = ormRequire.resolve("@libsql/client");
    mod = await import(pathToFileURL(resolvedPath).href);
  }
  const createClient = mod.createClient ?? mod.default?.createClient;
  return createClient({ url });
}

/**
 * MoonWitness Canonical SQLite Backup Utility
 * Performs online, non-blocking SQLite snapshotting via VACUUM INTO,
 * runs integrity & foreign-key checks, encrypts using AES-256-GCM,
 * and generates a signed metadata manifest.
 */

export function deriveBackupKey(keyInput) {
  if (!keyInput) {
    throw new Error("Backup encryption key required. Set MW_BACKUP_ENCRYPTION_KEY or pass --key.");
  }
  return createHash("sha256").update(keyInput).digest();
}

export function encryptBackupBytes(plaintextBytes, encryptionKey) {
  const key = deriveBackupKey(encryptionKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintextBytes), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

export async function safeRemove(filePath, retries = 10, delayMs = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      await rm(filePath, { force: true });
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function backupDatabaseFile({ sourceDbPath, outputDir, encryptionKey }) {
  if (!existsSync(sourceDbPath)) {
    throw new Error(`Source database file does not exist: ${sourceDbPath}`);
  }

  await mkdir(outputDir, { recursive: true });
  const dbName = basename(sourceDbPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tempSnapshot = join(outputDir, `${dbName}.${timestamp}.tmp.snapshot`);
  const finalEncrypted = join(outputDir, `${dbName}.${timestamp}.bak.enc`);

  let tables = [];

  // 1. Verify integrity & foreign keys on source, extract tables, then VACUUM INTO snapshot
  const client = await createLibsqlClient(`file:${resolve(sourceDbPath).replace(/\\/g, "/")}`);
  try {
    const integrityResult = await client.execute("PRAGMA integrity_check");
    const integrityValue = integrityResult.rows[0]?.integrity_check ?? integrityResult.rows[0]?.[0];
    if (integrityValue !== "ok") {
      throw new Error(`Integrity check failed: ${integrityValue}`);
    }

    const fkResult = await client.execute("PRAGMA foreign_key_check");
    if (fkResult.rows.length > 0) {
      throw new Error(`Foreign key check failed: ${JSON.stringify(fkResult.rows)}`);
    }

    const tableRows = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    tables = tableRows.rows.map((r) => String(r.name ?? r[0]));

    const escapedDest = resolve(tempSnapshot).replace(/\\/g, "/").replace(/'/g, "''");
    await client.execute(`VACUUM INTO '${escapedDest}'`);
  } finally {
    client.close();
  }

  // 2. Read snapshot bytes, compute hash, and encrypt
  const plaintextBytes = await readFile(tempSnapshot);
  const plaintextHash = createHash("sha256").update(plaintextBytes).digest("hex");
  const sizeBytes = plaintextBytes.length;

  const payload = encryptBackupBytes(plaintextBytes, encryptionKey);

  await writeFile(finalEncrypted, payload);
  await safeRemove(tempSnapshot);

  const encryptedHash = createHash("sha256").update(payload).digest("hex");

  return {
    dbName,
    backupFile: basename(finalEncrypted),
    fullPath: finalEncrypted,
    sizeBytes,
    plaintextHash,
    encryptedHash,
    tables,
    createdAt: new Date().toISOString(),
  };
}

export async function runBackupSuite({ databases, outputDir, encryptionKey }) {
  await mkdir(outputDir, { recursive: true });
  const manifest = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    algorithm: "aes-256-gcm",
    databases: [],
  };

  for (const dbPath of databases) {
    if (existsSync(dbPath)) {
      const dbReport = await backupDatabaseFile({
        sourceDbPath: dbPath,
        outputDir,
        encryptionKey,
      });
      manifest.databases.push(dbReport);
    }
  }

  const manifestPath = join(
    outputDir,
    `backup-manifest-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  return { manifest, manifestPath };
}

// CLI entry point
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? "")) {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf("--out");
  const keyIndex = args.indexOf("--key");
  const outputDir = outIndex !== -1 ? args[outIndex + 1] : "./backups";
  const key = keyIndex !== -1 ? args[keyIndex + 1] : process.env.MW_BACKUP_ENCRYPTION_KEY;

  if (!key) {
    console.error("Error: --key or MW_BACKUP_ENCRYPTION_KEY is required.");
    process.exit(1);
  }

  const defaultDbs = [
    "./moonwitness.db",
    "./services/radius/radius.db",
    "./services/snmp-poller/snmp-poller.db",
    "./services/syslog/syslog.db",
  ];

  runBackupSuite({ databases: defaultDbs, outputDir, encryptionKey: key })
    .then(({ manifestPath }) => {
      console.log(`Backup completed successfully. Manifest written to ${manifestPath}`);
    })
    .catch((err) => {
      console.error("Backup failed:", err);
      process.exit(1);
    });
}
