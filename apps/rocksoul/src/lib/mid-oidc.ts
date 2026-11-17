import {
  DEFAULT_MID_ISSUER_URL,
  createPkceAuthorizationRequest,
  decodeJwtParts,
  exchangeAuthorizationCode,
  fetchOidcUserInfo,
  normalizeIssuerUrl,
  refreshAccessTokens,
  revokeOAuthToken,
  type MidTokenResponse,
  type MidUserInfo,
} from "@moonwitness/core";
import { call, isDesktop } from "./api";

export const ROCKSOUL_MID_CLIENT_ID = "rocksoul-dx";
export const ROCKSOUL_MID_SESSION_KEY = "mw_rocksoul_oidc_session";
export const ROCKSOUL_MID_PKCE_KEY = "mw_rocksoul_oidc_pkce";
export const ROCKSOUL_MID_AUTH_EVENT = "rocksoul-mid-auth-change";

const DEFAULT_SCOPE = "openid profile email offline_access";
const REFRESH_LEEWAY_SECONDS = 30;

export interface RocksoulOidcSession {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly accessToken: string;
  readonly idToken: string;
  readonly refreshToken?: string;
  readonly scope?: string;
  readonly expiresAtEpochSec: number;
  readonly user: MidUserInfo;
}

export interface RocksoulOidcOptions {
  readonly issuerUrl?: string | undefined;
  readonly clientId?: string | undefined;
  readonly scope?: string | undefined;
  readonly fetchFn?: typeof fetch | undefined;
  readonly nowEpochSec?: (() => number) | undefined;
  readonly navigateFn?: ((url: string) => void) | undefined;
  readonly returnHash?: string | undefined;
}

interface PendingBrowserPkce {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly verifier: string;
  readonly state: string;
  readonly nonce: string;
  readonly redirectUri: string;
  readonly returnHash: string;
}

const inFlightCallbacks = new Map<
  string,
  Promise<{ readonly session: RocksoulOidcSession; readonly returnHash: string }>
>();

function currentEpochSeconds(nowEpochSec?: () => number): number {
  return (nowEpochSec ?? (() => Math.floor(Date.now() / 1000)))();
}

function readStorage(storageKind: "localStorage" | "sessionStorage", key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window[storageKind].getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storageKind: "localStorage" | "sessionStorage", key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window[storageKind].setItem(key, value);
  } catch {
    // Ignore storage unavailability in restricted contexts
  }
}

function removeStorage(storageKind: "localStorage" | "sessionStorage", key: string): void {
  if (typeof window === "undefined") return;
  try {
    window[storageKind].removeItem(key);
  } catch {
    // Ignore storage unavailability in restricted contexts
  }
}

function dispatchAuthChange(): void {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(ROCKSOUL_MID_AUTH_EVENT));
  }
}

function normalizeReturnHash(hash?: string): string {
  const candidate = (hash ?? "").trim();
  return candidate.startsWith("#/") ? candidate : "#/deck";
}

/** Resolve configured MoonWitness ID issuer URL for ROCKSOUL - DX. */
export function resolveRocksoulMidIssuer(issuerUrl?: string): string {
  const envIssuer = (import.meta as { env?: Record<string, string | undefined> }).env?.[
    "VITE_MID_ISSUER_URL"
  ];
  return normalizeIssuerUrl(issuerUrl ?? envIssuer ?? DEFAULT_MID_ISSUER_URL);
}

/** Resolve browser OAuth callback URI on the active web origin. */
export function getBrowserCallbackUrl(): string {
  if (typeof window === "undefined" || !window.location?.origin) {
    throw new Error("Browser origin is unavailable for MoonWitness ID callback.");
  }
  return `${window.location.origin}/auth/callback`;
}

/** Save an active MoonWitness ID session to localStorage and notify listeners. */
export function persistRocksoulOidcSession(session: RocksoulOidcSession): void {
  writeStorage("localStorage", ROCKSOUL_MID_SESSION_KEY, JSON.stringify(session));
  dispatchAuthChange();
}

/** Clear local MoonWitness ID session and PKCE state without revoking remotely. */
export function clearStoredRocksoulOidcSession(): void {
  removeStorage("localStorage", ROCKSOUL_MID_SESSION_KEY);
  removeStorage("sessionStorage", ROCKSOUL_MID_PKCE_KEY);
  dispatchAuthChange();
}

