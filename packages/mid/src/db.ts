import { generateEs256SigningKey, generateOpaqueToken, sha256Hex } from "./crypto";
import type {
  AuditEventRecord,
  D1DatabaseLike,
  MidEnv,
  MidIdentityStore,
  MidUserId,
  OidcClient,
  PublicEs256Jwk,
  PublicUser,
  SigningKeyRecord,
  UserRecord,
  UserRole,
} from "./types";

const INITIALIZED_DBS = new WeakMap<D1DatabaseLike, Promise<void>>();

const PROTOCOL_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS mid_signing_keys (
    kid TEXT PRIMARY KEY,
    public_jwk_json TEXT NOT NULL,
    encrypted_private_jwk TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mid_clients (
    client_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    redirect_uris_json TEXT NOT NULL,
    allowed_scopes_json TEXT NOT NULL,
    client_type TEXT NOT NULL CHECK (client_type IN ('public', 'confidential')),
    client_secret_hash TEXT,
    first_party INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mid_auth_codes (
    code_hash TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    scope TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    code_challenge_method TEXT NOT NULL,
    nonce TEXT,
    resource TEXT,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mid_refresh_tokens (
    token_hash TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    resource TEXT,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    replaced_by TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mid_refresh_family ON mid_refresh_tokens (family_id)`,
];

const LEGACY_AUDIT_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS mid_audit_logs (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    actor_user_id TEXT,
    client_id TEXT,
    detail_json TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mid_audit_created ON mid_audit_logs (created_at)`,
];

const FIRST_PARTY_CLIENTS = [
  {
    clientId: "moonwitness-web",
    name: "MoonWitness Web Console",
    redirectUris: [
      "https://moonwitness.biz.id/auth/callback",
      "https://www.moonwitness.biz.id/auth/callback",
      "http://localhost:3000/auth/callback",
    ],
    allowedScopes: ["openid", "profile", "email", "offline_access"],
    clientType: "public",
    firstParty: 1,
  },
  {
    clientId: "allah-sanctuary",
    name: "ALLAH Sanctuary",
    redirectUris: ["https://a-l-l-a-h.com/auth/callback", "http://localhost:3000/auth/callback"],
    allowedScopes: ["openid", "profile", "email", "offline_access"],
    clientType: "public",
    firstParty: 1,
  },
  {
    clientId: "igate-console",
    name: "MoonWitness IGate NOC",
    redirectUris: ["https://igate.moonwitness.biz.id/auth/callback"],
    allowedScopes: ["openid", "profile", "email", "offline_access"],
    clientType: "public",
    firstParty: 1,
  },
  {
    clientId: "moonwitness-cli",
    name: "MoonWitness Desktop & CLI",
    redirectUris: ["http://127.0.0.1/callback", "http://127.0.0.1:8765/callback"],
    allowedScopes: ["openid", "profile", "email", "offline_access"],
    clientType: "public",
    firstParty: 1,
  },
  {
    clientId: "rocksoul-dx",
    name: "ROCKSOUL - DX",
    redirectUris: ["http://127.0.0.1/callback", "http://localhost:1420/auth/callback"],
    allowedScopes: ["openid", "profile", "email", "offline_access"],
    clientType: "public",
    firstParty: 1,
  },
  {
    clientId: "moonwitness-memory",
    name: "MoonWitness Memory Deck",
    redirectUris: [
      "https://memory-edge.moonwitness.biz.id/auth/callback",
      "http://localhost:3005/auth/callback",
    ],
    allowedScopes: ["openid", "profile", "email", "offline_access"],
    clientType: "public",
    firstParty: 1,
  },
] as const;

async function ensureOptionalTextColumn(
  db: D1DatabaseLike,
  tableName: "mid_auth_codes" | "mid_refresh_tokens",
  columnName: "resource",
): Promise<void> {
  const info = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name?: string }>();
  const exists = (info.results ?? []).some((row) => row.name === columnName);
  if (!exists) {
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT`).run();
  }
}

/** Initialize MoonWitness ID schema tables and first-party OIDC clients once per DB binding. */
export async function ensureMidSchema(
  db: D1DatabaseLike,
  options: { skipLegacyAuditTable?: boolean } = {},
): Promise<void> {
  const existing = INITIALIZED_DBS.get(db);
  if (existing) return existing;

  const schemaStatements = options.skipLegacyAuditTable
    ? PROTOCOL_SCHEMA_STATEMENTS
    : [...PROTOCOL_SCHEMA_STATEMENTS, ...LEGACY_AUDIT_STATEMENTS];

  const initPromise = (async () => {
    const nowIso = new Date().toISOString();
    const statements = [
      ...schemaStatements.map((sql) => db.prepare(sql)),
      ...FIRST_PARTY_CLIENTS.map((client) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO mid_clients
             (client_id, name, redirect_uris_json, allowed_scopes_json, client_type, client_secret_hash, first_party, created_at)
             VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
          )
          .bind(
            client.clientId,
            client.name,
            JSON.stringify(client.redirectUris),
            JSON.stringify(client.allowedScopes),
            client.clientType,
            client.firstParty,
            nowIso,
          ),
      ),
    ];
    await db.batch(statements);
    await ensureOptionalTextColumn(db, "mid_auth_codes", "resource");
    await ensureOptionalTextColumn(db, "mid_refresh_tokens", "resource");
  })().catch((error: unknown) => {
    INITIALIZED_DBS.delete(db);
    throw error;
  });

  INITIALIZED_DBS.set(db, initPromise);
  return initPromise;
}

/** Return active signing key and all valid public JWKs; provision first key if empty. */
export async function getOrProvisionSigningKeys(
  db: D1DatabaseLike,
  masterSecret: string,
): Promise<{ activeKey: SigningKeyRecord; publicJwks: PublicEs256Jwk[] }> {
  const rows = await db
    .prepare(
      `SELECT kid, public_jwk_json, encrypted_private_jwk, active, created_at
       FROM mid_signing_keys ORDER BY created_at DESC`,
    )
    .all<{
      kid: string;
      public_jwk_json: string;
      encrypted_private_jwk: string;
      active: number;
      created_at: string;
    }>();

  const mapped: SigningKeyRecord[] = (rows.results ?? []).map((row) => ({
    kid: row.kid,
    publicJwkJson: row.public_jwk_json,
    encryptedPrivateJwk: row.encrypted_private_jwk,
    active: Boolean(row.active),
    createdAt: row.created_at,
  }));

  const currentActive = mapped.find((entry) => entry.active);
  if (currentActive) {
    return {
      activeKey: currentActive,
      publicJwks: mapped.map((entry) => JSON.parse(entry.publicJwkJson) as PublicEs256Jwk),
    };
  }

  const generated = await generateEs256SigningKey(masterSecret);
  const nowIso = new Date().toISOString();
  const publicJwkJson = JSON.stringify(generated.publicJwk);
  await db
    .prepare(
      `INSERT INTO mid_signing_keys (kid, public_jwk_json, encrypted_private_jwk, active, created_at)
       VALUES (?, ?, ?, 1, ?)`,
    )
    .bind(generated.kid, publicJwkJson, generated.encryptedPrivateJwk, nowIso)
    .run();

  const activeKey: SigningKeyRecord = {
    kid: generated.kid,
    publicJwkJson,
    encryptedPrivateJwk: generated.encryptedPrivateJwk,
    active: true,
    createdAt: nowIso,
  };
  return {
    activeKey,
    publicJwks: [
      generated.publicJwk,
      ...mapped.map((entry) => JSON.parse(entry.publicJwkJson) as PublicEs256Jwk),
    ],
  };
}

/** Fetch user record by username or email for credential login. */
export async function findUserByLogin(
  db: D1DatabaseLike,
  identifier: string,
): Promise<UserRecord | null> {
  const result = await db
    .prepare(
      `SELECT id, username, email, password_hash, role, display_name
       FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?) LIMIT 1`,
    )
    .bind(identifier.trim(), identifier.trim())
    .all<{
      id: number;
      username: string;
      email: string;
      password_hash: string;
      role: UserRole;
      display_name: string;
    }>();
  const row = result.results?.[0];
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    displayName: row.display_name,
  };
}

/** Fetch sanitized user record by ID. */
export async function findPublicUserById(
  db: D1DatabaseLike,
  userId: MidUserId,
): Promise<PublicUser | null> {
  const result = await db
    .prepare(`SELECT id, username, email, role, display_name FROM users WHERE id = ? LIMIT 1`)
    .bind(userId)
    .all<{
      id: MidUserId;
      username: string;
      email: string;
      role: UserRole;
      display_name: string;
    }>();
  const row = result.results?.[0];
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    displayName: row.display_name,
  };
}

/** Update user password hash atomically and stamp updated_at. */
export async function updateUserPasswordHash(
  db: D1DatabaseLike,
  userId: MidUserId,
  newPasswordHash: string,
): Promise<void> {
  await db
    .prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`)
    .bind(newPasswordHash, new Date().toISOString(), userId)
    .run();
}

/** Create shared SSO session row compatible with apps/api `sessions` schema. */
export async function createSsoSession(
  db: D1DatabaseLike,
  userId: MidUserId,
  ttlSeconds: number,
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, created_at, expires_at, revoked)
       VALUES (?, ?, ?, ?, 0)`,
    )
    .bind(sessionId, userId, now.toISOString(), expiresAt.toISOString())
    .run();
  return sessionId;
}

/** Look up active unrevoked, non-expired SSO session along with its owner. */
export async function findActiveSsoSession(
  db: D1DatabaseLike,
  sessionId: string,
): Promise<{ sessionId: string; expiresAt: string; user: PublicUser } | null> {
  if (!sessionId) return null;
  const result = await db
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, s.revoked,
              u.id AS user_id, u.username, u.email, u.role, u.display_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? LIMIT 1`,
    )
    .bind(sessionId)
    .all<{
      session_id: string;
      expires_at: string;
      revoked: number;
      user_id: number;
      username: string;
      email: string;
      role: UserRole;
      display_name: string;
    }>();
  const row = result.results?.[0];
  if (!row || Boolean(row.revoked)) return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;
  return {
    sessionId: row.session_id,
    expiresAt: row.expires_at,
    user: {
      id: row.user_id,
      username: row.username,
      email: row.email,
      role: row.role,
      displayName: row.display_name,
    },
  };
}

