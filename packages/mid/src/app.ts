import {
  buildAccessTokenAudience,
  resolveIntrospectionExpectedAudience,
  resolveRequestedClientTarget,
} from "./audience";
import {
  constantTimeEqualString,
  sha256Hex,
  signEs256Jwt,
  verifyEs256Jwt,
  verifyPassword,
  verifyPkceS256,
} from "./crypto";
import {
  consumeAuthorizationCode,
  deleteOidcClient,
  ensureMidSchema,
  findOidcClient,
  getOrProvisionSigningKeys,
  issueRefreshToken,
  listOidcClients,
  resolveIdentityStore,
  revokeRefreshToken,
  rotateRefreshToken,
  storeAuthorizationCode,
} from "./db";
import {
  buildSessionCookie,
  clientIpFromRequest,
  corsHeaders,
  htmlResponse,
  isTrustedOriginMutation,
  jsonResponse,
  oauthError,
  parseCookies,
  readFormOrJson,
  readTtl,
  resolveIssuer,
  SESSION_COOKIE_NAME,
} from "./http";
import { handlePortalPost } from "./portal";
import type { MidEnv, MidTokenClaims, OidcClient, PublicUser } from "./types";
import { renderAuthorizePage, renderPortalPage } from "./ui";

function resolveValidatedScopes(requested: string | null, client: OidcClient): string | null {
  const tokens = (requested ?? "openid").trim().split(/\s+/).filter(Boolean);
  if (!tokens.includes("openid")) return null;
  for (const token of tokens) {
    if (!client.allowedScopes.includes(token)) return null;
  }
  return Array.from(new Set(tokens)).join(" ");
}

function isRedirectUriAllowed(client: OidcClient, candidate: string): boolean {
  if (client.redirectUris.includes(candidate)) return true;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return false;
  }
  if (
    parsed.protocol !== "http:" ||
    (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost")
  ) {
    return false;
  }
  return client.redirectUris.some((registered) => {
    try {
      const regUrl = new URL(registered);
      return (
        regUrl.protocol === "http:" &&
        regUrl.hostname === parsed.hostname &&
        regUrl.port === "" &&
        regUrl.pathname === parsed.pathname
      );
    } catch {
      return false;
    }
  });
}

function appendQueryParams(
  baseUri: string,
  params: Record<string, string | null | undefined>,
): string {
  const target = new URL(baseUri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      target.searchParams.set(key, value);
    }
  }
  return target.toString();
}

