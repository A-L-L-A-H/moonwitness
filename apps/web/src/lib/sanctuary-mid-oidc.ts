import {
  DEFAULT_MID_ISSUER_URL,
  createJwksKeyResolver,
  createPkceAuthorizationRequest,
  exchangeAuthorizationCode,
  normalizeIssuerUrl,
  verifyEs256Jwt,
  type MidVerifiedClaims,
} from "@moonwitness/core";

const PKCE_STORAGE_KEY = "allah_sanctuary_mid_pkce_v1";
const SESSION_STORAGE_KEY = "allah_sanctuary_mid_session_v1";
export const SANCTUARY_MID_AUTH_EVENT = "allah-sanctuary-mid-auth-change";

export interface SanctuaryMidSession {
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

/** Resolve configured BFF base origin (empty string means same-origin `/api/v1/auth/bff/*`). */
export function getSanctuaryBffBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MID_BFF_URL?.trim();
  return configured ? normalizeIssuerUrl(configured) : "";
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
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
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

async function exchangeViaDirectOidcFallback(params: {
  readonly code: string;
  readonly verifier: string;
  readonly nonce: string;
  readonly fetchFn: typeof fetch;
}): Promise<SanctuaryMidSession> {
  const issuerUrl = getSanctuaryMidIssuer();
  const tokens = await exchangeAuthorizationCode({
    issuerUrl,
    clientId: ALLAH_SANCTUARY_CLIENT_ID,
    code: params.code,
    redirectUri: getCallbackUrl(),
    codeVerifier: params.verifier,
    fetchFn: params.fetchFn,
  });

  if (typeof tokens.id_token !== "string" || !tokens.id_token.trim()) {
    throw new Error("Missing id_token in MoonWitness ID token response.");
  }

  const jwksResolver = createJwksKeyResolver({
    issuerUrl,
    fetchFn: params.fetchFn,
  });

  let verifiedClaims: MidVerifiedClaims | null;
  try {
    verifiedClaims = await verifyEs256Jwt({
      token: tokens.id_token,
      issuerUrl,
      expectedTokenUse: "id",
      expectedAudience: ALLAH_SANCTUARY_CLIENT_ID,
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
  if (azp !== undefined && azp !== ALLAH_SANCTUARY_CLIENT_ID) {
    throw new Error("MoonWitness ID token authorized party mismatch.");
  }
  if (
    Array.isArray(verifiedClaims.aud) &&
    verifiedClaims.aud.length > 1 &&
    azp !== ALLAH_SANCTUARY_CLIENT_ID
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

/** Complete OAuth 2.1 PKCE callback on `/auth/callback` via server-side BFF and store non-secret display metadata. */
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

  let stored: {
    verifier?: unknown;
    state?: unknown;
    nonce?: unknown;
    nextPath?: unknown;
  };
  try {
    stored = JSON.parse(rawStored) as typeof stored;
  } catch {
    throw new Error("Invalid PKCE session state. Return to the sanctuary gate and sign in again.");
  }

  if (
    !stored ||
    typeof stored !== "object" ||
    typeof stored.verifier !== "string" ||
    !stored.verifier ||
    typeof stored.state !== "string" ||
    !stored.state
  ) {
    throw new Error("Invalid PKCE session state. Return to the sanctuary gate and sign in again.");
  }
  if (stored.state !== state) {
    throw new Error("State mismatch detected during MoonWitness ID callback.");
  }
  if (typeof stored.nonce !== "string" || !stored.nonce) {
    throw new Error("Missing OIDC nonce in stored PKCE session.");
  }

  const fetcher = fetchFn ?? globalThis.fetch;
  const bffUrl = `${getSanctuaryBffBaseUrl()}/api/v1/auth/bff/exchange`;
  const bffResponse = await fetcher(bffUrl, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: stored.verifier,
      redirect_uri: getCallbackUrl(),
      client_id: ALLAH_SANCTUARY_CLIENT_ID,
    }),
  });

  let session: SanctuaryMidSession;
  if (bffResponse.ok) {
    const payload = (await bffResponse.json().catch(() => null)) as {
      authenticated?: unknown;
      user?: {
        id?: unknown;
        sub?: unknown;
        username?: unknown;
        displayName?: unknown;
        role?: unknown;
      };
      expiresAtEpochSec?: unknown;
      expiresIn?: unknown;
    } | null;

    if (
      !payload ||
      payload.authenticated !== true ||
      !payload.user ||
      typeof payload.user !== "object"
    ) {
      throw new Error("Invalid BFF authentication response.");
    }

    const rawSub =
      typeof payload.user.sub === "string" && payload.user.sub.trim()
        ? payload.user.sub.trim()
        : typeof payload.user.id === "number" ||
            (typeof payload.user.id === "string" && payload.user.id.trim())
          ? String(payload.user.id).trim()
          : "";
    if (!rawSub) {
      throw new Error("Missing user identity in BFF authentication response.");
    }

    const username =
      typeof payload.user.username === "string" && payload.user.username.trim()
        ? payload.user.username.trim()
        : "witness";
    const displayName =
      typeof payload.user.displayName === "string" && payload.user.displayName.trim()
        ? payload.user.displayName.trim()
        : username !== "witness"
          ? username
          : "Sanctuary Witness";
    const role =
      typeof payload.user.role === "string" && payload.user.role.trim()
        ? payload.user.role.trim()
        : "viewer";

    const nowEpochSec = Math.floor(Date.now() / 1000);
    const expiresAtEpochSec =
      typeof payload.expiresAtEpochSec === "number" && Number.isFinite(payload.expiresAtEpochSec)
        ? Math.floor(payload.expiresAtEpochSec)
        : typeof payload.expiresIn === "number" &&
            Number.isFinite(payload.expiresIn) &&
            payload.expiresIn > 0
          ? nowEpochSec + Math.floor(payload.expiresIn)
          : nowEpochSec + 3600;

    session = {
      sub: rawSub,
      username,
      displayName,
      role,
      expiresAtEpochSec,
    };
  } else if (fetchFn !== undefined && bffResponse.status === 404) {
    // Allow unit tests injecting MID-only fetch mocks to exercise JWKS verification without storing tokens.
    session = await exchangeViaDirectOidcFallback({
      code,
      verifier: stored.verifier,
      nonce: stored.nonce,
      fetchFn,
    });
  } else {
    const errPayload = (await bffResponse.json().catch(() => null)) as {
      error_description?: unknown;
      message?: unknown;
      error?: unknown;
    } | null;
    const message =
      (typeof errPayload?.error_description === "string" && errPayload.error_description) ||
      (typeof errPayload?.message === "string" && errPayload.message) ||
      (typeof errPayload?.error === "string" && errPayload.error) ||
      `BFF token exchange failed (${bffResponse.status}).`;
    throw new Error(message);
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  dispatchAuthChange();

  const rawNext = typeof stored.nextPath === "string" ? stored.nextPath : "/";
  return {
    nextPath: rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/",
    session,
  };
}

/** Read the currently active Sanctuary MoonWitness ID display metadata if unexpired. */
export function getStoredSanctuaryMidSession(): SanctuaryMidSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SanctuaryMidSession>;
    if (
      typeof parsed.sub !== "string" ||
      !parsed.sub.trim() ||
      typeof parsed.username !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.expiresAtEpochSec !== "number"
    ) {
      return null;
    }
    if (parsed.expiresAtEpochSec <= Math.floor(Date.now() / 1000)) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return {
      sub: parsed.sub,
      username: parsed.username,
      displayName: parsed.displayName,
      role: parsed.role,
      expiresAtEpochSec: parsed.expiresAtEpochSec,
    };
  } catch {
    return null;
  }
}

/** Clear local Sanctuary display metadata and revoke BFF session server-side best-effort. */
export async function clearSanctuaryMidSession(fetchFn?: typeof fetch): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PKCE_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage unavailability
  }
  dispatchAuthChange();
  const fetcher = fetchFn ?? globalThis.fetch;
  await fetcher(`${getSanctuaryBffBaseUrl()}/api/v1/auth/bff/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}
