import { createActorContext, getDb, syncModels, SYSTEM_ACTOR } from "@moonwitness/orm";
import { auditLogModel, tryRecordAuditLog } from "@moonwitness/addon-audit";
import { authOAuthTokenModel, authSessionModel, authUserModel } from "./models.js";
import { hashAuthPassword, verifyAuthPassword } from "./passwords.js";

export type AuthRole = "admin" | "editor" | "viewer";

export interface AuthUser {
  id: string;
  legacyUserId: number | null;
  username: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuthUserInput {
  username: string;
  email: string;
  password: string;
  role: AuthRole;
  displayName: string;
}

export interface AuthUserPublic {
  id: string;
  username: string;
  email: string;
  role: AuthRole;
  displayName: string;
}

export type AuthUserMutationResult =
  | { ok: true; user: AuthUserPublic }
  | {
      ok: false;
      code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID_ROLE";
      error: string;
    };

export interface AuthSessionData {
  id: string;
  userId: string;
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

export interface AuthSessionWithUser {
  session: AuthSessionData;
  userId: string;
  username: string;
  email: string;
  role: AuthRole;
  displayName: string;
}

export const SESSION_COOKIE_NAME = "mw_session";
export const CSRF_COOKIE_NAME = "mw_csrf";

export function getSessionMaxAgeMs(): number {
  const days = Number(process.env.SESSION_MAX_AGE_DAYS ?? "7");
  return days * 24 * 60 * 60 * 1000;
}

export function getSessionCookieOptions(): Record<string, unknown> {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: Math.floor(getSessionMaxAgeMs() / 1000),
    path: "/",
  };
}

export function getCsrfCookieOptions(): Record<string, unknown> {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: Math.floor(getSessionMaxAgeMs() / 1000),
    path: "/",
  };
}

function mapUserRecord(row: {
  id: string;
  legacy_user_id: number | null;
  username: string;
  email: string;
  password_hash: string;
  role: AuthRole;
  display_name: string;
  is_active: boolean;
  create_date: Date;
  write_date: Date;
}): AuthUser {
  return {
    id: row.id,
    legacyUserId: row.legacy_user_id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    displayName: row.display_name,
    isActive: row.is_active,
    createdAt: row.create_date,
    updatedAt: row.write_date,
  };
}

export function toPublicAuthUser(user: AuthUser): AuthUserPublic {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  };
}

async function tableExists(tableName: string): Promise<boolean> {
  const db = getDb();
  try {
    const row = await db.get<{ name?: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      [tableName],
    );
    return Boolean(row?.name);
  } catch {
    try {
      const pgRow = await db.get<{ table_name?: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?",
        [tableName],
      );
      return Boolean(pgRow?.table_name);
    } catch {
      return false;
    }
  }
}

/**
 * One-time idempotent migration from legacy integer `users`/`sessions`/`bff_oauth_tokens`
 * tables into UUIDv7 `auth_users`/`auth_sessions`/`auth_oauth_tokens`.
 */
