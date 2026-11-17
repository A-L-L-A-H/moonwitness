/**
 * Session management service
 * Handles session creation, validation, and revocation
 */

import {
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions as sharedCsrfCookieOptions,
  getSessionCookieOptions as sharedCookieOptions,
  getSessionMaxAgeMs,
  SESSION_COOKIE_NAME,
} from "../shared/auth";
import { getDb, createActorContext } from "@moonwitness/orm";
import { tryRecordAuditLog } from "../infrastructure/audit/audit-log";
import {
  identitySessionModel,
  oauthTokenModel,
  authEventModel,
} from "../infrastructure/persistence/domain/identity";

export interface SessionData {
  id: string;
  userId: number;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

export interface BffOAuthTokenRecord {
  sessionId: string;
  clientId: string;
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface SessionWithUser {
  session: SessionData;
  userId: number;
  username: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  displayName: string;
}

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(Date.now() + getSessionMaxAgeMs());

  await db.run(
    `INSERT INTO sessions (id, user_id, created_at, expires_at, revoked)
     VALUES (?, ?, ?, ?, 0)`,
    [sessionId, userId, now.toISOString(), expiresAt.toISOString()],
  );

  // Record audit log for session creation
  const actor = createActorContext(null, "api");
  await tryRecordAuditLog({
    domain: "identity",
    entity: "session",
    entityId: sessionId,
    action: "CREATE",
    actor: { actorId: actor.actorId, requestId: actor.requestId, role: actor.source },
    correlationId: actor.requestId,
    requestPath: null,
    outcome: "success",
    before: null,
    after: {
      id: sessionId,
      userId,
    },
    metadata: null,
    occurredAt: now.toISOString(),
  });

  // Best-effort dual-write to identity ORM
  try {
    await identitySessionModel.repository.create(
      {
        session_token: sessionId,
        user_ref: String(userId),
        revoked: false,
        expires_at: expiresAt.toISOString(),
        ip_address: null,
        user_agent: null,
      },
      actor,
    );
    await authEventModel.repository.create(
      {
        actor_user_ref: String(userId),
        username: null,
        event_type: "session_created",
        outcome: "success",
        reason: null,
        ip_address: null,
        user_agent: null,
        correlation_id: actor.requestId ?? null,
        occurred_at: now.toISOString(),
      },
      actor,
    );
  } catch {
    // identity mirror is best-effort; do not break auth
  }

  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const db = getDb();
  const row = await db.get(
    `SELECT id, user_id, created_at, expires_at, revoked
     FROM sessions WHERE id = ?`,
    [sessionId],
  );
  if (!row) return null;
  return {
    id: row.id as string,
    userId: row.user_id as number,
    createdAt: new Date(row.created_at as string),
    expiresAt: new Date(row.expires_at as string),
    revoked: Boolean(row.revoked),
  };
}

export async function getSessionWithUser(sessionId: string): Promise<SessionWithUser | null> {
  const session = await getSession(sessionId);
  if (!session || session.revoked || session.expiresAt < new Date()) {
    return null;
  }

  const db = getDb();
  const user = await db.get(
    `SELECT id, username, email, role, display_name
     FROM users WHERE id = ?`,
    [session.userId],
  );
  if (!user) return null;

  return {
    session,
    userId: user.id as number,
    username: user.username as string,
    email: user.email as string,
    role: user.role as "admin" | "editor" | "viewer",
    displayName: user.display_name as string,
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.run(`UPDATE sessions SET revoked = 1 WHERE id = ?`, [sessionId]);
  const actor = createActorContext(null, "api");
  try {
    const rows = await identitySessionModel.repository.find({
      session_token: sessionId,
    });
    for (const row of rows) {
      await identitySessionModel.repository.update(
        row.id,
        { revoked: true },
        actor,
      );
    }
  } catch {
    // best-effort
  }
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  const db = getDb();
  await db.run(`UPDATE sessions SET revoked = 1 WHERE user_id = ?`, [userId]);
  const actor = createActorContext(null, "api");
  try {
    const rows = await identitySessionModel.repository.find({
      user_ref: String(userId),
    });
    for (const row of rows) {
      await identitySessionModel.repository.update(
        row.id,
        { revoked: true },
        actor,
      );
    }
  } catch {
    // best-effort
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDb();
  const nowIso = new Date().toISOString();
  await db.run(
    `DELETE FROM bff_oauth_tokens
     WHERE session_id IN (SELECT id FROM sessions WHERE expires_at < ? OR revoked = 1)`,
    [nowIso],
  );
  const result = await db.run(`DELETE FROM sessions WHERE expires_at < ? OR revoked = 1`, [nowIso]);
  return result.rowsAffected;
}

export async function storeBffOAuthTokens(input: {
  sessionId: string;
  clientId: string;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresInSec: number;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(1, input.expiresInSec) * 1000);
  await db.run(
    `INSERT INTO bff_oauth_tokens
     (session_id, client_id, access_token, refresh_token, id_token, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       client_id = excluded.client_id,
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       id_token = excluded.id_token,
       expires_at = excluded.expires_at`,
    [
      input.sessionId,
      input.clientId,
      input.accessToken,
      input.refreshToken ?? null,
      input.idToken ?? null,
      expiresAt.toISOString(),
      now.toISOString(),
    ],
  );

  // Best-effort dual-write to identity ORM
  const actor = createActorContext(null, "api");
  try {
    const existing = await oauthTokenModel.repository.find({
      session_ref: input.sessionId,
    });
    const payload = {
      session_ref: input.sessionId,
      client_id: input.clientId,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      id_token: input.idToken ?? null,
      expires_at: expiresAt.toISOString(),
    };
    if (existing[0]) {
      await oauthTokenModel.repository.update(existing[0].id, payload, actor);
    } else {
      await oauthTokenModel.repository.create(payload, actor);
    }
  } catch {
    // identity mirror is best-effort
  }
}

export async function getBffOAuthTokens(sessionId: string): Promise<BffOAuthTokenRecord | null> {
  const db = getDb();
  const row = await db.get<Record<string, unknown>>(
    `SELECT session_id, client_id, access_token, refresh_token, id_token, expires_at, created_at
     FROM bff_oauth_tokens WHERE session_id = ?`,
    [sessionId],
  );
  if (!row) return null;
  return {
    sessionId: String(row.session_id),
    clientId: String(row.client_id),
    accessToken: String(row.access_token),
    refreshToken: typeof row.refresh_token === "string" ? row.refresh_token : null,
    idToken: typeof row.id_token === "string" ? row.id_token : null,
    expiresAt: new Date(String(row.expires_at)),
    createdAt: new Date(String(row.created_at)),
  };
}

export async function consumeBffOAuthTokens(
  sessionId: string,
): Promise<BffOAuthTokenRecord | null> {
  const record = await getBffOAuthTokens(sessionId);
  if (record) {
    const db = getDb();
    await db.run(`DELETE FROM bff_oauth_tokens WHERE session_id = ?`, [sessionId]);
  }
  return record;
}

export function getSessionCookieOptions() {
  return sharedCookieOptions(getSessionMaxAgeMs());
}

export function getCsrfCookieOptions() {
  return sharedCsrfCookieOptions(getSessionMaxAgeMs());
}

export { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME };
