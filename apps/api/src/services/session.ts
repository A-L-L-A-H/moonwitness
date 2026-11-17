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
import { getDb } from "@moonwitness/orm";

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
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  const db = getDb();
  await db.run(`UPDATE sessions SET revoked = 1 WHERE user_id = ?`, [userId]);
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
