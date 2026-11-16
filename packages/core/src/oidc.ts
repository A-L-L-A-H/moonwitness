export const DEFAULT_MID_ISSUER_URL = "https://id.moonwitness.biz.id";

export interface PublicEs256Jwk {
  readonly kty: "EC";
  readonly crv: "P-256";
  readonly x: string;
  readonly y: string;
  readonly kid: string;
  readonly use?: string;
  readonly alg?: string;
  readonly key_ops?: string[];
  readonly ext?: boolean;
}

export interface MidTokenResponse {
  readonly access_token: string;
  readonly id_token: string;
  readonly token_type: string;
  readonly expires_in: number;
  readonly scope?: string;
  readonly refresh_token?: string;
}

export interface MidUserInfo {
  readonly sub: string;
  readonly preferred_username: string;
  readonly name: string;
  readonly email: string;
  readonly role: "admin" | "editor" | "viewer";
}

export interface MidVerifiedClaims {
  readonly iss: string;
  readonly sub: string;
  readonly aud: string | string[];
  readonly exp: number;
  readonly iat: number;
  readonly token_use: string;
  readonly scope?: string;
  readonly preferred_username?: string;
  readonly name?: string;
  readonly email?: string;
  readonly role?: "admin" | "editor" | "viewer";
  readonly nonce?: string;
}

export interface PkceAuthorizationRequest {
  readonly authorizeUrl: string;
  readonly verifier: string;
  readonly state: string;
  readonly nonce: string;
  readonly codeChallenge: string;
  readonly redirectUri: string;
}

export interface OAuthTokenErrorPayload {
  readonly error?: string;
  readonly error_description?: string;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/** Normalize an OIDC issuer origin by trimming trailing slashes. */
export function normalizeIssuerUrl(issuerUrl?: string): string {
  return (issuerUrl?.trim() || DEFAULT_MID_ISSUER_URL).replace(/\/+$/g, "");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/** Encode arbitrary bytes using RFC 4648 base64url without padding. */
export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Decode unpadded or padded base64url text into raw bytes. */
export function decodeBase64Url(segment: string): Uint8Array {
  const normalized =
    segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (segment.length % 4)) % 4);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Generate a cryptographically random URL-safe token of `byteLength` entropy bytes. */
export function randomUrlSafeString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

/** Compute an RFC 7636 `S256` PKCE code challenge from a verifier string. */
export async function computePkceS256Challenge(verifier: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    toArrayBuffer(TEXT_ENCODER.encode(verifier)),
  );
  return encodeBase64Url(new Uint8Array(digest));
}

/** Construct an OAuth 2.1 + PKCE authorization request URL with fresh verifier, state, and nonce. */
export async function createPkceAuthorizationRequest(params: {
  readonly issuerUrl?: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope?: string;
  readonly prompt?: "login" | "consent";
}): Promise<PkceAuthorizationRequest> {
  const issuer = normalizeIssuerUrl(params.issuerUrl);
  const verifier = randomUrlSafeString(48);
  const state = randomUrlSafeString(24);
  const nonce = randomUrlSafeString(24);
  const codeChallenge = await computePkceS256Challenge(verifier);

  const authUrl = new URL(`${issuer}/authorize`);
  authUrl.searchParams.set("client_id", params.clientId);
  authUrl.searchParams.set("redirect_uri", params.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", params.scope ?? "openid profile email offline_access");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  if (params.prompt) {
    authUrl.searchParams.set("prompt", params.prompt);
  }

  return {
    authorizeUrl: authUrl.toString(),
    verifier,
    state,
    nonce,
    codeChallenge,
    redirectUri: params.redirectUri,
  };
}

async function postTokenEndpoint(
  endpointUrl: string,
  formParams: Record<string, string>,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<MidTokenResponse> {
  const response = await fetchFn(endpointUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formParams).toString(),
  });
  const payload = (await response.json().catch(() => null)) as
    (MidTokenResponse & OAuthTokenErrorPayload) | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description || payload?.error || `Token request failed (${response.status}).`,
    );
  }
  return payload;
}

/** Exchange a PKCE authorization code for MoonWitness ID access/ID/refresh tokens. */
export async function exchangeAuthorizationCode(params: {
  readonly issuerUrl?: string;
  readonly clientId: string;
  readonly code: string;
  readonly redirectUri: string;
  readonly codeVerifier: string;
  readonly fetchFn?: typeof fetch;
}): Promise<MidTokenResponse> {
  const issuer = normalizeIssuerUrl(params.issuerUrl);
  return postTokenEndpoint(
    `${issuer}/oauth/token`,
    {
      grant_type: "authorization_code",
      client_id: params.clientId,
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    },
    params.fetchFn,
  );
}

/** Rotate an active `offline_access` refresh token via `/oauth/token`. */
export async function refreshAccessTokens(params: {
  readonly issuerUrl?: string;
  readonly clientId: string;
  readonly refreshToken: string;
  readonly scope?: string;
  readonly fetchFn?: typeof fetch;
}): Promise<MidTokenResponse> {
  const issuer = normalizeIssuerUrl(params.issuerUrl);
  const form: Record<string, string> = {
    grant_type: "refresh_token",
    client_id: params.clientId,
    refresh_token: params.refreshToken,
  };
  if (params.scope) {
    form.scope = params.scope;
  }
  return postTokenEndpoint(`${issuer}/oauth/token`, form, params.fetchFn);
}

