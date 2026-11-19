#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { deriveBackupKey, encryptBackupBytes, safeRemove } from "./backup-sqlite.mjs";

const execFileAsync = promisify(execFile);

/**
 * PostgreSQL-only backup CLI helper.
 * Creates a custom-format pg_dump, encrypts it with AES-256-GCM, and writes an
 * HMAC-signed SHA-256 manifest.
 */
export function isPostgresTarget(target) {
  return /^postgres(ql)?:\/\//i.test(String(target ?? "").trim());
}

export function assertPostgresTarget(target, operation = "Database backup") {
  const candidate = String(target ?? "").trim();
  if (!isPostgresTarget(candidate)) {
    throw new Error(`${operation} requires a PostgreSQL URL (postgres:// or postgresql://).`);
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`${operation} requires a valid PostgreSQL connection URL.`);
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
    throw new Error(`${operation} requires a PostgreSQL URL with a host and database name.`);
  }
  if (parsed.hash) {
    throw new Error(`${operation} connection URL must not contain a fragment.`);
  }
  return candidate;
}

function manifestSigningKey(encryptionKey) {
  return createHmac("sha256", deriveBackupKey(encryptionKey))
    .update("moonwitness:postgres-backup-manifest:hmac-sha256:v1")
    .digest();
}

async function defaultCommandRunner(command, args, options = {}) {
  await execFileAsync(command, args, {
    maxBuffer: 32 * 1024 * 1024,
    umask: 0o077,
    ...(options.env ? { env: options.env } : {}),
  });
}

export function preparePostgresCommandConnection(connectionString) {
  const url = new URL(connectionString);
  let password = url.password ? decodeURIComponent(url.password) : "";
  url.password = "";
  if (url.searchParams.has("password")) {
    if (!password) password = url.searchParams.get("password") ?? "";
    url.searchParams.delete("password");
  }
  return {
    connectionString: url.toString(),
    options: password ? { env: { ...process.env, PGPASSWORD: password } } : undefined,
  };
}

export async function backupPostgresUrl({
  connectionString,
  outputDir,
  encryptionKey,
  runCommand = defaultCommandRunner,
}) {
  connectionString = assertPostgresTarget(connectionString, "PostgreSQL backup");
  const commandConnection = preparePostgresCommandConnection(connectionString);
  await mkdir(outputDir, { recursive: true });
  const parsedUrl = new URL(connectionString);
  const dbName = parsedUrl.pathname.replace(/^\/+/, "") || "postgres";
  const fileStem = dbName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "") || "postgres";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `${timestamp}-${randomUUID()}`;
  const tempDump = join(outputDir, `${fileStem}.${backupId}.tmp.pgdump`);
  const finalEncrypted = join(outputDir, `${fileStem}.${backupId}.pgdump.enc`);

  try {
    await runCommand(
      "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-acl",
        "-f",
        tempDump,
        commandConnection.connectionString,
      ],
      commandConnection.options,
    );
    const plaintextBytes = await readFile(tempDump);
    const plaintextHash = createHash("sha256").update(plaintextBytes).digest("hex");
    const payload = encryptBackupBytes(plaintextBytes, encryptionKey);
    await writeFile(finalEncrypted, payload, { mode: 0o600 });
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
    const { fullPath: _localPath, ...portableReport } = report;
    const manifestBody = {
      version: "1.0",
      algorithm: "aes-256-gcm",
      ...portableReport,
    };
    const signature = createHmac("sha256", manifestSigningKey(encryptionKey))
      .update(JSON.stringify(manifestBody))
      .digest("hex");
    const manifest = {
      ...manifestBody,
      signature: { algorithm: "hmac-sha256", value: signature },
    };
    const manifestPath = join(outputDir, `pg-backup-manifest-${backupId}.json`);
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
    return { report, manifestPath };
  } finally {
    await safeRemove(tempDump);
  }
}

/**
 * Verify that a PostgreSQL backup manifest belongs to the encrypted archive
 * and was signed with the same secret used for AES-256-GCM encryption.
 */
export function verifyPostgresBackupManifest({ manifest, payload, backupPath, encryptionKey }) {
  if (
    !manifest ||
    manifest.version !== "1.0" ||
    manifest.algorithm !== "aes-256-gcm" ||
    !manifest.signature ||
    manifest.signature.algorithm !== "hmac-sha256"
  ) {
    throw new Error("Unsupported or unsigned PostgreSQL backup manifest.");
  }

  if (manifest.backupFile !== basename(backupPath)) {
    throw new Error("Backup manifest does not identify the supplied archive.");
  }

  const encryptedHash = createHash("sha256").update(payload).digest("hex");
  if (encryptedHash !== manifest.encryptedHash) {
    throw new Error("Encrypted archive hash does not match the backup manifest.");
  }

  if (
    typeof manifest.plaintextHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(manifest.plaintextHash)
  ) {
    throw new Error("Backup manifest contains an invalid plaintext hash.");
  }

  const { signature, ...manifestBody } = manifest;
  const expected = createHmac("sha256", manifestSigningKey(encryptionKey))
    .update(JSON.stringify(manifestBody))
    .digest();
  const actual = Buffer.from(String(signature.value ?? ""), "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Backup manifest HMAC signature is invalid.");
  }

  return manifest;
}

