/** Structural Cloudflare D1 prepared statement contract. */
export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  all<TRow = Record<string, unknown>>(): Promise<{ results?: TRow[] }>;
  run(): Promise<{ meta?: { last_row_id?: number; changes?: number } }>;
}

/** Structural Cloudflare D1 database binding contract. */
export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

/** Cloudflare Worker environment bindings for moonwitness-id. */
export interface MidEnv {
  DB: D1DatabaseLike;
  MID_KEY_ENCRYPTION_SECRET: string;
  ISSUER_URL?: string;
  ACCESS_TOKEN_TTL_SEC?: string;
  ID_TOKEN_TTL_SEC?: string;
  REFRESH_TOKEN_TTL_SEC?: string;
  SESSION_TTL_SEC?: string;
  COOKIE_DOMAIN?: string;
  CORS_ORIGINS?: string;
}

/** Canonical MoonWitness user role levels. */
export type UserRole = "admin" | "editor" | "viewer";

/** Sanitized public identity profile returned to clients and userinfo callers. */
export interface PublicUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  displayName: string;
}

/** Database user record including credential verifier hash. */
export interface UserRecord extends PublicUser {
  passwordHash: string;
}

/** Registered OAuth 2.1 / OIDC client application metadata. */
export interface OidcClient {
  clientId: string;
  name: string;
  redirectUris: string[];
  allowedScopes: string[];
  clientType: "public" | "confidential";
  clientSecretHash: string | null;
  firstParty: boolean;
  createdAt: string;
}

/** Persisted ECDSA P-256 signing key row with encrypted private JWK. */
export interface SigningKeyRecord {
  kid: string;
  publicJwkJson: string;
  encryptedPrivateJwk: string;
  active: boolean;
  createdAt: string;
}

/** Decoded ECDSA JWK public key payload exposed on JWKS endpoint. */
export interface PublicEs256Jwk {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
  kid: string;
  use: "sig";
  alg: "ES256";
}

/** Standard JWT claims emitted by moonwitness-id tokens. */
export interface MidTokenClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
  token_use: "access" | "id";
  scope?: string;
  nonce?: string;
  preferred_username: string;
  name: string;
  email: string;
  role: UserRole;
  sid?: string;
}

/** Security and lifecycle audit record entry. */
export interface AuditEventRecord {
  id: string;
  eventType: string;
  actorUserId: number | null;
  clientId: string | null;
  detailJson: string;
  ipAddress: string;
  createdAt: string;
}
