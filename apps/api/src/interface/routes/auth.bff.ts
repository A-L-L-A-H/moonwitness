import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { DEFAULT_MID_ISSUER_URL, normalizeIssuerUrl, type PublicEs256Jwk } from "@moonwitness/core";
import { type VerifiedMidProvisionClaims } from "../../middleware/mid-jwt";
import { CSRF_COOKIE_NAME } from "../../services/session";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  getUserPublic,
  type UserPublic,
} from "../../services/user";
import { generateToken } from "../../shared/auth";
import { parseCorsOrigins } from "../../shared/env";

const DEV_DEFAULT_ALLOWED_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

export interface BffExchangeRequestBody {
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
  readonly clientId: string;
}

export interface MidTokenExchangePayload {
  readonly access_token?: unknown;
  readonly id_token?: unknown;
  readonly refresh_token?: unknown;
  readonly expires_in?: unknown;
  readonly error?: unknown;
  readonly error_description?: unknown;
}

export function resolveMidBaseUrl(): string {
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

export function isAllowedBffOrigin(request: FastifyRequest): boolean {
  const rawOrigin = request.headers.origin;
  if (rawOrigin === undefined || typeof rawOrigin !== "string" || !rawOrigin.trim()) return false;

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
  if (configuredOrigins.includes(originUrl.origin)) return true;

  if (configuredOrigins.length === 0 && process.env.NODE_ENV !== "production") {
    if (DEV_DEFAULT_ALLOWED_ORIGINS.has(originUrl.origin)) return true;
  }

  const reqHost = parseRequestHost(request);
  if (!reqHost) return false;
  if (originUrl.host.toLowerCase() === reqHost.host) return true;
  return (
    originUrl.protocol === "https:" &&
    isSameSiteMoonWitnessHost(originUrl.hostname.toLowerCase(), reqHost.hostname)
  );
}

export function isValidOptionalCsrfHeader(request: FastifyRequest): boolean {
  const headerVal = request.headers["x-csrf-token"];
  const cookieVal = request.cookies?.[CSRF_COOKIE_NAME];
  if (!cookieVal) return true;
  if (headerVal === undefined || typeof headerVal !== "string" || !headerVal.trim()) return false;
  const a = Buffer.from(headerVal, "utf8");
  const b = Buffer.from(cookieVal, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseBffExchangeBody(rawBody: unknown): BffExchangeRequestBody | null {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) return null;
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
    if (parsedRedirect.protocol !== "http:" && parsedRedirect.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return { code, codeVerifier, redirectUri, clientId };
}

export async function resolveOrProvisionMidUser(
  claims: VerifiedMidProvisionClaims,
): Promise<UserPublic> {
  if (claims.sub.trim()) {
    const existingById = await findUserById(claims.sub.trim());
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

export async function postMidFormEndpoint(
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

export function createLocalMidJwkResolver(fastify: FastifyInstance) {
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
