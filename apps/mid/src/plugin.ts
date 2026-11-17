import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { createMidHandler } from "./app";
import { ensureMidSchema, getOrProvisionSigningKeys } from "./db";
import type { D1DatabaseLike, MidEnv } from "./types";

export interface MidFastifyPluginOptions {
  db: D1DatabaseLike;
  keyEncryptionSecret: string;
  issuerUrl?: string;
  accessTokenTtlSec?: number;
  idTokenTtlSec?: number;
  refreshTokenTtlSec?: number;
  sessionTtlSec?: number;
  cookieDomain?: string;
  corsOrigins?: string;
  /**
   * Primary identity authority host (default: "id.moonwitness.biz.id").
   * Requests with this Host header are routed unconditionally to MID.
   */
  identityHost?: string;
}

export const midFastifyPlugin: FastifyPluginAsync<MidFastifyPluginOptions> = async (
  fastify: FastifyInstance,
  options: MidFastifyPluginOptions,
) => {
  if (!options.db) {
    throw new Error("MidFastifyPlugin requires a valid D1DatabaseLike db instance");
  }
  if (!options.keyEncryptionSecret || options.keyEncryptionSecret.length < 16) {
    throw new Error("MidFastifyPlugin requires keyEncryptionSecret >= 16 chars");
  }

  // Idempotently ensure schema and first-party clients exist
  await ensureMidSchema(options.db);
  // Ensure active signing keys exist or provision fresh keypair
  await getOrProvisionSigningKeys(options.db, options.keyEncryptionSecret);

  const handleMidFetch = createMidHandler();
  const identityHost = (options.identityHost ?? "id.moonwitness.biz.id").toLowerCase();
  const issuerUrl = (options.issuerUrl ?? "https://id.moonwitness.biz.id").replace(/\/+$/, "");

  const midEnv: MidEnv = {
    DB: options.db,
    MID_KEY_ENCRYPTION_SECRET: options.keyEncryptionSecret,
    ISSUER_URL: issuerUrl,
    ACCESS_TOKEN_TTL_SEC: options.accessTokenTtlSec ? String(options.accessTokenTtlSec) : undefined,
    ID_TOKEN_TTL_SEC: options.idTokenTtlSec ? String(options.idTokenTtlSec) : undefined,
    REFRESH_TOKEN_TTL_SEC: options.refreshTokenTtlSec
      ? String(options.refreshTokenTtlSec)
      : undefined,
    SESSION_TTL_SEC: options.sessionTtlSec ? String(options.sessionTtlSec) : undefined,
    COOKIE_DOMAIN: options.cookieDomain,
    CORS_ORIGINS: options.corsOrigins,
  };

  if (!fastify.hasContentTypeParser("application/x-www-form-urlencoded")) {
    fastify.addContentTypeParser(
      "application/x-www-form-urlencoded",
      { parseAs: "string" },
      (_req, body, done) => {
        done(null, body);
      },
    );
  }

  async function dispatchToMid(
    request: FastifyRequest,
    reply: FastifyReply,
    urlOverride?: string,
  ): Promise<void> {
    const proto = (request.headers["x-forwarded-proto"] as string) || "https";
    const host =
      (request.headers["x-forwarded-host"] as string) || request.headers.host || identityHost;
    const targetUrl = urlOverride ?? request.raw.url ?? request.url;
    const fullUrl = new URL(targetUrl, `${proto}://${host}`);

    const headers = new Headers();
    for (const [key, val] of Object.entries(request.headers)) {
      if (val === undefined) continue;
      if (Array.isArray(val)) {
        for (const item of val) headers.append(key, item);
      } else {
        headers.set(key, val);
      }
    }

    let body: string | Uint8Array | undefined = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      if (typeof request.body === "string") {
        body = request.body;
      } else if (request.body instanceof Uint8Array || Buffer.isBuffer(request.body)) {
        body = request.body as Uint8Array;
      } else if (request.body && typeof request.body === "object") {
        const ctype = request.headers["content-type"] || "";
        if (ctype.includes("application/x-www-form-urlencoded")) {
          body = new URLSearchParams(request.body as Record<string, string>).toString();
        } else {
          body = JSON.stringify(request.body);
        }
      }
    }

    const webRequest = new Request(fullUrl, {
      method: request.method,
      headers,
      body: body as unknown as RequestInit["body"],
    });

    const webResponse = await handleMidFetch(webRequest, midEnv);

    reply.code(webResponse.status);

    const getSetCookie = (webResponse.headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie;
    if (typeof getSetCookie === "function") {
      const setCookies = getSetCookie.call(webResponse.headers);
      if (setCookies.length > 0) {
        reply.header("set-cookie", setCookies);
      }
    }

    for (const [k, v] of webResponse.headers.entries()) {
      if (k.toLowerCase() === "set-cookie") continue;
      reply.header(k, v);
    }

    const arrayBuffer = await webResponse.arrayBuffer();
    return reply.send(Buffer.from(arrayBuffer));
  }

  // Root OIDC and auth endpoints
  fastify.all("/.well-known/openid-configuration", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/.well-known/jwks.json", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/authorize", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/oauth/*", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/session", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/account", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/clients", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/clients/*", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/audit", (req, rep) => dispatchToMid(req, rep));

  // Prefixed alias under /api/v1/mid/*
  fastify.all("/api/v1/mid/*", (req, rep) => {
    const rawUrl = req.raw.url ?? req.url;
    const stripped = rawUrl.replace(/^\/api\/v1\/mid/, "");
    return dispatchToMid(req, rep, stripped || "/");
  });

  // Identity-host root, health, and login — always dispatched to MID
  fastify.all("/", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/health", (req, rep) => dispatchToMid(req, rep));
  fastify.all("/login", (req, rep) => dispatchToMid(req, rep));
};