function buildDiscoveryDocument(issuer: string): Record<string, unknown> {
  return {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    introspection_endpoint: `${issuer}/oauth/introspect`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    end_session_endpoint: `${issuer}/logout`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["ES256"],
    scopes_supported: ["openid", "profile", "email", "offline_access"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
    claims_supported: [
      "sub",
      "iss",
      "aud",
      "exp",
      "iat",
      "nonce",
      "preferred_username",
      "name",
      "email",
      "role",
    ],
  };
}

function buildTokenClaims(params: {
  issuer: string;
  user: PublicUser;
  audience: string | string[];
  azp?: string;
  ttlSec: number;
  tokenUse: "access" | "id";
  scope: string;
  nonce?: string | null;
}): MidTokenClaims {
  const nowSec = Math.floor(Date.now() / 1000);
  const claims: MidTokenClaims = {
    iss: params.issuer,
    sub: String(params.user.id),
    aud: params.audience,
    iat: nowSec,
    exp: nowSec + params.ttlSec,
    jti: crypto.randomUUID(),
    token_use: params.tokenUse,
    scope: params.scope,
    preferred_username: params.user.username,
    name: params.user.displayName,
    email: params.user.email,
    role: params.user.role,
  };
  if (params.azp) {
    claims.azp = params.azp;
  }
  if (params.tokenUse === "id" && params.nonce) {
    claims.nonce = params.nonce;
  }
  return claims;
}

async function issueClientTokens(params: {
  env: MidEnv;
  user: PublicUser;
  clientId: string;
  scope: string;
  nonce?: string | null;
  resource?: string | null;
  refreshTokenOverride?: string;
}): Promise<Record<string, unknown>> {
  const issuer = resolveIssuer(params.env);
  const accessTtl = readTtl(params.env.ACCESS_TOKEN_TTL_SEC, 900);
  const idTtl = readTtl(params.env.ID_TOKEN_TTL_SEC, 3600);
  const refreshTtl = readTtl(params.env.REFRESH_TOKEN_TTL_SEC, 604_800);

  const { activeKey } = await getOrProvisionSigningKeys(
    params.env.DB,
    params.env.MID_KEY_ENCRYPTION_SECRET,
  );
  const accessAudience = buildAccessTokenAudience(params.clientId, params.resource);
  const accessClaims = buildTokenClaims({
    issuer,
    user: params.user,
    audience: accessAudience,
    ...(Array.isArray(accessAudience) ? { azp: params.clientId } : {}),
    ttlSec: accessTtl,
    tokenUse: "access",
    scope: params.scope,
  });
  // ID tokens stay isolated to the relying-party client_id even on cross-resource grants.
  const idClaims = buildTokenClaims({
    issuer,
    user: params.user,
    audience: params.clientId,
    ttlSec: idTtl,
    tokenUse: "id",
    scope: params.scope,
    nonce: params.nonce,
  });

  const [accessToken, idToken] = await Promise.all([
    signEs256Jwt(
      accessClaims,
      activeKey.kid,
      activeKey.encryptedPrivateJwk,
      params.env.MID_KEY_ENCRYPTION_SECRET,
    ),
    signEs256Jwt(
      idClaims,
      activeKey.kid,
      activeKey.encryptedPrivateJwk,
      params.env.MID_KEY_ENCRYPTION_SECRET,
    ),
  ]);

  const payload: Record<string, unknown> = {
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: accessTtl,
    scope: params.scope,
  };

  if (params.refreshTokenOverride) {
    payload.refresh_token = params.refreshTokenOverride;
  } else if (params.scope.split(/\s+/).includes("offline_access")) {
    const issued = await issueRefreshToken(params.env.DB, {
      clientId: params.clientId,
      userId: params.user.id,
      scope: params.scope,
      ttlSec: refreshTtl,
      resource: params.resource ?? null,
    });
    payload.refresh_token = issued.plainToken;
  }
  return payload;
}

async function authenticateClientCredentials(
  request: Request,
  form: URLSearchParams,
  env: MidEnv,
): Promise<{ client: OidcClient | null; secret: string | null }> {
  let clientId = form.get("client_id")?.trim() ?? "";
  let clientSecret = form.get("client_secret") ?? null;

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6).trim());
      const separator = decoded.indexOf(":");
      if (separator <= 0) {
        return { client: null, secret: null };
      }
      clientId = decodeURIComponent(decoded.slice(0, separator));
      clientSecret = decodeURIComponent(decoded.slice(separator + 1));
    } catch {
      return { client: null, secret: null };
    }
  }

  if (!clientId) return { client: null, secret: null };
  const client = await findOidcClient(env.DB, clientId);
  if (!client) return { client: null, secret: null };

  if (client.clientType === "confidential") {
    if (!clientSecret || !client.clientSecretHash) return { client: null, secret: null };
    const presentedHash = await sha256Hex(clientSecret);
    if (!constantTimeEqualString(presentedHash, client.clientSecretHash)) {
      return { client: null, secret: null };
    }
  }
  return { client, secret: clientSecret };
}

function withCors(response: Response, headers: Record<string, string>): Response {
  const out = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    out.headers.set(key, value);
  }
  return out;
}

