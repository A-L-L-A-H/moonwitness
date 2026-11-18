import { hashPassword, verifyPassword } from "./crypto";
import {
  createOidcClient,
  createSsoSession,
  deleteOidcClient,
  findUserByLogin,
  listOidcClients,
  listRecentAuditEvents,
  recordAuditEvent,
  updateUserPasswordHash,
} from "./db";
import {
  buildSessionCookie,
  clientIpFromRequest,
  htmlResponse,
  isTrustedOriginMutation,
  jsonResponse,
  readFormOrJson,
  readTtl,
  resolveIssuer,
} from "./http";
import type { MidEnv, PublicUser } from "./types";
import { renderPortalPage } from "./ui";

/** Handle cookie-authenticated web portal and JSON management POST routes. */
export async function handlePortalPost(
  path: string,
  request: Request,
  requestUrl: URL,
  env: MidEnv,
  sessionUser: PublicUser | null,
): Promise<Response> {
  if (!isTrustedOriginMutation(request, env)) {
    return jsonResponse({ error: "Untrusted origin" }, 403);
  }
  const form = await readFormOrJson(request);
  const issuer = resolveIssuer(env);

  if (path === "/portal/login" || path === "/api/session/login") {
    const user = await findUserByLogin(env.DB, form.identifier ?? "");
    const valid = user ? await verifyPassword(form.password ?? "", user.passwordHash) : false;
    if (!user || !valid) {
      await recordAuditEvent(env.DB, {
        eventType: "auth.login.failed",
        actorUserId: user?.id ?? null,
        clientId: null,
        detail: { identifier: form.identifier ?? "" },
        ipAddress: clientIpFromRequest(request),
      });
      if (path === "/api/session/login") return jsonResponse({ error: "Invalid credentials" }, 401);
      return htmlResponse(
        renderPortalPage({
          issuer,
          user: null,
          clients: [],
          audits: [],
          error: "Invalid username/email or password.",
        }),
        401,
      );
    }
    const sessionTtl = readTtl(env.SESSION_TTL_SEC, 604_800);
    const sessionId = await createSsoSession(env.DB, user.id, sessionTtl);
    const setCookie = buildSessionCookie(sessionId, sessionTtl, requestUrl, env);
    await recordAuditEvent(env.DB, {
      eventType: "auth.login.succeeded",
      actorUserId: user.id,
      clientId: null,
      detail: { username: user.username },
      ipAddress: clientIpFromRequest(request),
    });
    if (path === "/api/session/login") {
      return jsonResponse(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
          },
        },
        200,
        { "set-cookie": setCookie },
      );
    }
    return new Response(null, { status: 303, headers: { location: "/", "set-cookie": setCookie } });
  }

  if (!sessionUser) return jsonResponse({ error: "Authentication required" }, 401);

  if (path === "/portal/password" || path === "/api/session/password") {
    const user = await findUserByLogin(env.DB, sessionUser.username);
    const currentValid = user
      ? await verifyPassword(form.current_password ?? "", user.passwordHash)
      : false;
    const newPassword = form.new_password ?? "";
    if (!user || !currentValid || newPassword.length < 10) {
      if (path === "/api/session/password") {
        return jsonResponse({ error: "Password check failed" }, 400);
      }
      const [clients, audits] = await Promise.all([
        listOidcClients(env.DB),
        listRecentAuditEvents(env.DB, 20),
      ]);
      return htmlResponse(
        renderPortalPage({
          issuer,
          user: sessionUser,
          clients,
          audits: sessionUser.role === "admin" ? audits : [],
          error: "Current password incorrect or new password shorter than 10 chars.",
        }),
        400,
      );
    }
    await updateUserPasswordHash(env.DB, user.id, await hashPassword(newPassword));
    await recordAuditEvent(env.DB, {
      eventType: "auth.password.rotated",
      actorUserId: user.id,
      clientId: null,
      detail: {},
      ipAddress: clientIpFromRequest(request),
    });
    if (path === "/api/session/password") return jsonResponse({ ok: true }, 200);
    return Response.redirect(new URL("/?notice=password_updated", requestUrl).toString(), 303);
  }

  if (sessionUser.role !== "admin") return jsonResponse({ error: "Admin role required" }, 403);

  if (path === "/portal/clients" || path === "/api/clients") {
    const clientId = (form.client_id ?? "").trim();
    const name = (form.name ?? "").trim();
    const redirectUris = (form.redirect_uris ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const clientType = form.client_type === "confidential" ? "confidential" : "public";
    if (!/^[a-z0-9-]{3,48}$/.test(clientId) || !name || redirectUris.length === 0) {
      return jsonResponse({ error: "Invalid client registration fields" }, 400);
    }
    const created = await createOidcClient(env.DB, {
      clientId,
      name,
      redirectUris,
      allowedScopes: ["openid", "profile", "email", "offline_access"],
      clientType,
    });
    await recordAuditEvent(env.DB, {
      eventType: "oidc.client.created",
      actorUserId: sessionUser.id,
      clientId,
      detail: { clientType },
      ipAddress: clientIpFromRequest(request),
    });
    if (path === "/api/clients") {
      return jsonResponse({ client: created.client, clientSecret: created.plainSecret }, 201);
    }
    const [clients, audits] = await Promise.all([
      listOidcClients(env.DB),
      listRecentAuditEvents(env.DB, 20),
    ]);
    return htmlResponse(
      renderPortalPage({
        issuer,
        user: sessionUser,
        clients,
        audits,
        notice: created.plainSecret
          ? `Created ${clientId}. Secret (shown once): ${created.plainSecret}`
          : `Created public client ${clientId}.`,
      }),
      201,
    );
  }

  if (path === "/portal/clients/delete") {
    const targetId = (form.client_id ?? "").trim();
    if (targetId) await deleteOidcClient(env.DB, targetId);
    return Response.redirect(new URL("/", requestUrl).toString(), 303);
  }

  return jsonResponse({ error: "Not found" }, 404);
}