/** Revoke a single SSO session ID. */
export async function revokeSsoSession(db: D1DatabaseLike, sessionId: string): Promise<void> {
  await db.prepare(`UPDATE sessions SET revoked = 1 WHERE id = ?`).bind(sessionId).run();
}

function mapClientRow(row: {
  client_id: string;
  name: string;
  redirect_uris_json: string;
  allowed_scopes_json: string;
  client_type: "public" | "confidential";
  client_secret_hash: string | null;
  first_party: number;
  created_at: string;
}): OidcClient {
  return {
    clientId: row.client_id,
    name: row.name,
    redirectUris: JSON.parse(row.redirect_uris_json) as string[],
    allowedScopes: JSON.parse(row.allowed_scopes_json) as string[],
    clientType: row.client_type,
    clientSecretHash: row.client_secret_hash,
    firstParty: Boolean(row.first_party),
    createdAt: row.created_at,
  };
}

/** Find registered OIDC client by client_id. */
export async function findOidcClient(
  db: D1DatabaseLike,
  clientId: string,
): Promise<OidcClient | null> {
  const result = await db
    .prepare(
      `SELECT client_id, name, redirect_uris_json, allowed_scopes_json, client_type, client_secret_hash, first_party, created_at
       FROM mid_clients WHERE client_id = ? LIMIT 1`,
    )
    .bind(clientId)
    .all<{
      client_id: string;
      name: string;
      redirect_uris_json: string;
      allowed_scopes_json: string;
      client_type: "public" | "confidential";
      client_secret_hash: string | null;
      first_party: number;
      created_at: string;
    }>();
  const row = result.results?.[0];
  return row ? mapClientRow(row) : null;
}

