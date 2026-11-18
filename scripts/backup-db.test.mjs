import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backupPostgresUrl, isPostgresTarget } from "./backup-db.mjs";
import { restoreTarget } from "./restore-db.mjs";

describe("dialect-aware backup & restore helpers", () => {
  it("encrypts pg_dump snapshots and restores decrypted payloads into pg_restore", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mw-pg-cli-"));
    try {
      const pgUrl = "postgresql://moonwitness:secret@localhost:5432/moonwitness";
      expectPostgres(pgUrl, true);
      expectPostgres("./moonwitness.db", false);

      const dumpFixture = Buffer.from("PGDMP-SYNTHETIC-ARCHIVE");
      const calls = [];
      const { report, manifestPath } = await backupPostgresUrl({
        connectionString: pgUrl,
        outputDir: dir,
        encryptionKey: "backup-secret-key",
        runCommand: async (command, args) => {
          calls.push({ command, args });
          const outPath = args[args.indexOf("-f") + 1];
          writeFileSync(outPath, dumpFixture);
        },
      });

      assert.equal(report.dialect, "postgres");
      assert.equal(report.dbName, "moonwitness");
      assert.equal(calls[0].command, "pg_dump");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      assert.equal(manifest.plaintextHash, report.plaintextHash);

      let restoredBytes = null;
      const restoreRes = await restoreTarget({
        encryptedBackupPath: report.fullPath,
        target: pgUrl,
        decryptionKey: "backup-secret-key",
        expectedPlaintextHash: report.plaintextHash,
        runCommand: async (command, args) => {
          assert.equal(command, "pg_restore");
          restoredBytes = readFileSync(args[args.length - 1]);
        },
      });

      assert.equal(restoreRes.dialect, "postgres");
      assert.deepEqual(restoredBytes, dumpFixture);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

function expectPostgres(target, expected) {
  assert.equal(isPostgresTarget(target), expected);
}
