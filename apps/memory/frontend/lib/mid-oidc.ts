const DEFAULT_MID_ISSUER_URL = "https://id.moonwitness.biz.id";
const DEFAULT_MID_CLIENT_ID = "moonwitness-memory";
const PKCE_STORAGE_KEY = "mw_memory_mid_pkce_v1";
const SESSION_STORAGE_KEY = "mw_memory_mid_session_v1";

export const MEMORY_MID_AUTH_EVENT = "mw-memory-mid-auth-change";

export interface MemoryMidSession {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly sub: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: string;
  readonly expiresAtEpochSec: number;
}

interface StoredPkceState {
  verifier: string;
  state: string;
  nonce?: string;
  nextPath?: string;
}

interface OAuthTokenResponse {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface DecodedIdClaims {
  sub?: string;
  preferred_username?: string;
  name?: string;
  role?: string;
  nonce?: string;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/** Normalize configured MoonWitness ID issuer URL by stripping trailing slashes. */
export function getMemoryMidIssuer(): string {
  const configured = process.env.NEXT_PUBLIC_MID_ISSUER_URL?.trim();
  return (configured || DEFAULT_MID_ISSUER_URL).replace(/\/+$/g, "");
}

/** Resolve OAuth 2.1 public client_id for the Memory Deck frontend. */
export function getMemoryMidClientId(): string {
  const configured = process.env.NEXT_PUBLIC_MID_CLIENT_ID?.trim();
  return configured || DEFAULT_MID_CLIENT_ID;
}

function resolveCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(segment: string): Uint8Array {
  const normalized =
    segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (segment.length % 4)) % 4);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function decodeJwtClaims(jwtToken: string | undefined): DecodedIdClaims | null {
  if (!jwtToken) return null;
  const segments = jwtToken.trim().split(".");
  if (segments.length !== 3 || !segments[1]) return null;
  try {
    return JSON.parse(TEXT_DECODER.decode(decodeBase64Url(segments[1]))) as DecodedIdClaims;
  } catch {
    return null;
  }
}

function randomUrlSafeString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

async function computeS256Challenge(verifier: string): Promise<string> {
  const digest = await window.crypto.subtle.digest("SHA-256", TEXT_ENCODER.encode(verifier));
  return encodeBase64Url(new Uint8Array(digest));
}

function dispatchAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MEMORY_MID_AUTH_EVENT));
  }
}

/** Begin OAuth 2.1 + PKCE sign-in flow against MoonWitness ID. */
export async function startMemoryMidLogin(nextPath = "/"): Promise<void> {
  const safeNext = nextPath.startsWith("/") ? nextPath : "/";
  const verifier = randomUrlSafeString(48);
  const state = randomUrlSafeString(24);
  const nonce = randomUrlSafeString(24);
  const codeChallenge = await computeS256Challenge(verifier);
  const issuer = getMemoryMidIssuer();

  window.sessionStorage.setItem(
    PKCE_STORAGE_KEY,
    JSON.stringify({ verifier, state, nonce, nextPath: safeNext }),
  );

  const authorizeUrl = new URL(`${issuer}/authorize`);
  authorizeUrl.searchParams.set("client_id", getMemoryMidClientId());
  authorizeUrl.searchParams.set("redirect_uri", resolveCallbackUrl());
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid profile email offline_access");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  window.location.assign(authorizeUrl.toString());
}

/** Complete OAuth 2.1 PKCE callback on `/auth/callback` and persist active session claims. */
export async function completeMemoryMidCallback(
  searchParams: URLSearchParams,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<{ readonly nextPath: string; readonly session: MemoryMidSession }> {
  const oauthError = searchParams.get("error");
  if (oauthError) {
    throw new Error(searchParams.get("error_description") || oauthError);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    throw new Error("Missing authorization code or state.");
  }

  const rawStored = window.sessionStorage.getItem(PKCE_STORAGE_KEY);
  window.sessionStorage.removeItem(PKCE_STORAGE_KEY);
  if (!rawStored) {
    throw new Error("PKCE session expired. Return to the Memory Deck and sign in again.");
  }

  const stored = JSON.parse(rawStored) as StoredPkceState;
  if (stored.state !== state) {
    throw new Error("State mismatch detected during MoonWitness ID callback.");
  }

  const issuer = getMemoryMidIssuer();
  const response = await fetchFn(`${issuer}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getMemoryMidClientId(),
      code,
      redirect_uri: resolveCallbackUrl(),
      code_verifier: stored.verifier,
    }).toString(),
  });

  const tokenPayload = (await response.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!response.ok || !tokenPayload?.access_token) {
    throw new Error(
      tokenPayload?.error_description ||
        tokenPayload?.error ||
        `Token exchange failed (${response.status}).`,
    );
  }

  const claims =
    decodeJwtClaims(tokenPayload.id_token) ?? decodeJwtClaims(tokenPayload.access_token);
  if (stored.nonce && claims?.nonce !== stored.nonce) {
    throw new Error("ID token nonce mismatch detected during MoonWitness ID callback.");
  }

  const ttlSeconds =
    typeof tokenPayload.expires_in === "number" && tokenPayload.expires_in > 0
      ? tokenPayload.expires_in
      : 900;
  const session: MemoryMidSession = {
    accessToken: tokenPayload.access_token,
    ...(tokenPayload.refresh_token ? { refreshToken: tokenPayload.refresh_token } : {}),
    sub: claims?.sub ?? "unknown",
    username: claims?.preferred_username ?? "witness",
    displayName: claims?.name ?? claims?.preferred_username ?? "Memory Operator",
    role: claims?.role ?? "viewer",
    expiresAtEpochSec: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  dispatchAuthChange();

  return {
    nextPath: stored.nextPath && stored.nextPath.startsWith("/") ? stored.nextPath : "/",
    session,
  };
}

/** Read active MoonWitness ID session from sessionStorage if unexpired. */
export function getStoredMemoryMidSession(): MemoryMidSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MemoryMidSession>;
    if (!parsed.accessToken || typeof parsed.expiresAtEpochSec !== "number") {
      return null;
    }
    if (parsed.expiresAtEpochSec <= Math.floor(Date.now() / 1000)) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed as MemoryMidSession;
  } catch {
    return null;
  }
}

/** Return active Bearer access token when a valid MoonWitness ID session exists. */
export function getStoredMemoryAccessToken(): string | null {
  return getStoredMemoryMidSession()?.accessToken ?? null;
}

/** Attach Authorization Bearer header when a MoonWitness ID access token is available. */
export function buildMemoryAuthHeaders(
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  const token = getStoredMemoryAccessToken();
  if (!token) return { ...extraHeaders };
  return { ...extraHeaders, Authorization: `Bearer ${token}` };
}

/** Clear local MoonWitness ID session state and revoke refresh token best-effort. */
export async function clearMemoryMidSession(
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<void> {
  if (typeof window === "undefined") return;
  const current = getStoredMemoryMidSession();
  try {
    window.sessionStorage.removeItem(PKCE_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* Ignore storage unavailability during teardown. */
  }
  dispatchAuthChange();
  if (current?.refreshToken) {
    const form = new URLSearchParams({
      client_id: getMemoryMidClientId(),
      token: current.refreshToken,
      token_type_hint: "refresh_token",
    });
    await fetchFn(`${getMemoryMidIssuer()}/oauth/revoke`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    }).catch(() => {});
  }
}
