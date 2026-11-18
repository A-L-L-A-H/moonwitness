/**
 * Authentication routes
 * Handles login, logout, BFF OAuth exchange, and session verification
 */

import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { DEFAULT_MID_ISSUER_URL, normalizeIssuerUrl, type PublicEs256Jwk } from "@moonwitness/core";
import { resolveRequestIdentity } from "../../middleware/auth";
import {
  verifyMidBffExchangeClaims,
  type VerifiedMidProvisionClaims,
} from "../../middleware/mid-jwt";
import {
  consumeBffOAuthTokens,
  createSession,
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
  getSessionCookieOptions,
  revokeSession,
  SESSION_COOKIE_NAME,
  storeBffOAuthTokens,
} from "../../services/session";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  getUserPublic,
  verifyUserPassword,
  type UserPublic,
} from "../../services/user";
import { generateToken } from "../../shared/auth";
import { parseCorsOrigins } from "../../shared/env";

const DEV_DEFAULT_ALLOWED_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

interface BffExchangeRequestBody {
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
  readonly clientId: string;
}

interface MidTokenExchangePayload {
  readonly access_token?: unknown;
  readonly id_token?: unknown;
  readonly refresh_token?: unknown;
  readonly expires_in?: unknown;
  readonly error?: unknown;
  readonly error_description?: unknown;
}

function resolveMidBaseUrl(): string {
  const configured =
    process.env.MID_INTERNAL_URL?.trim() ||
    process.env.MID_ISSUER_URL?.trim() ||
    DEFAULT_MID_ISSUER_URL;
  return configured.replace(/\/+$/g, "");
}

function parseRequestHost(request: FastifyRequest): { host: string; hostname: string } | null {
  const raw =
    typeof request.headers["x-forwarded-host"] === "string"
      ? request.headers["x-forwarded-host"]
      : request.headers.host;
  if (!raw) return null;
  const host = raw.split(",")[0]?.trim().toLowerCase();
  if (!host) return null;
  try {
    const parsed = new URL(`http://${host}`);
    return { host: parsed.host.toLowerCase(), hostname: parsed.hostname.toLowerCase() };
  } catch {
    return null;
  }
}

function isSameSiteMoonWitnessHost(originHost: string, requestHost: string): boolean {
  const isFirstPartyDomain = (hostname: string) =>
    hostname === "moonwitness.biz.id" || hostname.endsWith(".moonwitness.biz.id");
  return isFirstPartyDomain(originHost) && isFirstPartyDomain(requestHost);
}

function isAllowedBffOrigin(request: FastifyRequest): boolean {
  const rawOrigin = request.headers.origin;
  // Reject requests with no Origin header on state-changing BFF endpoints
  // to prevent CSRF attacks from non-browser clients.
  if (rawOrigin === undefined) return false;
  if (typeof rawOrigin !== "string" || !rawOrigin.trim()) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(rawOrigin);
  } catch {
    return false;
  }
  if (
    (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") ||
    originUrl.origin === "null"
  ) {
    return false;
  }

  const configuredOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  if (configuredOrigins.includes(originUrl.origin)) {
    return true;
  }

  if (configuredOrigins.length === 0 && process.env.NODE_ENV !== "production") {
    if (DEV_DEFAULT_ALLOWED_ORIGINS.has(originUrl.origin)) {
      return true;
    }
  }

  const reqHost = parseRequestHost(request);
  if (!reqHost) return false;
  if (originUrl.host.toLowerCase() === reqHost.host) {
    return true;
  }
  if (
    originUrl.protocol === "https:" &&
    isSameSiteMoonWitnessHost(originUrl.hostname.toLowerCase(), reqHost.hostname)
  ) {
    return true;
  }
  return false;
}

