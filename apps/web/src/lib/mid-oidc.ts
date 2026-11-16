const STORAGE_PKCE_KEY = "mw_mid_pkce";
const STORAGE_TOKEN_KEY = "mw_mid_access_token";

export interface MidTokenPayload {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
}

function getMidIssuer(): string {
  return (process.env.NEXT_PUBLIC_MID_ISSUER_URL ?? "https://id.moonwitness.biz.id").replace(
    /\/+$/g,
    "",
  );
}

function randomUrlSafeString(byteLen: number): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function computeS256Challenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoded));
  let binary = "";
  for (const byte of digest) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function resolveCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

/** Initiate OAuth 2.1 + PKCE SSO sign-in flow against MoonWitness ID. */
export async function startMidLogin(nextPath = "/mission-control"): Promise<void> {
  const verifier = randomUrlSafeString(48);
  const state = randomUrlSafeString(18);
  const nonce = randomUrlSafeString(18);
  const challenge = await computeS256Challenge(verifier);
  const safeNext = nextPath.startsWith("/") ? nextPath : "/mission-control";

  window.sessionStorage.setItem(
    STORAGE_PKCE_KEY,
    JSON.stringify({ verifier, state, nextPath: safeNext }),
  );

  const authUrl = new URL(`${getMidIssuer()}/authorize`);
  authUrl.searchParams.set("client_id", "moonwitness-web");
  authUrl.searchParams.set("redirect_uri", resolveCallbackUrl());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email offline_access");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  window.location.assign(authUrl.toString());
}

/** Complete OAuth 2.1 authorization_code exchange on `/auth/callback`. */
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

  const response = await fetch(`${getMidIssuer()}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "moonwitness-web",
      code,
      redirect_uri: resolveCallbackUrl(),
      code_verifier: stored.verifier,
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    (MidTokenPayload & { error_description?: string; error?: string }) | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || "Token exchange failed.");
  }

  window.sessionStorage.setItem(STORAGE_TOKEN_KEY, payload.access_token);
  return stored.nextPath && stored.nextPath.startsWith("/") ? stored.nextPath : "/mission-control";
}

/** Retrieve active MoonWitness ID Bearer token from sessionStorage if available. */
export function getStoredMidAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Remove stored MoonWitness ID PKCE state and access token on logout. */
export function clearStoredMidSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_PKCE_KEY);
    window.sessionStorage.removeItem(STORAGE_TOKEN_KEY);
  } catch {
    // Ignore storage unavailability during teardown.
  }
}