/** List all registered OIDC clients sorted cleanly. */
export async function listOidcClients(db: D1DatabaseLike): Promise<OidcClient[]> {
  const result = await db
    .prepare(
      `SELECT client_id, name, redirect_uris_json, allowed_scopes_json, client_type, client_secret_hash, first_party, created_at
       FROM mid_clients ORDER BY first_party DESC, client_id ASC`,
    )
    .all<{
      client_id: string;
      name: string;
      redirect_uris_json: string;
      allowed_scopes_json: string;
      client_type: "public" | "confidential";
      client_secret_hash: string | null;
      first_party: number;
      created_at: string;
    }>();
  return (result.results ?? []).map(mapClientRow);
}

/** Register a custom OIDC client; returns plaintext client_secret once if confidential. */
export async function createOidcClient(
  db: D1DatabaseLike,
  input: {
    clientId: string;
    name: string;
    redirectUris: string[];
    allowedScopes: string[];
    clientType: "public" | "confidential";
  },
): Promise<{ client: OidcClient; plainSecret: string | null }> {
  const plainSecret = input.clientType === "confidential" ? `mws_${generateOpaqueToken(24)}` : null;
  const secretHash = plainSecret ? await sha256Hex(plainSecret) : null;
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO mid_clients
       (client_id, name, redirect_uris_json, allowed_scopes_json, client_type, client_secret_hash, first_party, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    )
    .bind(
      input.clientId,
      input.name,
      JSON.stringify(input.redirectUris),
      JSON.stringify(input.allowedScopes),
      input.clientType,
      secretHash,
      nowIso,
    )
    .run();

  return {
    client: {
      clientId: input.clientId,
      name: input.name,
      redirectUris: input.redirectUris,
      allowedScopes: input.allowedScopes,
      clientType: input.clientType,
      clientSecretHash: secretHash,
      firstParty: false,
      createdAt: nowIso,
    },
    plainSecret,
  };
}

