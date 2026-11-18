import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, getDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon, listAuditLogs } from "@moonwitness/addon-audit";
import { authAddon, createAuthMidIdentityStore, createUser, getSessionWithUser } from "./index.js";

describe("@moonwitness/addon-auth", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-auth-"));
    dirs.push(dir);
    await initDb(join(dir, "auth.db"));
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  afterAll(() => {
    for (const dir of dirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on cleanup.
      }
    }
  });

  it("imports legacy numeric users & sessions idempotently and powers MID identity store", async () => {
    const db = getDb();
    await db.run(
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        display_name TEXT NOT NULL
      )`,
    );
    await db.run(
      `CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0
      )`,
    );
    await db.run(
      `INSERT INTO users (id, username, email, password_hash, role, display_name)
       VALUES (7, 'legacy_admin', 'legacy@moonwitness.biz.id', 'hash-x', 'admin', 'Legacy Admin')`,
    );
    await db.run(
      `INSERT INTO sessions (id, user_id, expires_at, revoked)
       VALUES ('legacy-sess-7', 7, ?, 0)`,
      [new Date(Date.now() + 60_000).toISOString()],
    );

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
    ]);

    const store = createAuthMidIdentityStore();
    const migrated = await store.findUserByLogin("legacy_admin");
    expect(migrated?.id).toBeTypeOf("string");
    expect(migrated?.email).toBe("legacy@moonwitness.biz.id");

    const session = await getSessionWithUser("legacy-sess-7");
    expect(session?.userId).toBe(migrated?.id);

    const byLegacyId = await store.findPublicUserById(7);
    expect(byLegacyId?.id).toBe(migrated?.id);

    await store.recordAuditEvent({
      eventType: "oauth.token.issued",
      actorUserId: migrated!.id,
      clientId: "moonwitness-web",
      detail: { scope: "openid" },
      ipAddress: "127.0.0.1",
    });
    const logs = await listAuditLogs({ domain: "mid" });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.actorId).toBe(migrated?.id);

    const freshUser = await createUser({
      username: "uuid_pilot",
      email: "uuid@moonwitness.biz.id",
      password: "SuperLongPassword123!",
      role: "editor",
      displayName: "UUID Pilot",
    });
    expect(freshUser.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