/** Revoke an active refresh or access token via RFC 7009 `/oauth/revoke`. */
export async function revokeOAuthToken(params: {
  readonly issuerUrl?: string;
  readonly clientId: string;
  readonly token: string;
  readonly tokenTypeHint?: "refresh_token" | "access_token";
  readonly fetchFn?: typeof fetch;
}): Promise<void> {
  const issuer = normalizeIssuerUrl(params.issuerUrl);
  const form = new URLSearchParams({
    client_id: params.clientId,
    token: params.token,
  });
  if (params.tokenTypeHint) {
    form.set("token_type_hint", params.tokenTypeHint);
  }
  const fetchFn = params.fetchFn ?? globalThis.fetch;
  const response = await fetchFn(`${issuer}/oauth/revoke`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!response.ok) {
    throw new Error(`Token revocation failed (${response.status}).`);
  }
}

/** Fetch OIDC user claims from `/oauth/userinfo` using a Bearer access token. */
export async function fetchOidcUserInfo(params: {
  readonly issuerUrl?: string;
  readonly accessToken: string;
  readonly fetchFn?: typeof fetch;
}): Promise<MidUserInfo> {
  const issuer = normalizeIssuerUrl(params.issuerUrl);
  const fetchFn = params.fetchFn ?? globalThis.fetch;
  const response = await fetchFn(`${issuer}/oauth/userinfo`, {
    headers: { authorization: `Bearer ${params.accessToken}` },
  });
  const payload = (await response.json().catch(() => null)) as
    (MidUserInfo & OAuthTokenErrorPayload) | null;
  if (!response.ok || !payload?.sub) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        `UserInfo request failed (${response.status}).`,
    );
  }
  return payload;
}

/** Decode a compact JWS into header, payload claims, signing input, and raw signature bytes. */
export function decodeJwtParts<
  THeader = { alg?: string; kid?: string; typ?: string },
  TClaims = Partial<MidVerifiedClaims>,
>(
  jwt: string,
): {
  readonly header: THeader;
  readonly claims: TClaims;
  readonly signingInput: string;
  readonly signatureBytes: Uint8Array;
} | null {
  const segments = jwt.trim().split(".");
  if (segments.length !== 3 || !segments[0] || !segments[1] || !segments[2]) {
    return null;
  }
  try {
    const header = JSON.parse(TEXT_DECODER.decode(decodeBase64Url(segments[0]))) as THeader;
    const claims = JSON.parse(TEXT_DECODER.decode(decodeBase64Url(segments[1]))) as TClaims;
    const signatureBytes = decodeBase64Url(segments[2]);
    return {
      header,
      claims,
      signingInput: `${segments[0]}.${segments[1]}`,
      signatureBytes,
    };
  } catch {
    return null;
  }
}

/** Create a TTL-cached remote ES256 JWKS key resolver for edge Workers or Node backends. */
export function createJwksKeyResolver(options?: {
  readonly issuerUrl?: string;
  readonly jwksUrl?: string;
  readonly ttlMs?: number;
  readonly fetchFn?: typeof fetch;
}): {
  readonly resolveByKid: (kid: string) => Promise<PublicEs256Jwk | null>;
  readonly resetCache: () => void;
} {
  const issuer = normalizeIssuerUrl(options?.issuerUrl);
  const jwksUrl = options?.jwksUrl?.trim() || `${issuer}/.well-known/jwks.json`;
  const ttlMs = options?.ttlMs ?? 300_000;
  const fetchFn = options?.fetchFn ?? globalThis.fetch;

  let cached: { fetchedAt: number; keys: readonly PublicEs256Jwk[] } | null = null;

  return {
    async resolveByKid(kid: string): Promise<PublicEs256Jwk | null> {
      const now = Date.now();
      if (!cached || now - cached.fetchedAt > ttlMs) {
        const response = await fetchFn(jwksUrl);
        if (!response.ok) return null;
        const body = (await response.json().catch(() => null)) as {
          keys?: PublicEs256Jwk[];
        } | null;
        if (!body?.keys) return null;
        cached = { fetchedAt: now, keys: body.keys };
      }
      return cached.keys.find((entry) => entry.kid === kid) ?? null;
    },
    resetCache(): void {
      cached = null;
    },
  };
}

/** Verify an ES256 JWT issued by MoonWitness ID against a resolved P-256 public JWK. */
export async function verifyEs256Jwt(params: {
  readonly token: string;
  readonly issuerUrl?: string;
  readonly expectedTokenUse?: "access" | "id";
  readonly expectedAudience?: string;
  readonly expectedNonce?: string;
  readonly resolveJwkByKid: (kid: string) => Promise<PublicEs256Jwk | null>;
  readonly nowEpochSec?: number;
}): Promise<MidVerifiedClaims | null> {
  const decoded = decodeJwtParts<{ alg?: string; kid?: string }, Partial<MidVerifiedClaims>>(
    params.token,
  );
  if (!decoded || decoded.header.alg !== "ES256" || !decoded.header.kid) {
    return null;
  }

  const expectedIssuer = normalizeIssuerUrl(params.issuerUrl);
  const { claims } = decoded;
  if (claims.iss !== expectedIssuer) return null;
  if (params.expectedTokenUse && claims.token_use !== params.expectedTokenUse) return null;
  if (params.expectedNonce && claims.nonce !== params.expectedNonce) return null;

  if (params.expectedAudience) {
    const audList = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
    if (!audList.includes(params.expectedAudience)) return null;
  }

  const nowSec = params.nowEpochSec ?? Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= nowSec) return null;
  if (typeof claims.sub !== "string" || !claims.sub) return null;

  const jwk = await params.resolveJwkByKid(decoded.header.kid);
  if (!jwk || jwk.kty !== "EC" || jwk.crv !== "P-256") return null;

  const publicKey = await globalThis.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const valid = await globalThis.crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    toArrayBuffer(decoded.signatureBytes),
    toArrayBuffer(TEXT_ENCODER.encode(decoded.signingInput)),
  );
  if (!valid) return null;

  return claims as MidVerifiedClaims;
}