async function handleAuthorizeGet(
  request: Request,
  requestUrl: URL,
  env: MidEnv,
  sessionUser: PublicUser | null,
): Promise<Response> {
  const clientId = requestUrl.searchParams.get("client_id") ?? "";
  const redirectUri = requestUrl.searchParams.get("redirect_uri") ?? "";
  const responseType = requestUrl.searchParams.get("response_type") ?? "";
  const state = requestUrl.searchParams.get("state") ?? "";
  const nonce = requestUrl.searchParams.get("nonce") ?? "";
  const codeChallenge = requestUrl.searchParams.get("code_challenge") ?? "";
  const codeChallengeMethod = requestUrl.searchParams.get("code_challenge_method") ?? "";
  const promptParam = requestUrl.searchParams.get("prompt") ?? "";

  const client = await findOidcClient(env.DB, clientId);
  if (!client || !isRedirectUriAllowed(client, redirectUri)) {
    return oauthError("invalid_request", "Unknown client_id or unregistered redirect_uri", 400);
  }
  if (responseType !== "code") {
    return Response.redirect(
      appendQueryParams(redirectUri, { error: "unsupported_response_type", state }),
      302,
    );
  }
  if (codeChallengeMethod !== "S256" || codeChallenge.length < 43) {
    return Response.redirect(
      appendQueryParams(redirectUri, { error: "invalid_request", state }),
      302,
    );
  }
  const scope = resolveValidatedScopes(requestUrl.searchParams.get("scope"), client);
  if (!scope) {
    return Response.redirect(
      appendQueryParams(redirectUri, { error: "invalid_scope", state }),
      302,
    );
  }
  const targetResolution = resolveRequestedClientTarget(client.clientId, {
    resources: requestUrl.searchParams.getAll("resource"),
    audiences: requestUrl.searchParams.getAll("audience"),
  });
  if (!targetResolution.ok) {
    return Response.redirect(
      appendQueryParams(redirectUri, { error: "invalid_target", state }),
      302,
    );
  }

  if (sessionUser && client.firstParty && promptParam !== "login" && promptParam !== "consent") {
    const store = resolveIdentityStore(env);
    const code = await storeAuthorizationCode(env.DB, {
      clientId: client.clientId,
      userId: sessionUser.id,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod,
      nonce: nonce || null,
      resource: targetResolution.resource,
    });
    await store.recordAuditEvent({
      eventType: "oauth.code.sso_issued",
      actorUserId: sessionUser.id,
      clientId: client.clientId,
      detail: { scope, resource: targetResolution.resource },
      ipAddress: clientIpFromRequest(request),
    });
    return Response.redirect(appendQueryParams(redirectUri, { code, state }), 302);
  }

  return htmlResponse(
    renderAuthorizePage({
      client,
      user: promptParam === "login" ? null : sessionUser,
      redirectUri,
      scope,
      state,
      nonce,
      codeChallenge,
      codeChallengeMethod,
      resource: targetResolution.resource,
    }),
  );
}

async function handleAuthorizePost(
  request: Request,
  requestUrl: URL,
  env: MidEnv,
  sessionUser: PublicUser | null,
): Promise<Response> {
  if (!isTrustedOriginMutation(request, env)) {
    return oauthError("invalid_request", "Untrusted origin", 403);
  }
  const body = await readFormOrJson(request);
  const clientId = body.client_id ?? "";
  const redirectUri = body.redirect_uri ?? "";
  const state = body.state ?? "";
  const nonce = body.nonce ?? "";
  const codeChallenge = body.code_challenge ?? "";
  const codeChallengeMethod = body.code_challenge_method ?? "";
  const decision = body.decision ?? "approve";

  const client = await findOidcClient(env.DB, clientId);
  const scope = client ? resolveValidatedScopes(body.scope ?? "openid", client) : null;
  if (
    !client ||
    !isRedirectUriAllowed(client, redirectUri) ||
    codeChallengeMethod !== "S256" ||
    !scope
  ) {
    return oauthError("invalid_request", "Malformed authorization submission", 400);
  }
  const targetResolution = resolveRequestedClientTarget(client.clientId, {
    resources: body.resource !== undefined ? [body.resource] : [],
    audiences: body.audience !== undefined ? [body.audience] : [],
  });
  if (!targetResolution.ok) {
    return oauthError(
      "invalid_target",
      "Requested resource or audience is not authorized for this client",
      400,
    );
  }
  if (decision === "deny") {
    return Response.redirect(
      appendQueryParams(redirectUri, { error: "access_denied", state }),
      302,
    );
  }

  const store = resolveIdentityStore(env);
  let activeUser = sessionUser;
  const extraHeaders: Record<string, string> = {};
  if (!activeUser || body.identifier) {
    const user = await store.findUserByLogin(body.identifier ?? "");
    const valid = user ? await verifyPassword(body.password ?? "", user.passwordHash) : false;
    if (!user || !valid) {
      await store.recordAuditEvent({
        eventType: "auth.login.failed",
        actorUserId: user?.id ?? null,
        clientId: client.clientId,
        detail: { identifier: body.identifier ?? "" },
        ipAddress: clientIpFromRequest(request),
      });
      return htmlResponse(
        renderAuthorizePage({
          client,
          user: null,
          redirectUri,
          scope,
          state,
          nonce,
          codeChallenge,
          codeChallengeMethod,
          resource: targetResolution.resource,
          error: "Invalid username/email or password.",
        }),
        401,
      );
    }
    const sessionTtl = readTtl(env.SESSION_TTL_SEC, 604_800);
    const newSessionId = await store.createSsoSession(user.id, sessionTtl);
    extraHeaders["set-cookie"] = buildSessionCookie(newSessionId, sessionTtl, requestUrl, env);
    activeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    };
  }

  const code = await storeAuthorizationCode(env.DB, {
    clientId: client.clientId,
    userId: activeUser.id,
    redirectUri,
    scope,
    codeChallenge,
    codeChallengeMethod,
    nonce: nonce || null,
    resource: targetResolution.resource,
  });
  await store.recordAuditEvent({
    eventType: "oauth.code.issued",
    actorUserId: activeUser.id,
    clientId: client.clientId,
    detail: { scope, resource: targetResolution.resource },
    ipAddress: clientIpFromRequest(request),
  });
  return new Response(null, {
    status: 302,
    headers: { location: appendQueryParams(redirectUri, { code, state }), ...extraHeaders },
  });
}

