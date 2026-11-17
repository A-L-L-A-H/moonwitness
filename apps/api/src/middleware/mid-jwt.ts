import { normalizeIssuerUrl, verifyEs256Jwt, type PublicEs256Jwk } from "@moonwitness/core";
import { getDb } from "@moonwitness/orm";
import { findUserById, getUserPublic } from "../services/user";

export const DEFAULT_API_ALLOWED_AUDIENCES = [
  "moonwitness-web",
  "moonwitness-cli",
  "rocksoul-dx",
  "allah-sanctuary",
  "moonwitness-api",
] as const;

export interface VerifiedMidUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  displayName: string;
}

const JWKS_CACHE_TTL_MS = 300_000;
let jwksCache: {
  url: string;
  fetchedAt: number;
  keys: PublicEs256Jwk[];
  missedKids: Set<string>;
} | null = null;

/** Resolve the configured API token audience allowlist (empty explicit string fails closed). */
export function resolveAllowedApiAudiences(
  rawValue = process.env.MID_ALLOWED_AUDIENCES,
): readonly string[] {
  if (rawValue === undefined) {
    return DEFAULT_API_ALLOWED_AUDIENCES;
  }
  return rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function lookupDbSigningKey(kid: string): Promise<PublicEs256Jwk | null> {
  try {
    const db = getDb();
    const row = await db.get<{ public_jwk_json?: string }>(
      "SELECT public_jwk_json FROM mid_signing_keys WHERE kid = ? AND active = 1 LIMIT 1",
      [kid],
    );
    if (!row?.public_jwk_json) return null;
    return JSON.parse(row.public_jwk_json) as PublicEs256Jwk;
  } catch {
    return null;
  }
}

async function lookupRemoteJwk(kid: string, issuerUrl: string): Promise<PublicEs256Jwk | null> {
  const jwksUrl = process.env.MID_JWKS_URL?.trim() || `${issuerUrl}/.well-known/jwks.json`;
  const now = Date.now();
  const cacheExpired =
    !jwksCache || jwksCache.url !== jwksUrl || now - jwksCache.fetchedAt > JWKS_CACHE_TTL_MS;
  const rotationMiss =
    !cacheExpired &&
    jwksCache !== null &&
    !jwksCache.keys.some((entry) => entry.kid === kid) &&
    !jwksCache.missedKids.has(kid);

  if (cacheExpired || rotationMiss) {
    try {
      const response = await fetch(jwksUrl);
      if (!response.ok) return null;
      const body = (await response.json()) as { keys?: PublicEs256Jwk[] };
      const keys = body.keys ?? [];
      const missedKids = new Set<string>();
      if (!keys.some((entry) => entry.kid === kid)) {
        missedKids.add(kid);
      }
      jwksCache = { url: jwksUrl, fetchedAt: now, keys, missedKids };
    } catch {
      return null;
    }
  }

  const found = jwksCache?.keys.find((entry) => entry.kid === kid) ?? null;
  if (!found && jwksCache && jwksCache.missedKids.size < 64) {
    jwksCache.missedKids.add(kid);
  }
  return found;
}

/** Verify an OAuth 2.1 ES256 Bearer access token issued by moonwitness-id. */
export async function verifyMidBearerToken(
  authorizationHeader: string | undefined,
): Promise<VerifiedMidUser | null> {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice(7).trim();
  if (!token) return null;

  const issuerUrl = normalizeIssuerUrl(process.env.MID_ISSUER_URL);
  const allowedAudiences = resolveAllowedApiAudiences();
  const claims = await verifyEs256Jwt({
    token,
    issuerUrl,
    expectedTokenUse: "access",
    expectedAudience: allowedAudiences,
    resolveJwkByKid: async (kid) =>
      (await lookupDbSigningKey(kid)) ??
      (process.env.MID_JWKS_URL ? await lookupRemoteJwk(kid, issuerUrl) : null),
  });
  if (!claims) return null;

  const userId = Number(claims.sub);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const user = await findUserById(userId);
  return user ? getUserPublic(user) : null;
}

/** Reset cached JWKS response in unit tests. */
export function resetMidJwksCacheForTests(): void {
  jwksCache = null;
}
