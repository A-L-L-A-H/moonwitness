import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertPostgresTarget,
  backupPostgresSet,
  backupPostgresUrl,
  backupTarget,
  isPostgresTarget,
  preparePostgresCommandConnection,
  verifyBackupSetManifest,
  verifyPostgresBackupManifest,
} from "./backup-db.mjs";
import { restoreTarget, samePostgresDatabase } from "./restore-db.mjs";

describe("PostgreSQL-only backup & restore helpers", () => {
  it("rejects SQLite, libSQL, D1 and malformed targets before invoking tools", async () => {
    for (const target of [
      "./moonwitness.db",
      "sqlite:./moonwitness.db",
      "file:./moonwitness.db",
      "libsql://db.example",
      "d1://database",
      "postgresql://[",
      "postgresql://localhost:5432",
    ]) {
      assert.throws(() => assertPostgresTarget(target), /PostgreSQL/);
      await assert.rejects(
        backupTarget({
          target,
          outputDir: tmpdir(),
          encryptionKey: "backup-secret-key",
          runCommand: async () => {
            throw new Error("backup should not run for an invalid target");
          },
        }),
        /PostgreSQL/,
      );
      await assert.rejects(
        restoreTarget({
          encryptedBackupPath: join(tmpdir(), "not-read.enc"),
          target,
          decryptionKey: "backup-secret-key",
          runCommand: async () => {
            throw new Error("restore should not run for an invalid target");
          },
        }),
        /PostgreSQL/,
      );
    }
  });

  it("rejects restoring over the configured source database", () => {
    assert.equal(
      samePostgresDatabase(
        "postgresql://restore:secret@localhost:5432/moonwitness",
        "postgresql://app:other@localhost:5432/moonwitness",
      ),
      true,
    );
    assert.equal(
      samePostgresDatabase(
        "postgresql://restore@localhost:5432/moonwitness_restore",
        "postgresql://app@localhost:5432/moonwitness",
      ),
      false,
    );
  });

  it("accepts valid PostgreSQL targets", () => {
    const validUrl = "postgresql://user:secret@localhost:5432/moonwitness";
    assert.equal(assertPostgresTarget(validUrl), validUrl);
    assert.equal(isPostgresTarget("postgres://localhost:5432/moonwitness"), true);
    assert.equal(isPostgresTarget("./moonwitness.db"), false);
  });

  it("moves database passwords to the subprocess environment", () => {
    const prepared = preparePostgresCommandConnection(
      "postgresql://m:secret%40value@localhost/m?sslmode=require",
    );
    assert.equal(prepared.connectionString.includes("secret"), false);
    assert.equal(prepared.connectionString, "postgresql://m@localhost/m?sslmode=require");
    assert.equal(prepared.options.env.PGPASSWORD, "secret@value");

    const queryPassword = preparePostgresCommandConnection(
      "postgresql://m@localhost/m?password=secret&sslmode=require",
    );
    assert.equal(queryPassword.connectionString.includes("password="), false);
    assert.equal(queryPassword.options.env.PGPASSWORD, "secret");
  });

  it("requires a signed manifest before restore", async () => {
    await assert.rejects(
      restoreTarget({
        encryptedBackupPath: join(tmpdir(), "missing.pgdump.enc"),
        target: "postgresql://mw:secret@localhost:5432/moonwitness",
        decryptionKey: "backup-secret-key",
      }),
      /signed PostgreSQL backup manifest is required/,
    );
  });

  it("encrypts pg_dump snapshots and restores with pg_restore", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mw-pg-cli-"));
    try {
      const pgUrl = "postgresql://mw:secret@localhost:5432/moonwitness";
      expectPostgres(pgUrl, true);
      expectPostgres("./moonwitness.db", false);

      const dumpFixture = Buffer.from("PGDMP-SYNTHETIC-ARCHIVE");
      const calls = [];
      const { report, manifestPath } = await backupPostgresUrl({
        connectionString: pgUrl,
        outputDir: dir,
        encryptionKey: "backup-secret-key",
        runCommand: async (command, args, options) => {
          calls.push({ command, args, options });
          const outPath = args[args.indexOf("-f") + 1];
          writeFileSync(outPath, dumpFixture);
        },
      });

      assert.equal(report.dialect, "postgres");
      assert.equal(report.dbName, "moonwitness");
      assert.equal(calls[0].command, "pg_dump");
      assert.equal(calls[0].args.includes(pgUrl), false);
      assert.equal(calls[0].options.env.PGPASSWORD, "secret");
      if (process.platform !== "win32") {
        assert.equal(statSync(report.fullPath).mode & 0o777, 0o600);
        assert.equal(statSync(manifestPath).mode & 0o777, 0o600);
      }
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      assert.equal(manifest.plaintextHash, report.plaintextHash);
      assert.equal(manifest.fullPath, undefined);
      assert.equal(manifest.signature.algorithm, "hmac-sha256");
      const payload = readFileSync(report.fullPath);
      assert.equal(
        verifyPostgresBackupManifest({
          manifest,
          payload,
          backupPath: report.fullPath,
          encryptionKey: "backup-secret-key",
        }).backupFile,
        manifest.backupFile,
      );

      let restoredBytes = null;
      const restoreRes = await restoreTarget({
        encryptedBackupPath: report.fullPath,
        manifestPath,
        target: pgUrl,
        decryptionKey: "backup-secret-key",
        expectedPlaintextHash: report.plaintextHash,
        runCommand: async (command, args, options) => {
          assert.equal(command, "pg_restore");
          assert.equal(args.includes(pgUrl), false);
          assert.equal(options.env.PGPASSWORD, "secret");
          restoredBytes = readFileSync(args[args.length - 1]);
        },
      });

      assert.equal(restoreRes.dialect, "postgres");
      assert.deepEqual(restoredBytes, dumpFixture);

      const signedManifest = readFileSync(manifestPath, "utf-8");
      const changedManifest = JSON.parse(signedManifest);
      changedManifest.dbName = "tampered";
      writeFileSync(manifestPath, JSON.stringify(changedManifest));
      await assert.rejects(
        restoreTarget({
          encryptedBackupPath: report.fullPath,
          manifestPath,
          target: pgUrl,
          decryptionKey: "backup-secret-key",
          runCommand: async () => {
            throw new Error("pg_restore must not run for a tampered manifest");
          },
        }),
        /HMAC signature is invalid/,
      );
      writeFileSync(manifestPath, signedManifest);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("verifies multi-database backup-set completeness, disabled reporting, freshness, and trust-zone isolation", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mw-pg-set-"));
    try {
      await assert.rejects(
        backupPostgresSet({
          targets: [
            {
              name: "rocksoul",
              enabled: true,
              trustZone: "rocksoul",
              connectionString: "postgresql://r@localhost/r",
            },
          ],
          outputDir: dir,
          encryptionKey: "backup-secret-key",
        }),
        /Trust-zone boundary violation/,
      );

      const { setManifest, setManifestPath } = await backupPostgresSet({
        targets: [
          {
            name: "core",
            enabled: true,
            connectionString: "postgresql://mw:s@localhost:5432/moonwitness",
          },
          { name: "radius", enabled: false },
        ],
        outputDir: dir,
        encryptionKey: "backup-secret-key",
        runCommand: async (_cmd, args) => {
          writeFileSync(args[args.indexOf("-f") + 1], Buffer.from("PGDMP-SET"));
        },
      });
      const cliOut = execFileSync(
        process.execPath,
        ["scripts/backup-db.mjs", "--verify-set", setManifestPath, "--max-age-hours", "24"],
        {
          env: { ...process.env, MW_BACKUP_ENCRYPTION_KEY: "backup-secret-key" },
          encoding: "utf-8",
        },
      );
      assert.match(cliOut, /Backup set verified: 2 entries/);
      assert.equal(setManifest.entries.find((e) => e.name === "radius")?.status, "disabled");
      assert.equal(
        verifyBackupSetManifest({
          setManifest,
          encryptionKey: "backup-secret-key",
          maxAgeHours: 24,
        }).complete,
        true,
      );
      assert.throws(
        () =>
          verifyBackupSetManifest({
            setManifest,
            encryptionKey: "backup-secret-key",
            maxAgeHours: 1,
            nowMs: Date.parse(setManifest.createdAt) + 2 * 3_600_000,
          }),
        /stale/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

function expectPostgres(target, expected) {
  assert.equal(isPostgresTarget(target), expected);
}
