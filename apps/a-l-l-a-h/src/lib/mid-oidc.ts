import {
  DEFAULT_MID_ISSUER_URL,
  createPkceAuthorizationRequest,
  decodeJwtParts,
  exchangeAuthorizationCode,
  normalizeIssuerUrl,
  revokeOAuthToken,
} from "@moonwitness/core";

const PKCE_STORAGE_KEY = "allah_sanctuary_mid_pkce_v1";
const SESSION_STORAGE_KEY = "allah_sanctuary_mid_session_v1";
export const SANCTUARY_MID_AUTH_EVENT = "allah-sanctuary-mid-auth-change";

export interface SanctuaryMidSession {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly sub: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: string;
  readonly expiresAtEpochSec: number;
}

export const ALLAH_SANCTUARY_CLIENT_ID = "allah-sanctuary";

/** Resolve configured MoonWitness ID issuer URL for A-L-L-A-H Sanctuary. */
export function getSanctuaryMidIssuer(): string {
  return normalizeIssuerUrl(process.env.NEXT_PUBLIC_MID_ISSUER_URL ?? DEFAULT_MID_ISSUER_URL);
}

function getCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

function dispatchAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SANCTUARY_MID_AUTH_EVENT));
  }
}

/** Begin OAuth 2.1 + PKCE sign-in flow against `id.moonwitness.biz.id`. */
export async function startSanctuaryMidLogin(nextPath = "/"): Promise<void> {
  const safeNext = nextPath.startsWith("/") ? nextPath : "/";
  const pkce = await createPkceAuthorizationRequest({
    issuerUrl: getSanctuaryMidIssuer(),
    clientId: ALLAH_SANCTUARY_CLIENT_ID,
    redirectUri: getCallbackUrl(),
  });

  window.sessionStorage.setItem(
    PKCE_STORAGE_KEY,
    JSON.stringify({
      verifier: pkce.verifier,
      state: pkce.state,
      nonce: pkce.nonce,
      nextPath: safeNext,
    }),
  );
  window.location.assign(pkce.authorizeUrl);
}

/** Complete OAuth 2.1 PKCE callback on `/auth/callback` and persist session claims. */
export async function completeSanctuaryMidCallback(
  searchParams: URLSearchParams,
  fetchFn?: typeof fetch,
): Promise<{ readonly nextPath: string; readonly session: SanctuaryMidSession }> {
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
    throw new Error("PKCE session expired. Return to the sanctuary gate and sign in again.");
  }

  const stored = JSON.parse(rawStored) as {
    verifier: string;
    state: string;
    nonce?: string;
    nextPath?: string;
  };
  if (stored.state !== state) {
    throw new Error("State mismatch detected during MoonWitness ID callback.");
  }

  const tokens = await exchangeAuthorizationCode({
    issuerUrl: getSanctuaryMidIssuer(),
    clientId: ALLAH_SANCTUARY_CLIENT_ID,
    code,
    redirectUri: getCallbackUrl(),
    codeVerifier: stored.verifier,
    fetchFn,
  });

  const decodedId = decodeJwtParts<
    { alg?: string },
    {
      sub?: string;
      preferred_username?: string;
      name?: string;
      role?: string;
      nonce?: string;
    }
  >(tokens.id_token);

  if (stored.nonce && decodedId?.claims.nonce !== stored.nonce) {
    throw new Error("ID token nonce mismatch detected during MoonWitness ID callback.");
  }

  const claims = decodedId?.claims;
  const session: SanctuaryMidSession = {
    accessToken: tokens.access_token,
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    sub: claims?.sub ?? "unknown",
    username: claims?.preferred_username ?? "witness",
    displayName: claims?.name ?? claims?.preferred_username ?? "Sanctuary Witness",
    role: claims?.role ?? "viewer",
    expiresAtEpochSec: Math.floor(Date.now() / 1000) + Math.max(1, tokens.expires_in),
  };

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  dispatchAuthChange();

  return {
    nextPath: stored.nextPath && stored.nextPath.startsWith("/") ? stored.nextPath : "/",
    session,
  };
}

/** Read the currently active Sanctuary MoonWitness ID session if unexpired. */
export function getStoredSanctuaryMidSession(): SanctuaryMidSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SanctuaryMidSession>;
    if (!parsed.accessToken || typeof parsed.expiresAtEpochSec !== "number") {
      return null;
    }
    if (parsed.expiresAtEpochSec <= Math.floor(Date.now() / 1000)) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed as SanctuaryMidSession;
  } catch {
    return null;
  }
}

/** Clear local Sanctuary session and revoke active refresh token best-effort. */
export async function clearSanctuaryMidSession(fetchFn?: typeof fetch): Promise<void> {
  if (typeof window === "undefined") return;
  const current = getStoredSanctuaryMidSession();
  try {
    window.sessionStorage.removeItem(PKCE_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage unavailability
  }
  dispatchAuthChange();
  if (current?.refreshToken) {
    await revokeOAuthToken({
      issuerUrl: getSanctuaryMidIssuer(),
      clientId: ALLAH_SANCTUARY_CLIENT_ID,
      token: current.refreshToken,
      tokenTypeHint: "refresh_token",
      fetchFn,
    }).catch(() => {});
  }
}