async function handleTokenPost(request: Request, env: MidEnv): Promise<Response> {
  const form = new URLSearchParams(await request.text());
  const grantType = form.get("grant_type") ?? "";
  const { client } = await authenticateClientCredentials(request, form, env);
  if (!client) return oauthError("invalid_client", "Client authentication failed", 401);

  const targetResolution = resolveRequestedClientTarget(client.clientId, {
    resources: form.getAll("resource"),
    audiences: form.getAll("audience"),
  });

  if (grantType === "authorization_code") {
    const code = form.get("code") ?? "";
    const redirectUri = form.get("redirect_uri") ?? "";
    const verifier = form.get("code_verifier") ?? "";
    if (!code || !redirectUri || !verifier) {
      return oauthError("invalid_request", "Missing code, redirect_uri, or code_verifier");
    }
    if (!targetResolution.ok) {
      return oauthError(
        "invalid_target",
        "Requested resource or audience is not authorized for this client",
        400,
      );
    }
    const authCode = await consumeAuthorizationCode(env.DB, code);
    if (
      !authCode ||
      authCode.clientId !== client.clientId ||
      authCode.redirectUri !== redirectUri
    ) {
      return oauthError("invalid_grant", "Authorization code is invalid, expired, or already used");
    }
    if (
      authCode.resource &&
      targetResolution.resource &&
      targetResolution.resource !== authCode.resource &&
      targetResolution.resource !== client.clientId
    ) {
      return oauthError(
        "invalid_target",
        "Requested resource does not match authorization grant",
        400,
      );
    }
    const pkceValid = await verifyPkceS256(verifier, authCode.codeChallenge);
    if (!pkceValid) {
      return oauthError("invalid_grant", "PKCE verification failed");
    }
    const store = resolveIdentityStore(env);
    const user = await store.findPublicUserById(authCode.userId);
    if (!user) return oauthError("invalid_grant", "User account no longer active");

    const effectiveResource = targetResolution.resource ?? authCode.resource;
    const tokenResponse = await issueClientTokens({
      env,
      user,
      clientId: client.clientId,
      scope: authCode.scope,
      nonce: authCode.nonce,
      resource: effectiveResource,
    });
    await store.recordAuditEvent({
      eventType: "oauth.token.issued",
      actorUserId: user.id,
      clientId: client.clientId,
      detail: {
        grantType: "authorization_code",
        scope: authCode.scope,
        resource: effectiveResource,
      },
      ipAddress: clientIpFromRequest(request),
    });
    return jsonResponse(tokenResponse, 200);
  }

  if (grantType === "refresh_token") {
    const presentedToken = form.get("refresh_token") ?? "";
    if (!presentedToken) return oauthError("invalid_request", "Missing refresh_token");
    if (!targetResolution.ok) {
      return oauthError(
        "invalid_target",
        "Requested resource or audience is not authorized for this client",
        400,
      );
    }
    const refreshTtl = readTtl(env.REFRESH_TOKEN_TTL_SEC, 604_800);
    const rotated = await rotateRefreshToken(
      env.DB,
      presentedToken,
      client.clientId,
      refreshTtl,
      targetResolution.resource,
    );
    if (rotated.status === "invalid_target") {
      return oauthError("invalid_target", "Requested resource exceeds refresh token grant", 400);
    }
    const store = resolveIdentityStore(env);
    if (rotated.status === "reused") {
      await store.recordAuditEvent({
        eventType: "oauth.refresh.reuse_detected",
        actorUserId: null,
        clientId: client.clientId,
        detail: { familyRevoked: true },
        ipAddress: clientIpFromRequest(request),
      });
      return oauthError("invalid_grant", "Refresh token replay detected; token family revoked");
    }
    if (
      rotated.status !== "rotated" ||
      !rotated.userId ||
      !rotated.nextRefreshToken ||
      !rotated.scope
    ) {
      return oauthError("invalid_grant", "Refresh token is invalid or expired");
    }
    const user = await store.findPublicUserById(rotated.userId);
    if (!user) return oauthError("invalid_grant", "User account no longer active");

    const tokenResponse = await issueClientTokens({
      env,
      user,
      clientId: client.clientId,
      scope: rotated.scope,
      resource: rotated.resource ?? null,
      refreshTokenOverride: rotated.nextRefreshToken,
    });
    return jsonResponse(tokenResponse, 200);
  }

  return oauthError(
    "unsupported_grant_type",
    "Only authorization_code and refresh_token are supported",
  );
}