export async function importLegacyUsersAndSessions(): Promise<{
  importedUsers: number;
  importedSessions: number;
  importedTokens: number;
}> {
  let importedUsers = 0;
  let importedSessions = 0;
  let importedTokens = 0;
  const legacyToUuid = new Map<number, string>();

  if (await tableExists("users")) {
    const rows = await getDb().all<Record<string, unknown>>(
      "SELECT id, username, email, password_hash, role, display_name FROM users",
    );
    for (const row of rows) {
      const legacyId = Number(row.id);
      const username = String(row.username);
      const existing =
        (await authUserModel.repository.find({ legacy_user_id: legacyId }))[0] ??
        (await authUserModel.repository.find({ username }))[0];
      if (existing) {
        legacyToUuid.set(legacyId, existing.id);
        continue;
      }
      const created = await authUserModel.repository.create(
        {
          legacy_user_id: legacyId,
          username,
          email: String(row.email),
          password_hash: String(row.password_hash),
          role: String(row.role) as AuthRole,
          display_name: String(row.display_name),
          is_active: true,
          last_login_at: null,
        },
        SYSTEM_ACTOR,
      );
      legacyToUuid.set(legacyId, created.id);
      importedUsers += 1;
    }
  }

  if (await tableExists("sessions")) {
    const rows = await getDb().all<Record<string, unknown>>(
      "SELECT id, user_id, expires_at, revoked FROM sessions",
    );
    for (const row of rows) {
      const sessionToken = String(row.id);
      const existing = (await authSessionModel.repository.find({ session_token: sessionToken }))[0];
      if (existing) continue;
      const legacyUserId = Number(row.user_id);
      const mappedUuid = legacyToUuid.get(legacyUserId) ?? String(row.user_id);
      await authSessionModel.repository.create(
        {
          session_token: sessionToken,
          user_id: mappedUuid,
          revoked: Boolean(row.revoked),
          expires_at: String(row.expires_at),
          ip_address: null,
          user_agent: null,
        },
        SYSTEM_ACTOR,
      );
      importedSessions += 1;
    }
  }

  if (await tableExists("bff_oauth_tokens")) {
    const rows = await getDb().all<Record<string, unknown>>(
      "SELECT session_id, client_id, access_token, refresh_token, id_token, expires_at FROM bff_oauth_tokens",
    );
    for (const row of rows) {
      const tokenKey = String(row.session_id);
      const existing = (await authOAuthTokenModel.repository.find({ session_token: tokenKey }))[0];
      if (existing) continue;
      await authOAuthTokenModel.repository.create(
        {
          session_token: tokenKey,
          client_id: String(row.client_id),
          access_token: String(row.access_token),
          refresh_token: typeof row.refresh_token === "string" ? row.refresh_token : null,
          id_token: typeof row.id_token === "string" ? row.id_token : null,
          expires_at: String(row.expires_at),
        },
        SYSTEM_ACTOR,
      );
      importedTokens += 1;
    }
  }

  return { importedUsers, importedSessions, importedTokens };
}

export async function ensureAuthSchema(): Promise<void> {
  await syncModels([auditLogModel, authUserModel, authSessionModel, authOAuthTokenModel]);
  await importLegacyUsersAndSessions();
}

export async function createUser(input: CreateAuthUserInput): Promise<AuthUserPublic> {
  if (!["admin", "editor", "viewer"].includes(input.role)) {
    throw new Error("Invalid role: " + input.role);
  }
  const passwordBytes = Buffer.byteLength(input.password, "utf8");
  if (passwordBytes < 12 || passwordBytes > 72) {
    throw new Error("Password must be between 12 and 72 UTF-8 bytes");
  }
  const passwordHash = await hashAuthPassword(input.password);
  const actor = createActorContext(null, "api");
  const created = await authUserModel.repository.create(
    {
      legacy_user_id: null,
      username: input.username,
      email: input.email,
      password_hash: passwordHash,
      role: input.role,
      display_name: input.displayName,
      is_active: true,
      last_login_at: null,
    },
    actor,
  );
  await tryRecordAuditLog({
    domain: "identity",
    entity: "user",
    entityId: created.id,
    action: "CREATE",
    actor,
    outcome: "success",
    after: {
      id: created.id,
      username: created.username,
      email: created.email,
      role: created.role,
      displayName: created.display_name,
    },
    occurredAt: new Date().toISOString(),
  });
  return {
    id: created.id,
    username: created.username,
    email: created.email,
    role: created.role,
    displayName: created.display_name,
  };
}

export async function findUserByUsername(username: string): Promise<AuthUser | null> {
  const row = (await authUserModel.repository.find({ username }))[0];
  return row ? mapUserRecord(row) : null;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const row = (await authUserModel.repository.find({ email }))[0];
  return row ? mapUserRecord(row) : null;
}

export async function findUserById(id: string | number): Promise<AuthUser | null> {
  if (typeof id === "number" || /^\d+$/.test(String(id))) {
    const legacyRow = (await authUserModel.repository.find({ legacy_user_id: Number(id) }))[0];
    if (legacyRow) return mapUserRecord(legacyRow);
  }
  const row = await authUserModel.repository.findOne(String(id));
  return row ? mapUserRecord(row) : null;
}

export async function updateUserPasswordHash(
  id: string | number,
  nextPasswordHash: string,
): Promise<void> {
  const target = await findUserById(id);
  if (!target) return;
  await authUserModel.repository.update(
    target.id,
    { password_hash: nextPasswordHash },
    createActorContext(target.id, "api"),
  );
}

