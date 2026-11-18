import {
  DEFAULT_MID_ISSUER_URL,
  createJwksKeyResolver,
  createPkceAuthorizationRequest,
  decodeJwtParts,
  exchangeAuthorizationCode,
  fetchOidcUserInfo,
  normalizeIssuerUrl,
  verifyEs256Jwt,
  type MidTokenResponse,
  type MidUserInfo,
  type MidVerifiedClaims,
} from "./oidc";

export type BrowserStorageKind = "localStorage" | "sessionStorage";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface RuntimeWindowLike {
  readonly location?: {
    readonly origin?: string;
    readonly hash?: string;
    assign?: (url: string) => void;
  };
  readonly localStorage?: StorageAdapter;
  readonly sessionStorage?: StorageAdapter;
  dispatchEvent?: (event: unknown) => boolean;
}

function getRuntimeWindow(): RuntimeWindowLike | undefined {
  return (globalThis as { readonly window?: RuntimeWindowLike }).window;
}

function getStorage(kind: BrowserStorageKind): StorageAdapter | null {
  const win = getRuntimeWindow();
  const fromWindow = win?.[kind];
  if (fromWindow) return fromWindow;
  const fromGlobal = (globalThis as Record<string, unknown>)[kind] as StorageAdapter | undefined;
  return fromGlobal && typeof fromGlobal.getItem === "function" ? fromGlobal : null;
}

export function readBrowserStorage(kind: BrowserStorageKind, key: string): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeBrowserStorage(kind: BrowserStorageKind, key: string, value: string): void {
  try {
    getStorage(kind)?.setItem(key, value);
  } catch {
    // Ignore storage unavailability in restricted contexts.
  }
}

export function removeBrowserStorage(kind: BrowserStorageKind, key: string): void {
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    // Ignore storage unavailability in restricted contexts.
  }
}

export function dispatchBrowserAuthEvent(eventName: string): void {
  const win = getRuntimeWindow();
  if (!win || typeof win.dispatchEvent !== "function") return;
  const CustomEventCtor = (globalThis as { readonly CustomEvent?: new (type: string) => unknown })
    .CustomEvent;
  const event =
    typeof CustomEventCtor === "function" ? new CustomEventCtor(eventName) : { type: eventName };
  win.dispatchEvent(event);
}

export function sanitizeRedirectPath(rawPath: unknown, fallback = "/"): string {
  if (typeof rawPath === "string" && rawPath.startsWith("/") && !rawPath.startsWith("//")) {
    return rawPath;
  }
  return fallback;
}

export function resolveBrowserOriginCallbackUrl(path = "/auth/callback"): string {
  const origin = getRuntimeWindow()?.location?.origin;
  if (!origin) {
    throw new Error("Browser origin is unavailable for MoonWitness ID callback.");
  }
  return `${origin}${path}`;
}

export function extractOAuthCallbackParams(
  searchParams: { get(name: string): string | null },
  options?: { readonly onError?: () => void },
): { readonly code: string; readonly state: string } {
  const oauthError = searchParams.get("error");
  if (oauthError) {
    options?.onError?.();
    throw new Error(searchParams.get("error_description") || oauthError);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    throw new Error("Missing authorization code or state.");
  }
  return { code, state };
}

export interface BrowserPkceRedirectOptions {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly storageKey: string;
  readonly scope?: string | undefined;
  readonly nextPath?: string | undefined;
  readonly extraState?: Record<string, unknown> | undefined;
  readonly navigateFn?: ((url: string) => void) | undefined;
}

export async function beginBrowserPkceRedirect(options: BrowserPkceRedirectOptions): Promise<{
  readonly verifier: string;
  readonly state: string;
  readonly nonce: string;
  readonly redirectUri: string;
}> {
  const pkce = await createPkceAuthorizationRequest({
    issuerUrl: options.issuerUrl,
    clientId: options.clientId,
    redirectUri: options.redirectUri,
    ...(options.scope ? { scope: options.scope } : {}),
  });

  writeBrowserStorage(
    "sessionStorage",
    options.storageKey,
    JSON.stringify({
      issuerUrl: options.issuerUrl,
      clientId: options.clientId,
      verifier: pkce.verifier,
      state: pkce.state,
      nonce: pkce.nonce,
      redirectUri: options.redirectUri,
      ...(options.nextPath !== undefined ? { nextPath: options.nextPath } : {}),
      ...(options.extraState ?? {}),
    }),
  );

  const assign =
    options.navigateFn ?? ((url: string) => getRuntimeWindow()?.location?.assign?.(url));
  assign(pkce.authorizeUrl);

  return {
    verifier: pkce.verifier,
    state: pkce.state,
    nonce: pkce.nonce,
    redirectUri: options.redirectUri,
  };
}

export interface StoredPkceEnvelope {
  readonly issuerUrl?: string | undefined;
  readonly clientId?: string | undefined;
  readonly verifier: string;
  readonly state: string;
  readonly nonce?: string | undefined;
  readonly redirectUri?: string | undefined;
  readonly nextPath?: string | undefined;
  readonly returnHash?: string | undefined;
}

