import {
  DEFAULT_MID_ISSUER_URL,
  createPkceAuthorizationRequest,
  normalizeIssuerUrl,
} from "@moonwitness/core";

const STORAGE_PKCE_KEY = "mw_mid_pkce";

function getMidIssuer(): string {
  return normalizeIssuerUrl(process.env.NEXT_PUBLIC_MID_ISSUER_URL ?? DEFAULT_MID_ISSUER_URL);
}

function sanitizeNextPath(rawPath: string | undefined): string {
  if (typeof rawPath === "string" && rawPath.startsWith("/") && !rawPath.startsWith("//")) {
    return rawPath;
  }
  return "/mission-control";
}

function resolveCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

/** Initiate OAuth 2.1 + PKCE SSO sign-in flow against MoonWitness ID using @moonwitness/core. */
export async function startMidLogin(nextPath = "/mission-control"): Promise<void> {
  const safeNext = sanitizeNextPath(nextPath);
  const pkce = await createPkceAuthorizationRequest({
    issuerUrl: getMidIssuer(),
    clientId: "moonwitness-web",
    redirectUri: resolveCallbackUrl(),
  });

  window.sessionStorage.setItem(
    STORAGE_PKCE_KEY,
    JSON.stringify({ verifier: pkce.verifier, state: pkce.state, nextPath: safeNext }),
  );

  window.location.assign(pkce.authorizeUrl);
}

/** Complete OAuth 2.1 authorization_code exchange via the server-side BFF on `/auth/callback`. */
export async function completeMidCallback(searchParams: URLSearchParams): Promise<string> {
  const oauthError = searchParams.get("error");
  if (oauthError) {
    throw new Error(searchParams.get("error_description") || oauthError);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    throw new Error("Missing authorization code or state parameter.");
  }

  const rawStored = window.sessionStorage.getItem(STORAGE_PKCE_KEY);
  window.sessionStorage.removeItem(STORAGE_PKCE_KEY);
  if (!rawStored) {
    throw new Error("Login session expired. Return to Sign In and try again.");
  }

  const stored = JSON.parse(rawStored) as {
    verifier: string;
    state: string;
    nextPath?: string;
  };
  if (stored.state !== state) {
    throw new Error("State mismatch detected during SSO callback.");
  }

  const response = await fetch("/api/v1/auth/bff/exchange", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: stored.verifier,
      redirect_uri: resolveCallbackUrl(),
      client_id: "moonwitness-web",
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    authenticated?: boolean;
    user?: unknown;
    error?: string;
    error_description?: string;
    message?: string;
  } | null;
  if (!response.ok || !payload?.authenticated || !payload?.user) {
    throw new Error(
      payload?.error_description ||
        payload?.message ||
        payload?.error ||
        "Authentication exchange failed.",
    );
  }

  return sanitizeNextPath(stored.nextPath);
}

/**
 * @deprecated OAuth tokens are stored server-side behind HttpOnly session cookies.
 * Always returns null.
 */
export function getStoredMidAccessToken(): null {
  return null;
}

/** Remove stored ephemeral MoonWitness ID PKCE state on logout. */
export function clearStoredMidSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_PKCE_KEY);
  } catch {
    // Ignore storage unavailability during teardown.
  }
}

export * from "./sanctuary-mid-oidc";
