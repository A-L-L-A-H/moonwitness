import { getDb } from "@moonwitness/orm";
import { findUserById, getUserPublic } from "../services/user";

interface PublicEs256Jwk {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
  kid: string;
  use?: string;
  alg?: string;
}

interface MidJwtClaims {
  iss?: string;
  sub?: string;
  exp?: number;
  token_use?: string;
}

export interface VerifiedMidUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  displayName: string;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();
const JWKS_CACHE_TTL_MS = 300_000;
let jwksCache: { url: string; fetchedAt: number; keys: PublicEs256Jwk[] } | null = null;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function decodeBase64Url(segment: string): Uint8Array {
  const padded =
    segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (segment.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function decodeJsonSegment<TRecord>(segment: string): TRecord {
  return JSON.parse(TEXT_DECODER.decode(decodeBase64Url(segment))) as TRecord;
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
  const jwksUrl =
    process.env.MID_JWKS_URL?.trim() || `${issuerUrl.replace(/\/+$/g, "")}/.well-known/jwks.json`;
  const now = Date.now();
  if (!jwksCache || jwksCache.url !== jwksUrl || now - jwksCache.fetchedAt > JWKS_CACHE_TTL_MS) {
    try {
      const response = await fetch(jwksUrl);
      if (!response.ok) return null;
      const body = (await response.json()) as { keys?: PublicEs256Jwk[] };
      jwksCache = { url: jwksUrl, fetchedAt: now, keys: body.keys ?? [] };
    } catch {
      return null;
    }
  }
  return jwksCache.keys.find((entry) => entry.kid === kid) ?? null;
}

/** Verify an OAuth 2.1 ES256 Bearer access token issued by moonwitness-id. */
export async function verifyMidBearerToken(
  authorizationHeader: string | undefined,
): Promise<VerifiedMidUser | null> {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice(7).trim();
  const segments = token.split(".");
  if (segments.length !== 3 || !segments[0] || !segments[1] || !segments[2]) return null;

  let header: { alg?: string; kid?: string };
  let claims: MidJwtClaims;
  try {
    header = decodeJsonSegment<{ alg?: string; kid?: string }>(segments[0]);
    claims = decodeJsonSegment<MidJwtClaims>(segments[1]);
  } catch {
    return null;
  }

  const expectedIssuer = (process.env.MID_ISSUER_URL ?? "https://id.moonwitness.biz.id").replace(
    /\/+$/g,
    "",
  );
  if (header.alg !== "ES256" || !header.kid) return null;
  if (claims.iss !== expectedIssuer || claims.token_use !== "access") return null;
  if (typeof claims.exp !== "number" || claims.exp <= Math.floor(Date.now() / 1000)) return null;

  const userId = Number(claims.sub);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const jwk =
    (await lookupDbSigningKey(header.kid)) ??
    (process.env.MID_JWKS_URL ? await lookupRemoteJwk(header.kid, expectedIssuer) : null);
  if (!jwk || jwk.kty !== "EC" || jwk.crv !== "P-256") return null;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const signatureValid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    toArrayBuffer(decodeBase64Url(segments[2])),
    toArrayBuffer(TEXT_ENCODER.encode(`${segments[0]}.${segments[1]}`)),
  );
  if (!signatureValid) return null;

  const user = await findUserById(userId);
  return user ? getUserPublic(user) : null;
}

/** Reset cached JWKS response in unit tests. */
export function resetMidJwksCacheForTests(): void {
  jwksCache = null;
}