export async function verifyUserPassword(user: AuthUser, password: string): Promise<boolean> {
  return verifyAuthPassword(password, user.passwordHash);
}

export function getUserPublic(user: AuthUser): AuthUserPublic {
  return toPublicAuthUser(user);
}

export async function listUsers(): Promise<AuthUserPublic[]> {
  const rows = await authUserModel.repository.find({}, { orderBy: "create_date ASC" });
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    displayName: row.display_name,
  }));
}

export async function updateUserRole(
  userId: string | number,
  nextRole: AuthRole,
  actorUserId?: string | number,
): Promise<AuthUserMutationResult> {
  if (!["admin", "editor", "viewer"].includes(nextRole)) {
    return { ok: false, code: "INVALID_ROLE", error: `Invalid role: ${nextRole}` };
  }
  const target = await findUserById(userId);
  if (!target) {
    return { ok: false, code: "NOT_FOUND", error: `User ${userId} not found` };
  }
  if (
    actorUserId !== undefined &&
    String(actorUserId) === target.id &&
    target.role === "admin" &&
    nextRole !== "admin"
  ) {
    return { ok: false, code: "FORBIDDEN", error: "Cannot demote your own admin account" };
  }
  if (target.role === "admin" && nextRole !== "admin") {
    const admins = await authUserModel.repository.count({ role: "admin" });
    if (admins <= 1) {
      return { ok: false, code: "CONFLICT", error: "Cannot demote the last admin user" };
    }
  }
  const actor = createActorContext(actorUserId ? String(actorUserId) : null, "api");
  const updated = await authUserModel.repository.update(target.id, { role: nextRole }, actor);
  await tryRecordAuditLog({
    domain: "identity",
    entity: "user",
    entityId: target.id,
    action: "UPDATE",
    actor,
    actorRole: "admin",
    outcome: "success",
    before: { role: target.role },
    after: { role: nextRole },
    occurredAt: new Date().toISOString(),
  });
  return {
    ok: true,
    user: updated
      ? toPublicAuthUser(mapUserRecord(updated))
      : { ...toPublicAuthUser(target), role: nextRole },
  };
}

export async function deleteUser(
  userId: string | number,
  actorUserId?: string | number,
): Promise<AuthUserMutationResult> {
  const target = await findUserById(userId);
  if (!target) {
    return { ok: false, code: "NOT_FOUND", error: `User ${userId} not found` };
  }
  if (actorUserId !== undefined && String(actorUserId) === target.id) {
    return { ok: false, code: "FORBIDDEN", error: "Cannot delete your own active account" };
  }
  if (target.role === "admin") {
    const admins = await authUserModel.repository.count({ role: "admin" });
    if (admins <= 1) {
      return { ok: false, code: "CONFLICT", error: "Cannot delete the last admin user" };
    }
  }
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.run(
      "DELETE FROM auth_oauth_tokens WHERE session_token IN (SELECT session_token FROM auth_sessions WHERE user_id = ?)",
      [target.id],
    );
    await tx.run("DELETE FROM auth_sessions WHERE user_id = ?", [target.id]);
    await tx.run("DELETE FROM auth_users WHERE id = ?", [target.id]);
  });
  const actor = createActorContext(actorUserId ? String(actorUserId) : null, "api");
  await tryRecordAuditLog({
    domain: "identity",
    entity: "user",
    entityId: target.id,
    action: "DELETE",
    actor,
    actorRole: "admin",
    outcome: "success",
    before: toPublicAuthUser(target),
    occurredAt: new Date().toISOString(),
  });
  return { ok: true, user: toPublicAuthUser(target) };
}

export async function seedBootstrapAdmin(): Promise<void> {
  const total = await authUserModel.repository.count();
  if (total > 0) return;

  const username = process.env.MW_BOOTSTRAP_ADMIN_USERNAME?.trim();
  const email = process.env.MW_BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.MW_BOOTSTRAP_ADMIN_PASSWORD;
  const displayName = process.env.MW_BOOTSTRAP_ADMIN_DISPLAY_NAME?.trim();
  const configured = [username, email, password];
  if (configured.every((v) => !v)) return;
  if (configured.some((v) => !v)) {
    throw new Error(
      "Set MW_BOOTSTRAP_ADMIN_USERNAME, MW_BOOTSTRAP_ADMIN_EMAIL, and MW_BOOTSTRAP_ADMIN_PASSWORD together, or leave all three unset to use /setup web onboarding.",
    );
  }
  await createUser({
    username: username!.toLowerCase(),
    email: email!.toLowerCase(),
    password: password!,
    role: "admin",
    displayName: displayName || username!,
  });
}