/** Delete non-first-party OIDC client. */
export async function deleteOidcClient(db: D1DatabaseLike, clientId: string): Promise<boolean> {
  const exec = await db
    .prepare(`DELETE FROM mid_clients WHERE client_id = ? AND first_party = 0`)
    .bind(clientId)
    .run();
  return (exec.meta?.changes ?? 0) > 0;
}

/** Store single-use hashed authorization code with 120s TTL. */
export async function storeAuthorizationCode(
  db: D1DatabaseLike,
  params: {
    clientId: string;
    userId: MidUserId;
    redirectUri: string;
    scope: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    nonce: string | null;
    resource?: string | null;
  },
): Promise<string> {
  const plainCode = `mwc_${generateOpaqueToken(24)}`;
  const codeHash = await sha256Hex(plainCode);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 120_000);
  await db
    .prepare(
      `INSERT INTO mid_auth_codes
       (code_hash, client_id, user_id, redirect_uri, scope, code_challenge, code_challenge_method, nonce, resource, expires_at, consumed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    )
    .bind(
      codeHash,
      params.clientId,
      String(params.userId),
      params.redirectUri,
      params.scope,
      params.codeChallenge,
      params.codeChallengeMethod,
      params.nonce,
      params.resource ?? null,
      expiresAt.toISOString(),
      now.toISOString(),
    )
    .run();
  return plainCode;
}

/** Atomically consume an unexpired, unused authorization code. */
export async function consumeAuthorizationCode(
  db: D1DatabaseLike,
  plainCode: string,
): Promise<{
  clientId: string;
  userId: MidUserId;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  nonce: string | null;
  resource: string | null;
} | null> {
  const codeHash = await sha256Hex(plainCode);
  const nowIso = new Date().toISOString();
  const claimResult = await db
    .prepare(
      `UPDATE mid_auth_codes SET consumed_at = ?
       WHERE code_hash = ? AND consumed_at IS NULL AND expires_at > ?`,
    )
    .bind(nowIso, codeHash, nowIso)
    .run();
  if ((claimResult.meta?.changes ?? 0) === 0) return null;

  const rowResult = await db
    .prepare(
      `SELECT client_id, user_id, redirect_uri, scope, code_challenge, code_challenge_method, nonce, resource
       FROM mid_auth_codes WHERE code_hash = ? LIMIT 1`,
    )
    .bind(codeHash)
    .all<{
      client_id: string;
      user_id: MidUserId;
      redirect_uri: string;
      scope: string;
      code_challenge: string;
      code_challenge_method: string;
      nonce: string | null;
      resource: string | null;
    }>();
  const row = rowResult.results?.[0];
  if (!row) return null;
  return {
    clientId: row.client_id,
    userId: row.user_id,
    redirectUri: row.redirect_uri,
    scope: row.scope,
    codeChallenge: row.code_challenge,
    codeChallengeMethod: row.code_challenge_method,
    nonce: row.nonce,
    resource: row.resource ?? null,
  };
}

/** Issue a refresh token belonging to a rotation family. */
export async function issueRefreshToken(
  db: D1DatabaseLike,
  params: {
    clientId: string;
    userId: MidUserId;
    scope: string;
    ttlSec: number;
    familyId?: string;
    resource?: string | null;
  },
): Promise<{ plainToken: string; familyId: string }> {
  const plainToken = `mwr_${generateOpaqueToken(32)}`;
  const tokenHash = await sha256Hex(plainToken);
  const familyId = params.familyId ?? crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.ttlSec * 1000);
  await db
    .prepare(
      `INSERT INTO mid_refresh_tokens
       (token_hash, family_id, client_id, user_id, scope, resource, expires_at, revoked_at, replaced_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
    )
    .bind(
      tokenHash,
      familyId,
      params.clientId,
      String(params.userId),
      params.scope,
      params.resource ?? null,
      expiresAt.toISOString(),
      now.toISOString(),
    )
    .run();
  return { plainToken, familyId };
}