/** Load persisted MoonWitness ID session from localStorage if valid or refreshable. */
export function getStoredRocksoulOidcSession(
  nowEpochSec?: () => number,
): RocksoulOidcSession | null {
  const raw = readStorage("localStorage", ROCKSOUL_MID_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RocksoulOidcSession>;
    if (
      !parsed.accessToken ||
      !parsed.idToken ||
      !parsed.issuerUrl ||
      !parsed.clientId ||
      typeof parsed.expiresAtEpochSec !== "number" ||
      !Number.isFinite(parsed.expiresAtEpochSec) ||
      !parsed.user?.sub ||
      !parsed.user?.preferred_username
    ) {
      return null;
    }
    if (parsed.expiresAtEpochSec <= currentEpochSeconds(nowEpochSec) && !parsed.refreshToken) {
      removeStorage("localStorage", ROCKSOUL_MID_SESSION_KEY);
      return null;
    }
    return parsed as RocksoulOidcSession;
  } catch {
    return null;
  }
}

async function buildSessionFromTokens(params: {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly tokens: MidTokenResponse;
  readonly expectedNonce?: string | undefined;
  readonly fallbackUser?: MidUserInfo | undefined;
  readonly fetchFn?: typeof fetch | undefined;
  readonly nowEpochSec: number;
}): Promise<RocksoulOidcSession> {
  if (params.expectedNonce) {
    const decoded = decodeJwtParts<{ alg?: string }, { nonce?: string }>(params.tokens.id_token);
    if (decoded?.claims.nonce !== params.expectedNonce) {
      throw new Error("ID token nonce mismatch detected during MoonWitness ID sign-in.");
    }
  }

  let user: MidUserInfo;
  try {
    user = await fetchOidcUserInfo({
      issuerUrl: params.issuerUrl,
      accessToken: params.tokens.access_token,
      ...(params.fetchFn ? { fetchFn: params.fetchFn } : {}),
    });
  } catch (error) {
    if (!params.fallbackUser) throw error;
    user = params.fallbackUser;
  }

  return {
    issuerUrl: params.issuerUrl,
    clientId: params.clientId,
    accessToken: params.tokens.access_token,
    idToken: params.tokens.id_token,
    ...(params.tokens.refresh_token ? { refreshToken: params.tokens.refresh_token } : {}),
    ...(params.tokens.scope ? { scope: params.tokens.scope } : {}),
    expiresAtEpochSec: params.nowEpochSec + Math.max(1, params.tokens.expires_in),
    user,
  };
}

/**
 * Start OAuth 2.1 + PKCE sign-in against MoonWitness ID.
 * Uses Tauri's native loopback listener when running in desktop mode,
 * or redirects the browser to `/auth/callback` in web mode.
 */
export async function signInWithMoonWitnessId(
  options?: RocksoulOidcOptions,
): Promise<RocksoulOidcSession | null> {
  const issuerUrl = resolveRocksoulMidIssuer(options?.issuerUrl);
  const clientId = options?.clientId?.trim() || ROCKSOUL_MID_CLIENT_ID;
  const scope = options?.scope?.trim() || DEFAULT_SCOPE;

  if (isDesktop()) {
    const pkce = await createPkceAuthorizationRequest({
      issuerUrl,
      clientId,
      redirectUri: "http://127.0.0.1/callback",
      scope,
    });
    const callback = await call("await_mid_loopback_callback", {
      authorizeUrl: pkce.authorizeUrl,
    });
    if (callback.state !== pkce.state) {
      throw new Error("OAuth state mismatch received on loopback callback.");
    }
    const tokens = await exchangeAuthorizationCode({
      issuerUrl,
      clientId,
      code: callback.code,
      redirectUri: callback.redirect_uri,
      codeVerifier: pkce.verifier,
      ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
    });
    const session = await buildSessionFromTokens({
      issuerUrl,
      clientId,
      tokens,
      expectedNonce: pkce.nonce,
      ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
      nowEpochSec: currentEpochSeconds(options?.nowEpochSec),
    });
    persistRocksoulOidcSession(session);
    return session;
  }

  const redirectUri = getBrowserCallbackUrl();
  const pkce = await createPkceAuthorizationRequest({
    issuerUrl,
    clientId,
    redirectUri,
    scope,
  });
  const pending: PendingBrowserPkce = {
    issuerUrl,
    clientId,
    verifier: pkce.verifier,
    state: pkce.state,
    nonce: pkce.nonce,
    redirectUri,
    returnHash: normalizeReturnHash(
      options?.returnHash ?? (typeof window !== "undefined" ? window.location.hash : undefined),
    ),
  };
  writeStorage("sessionStorage", ROCKSOUL_MID_PKCE_KEY, JSON.stringify(pending));
  const navigate = options?.navigateFn ?? ((url: string) => window.location.assign(url));
  navigate(pkce.authorizeUrl);
  return null;
}