function isValidOptionalCsrfHeader(request: FastifyRequest): boolean {
  const headerVal = request.headers["x-csrf-token"];
  const cookieVal = request.cookies?.[CSRF_COOKIE_NAME];
  // If no CSRF cookie is set, there's nothing to validate against.
  if (!cookieVal) return true;
  // If a CSRF cookie exists, the header must be present and match.
  if (headerVal === undefined) return false;
  if (typeof headerVal !== "string" || !headerVal.trim()) return false;
  const a = Buffer.from(headerVal, "utf8");
  const b = Buffer.from(cookieVal, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseBffExchangeBody(rawBody: unknown): BffExchangeRequestBody | null {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return null;
  }
  const body = rawBody as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const codeVerifier = typeof body.code_verifier === "string" ? body.code_verifier.trim() : "";
  const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri.trim() : "";
  const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";

  if (!code || code.length > 2048) return null;
  if (!codeVerifier || codeVerifier.length > 512) return null;
  if (!redirectUri || redirectUri.length > 2048) return null;
  if (!clientId || clientId.length > 128 || !/^[a-zA-Z0-9._-]+$/.test(clientId)) return null;

  try {
    const parsedRedirect = new URL(redirectUri);
    if (parsedRedirect.protocol !== "http:" && parsedRedirect.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  return { code, codeVerifier, redirectUri, clientId };
}

async function resolveOrProvisionMidUser(claims: VerifiedMidProvisionClaims): Promise<UserPublic> {
  if (/^\d+$/.test(claims.sub)) {
    const existingById = await findUserById(Number(claims.sub));
    if (existingById) return getUserPublic(existingById);
  }

  const normalizedUsername = (claims.username ?? `mid_${claims.sub}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_");
  const candidateUsername = normalizedUsername || `mid_${Date.now()}`;

  const existingByUsername = await findUserByUsername(candidateUsername);
  if (existingByUsername) return getUserPublic(existingByUsername);

  const candidateEmail = (claims.email ?? `${candidateUsername}@mid.moonwitness.local`)
    .trim()
    .toLowerCase();
  const existingByEmail = await findUserByEmail(candidateEmail);
  if (existingByEmail) return getUserPublic(existingByEmail);

  const displayName = claims.displayName?.trim() || claims.username?.trim() || candidateUsername;
  try {
    return await createUser({
      username: candidateUsername,
      email: candidateEmail,
      password: generateToken(24),
      role: claims.role,
      displayName,
    });
  } catch (error) {
    const retryUser =
      (await findUserByUsername(candidateUsername)) ?? (await findUserByEmail(candidateEmail));
    if (retryUser) return getUserPublic(retryUser);
    throw error;
  }
}

async function postMidFormEndpoint(
  fastify: FastifyInstance,
  path: string,
  formParams: URLSearchParams,
): Promise<{ status: number; json: () => Promise<unknown> }> {
  const useLocalMid = !process.env.MID_INTERNAL_URL?.trim() && fastify.hasDecorator("midMounted");
  if (useLocalMid) {
    const issuerHost = new URL(normalizeIssuerUrl(process.env.MID_ISSUER_URL)).host;
    const injected = await fastify.inject({
      method: "POST",
      url: path,
      headers: {
        host: issuerHost,
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: formParams.toString(),
    });
    return {
      status: injected.statusCode,
      json: async () => {
        try {
          return injected.json();
        } catch {
          return null;
        }
      },
    };
  }

  const midBaseUrl = resolveMidBaseUrl();
  const response = await fetch(`${midBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formParams.toString(),
    signal: AbortSignal.timeout(10_000),
  });
  return {
    status: response.status,
    json: async () => response.json().catch(() => null),
  };
}

function createLocalMidJwkResolver(fastify: FastifyInstance) {
  return async (kid: string): Promise<PublicEs256Jwk | null> => {
    const issuerHost = new URL(normalizeIssuerUrl(process.env.MID_ISSUER_URL)).host;
    const res = await fastify.inject({
      method: "GET",
      url: "/.well-known/jwks.json",
      headers: { host: issuerHost },
    });
    if (res.statusCode !== 200) return null;
    try {
      const body = res.json() as { keys?: PublicEs256Jwk[] };
      return body.keys?.find((entry) => entry.kid === kid) ?? null;
    } catch {
      return null;
    }
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  // Rate limiting for auth endpoints
  await fastify.register(async (authScope) => {
    await authScope.register(rateLimit, {
      max: 10,
      timeWindow: 60000,
      keyGenerator: (request) => request.ip,
      errorResponseBuilder: () => ({
        statusCode: 429,
        error: "Too Many Requests",
        message: "terlalu banyak percobaan; coba lagi nanti",
      }),
    });
    authScope.addHook("onSend", async (_request, reply, payload) => {
      reply.header("cache-control", "no-store");
      return payload;
    });

    // POST /api/v1/auth/login
    authScope.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as { identifier?: unknown; password?: unknown } | null;
      const identifier = body?.identifier;
      const password = body?.password;

      if (
        typeof identifier !== "string" ||
        typeof password !== "string" ||
        !identifier.trim() ||
        !password ||
        Buffer.byteLength(password, "utf8") > 72
      ) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Username/email dan password wajib valid",
        });
      }

      const identifierStr = identifier.trim().toLowerCase();
      const user =
        (await findUserByUsername(identifierStr)) || (await findUserByEmail(identifierStr));

      if (!user) {
        // Generic error to prevent user enumeration
        return reply.code(401).send({
          error: "Unauthorized",
          message: "Identitas atau kata sandi salah",
        });
      }

      const valid = await verifyUserPassword(user, password);
      if (!valid) {
        return reply.code(401).send({
          error: "Unauthorized",
          message: "Identitas atau kata sandi salah",
        });
      }

      // Create session
      const sessionId = await createSession(user.id);
      reply.setCookie(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions());

      return reply.send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
        },
      });
    });

    // POST /api/v1/auth/bff/exchange
    authScope.post("/auth/bff/exchange", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isAllowedBffOrigin(request)) {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Untrusted origin",
        });
      }

      const parsed = parseBffExchangeBody(request.body);
      if (!parsed) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "code, code_verifier, redirect_uri, and client_id must be valid strings",
        });
      }

      const formParams = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: parsed.clientId,
        code: parsed.code,
        redirect_uri: parsed.redirectUri,
        code_verifier: parsed.codeVerifier,
      });

      let tokenExchangeRes: { status: number; json: () => Promise<unknown> };
      try {
        tokenExchangeRes = await postMidFormEndpoint(authScope, "/oauth/token", formParams);
      } catch (error) {
        request.log.warn({ err: error }, "MID token exchange request failed");
        return reply.code(502).send({
          error: "Bad Gateway",
          message: "Identity provider token exchange unavailable",
        });
      }

      const tokenPayload = (await tokenExchangeRes.json()) as MidTokenExchangePayload | null;
      if (tokenExchangeRes.status >= 500) {
        return reply.code(502).send({
          error: "Bad Gateway",
          message: "Identity provider token exchange failed",
        });
      }
      if (
        tokenExchangeRes.status < 200 ||
        tokenExchangeRes.status >= 300 ||
        !tokenPayload ||
        typeof tokenPayload.access_token !== "string" ||
        !tokenPayload.access_token.trim()
      ) {
        const errorCode =
          typeof tokenPayload?.error === "string" ? tokenPayload.error : "token_exchange_failed";
        const errorDescription =
          typeof tokenPayload?.error_description === "string"
            ? tokenPayload.error_description
            : "Authorization code exchange failed";
        return reply.code(401).send({
          error: errorCode,
          error_description: errorDescription,
        });
      }

      const useLocalMid =
        !process.env.MID_INTERNAL_URL?.trim() && authScope.hasDecorator("midMounted");
      const verification = await verifyMidBffExchangeClaims({
        accessToken: tokenPayload.access_token,
        idToken: typeof tokenPayload.id_token === "string" ? tokenPayload.id_token : undefined,
        clientId: parsed.clientId,
        midBaseUrl: resolveMidBaseUrl(),
        resolveLocalJwkByKid: useLocalMid ? createLocalMidJwkResolver(authScope) : undefined,
      });

      if (!verification) {
        return reply.code(401).send({
          error: "Unauthorized",
          message: "Identity token verification failed",
        });
      }

      const user =
        verification.kind === "user"
          ? verification.user
          : await resolveOrProvisionMidUser(verification.claims);

      const sessionId = await createSession(user.id);
      const expiresInSec =
        typeof tokenPayload.expires_in === "number" &&
        Number.isFinite(tokenPayload.expires_in) &&
        tokenPayload.expires_in > 0
          ? Math.floor(tokenPayload.expires_in)
          : 900;

      await storeBffOAuthTokens({
        sessionId,
        clientId: parsed.clientId,
        accessToken: tokenPayload.access_token,
        refreshToken:
          typeof tokenPayload.refresh_token === "string" && tokenPayload.refresh_token.trim()
            ? tokenPayload.refresh_token
            : undefined,
        idToken:
          typeof tokenPayload.id_token === "string" && tokenPayload.id_token.trim()
            ? tokenPayload.id_token
            : undefined,
        expiresInSec,
      });

      reply.setCookie(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions());
      reply.setCookie(CSRF_COOKIE_NAME, generateToken(24), getCsrfCookieOptions());

      return reply.send({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
        },
      });
    });

    async function performLogout(request: FastifyRequest, reply: FastifyReply) {
      if (!isAllowedBffOrigin(request) || !isValidOptionalCsrfHeader(request)) {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Untrusted origin or invalid CSRF token",
        });
      }

      const sessionId = request.cookies?.[SESSION_COOKIE_NAME];
      if (sessionId) {
        const tokenRecord = await consumeBffOAuthTokens(sessionId);
        if (tokenRecord?.refreshToken) {
          const revokeParams = new URLSearchParams({
            client_id: tokenRecord.clientId,
            token: tokenRecord.refreshToken,
            token_type_hint: "refresh_token",
          });
          await postMidFormEndpoint(authScope, "/oauth/revoke", revokeParams).catch((error) => {
            request.log.warn({ err: error }, "Best-effort MID refresh token revocation failed");
          });
        }
        await revokeSession(sessionId);
      }

      reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
      reply.clearCookie(CSRF_COOKIE_NAME, { path: "/" });
      return reply.send({ ok: true });
    }

    // POST /api/v1/auth/logout
    authScope.post("/auth/logout", performLogout);

    // POST /api/v1/auth/bff/logout
    authScope.post("/auth/bff/logout", performLogout);

    // GET /api/v1/auth/me
    authScope.get("/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
      const { user, expiredSessionCookie } = await resolveRequestIdentity(request);
      if (!user) {
        if (expiredSessionCookie) {
          reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
          return reply.code(401).send({ error: "Session expired or invalid" });
        }
        return reply.code(401).send({ error: "Not authenticated" });
      }
      return reply.send({ user });
    });
  });
}
