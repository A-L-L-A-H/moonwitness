import type { MidEnv } from "./types";

export const SESSION_COOKIE_NAME = "mw_session";

/** Escape dynamic text before embedding into HTML elements or attributes. */
export function escapeHtml(rawText: string): string {
  return rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Parse Cookie header key-value pairs cleanly. */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const parsed: Record<string, string> = {};
  if (!cookieHeader) return parsed;
  for (const segment of cookieHeader.split(";")) {
    const equalsIdx = segment.indexOf("=");
    if (equalsIdx <= 0) continue;
    const key = segment.slice(0, equalsIdx).trim();
    const val = segment.slice(equalsIdx + 1).trim();
    try {
      parsed[key] = decodeURIComponent(val);
    } catch {
      parsed[key] = val;
    }
  }
  return parsed;
}

/** Determine whether `COOKIE_DOMAIN` matches the current request hostname. */
function resolveCookieDomain(requestUrl: URL, configuredDomain?: string): string | null {
  if (!configuredDomain) return null;
  const trimmed = configuredDomain.trim();
  if (!trimmed) return null;
  const naked = trimmed.startsWith(".") ? trimmed.slice(1) : trimmed;
  if (requestUrl.hostname === naked || requestUrl.hostname.endsWith(`.${naked}`)) {
    return trimmed;
  }
  return null;
}

/** Build HttpOnly SameSite=Lax cookie string for SSO sessions. */
export function buildSessionCookie(
  sessionId: string,
  maxAgeSec: number,
  requestUrl: URL,
  env: MidEnv,
): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`,
  ];
  if (requestUrl.protocol === "https:") {
    attributes.push("Secure");
  }
  const domain = resolveCookieDomain(requestUrl, env.COOKIE_DOMAIN);
  if (domain) {
    attributes.push(`Domain=${domain}`);
  }
  return attributes.join("; ");
}

/** Resolve configured CORS origin allowlist. */
export function parseAllowedOrigins(env: MidEnv, selfOrigin: string): Set<string> {
  const origins = new Set<string>([selfOrigin]);
  for (const candidate of (env.CORS_ORIGINS ?? "").split(",")) {
    const clean = candidate.trim();
    if (clean) origins.add(clean);
  }
  return origins;
}

/** Build CORS headers when Origin header is in allowlist. */
export function corsHeaders(request: Request, env: MidEnv): Record<string, string> {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) return {};
  const allowed = parseAllowedOrigins(env, new URL(request.url).origin);
  if (!allowed.has(requestOrigin)) return {};
  return {
    "access-control-allow-origin": requestOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    vary: "Origin",
  };
}

/** Reject cross-site CSRF form/JSON mutations from untrusted Origins. */
export function isTrustedOriginMutation(request: Request, env: MidEnv): boolean {
  const requestUrl = new URL(request.url);
  const allowed = parseAllowedOrigins(env, requestUrl.origin);
  const originHeader = request.headers.get("origin");
  if (originHeader) return allowed.has(originHeader);
  const refererHeader = request.headers.get("referer");
  if (!refererHeader) return false;
  try {
    return allowed.has(new URL(refererHeader).origin);
  } catch {
    return false;
  }
}

/** Construct JSON response with security & cache-control headers. */
export function jsonResponse(
  payload: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

/** Construct OAuth2 standard error JSON response. */
export function oauthError(errorCode: string, description: string, status = 400): Response {
  return jsonResponse({ error: errorCode, error_description: description }, status);
}

/** Construct CSP-hardened HTML page response. */
export function htmlResponse(
  markup: string,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(markup, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https: http://127.0.0.1:*; frame-ancestors 'none'; base-uri 'self'",
      ...extraHeaders,
    },
  });
}

/** Extract best-effort client IP from Cloudflare proxy headers. */
export function clientIpFromRequest(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

/** Parse positive integer TTL setting in seconds with fallback. */
export function readTtl(rawValue: string | undefined, fallbackSec: number): number {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallbackSec;
}

/** Resolve canonical MoonWitness ID issuer URL without trailing slashes. */
export function resolveIssuer(env: MidEnv): string {
  return (env.ISSUER_URL ?? "https://id.moonwitness.biz.id").replace(/\/+$/g, "");
}

/** Parse application/x-www-form-urlencoded or application/json request bodies uniformly. */
export async function readFormOrJson(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const normalized: Record<string, string> = {};
    for (const [key, val] of Object.entries(raw)) {
      if (typeof val === "string") normalized[key] = val;
    }
    return normalized;
  }
  const params = new URLSearchParams(await request.text());
  const normalized: Record<string, string> = {};
  params.forEach((val, key) => {
    normalized[key] = val;
  });
  return normalized;
}
