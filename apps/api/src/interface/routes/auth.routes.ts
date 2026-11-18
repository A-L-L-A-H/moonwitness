import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { resolveRequestIdentity } from "../../middleware/auth";
import { verifyMidBffExchangeClaims } from "../../middleware/mid-jwt";
import {
  consumeBffOAuthTokens,
  createSession,
  CSRF_COOKIE_NAME,
  findUserByEmail,
  findUserByUsername,
  generateToken,
  getCsrfCookieOptions,
  getSessionCookieOptions,
  revokeSession,
  SESSION_COOKIE_NAME,
  storeBffOAuthTokens,
  verifyUserPassword,
} from "@moonwitness/addons/auth";
import { registerAuthAdminRoutes } from "./auth.admin";
import {
  createLocalMidJwkResolver,
  isAllowedBffOrigin,
  isValidOptionalCsrfHeader,
  type MidTokenExchangePayload,
  parseBffExchangeBody,
  postMidFormEndpoint,
  resolveMidBaseUrl,
  resolveOrProvisionMidUser,
} from "./auth.bff";

export async function authRoutes(
  fastify: FastifyInstance,
  options: { mountAuditRoute?: boolean } = {},
) {
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

    authScope.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as {
        identifier?: unknown;
        username?: unknown;
        email?: unknown;
        password?: unknown;
      } | null;
      const identifier =
        typeof body?.identifier === "string" && body.identifier.trim()
          ? body.identifier
          : typeof body?.email === "string" && body.email.trim()
            ? body.email
            : typeof body?.username === "string" && body.username.trim()
              ? body.username
              : undefined;
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
      const user = identifierStr.includes("@")
        ? (await findUserByEmail(identifierStr)) || (await findUserByUsername(identifierStr))
        : (await findUserByUsername(identifierStr)) || (await findUserByEmail(identifierStr));

      if (!user || !(await verifyUserPassword(user, password))) {
        return reply.code(401).send({
          error: "Unauthorized",
          message: "Identitas atau kata sandi salah",
        });
      }

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

    authScope.post("/auth/bff/exchange", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isAllowedBffOrigin(request)) {
        return reply.code(403).send({ error: "Forbidden", message: "Untrusted origin" });
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
        return reply.code(401).send({ error: errorCode, error_description: errorDescription });
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
        return reply
          .code(401)
          .send({ error: "Unauthorized", message: "Identity token verification failed" });
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
        return reply
          .code(403)
          .send({ error: "Forbidden", message: "Untrusted origin or invalid CSRF token" });
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

    authScope.post("/auth/logout", performLogout);
    authScope.post("/auth/bff/logout", performLogout);

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

  registerAuthAdminRoutes(fastify, options.mountAuditRoute ?? true);
}
