import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { AUDIT_REDACTED, defineModel, ormAuditMigrations } from "../define-model.js";
import { closeDb, getDb, initDb } from "../driver.js";
import { applyMigrations } from "../migrations.js";
import { SYSTEM_ACTOR } from "../actor-context.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const secretVault = defineModel({
  name: "mw0832_vault",
  table: "mw0832_vault",
  schema: z.object({
    label: z.string(),
    password_hash: z.string(),
    api_token: z.string(),
    encryption_secret: z.string(),
    encrypted_private: z.string(),
    connection: z.object({
      host: z.string(),
      _secret: z.string(),
      password_hash: z.string(),
    }),
    tags: z.array(z.object({ name: z.string(), _token: z.string() })),
  }),
  fieldPolicies: {
    api_token: { sensitive: true },
    encryption_secret: { sensitive: true },
  },
  indexes: [{ fields: ["label"], unique: true }],
  softDelete: false,
});

let dbPath: string;

beforeEach(async () => {
  dbPath = join(mkdtempSync(join(tmpdir(), "mw0832-")), "orm.db");
  await initDb(dbPath);
  await applyMigrations(ormAuditMigrations);
  // Create the model table
  await getDb().exec(secretVault.ddl);
});

afterEach(async () => {
  closeDb();
  // Small delay to allow SQLite to release file handle on Windows
  await new Promise((r) => setTimeout(r, 50));
  try {
    rmSync(dbPath, { force: true });
  } catch {
    // Ignore cleanup errors on Windows
  }
});

async function latestAuditDiff(entityId: string): Promise<Record<string, unknown>> {
  const row = await getDb().get<{ diff: string }>(
    "SELECT diff FROM _orm_audit_log WHERE entity_id = ? ORDER BY changed_at DESC, id DESC LIMIT 1",
    [entityId],
  );
  expect(row).toBeDefined();
  return JSON.parse(row!.diff) as Record<string, unknown>;
}

describe("MW-0832 audit diff redaction", () => {
  it("redacts sensitive values on CREATE audit for all credential key patterns", async () => {
    const created = await secretVault.repository.create(
      {
        label: "prod-vault",
        password_hash: "PLAINTEXT-HASH-XYZ",
        api_token: "PLAINTEXT-TOKEN-XYZ",
        encryption_secret: "PLAINTEXT-SECRET-XYZ",
        encrypted_private: "PLAINTEXT-PRIVATE-XYZ",
        connection: { host: "db.internal", _secret: "NESTED-SECRET", password_hash: "NESTED-HASH" },
        tags: [{ name: "a", _token: "NESTED-TOKEN" }],
      },
      SYSTEM_ACTOR,
    );

    const diff = await latestAuditDiff(created.id);
    expect(diff.password_hash).toEqual({ before: null, after: AUDIT_REDACTED });
    expect(diff.api_token).toEqual({ before: null, after: AUDIT_REDACTED });
    expect(diff.encryption_secret).toEqual({ before: null, after: AUDIT_REDACTED });
    expect(diff.encrypted_private).toEqual({ before: null, after: AUDIT_REDACTED });
    expect(diff.connection).toEqual({
      before: null,
      after: { host: "db.internal", _secret: AUDIT_REDACTED, password_hash: AUDIT_REDACTED },
    });
    expect(diff.tags).toEqual({
      before: null,
      after: [{ name: "a", _token: AUDIT_REDACTED }],
    });
    // Non-sensitive fields keep their real values.
    expect(diff.label).toEqual({ before: null, after: "prod-vault" });

    const rawRow = await getDb().get<{ diff: string }>(
      "SELECT diff FROM _orm_audit_log WHERE entity_id = ?",
      [created.id],
    );
    expect(rawRow!.diff).not.toContain("PLAINTEXT-");
    expect(rawRow!.diff).not.toContain("NESTED-");
  });

  it("records that a sensitive field changed without exposing old or new value on UPDATE", async () => {
    const created = await secretVault.repository.create(
      {
        label: "rotate-me",
        password_hash: "OLD-HASH",
        api_token: "OLD-TOKEN",
        encryption_secret: "OLD-SECRET",
        encrypted_private: "OLD-PRIVATE",
        connection: { host: "h", _secret: "s", password_hash: "p" },
        tags: [],
      },
      SYSTEM_ACTOR,
    );
    await secretVault.repository.update(
      created.id,
      { password_hash: "NEW-HASH", label: "rotated" },
      SYSTEM_ACTOR,
    );

    const diff = await latestAuditDiff(created.id);
    expect(diff.password_hash).toEqual({ before: AUDIT_REDACTED, after: AUDIT_REDACTED });
    expect(diff.label).toEqual({ before: "rotate-me", after: "rotated" });

    const rawRow = await getDb().get<{ diff: string }>(
      "SELECT diff FROM _orm_audit_log WHERE entity_id = ? AND action = 'UPDATE'",
      [created.id],
    );
    expect(rawRow!.diff).not.toContain("OLD-HASH");
    expect(rawRow!.diff).not.toContain("NEW-HASH");
  });

  it("redacts sensitive values on the upsert conflict-update audit path (MW-0833)", async () => {
    const first = await secretVault.repository.upsert(
      { label: "svc" },
      {
        password_hash: "FIRST-HASH",
        api_token: "FIRST-TOKEN",
        encryption_secret: "FIRST-SECRET",
        encrypted_private: "FIRST-PRIVATE",
        connection: { host: "h", _secret: "s", password_hash: "p" },
        tags: [],
      },
      SYSTEM_ACTOR,
    );
    await secretVault.repository.upsert(
      { label: "svc" },
      {
        password_hash: "SECOND-HASH",
        api_token: "SECOND-TOKEN",
        encryption_secret: "SECOND-SECRET",
        encrypted_private: "SECOND-PRIVATE",
        connection: { host: "h2", _secret: "s2", password_hash: "p2" },
        tags: [],
      },
      SYSTEM_ACTOR,
    );

    const rows = await getDb().all<{ action: string; diff: string }>(
      "SELECT action, diff FROM _orm_audit_log WHERE entity_id = ? ORDER BY changed_at, id",
      [first.id],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]!.action).toBe("CREATE");
    expect(rows[1]!.action).toBe("UPDATE");
    // Truthful before/after: conflict update captured the real pre-update row.
    const updateDiff = JSON.parse(rows[1]!.diff) as Record<
      string,
      { before: unknown; after: unknown }
    >;
    expect(updateDiff.connection).toBeDefined();
    expect((updateDiff.connection as { before: unknown; after: unknown }).before).not.toBeNull();
    expect(updateDiff.password_hash).toEqual({ before: AUDIT_REDACTED, after: AUDIT_REDACTED });
    expect(rows[1]!.diff).not.toContain("FIRST-HASH");
    expect(rows[1]!.diff).not.toContain("SECOND-HASH");
  });
});