/** Rotate refresh token once; revoke entire family on replay attempt. */
export async function rotateRefreshToken(
  db: D1DatabaseLike,
  plainToken: string,
  clientId: string,
  ttlSec: number,
  requestedResource?: string | null,
): Promise<{
  status: "rotated" | "invalid" | "reused" | "invalid_target";
  nextRefreshToken?: string;
  userId?: MidUserId;
  scope?: string;
  resource?: string | null;
}> {
  const tokenHash = await sha256Hex(plainToken);
  const lookup = await db
    .prepare(
      `SELECT token_hash, family_id, client_id, user_id, scope, resource, expires_at, revoked_at, replaced_by
       FROM mid_refresh_tokens WHERE token_hash = ? LIMIT 1`,
    )
    .bind(tokenHash)
    .all<{
      token_hash: string;
      family_id: string;
      client_id: string;
      user_id: MidUserId;
      scope: string;
      resource: string | null;
      expires_at: string;
      revoked_at: string | null;
      replaced_by: string | null;
    }>();
  const row = lookup.results?.[0];
  if (!row || row.client_id !== clientId) return { status: "invalid" };

  const nowIso = new Date().toISOString();
  if (row.revoked_at || row.replaced_by) {
    await db
      .prepare(
        `UPDATE mid_refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL`,
      )
      .bind(nowIso, row.family_id)
      .run();
    return { status: "reused" };
  }
  if (Date.parse(row.expires_at) <= Date.now()) return { status: "invalid" };

  const boundResource = row.resource ?? null;
  if (requestedResource && requestedResource !== clientId && boundResource !== requestedResource) {
    return { status: "invalid_target" };
  }
  const effectiveResource = requestedResource ?? boundResource;

  const nextRefreshToken = `mwr_${generateOpaqueToken(32)}`;
  const nextHash = await sha256Hex(nextRefreshToken);
  const nextExpires = new Date(Date.now() + ttlSec * 1000).toISOString();

  await db.batch([
    db
      .prepare(`UPDATE mid_refresh_tokens SET revoked_at = ?, replaced_by = ? WHERE token_hash = ?`)
      .bind(nowIso, nextHash, tokenHash),
    db
      .prepare(
        `INSERT INTO mid_refresh_tokens
         (token_hash, family_id, client_id, user_id, scope, resource, expires_at, revoked_at, replaced_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
      )
      .bind(
        nextHash,
        row.family_id,
        clientId,
        row.user_id,
        row.scope,
        boundResource,
        nextExpires,
        nowIso,
      ),
  ]);

  return {
    status: "rotated",
    nextRefreshToken,
    userId: row.user_id,
    scope: row.scope,
    resource: effectiveResource,
  };
}

/** Revoke refresh token and its family if present. */
export async function revokeRefreshToken(db: D1DatabaseLike, plainToken: string): Promise<void> {
  const tokenHash = await sha256Hex(plainToken);
  const row = await db
    .prepare(`SELECT family_id FROM mid_refresh_tokens WHERE token_hash = ? LIMIT 1`)
    .bind(tokenHash)
    .all<{ family_id: string }>();
  const familyId = row.results?.[0]?.family_id;
  if (!familyId) return;
  await db
    .prepare(
      `UPDATE mid_refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL`,
    )
    .bind(new Date().toISOString(), familyId)
    .run();
}

/** Persist structured security audit event. */
export async function recordAuditEvent(
  db: D1DatabaseLike,
  entry: {
    eventType: string;
    actorUserId: MidUserId | null;
    clientId: string | null;
    detail: Record<string, unknown>;
    ipAddress: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO mid_audit_logs (id, event_type, actor_user_id, client_id, detail_json, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      entry.eventType,
      entry.actorUserId === null ? null : String(entry.actorUserId),
      entry.clientId,
      JSON.stringify(entry.detail),
      entry.ipAddress,
      new Date().toISOString(),
    )
    .run();
}

/** Fetch recent security audit events for admin review. */
export async function listRecentAuditEvents(
  db: D1DatabaseLike,
  limit = 40,
): Promise<AuditEventRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, event_type, actor_user_id, client_id, detail_json, ip_address, created_at
       FROM mid_audit_logs ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<{
      id: string;
      event_type: string;
      actor_user_id: MidUserId | null;
      client_id: string | null;
      detail_json: string;
      ip_address: string;
      created_at: string;
    }>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    clientId: row.client_id,
    detailJson: row.detail_json,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  }));
}

/** Default SQL-backed identity store targeting legacy `users` / `sessions` / `mid_audit_logs`. */
export function createLegacySqlIdentityStore(db: D1DatabaseLike): MidIdentityStore {
  return {
    findUserByLogin: (login) => findUserByLogin(db, login),
    findPublicUserById: (userId) => findPublicUserById(db, userId),
    updateUserPasswordHash: (userId, nextHash) => updateUserPasswordHash(db, userId, nextHash),
    createSsoSession: (userId, ttlSeconds) => createSsoSession(db, userId, ttlSeconds),
    findActiveSsoSession: (sessionId) => findActiveSsoSession(db, sessionId),
    revokeSsoSession: (sessionId) => revokeSsoSession(db, sessionId),
    recordAuditEvent: (entry) => recordAuditEvent(db, entry),
    listRecentAuditEvents: (limit = 40) => listRecentAuditEvents(db, limit),
  };
}

/** Resolve active identity store from `env.IDENTITY_STORE` or legacy SQL fallback. */
export function resolveIdentityStore(env: MidEnv): MidIdentityStore {
  return env.IDENTITY_STORE ?? createLegacySqlIdentityStore(env.DB);
}