export async function createSession(
  userId: string | number,
  ttlMs = getSessionMaxAgeMs(),
): Promise<string> {
  const resolved = await findUserById(userId);
  const canonicalUserId = resolved?.id ?? String(userId);
  const sessionToken = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  const actor = createActorContext(canonicalUserId, "api");

  await authSessionModel.repository.create(
    {
      session_token: sessionToken,
      user_id: canonicalUserId,
      revoked: false,
      expires_at: expiresAt.toISOString(),
      ip_address: null,
      user_agent: null,
    },
    actor,
  );
  await tryRecordAuditLog({
    domain: "identity",
    entity: "session",
    entityId: sessionToken,
    action: "CREATE",
    actor,
    outcome: "success",
    after: { id: sessionToken, userId: canonicalUserId },
    occurredAt: now.toISOString(),
  });
  return sessionToken;
}

export async function getSession(sessionToken: string): Promise<AuthSessionData | null> {
  if (!sessionToken) return null;
  const row = (await authSessionModel.repository.find({ session_token: sessionToken }))[0];
  if (!row || row.revoked) return null;
  const expiresAt = new Date(row.expires_at);
  if (expiresAt.getTime() <= Date.now()) return null;
  return {
    id: row.session_token,
    userId: row.user_id,
    createdAt: row.create_date,
    expiresAt,
    revoked: row.revoked,
  };
}

export async function getSessionWithUser(
  sessionToken: string,
): Promise<AuthSessionWithUser | null> {
  const session = await getSession(sessionToken);
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user || !user.isActive) return null;
  return {
    session,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  };
}

export async function revokeSession(sessionToken: string): Promise<void> {
  const row = (await authSessionModel.repository.find({ session_token: sessionToken }))[0];
  if (!row || row.revoked) return;
  const actor = createActorContext(row.user_id, "api");
  await authSessionModel.repository.update(row.id, { revoked: true }, actor);
  await tryRecordAuditLog({
    domain: "identity",
    entity: "session",
    entityId: sessionToken,
    action: "UPDATE",
    actor,
    outcome: "success",
    before: { revoked: false },
    after: { revoked: true },
    occurredAt: new Date().toISOString(),
  });
}

export async function revokeAllUserSessions(userId: string | number): Promise<void> {
  const target = await findUserById(userId);
  const uid = target?.id ?? String(userId);
  const rows = await authSessionModel.repository.find({ user_id: uid, revoked: false });
  const actor = createActorContext(uid, "api");
  for (const row of rows) {
    await authSessionModel.repository.update(row.id, { revoked: true }, actor);
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  const nowIso = new Date().toISOString();
  const result = await getDb().run("DELETE FROM auth_sessions WHERE expires_at <= ?", [nowIso]);
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
  const expiresAt = new Date(Date.now() + Math.max(1, input.expiresInSec) * 1000);
  const actor = createActorContext(null, "api");
  await authOAuthTokenModel.repository.upsert(
    { session_token: input.sessionId },
    {
      session_token: input.sessionId,
      client_id: input.clientId,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      id_token: input.idToken ?? null,
      expires_at: expiresAt.toISOString(),
    },
    actor,
  );
}

export async function getBffOAuthTokens(sessionId: string): Promise<BffOAuthTokenRecord | null> {
  const row = (await authOAuthTokenModel.repository.find({ session_token: sessionId }))[0];
  if (!row) return null;
  return {
    sessionId: row.session_token,
    clientId: row.client_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    idToken: row.id_token,
    expiresAt: new Date(row.expires_at),
    createdAt: row.create_date,
  };
}

export async function consumeBffOAuthTokens(
  sessionId: string,
): Promise<BffOAuthTokenRecord | null> {
  const record = await getBffOAuthTokens(sessionId);
  if (record) {
    await getDb().run("DELETE FROM auth_oauth_tokens WHERE session_token = ?", [sessionId]);
  }
  return record;
}