/** Complete browser `/auth/callback` OAuth 2.1 PKCE code exchange and persist session. */
export async function completeBrowserOidcCallback(
  searchParams: URLSearchParams,
  options?: RocksoulOidcOptions,
): Promise<{ readonly session: RocksoulOidcSession; readonly returnHash: string }> {
  const oauthError = searchParams.get("error");
  if (oauthError) {
    removeStorage("sessionStorage", ROCKSOUL_MID_PKCE_KEY);
    throw new Error(searchParams.get("error_description") || oauthError);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    throw new Error("Missing authorization code or state.");
  }

  const inflightKey = `${code}:${state}`;
  const existing = inFlightCallbacks.get(inflightKey);
  if (existing) return existing;

  const job = (async () => {
    const rawPending = readStorage("sessionStorage", ROCKSOUL_MID_PKCE_KEY);
    removeStorage("sessionStorage", ROCKSOUL_MID_PKCE_KEY);
    if (!rawPending) {
      throw new Error("PKCE sign-in state expired. Start MoonWitness ID sign-in again.");
    }
    const pending = JSON.parse(rawPending) as Partial<PendingBrowserPkce>;
    if (
      !pending.verifier ||
      !pending.state ||
      !pending.redirectUri ||
      !pending.issuerUrl ||
      !pending.clientId
    ) {
      throw new Error("Stored PKCE sign-in state is malformed.");
    }
    if (pending.state !== state) {
      throw new Error("State mismatch detected during MoonWitness ID callback.");
    }

    const tokens = await exchangeAuthorizationCode({
      issuerUrl: pending.issuerUrl,
      clientId: pending.clientId,
      code,
      redirectUri: pending.redirectUri,
      codeVerifier: pending.verifier,
      ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
    });
    const session = await buildSessionFromTokens({
      issuerUrl: pending.issuerUrl,
      clientId: pending.clientId,
      tokens,
      expectedNonce: pending.nonce,
      ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
      nowEpochSec: currentEpochSeconds(options?.nowEpochSec),
    });
    persistRocksoulOidcSession(session);
    return {
      session,
      returnHash: normalizeReturnHash(pending.returnHash),
    };
  })().finally(() => {
    inFlightCallbacks.delete(inflightKey);
  });

  inFlightCallbacks.set(inflightKey, job);
  return job;
}

/** Rotate an active `offline_access` refresh token and persist updated session. */
export async function refreshRocksoulOidcSession(
  options?: RocksoulOidcOptions,
): Promise<RocksoulOidcSession> {
  const current = getStoredRocksoulOidcSession(options?.nowEpochSec);
  if (!current?.refreshToken) {
    throw new Error("No refreshable MoonWitness ID session is stored.");
  }
  const tokens = await refreshAccessTokens({
    issuerUrl: current.issuerUrl,
    clientId: current.clientId,
    refreshToken: current.refreshToken,
    ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
  });
  const next = await buildSessionFromTokens({
    issuerUrl: current.issuerUrl,
    clientId: current.clientId,
    tokens,
    fallbackUser: current.user,
    ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
    nowEpochSec: currentEpochSeconds(options?.nowEpochSec),
  });
  persistRocksoulOidcSession(next);
  return next;
}

/** Return an unexpired MoonWitness ID session, rotating via refresh token if near expiry. */
export async function resolveValidRocksoulOidcSession(
  options?: RocksoulOidcOptions,
): Promise<RocksoulOidcSession | null> {
  const current = getStoredRocksoulOidcSession(options?.nowEpochSec);
  if (!current) return null;
  const now = currentEpochSeconds(options?.nowEpochSec);
  if (current.expiresAtEpochSec - REFRESH_LEEWAY_SECONDS > now) {
    return current;
  }
  if (!current.refreshToken) {
    clearStoredRocksoulOidcSession();
    return null;
  }
  try {
    return await refreshRocksoulOidcSession(options);
  } catch {
    clearStoredRocksoulOidcSession();
    return null;
  }
}

/** Clear local MoonWitness ID session and revoke active token best-effort. */
export async function signOutRocksoulOidc(options?: RocksoulOidcOptions): Promise<void> {
  const current = getStoredRocksoulOidcSession(options?.nowEpochSec);
  clearStoredRocksoulOidcSession();
  const tokenToRevoke = current?.refreshToken ?? current?.accessToken;
  if (!current || !tokenToRevoke) return;
  await revokeOAuthToken({
    issuerUrl: current.issuerUrl,
    clientId: current.clientId,
    token: tokenToRevoke,
    tokenTypeHint: current.refreshToken ? "refresh_token" : "access_token",
    ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
  }).catch(() => {});
}