export async function backupTarget({ target, outputDir, encryptionKey, runCommand }) {
  return backupPostgresUrl({
    connectionString: assertPostgresTarget(target, "Backup"),
    outputDir,
    encryptionKey,
    runCommand,
  });
}

const PRIVATE_LOCAL_ZONES = new Set(["rocksoul", "memory"]);

export function assertBackupTrustZone(trustZone, targetName) {
  const zone = String(trustZone ?? "production-vps")
    .trim()
    .toLowerCase();
  if (PRIVATE_LOCAL_ZONES.has(zone)) {
    throw new Error(
      `Trust-zone boundary violation: '${targetName}' (${zone}) must not be mixed into the public production backup set.`,
    );
  }
}

/**
 * Backs up a declared set of PostgreSQL databases, explicitly recording
 * disabled optional services and refusing partial completion when any enabled
 * target fails.
 */
export async function backupPostgresSet({
  targets,
  outputDir,
  encryptionKey,
  runCommand = defaultCommandRunner,
}) {
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error("Backup set requires at least one declared database target.");
  }

  const entries = [];
  for (const target of targets) {
    assertBackupTrustZone(target.trustZone, target.name);
    if (!target.enabled) {
      entries.push({ name: target.name, enabled: false, status: "disabled" });
      continue;
    }
    const { report, manifestPath } = await backupPostgresUrl({
      connectionString: assertPostgresTarget(target.connectionString, `Backup (${target.name})`),
      outputDir,
      encryptionKey,
      runCommand,
    });
    entries.push({
      name: target.name,
      enabled: true,
      status: "backed_up",
      dbName: report.dbName,
      backupFile: report.backupFile,
      plaintextHash: report.plaintextHash,
      encryptedHash: report.encryptedHash,
      createdAt: report.createdAt,
      manifestFile: basename(manifestPath),
    });
  }

  const setBody = {
    version: "1.0",
    trustZone: "production-vps",
    complete: true,
    createdAt: new Date().toISOString(),
    entries,
  };
  const signature = createHmac("sha256", manifestSigningKey(encryptionKey))
    .update(JSON.stringify(setBody))
    .digest("hex");
  const setManifest = { ...setBody, signature: { algorithm: "hmac-sha256", value: signature } };
  const setManifestPath = join(
    outputDir,
    `pg-backup-set-${setBody.createdAt.replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(setManifestPath, JSON.stringify(setManifest, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  return { setManifest, setManifestPath };
}

export function verifyBackupSetManifest({
  setManifest,
  encryptionKey,
  maxAgeHours = 24,
  nowMs = Date.now(),
}) {
  if (!setManifest || setManifest.version !== "1.0" || !setManifest.signature?.value) {
    throw new Error("Unsupported or unsigned PostgreSQL backup-set manifest.");
  }
  const { signature, ...setBody } = setManifest;
  const expected = createHmac("sha256", manifestSigningKey(encryptionKey))
    .update(JSON.stringify(setBody))
    .digest();
  const actual = Buffer.from(String(signature.value), "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Backup-set manifest HMAC signature is invalid.");
  }
  if (!setManifest.complete) {
    throw new Error("Backup-set manifest is incomplete.");
  }
  const createdMs = Date.parse(setManifest.createdAt);
  if (!Number.isFinite(createdMs) || nowMs - createdMs > maxAgeHours * 3_600_000) {
    throw new Error(`Backup-set manifest is stale (exceeds ${maxAgeHours}h freshness window).`);
  }
  return setManifest;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? "")) {
  const args = process.argv.slice(2);
  const key = process.env.MW_BACKUP_ENCRYPTION_KEY;

  if (args.includes("--target") || args.includes("--key")) {
    console.error("Use DATABASE_URL and MW_BACKUP_ENCRYPTION_KEY environment variables.");
    process.exit(1);
  }

  const verifySetIdx = args.indexOf("--verify-set");
  if (verifySetIdx !== -1) {
    const manifestPath = args[verifySetIdx + 1];
    const maxAgeIdx = args.indexOf("--max-age-hours");
    const maxAgeHours = maxAgeIdx !== -1 ? Number(args[maxAgeIdx + 1]) : 24;
    if (!manifestPath || !key || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
      console.error(
        "Set MW_BACKUP_ENCRYPTION_KEY and run backup-db.mjs --verify-set PATH [--max-age-hours N].",
      );
      process.exit(1);
    }
    readFile(manifestPath, "utf-8")
      .then((raw) => {
        const setManifest = JSON.parse(raw);
        const verified = verifyBackupSetManifest({ setManifest, encryptionKey: key, maxAgeHours });
        console.log("Backup set verified:", verified.entries.length, "entries");
      })
      .catch((err) => {
        console.error("Backup set verification failed:", err.message);
        process.exit(1);
      });
  } else {
    const outIdx = args.indexOf("--out");
    const outputDir = outIdx !== -1 ? args[outIdx + 1] : "./backups";
    const target = process.env.DATABASE_URL;

    if (!target || !key) {
      console.error("Set both environment variables; run backup-db.mjs --out DIR.");
      process.exit(1);
    }

    backupTarget({ target, outputDir, encryptionKey: key })
      .then(({ report, manifestPath }) => {
        console.log("Backup complete:", report.fullPath);
        if (manifestPath) console.log("Manifest:", manifestPath);
      })
      .catch((err) => {
        console.error("Backup failed:", err);
        process.exit(1);
      });
  }
}
