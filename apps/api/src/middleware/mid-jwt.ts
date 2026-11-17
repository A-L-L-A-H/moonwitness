import {
  decodeJwtParts,
  normalizeIssuerUrl,
  verifyEs256Jwt,
  type MidVerifiedClaims,
  type PublicEs256Jwk,
} from "@moonwitness/core";
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

async function lookupRemoteJwk(
  kid: string,
  issuerUrl: string,
  jwksUrlOverride?: string,
): Promise<PublicEs256Jwk | null> {
  const jwksUrl =
    jwksUrlOverride?.trim() ||
    process.env.MID_JWKS_URL?.trim() ||
    `${issuerUrl}/.well-known/jwks.json`;
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

export interface VerifiedMidProvisionClaims {
  readonly sub: string;
  readonly username?: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly role: "admin" | "editor" | "viewer";
}

export type MidExchangeVerificationResult =
  | { readonly kind: "user"; readonly user: VerifiedMidUser }
  | { readonly kind: "claims"; readonly claims: VerifiedMidProvisionClaims };

function normalizeMidRole(role: unknown): "admin" | "editor" | "viewer" {
  return role === "admin" || role === "editor" || role === "viewer" ? role : "viewer";
}

function toProvisionClaims(claims: MidVerifiedClaims): VerifiedMidProvisionClaims {
  const username =
    typeof claims.preferred_username === "string" && claims.preferred_username.trim()
      ? claims.preferred_username.trim()
      : undefined;
  const email =
    typeof claims.email === "string" && claims.email.trim() ? claims.email.trim() : undefined;
  const displayName =
    typeof claims.name === "string" && claims.name.trim() ? claims.name.trim() : undefined;
  return {
    sub: claims.sub,
    username,
    email,
    displayName,
    role: normalizeMidRole(claims.role),
  };
}

/**
 * Verify tokens returned from a server-side MID authorization_code exchange.
 * Prefers `verifyMidBearerToken` and falls back to explicit ES256 JWKS verification
 * for provisioning new local users or resolving remote MID JWKS endpoints.
 */
export async function verifyMidBffExchangeClaims(params: {
  readonly accessToken: string;
  readonly idToken?: string;
  readonly clientId: string;
  readonly midBaseUrl: string;
  readonly resolveLocalJwkByKid?: (kid: string) => Promise<PublicEs256Jwk | null>;
}): Promise<MidExchangeVerificationResult | null> {
  const directUser = await verifyMidBearerToken(`Bearer ${params.accessToken}`);
  if (directUser) {
    return { kind: "user", user: directUser };
  }

  const issuerUrl = normalizeIssuerUrl(process.env.MID_ISSUER_URL);
  const jwksUrl =
    process.env.MID_JWKS_URL?.trim() ||
    `${params.midBaseUrl.replace(/\/+$/g, "")}/.well-known/jwks.json`;

  const resolveKey = async (kid: string): Promise<PublicEs256Jwk | null> =>
    (await lookupDbSigningKey(kid)) ??
    (params.resolveLocalJwkByKid
      ? await params.resolveLocalJwkByKid(kid)
      : await lookupRemoteJwk(kid, issuerUrl, jwksUrl));

  const isAccessJwt = decodeJwtParts(params.accessToken) !== null;
  if (isAccessJwt) {
    const allowedAudiences = resolveAllowedApiAudiences();
    if (allowedAudiences.length === 0) return null;
    const isFirstPartyBrowserClient =
      params.clientId === "moonwitness-web" || params.clientId === "allah-sanctuary";
    const bffAudiences = isFirstPartyBrowserClient
      ? Array.from(new Set([...allowedAudiences, params.clientId]))
      : allowedAudiences;
    const accessClaims = await verifyEs256Jwt({
      token: params.accessToken,
      issuerUrl,
      expectedTokenUse: "access",
      expectedAudience: bffAudiences,
      resolveJwkByKid: resolveKey,
    });
    if (!accessClaims) return null;

    let mergedClaims = accessClaims;
    if (params.idToken && decodeJwtParts(params.idToken) !== null) {
      const idClaims = await verifyEs256Jwt({
        token: params.idToken,
        issuerUrl,
        expectedTokenUse: "id",
        expectedAudience: params.clientId,
        resolveJwkByKid: resolveKey,
      });
      if (!idClaims || idClaims.sub !== accessClaims.sub) return null;
      mergedClaims = {
        ...idClaims,
        ...accessClaims,
        preferred_username: accessClaims.preferred_username ?? idClaims.preferred_username,
        email: accessClaims.email ?? idClaims.email,
        name: accessClaims.name ?? idClaims.name,
        role: accessClaims.role ?? idClaims.role,
      };
    }
    return { kind: "claims", claims: toProvisionClaims(mergedClaims) };
  }

  if (!params.idToken?.trim()) return null;
  const idClaims = await verifyEs256Jwt({
    token: params.idToken,
    issuerUrl,
    expectedTokenUse: "id",
    expectedAudience: params.clientId,
    resolveJwkByKid: resolveKey,
  });
  if (!idClaims) return null;
  return { kind: "claims", claims: toProvisionClaims(idClaims) };
}

/** Reset cached JWKS response in unit tests. */
export function resetMidJwksCacheForTests(): void {
  jwksCache = null;
}