export function consumeStoredPkceEnvelope(
  storageKey: string,
  expectedState: string,
  messages?: {
    readonly expired?: string;
    readonly malformed?: string;
    readonly mismatch?: string;
  },
): StoredPkceEnvelope {
  const raw = readBrowserStorage("sessionStorage", storageKey);
  removeBrowserStorage("sessionStorage", storageKey);
  if (!raw) {
    throw new Error(messages?.expired ?? "PKCE session expired. Start sign-in again.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(messages?.malformed ?? "Invalid PKCE session state.");
  }

  const verifier = parsed?.["verifier"];
  const storedState = parsed?.["state"];
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof verifier !== "string" ||
    !verifier ||
    typeof storedState !== "string" ||
    !storedState
  ) {
    throw new Error(messages?.malformed ?? "Stored PKCE sign-in state is malformed.");
  }

  if (storedState !== expectedState) {
    throw new Error(
      messages?.mismatch ?? "State mismatch detected during MoonWitness ID callback.",
    );
  }

  return parsed as unknown as StoredPkceEnvelope;
}

export interface BffDisplaySession {
  readonly sub: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: string;
  readonly expiresAtEpochSec: number;
}

export function resolveConfiguredMidIssuer(configured?: string): string {
  return normalizeIssuerUrl(configured ?? DEFAULT_MID_ISSUER_URL);
}

export async function verifyDirectIdTokenAndBuildDisplaySession(params: {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly code: string;
  readonly redirectUri: string;
  readonly verifier: string;
  readonly nonce: string;
  readonly fetchFn: typeof fetch;
}): Promise<BffDisplaySession> {
  const tokens = await exchangeAuthorizationCode({
    issuerUrl: params.issuerUrl,
    clientId: params.clientId,
    code: params.code,
    redirectUri: params.redirectUri,
    codeVerifier: params.verifier,
    fetchFn: params.fetchFn,
  });

  if (typeof tokens.id_token !== "string" || !tokens.id_token.trim()) {
    throw new Error("Missing id_token in MoonWitness ID token response.");
  }

  const jwksResolver = createJwksKeyResolver({
    issuerUrl: params.issuerUrl,
    fetchFn: params.fetchFn,
  });

  let verifiedClaims: MidVerifiedClaims | null;
  try {
    verifiedClaims = await verifyEs256Jwt({
      token: tokens.id_token,
      issuerUrl: params.issuerUrl,
      expectedTokenUse: "id",
      expectedAudience: params.clientId,
      expectedNonce: params.nonce,
      resolveJwkByKid: jwksResolver.resolveByKid,
    });
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : "JWKS unavailable";
    throw new Error(`MoonWitness ID token verification failed: ${reason}`, { cause: err });
  }

  if (!verifiedClaims) {
    throw new Error("MoonWitness ID token verification failed.");
  }

  const azp = (verifiedClaims as { readonly azp?: unknown }).azp;
  if (azp !== undefined && azp !== params.clientId) {
    throw new Error("MoonWitness ID token authorized party mismatch.");
  }
  if (
    Array.isArray(verifiedClaims.aud) &&
    verifiedClaims.aud.length > 1 &&
    azp !== params.clientId
  ) {
    throw new Error("MoonWitness ID token audience includes untrusted parties.");
  }

  const nowEpochSec = Math.floor(Date.now() / 1000);
  const expiresInSec =
    typeof tokens.expires_in === "number" && Number.isFinite(tokens.expires_in)
      ? Math.max(1, Math.floor(tokens.expires_in))
      : Math.max(1, verifiedClaims.exp - nowEpochSec);

  const username =
    typeof verifiedClaims.preferred_username === "string" &&
    verifiedClaims.preferred_username.trim()
      ? verifiedClaims.preferred_username
      : "witness";
  const displayName =
    typeof verifiedClaims.name === "string" && verifiedClaims.name.trim()
      ? verifiedClaims.name
      : username !== "witness"
        ? username
        : "Sanctuary Witness";
  const role =
    typeof verifiedClaims.role === "string" && verifiedClaims.role.trim()
      ? verifiedClaims.role
      : "viewer";

  return {
    sub: verifiedClaims.sub,
    username,
    displayName,
    role,
    expiresAtEpochSec: nowEpochSec + expiresInSec,
  };
}

export async function buildOidcSessionFromTokens(params: {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly tokens: MidTokenResponse;
  readonly expectedNonce?: string | undefined;
  readonly fallbackUser?: MidUserInfo | undefined;
  readonly fetchFn?: typeof fetch | undefined;
  readonly nowEpochSec: number;
}): Promise<{
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly accessToken: string;
  readonly idToken: string;
  readonly refreshToken?: string;
  readonly scope?: string;
  readonly expiresAtEpochSec: number;
  readonly user: MidUserInfo;
}> {
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

export function createCallbackDeduplicator<T>() {
  const inFlight = new Map<string, Promise<T>>();
  return async (key: string, work: () => Promise<T>): Promise<T> => {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const job = work().finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, job);
    return job;
  };
}