/** Create Cloudflare Worker fetch handler for moonwitness-id. */
export function createMidHandler() {
  return async (request: Request, env: MidEnv): Promise<Response> => {
    if (!env.DB || !env.MID_KEY_ENCRYPTION_SECRET) {
      return jsonResponse(
        { error: "Worker bindings DB or MID_KEY_ENCRYPTION_SECRET missing" },
        500,
      );
    }

    const requestUrl = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    await ensureMidSchema(env.DB, { skipLegacyAuditTable: Boolean(env.IDENTITY_STORE) });
    const store = resolveIdentityStore(env);
    const issuer = resolveIssuer(env);
    const path = requestUrl.pathname;

    if (request.method === "GET" && path === "/health") {
      const { activeKey } = await getOrProvisionSigningKeys(env.DB, env.MID_KEY_ENCRYPTION_SECRET);
      return withCors(
        jsonResponse({ service: "moonwitness-id", status: "ok", issuer, activeKid: activeKey.kid }),
        cors,
      );
    }

    if (request.method === "GET" && path === "/.well-known/openid-configuration") {
      return withCors(jsonResponse(buildDiscoveryDocument(issuer)), cors);
    }

    if (request.method === "GET" && path === "/.well-known/jwks.json") {
      const { publicJwks } = await getOrProvisionSigningKeys(env.DB, env.MID_KEY_ENCRYPTION_SECRET);
      return withCors(
        jsonResponse({ keys: publicJwks }, 200, { "cache-control": "public, max-age=300" }),
        cors,
      );
    }

    const cookies = parseCookies(request.headers.get("cookie"));
    const activeSession = cookies[SESSION_COOKIE_NAME]
      ? await store.findActiveSsoSession(cookies[SESSION_COOKIE_NAME])
      : null;
    const sessionUser = activeSession?.user ?? null;

    if (path === "/" && request.method === "GET") {
      const [clients, audits] = sessionUser
        ? await Promise.all([
            listOidcClients(env.DB),
            sessionUser.role === "admin" ? store.listRecentAuditEvents(20) : Promise.resolve([]),
          ])
        : [[], []];
      const notice =
        requestUrl.searchParams.get("notice") === "password_updated"
          ? "Password updated successfully."
          : undefined;
      return htmlResponse(renderPortalPage({ issuer, user: sessionUser, clients, audits, notice }));
    }

    if (path === "/authorize") {
      if (request.method === "GET")
        return handleAuthorizeGet(request, requestUrl, env, sessionUser);
      if (request.method === "POST")
        return handleAuthorizePost(request, requestUrl, env, sessionUser);
    }

    if (path === "/oauth/token" && request.method === "POST") {
      return withCors(await handleTokenPost(request, env), cors);
    }

    if (path === "/oauth/userinfo" && request.method === "GET") {
      const authHeader = request.headers.get("authorization") ?? "";
      if (!authHeader.startsWith("Bearer ")) {
        return withCors(oauthError("invalid_token", "Bearer token required", 401), cors);
      }
      const token = authHeader.slice(7).trim();
      const { publicJwks } = await getOrProvisionSigningKeys(env.DB, env.MID_KEY_ENCRYPTION_SECRET);
      const claims = await verifyEs256Jwt(token, publicJwks, issuer, {
        expectedTokenUse: "access",
      });
      if (!claims || claims.token_use !== "access") {
        return withCors(oauthError("invalid_token", "Invalid or expired access token", 401), cors);
      }
      return withCors(
        jsonResponse({
          sub: claims.sub,
          preferred_username: claims.preferred_username,
          name: claims.name,
          email: claims.email,
          role: claims.role,
        }),
        cors,
      );
    }

    if ((path === "/oauth/introspect" || path === "/oauth/revoke") && request.method === "POST") {
      const form = new URLSearchParams(await request.text());
      const token = form.get("token") ?? "";
      if (path === "/oauth/revoke") {
        if (token) await revokeRefreshToken(env.DB, token);
        return withCors(jsonResponse({ revoked: true }), cors);
      }
      const { client } = await authenticateClientCredentials(request, form, env);
      if (!client || client.clientType !== "confidential") {
        return withCors(
          oauthError("invalid_client", "Confidential client credentials required", 401),
          cors,
        );
      }
      const expectedAudience = resolveIntrospectionExpectedAudience(client.clientId, form, env);
      if (!expectedAudience) {
        return withCors(jsonResponse({ active: false }), cors);
      }
      const { publicJwks } = await getOrProvisionSigningKeys(env.DB, env.MID_KEY_ENCRYPTION_SECRET);
      const claims = token
        ? await verifyEs256Jwt(token, publicJwks, issuer, {
            expectedTokenUse: "access",
            expectedAudience,
          })
        : null;
      if (!claims) {
        return withCors(jsonResponse({ active: false }), cors);
      }
      const resolvedClientId =
        claims.azp ?? (Array.isArray(claims.aud) ? (claims.aud[0] ?? client.clientId) : claims.aud);
      return withCors(
        jsonResponse({
          active: true,
          ...claims,
          client_id: resolvedClientId,
        }),
        cors,
      );
    }

    if (
      (path === "/logout" && request.method === "GET") ||
      (path === "/oauth/logout" && request.method === "POST")
    ) {
      if (activeSession) {
        await store.revokeSsoSession(activeSession.sessionId);
        await store.recordAuditEvent({
          eventType: "auth.logout",
          actorUserId: activeSession.user.id,
          clientId: null,
          detail: {},
          ipAddress: clientIpFromRequest(request),
        });
      }
      const expiredCookie = buildSessionCookie("", 0, requestUrl, env);
      return new Response(null, {
        status: 303,
        headers: { location: "/", "set-cookie": expiredCookie },
      });
    }

    if (path === "/api/session/me" && request.method === "GET") {
      if (!sessionUser) return withCors(jsonResponse({ authenticated: false }, 401), cors);
      return withCors(jsonResponse({ authenticated: true, user: sessionUser }), cors);
    }

    if (path === "/api/clients" && request.method === "GET") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return withCors(
          jsonResponse({ error: "Admin role required" }, sessionUser ? 403 : 401),
          cors,
        );
      }
      return withCors(jsonResponse({ clients: await listOidcClients(env.DB) }), cors);
    }

    if (path === "/api/audit" && request.method === "GET") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return withCors(
          jsonResponse({ error: "Admin role required" }, sessionUser ? 403 : 401),
          cors,
        );
      }
      return withCors(jsonResponse({ events: await store.listRecentAuditEvents(50) }), cors);
    }

    if (path.startsWith("/api/clients/") && request.method === "DELETE") {
      if (!isTrustedOriginMutation(request, env))
        return jsonResponse({ error: "Untrusted origin" }, 403);
      if (!sessionUser || sessionUser.role !== "admin") {
        return jsonResponse({ error: "Admin role required" }, sessionUser ? 403 : 401);
      }
      const deleted = await deleteOidcClient(env.DB, path.slice("/api/clients/".length));
      return jsonResponse({ deleted }, deleted ? 200 : 404);
    }

    if (request.method === "POST" && (path.startsWith("/portal/") || path.startsWith("/api/"))) {
      return withCors(await handlePortalPost(path, request, requestUrl, env, sessionUser), cors);
    }

    return withCors(jsonResponse({ error: "Not found" }, 404), cors);
  };
}
