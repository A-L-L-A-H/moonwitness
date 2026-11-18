import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { createActorContext, getDb } from "@moonwitness/orm";
import {
  requireAuth,
  requireRole,
  resolveRequestIdentity,
  type AuthenticatedRequest,
} from "../../middleware/auth";
import {
  createSession,
  getSessionCookieOptions,
  revokeSession,
  SESSION_COOKIE_NAME,
} from "../../services/session";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  verifyUserPassword,
} from "../../services/user";
import { controlCommandModel } from "../../infrastructure/persistence/domain";
import { getEdgeLoopbackErrorPayload, resolveUpstreamServiceUrl } from "../../shared/upstream";

function getArsyUrl(): string {
  return resolveUpstreamServiceUrl("ARSY_URL", "http://127.0.0.1:8787");
}

function getArsyTokens(): { readonlyToken: string; adminToken: string } {
  return {
    readonlyToken: process.env.ARSY_TOKEN_READONLY ?? "",
    adminToken: process.env.ARSY_TOKEN_ADMIN ?? "",
  };
}

// Endpoint auth/setup meneruskan kredensial ke control plane, jadi dibatasi
// per-IP untuk mempersempit brute force (login) dan penyalahgunaan setup.
const AUTH_RATE_MAX = Number(process.env.ARSY_AUTH_RATE_MAX ?? "30");
const AUTH_RATE_WINDOW_MS = Number(process.env.ARSY_AUTH_RATE_WINDOW_MS ?? "60000");

/** Declarative resource kinds supported or capability-gated by cp/arsy V1. */
export const ARSY_V1_SUPPORTED_RESOURCE_KINDS = new Set([
  "files",
  "dir",
  "docker",
  "systemd",
  "dockercompose",
  "backup",
  "cert",
]);

/** Resource kinds explicitly rejected by cp/arsy internal/resources/unsupported.go in V1. */
export const ARSY_V1_DEFERRED_RESOURCE_KINDS = new Set([
  "kubernetes",
  "gitdeploy",
  "cron",
  "user",
  "firewall",
  "portforward",
  "network",
  "ssh",
  "mount",
  "alert",
  "webhook",
  "package",
]);

// Hanya endpoint arsy yang dikenal di cp/arsy/internal/api/server.go yang boleh diproxy.
// Ini mencegah web menjadi open proxy ke path arsy yang tidak eksis.
const READ_PATHS = new Set([
  "health",
  "host",
  "capabilities",
  "metrics",
  "state",
  "resources",
  "logs",
  "audit",
  "users",
  "dns",
  "portforwards",
  "vpn/status",
  "vpn/subnets",
  "vpn/peers",
]);

const WRITE_PATHS = new Set([
  "plan",
  "apply",
  "ops/plan",
  "ops",
  "portforwards",
  "vpn/subnets",
  "vpn/up",
  "vpn/down",
  "vpn/peers",
]);

// Endpoint onboarding/auth memakai cookie sesi, bukan token server-side.
const SETUP_PATHS = new Set(["status", "superuser"]);
const AUTH_PATHS = new Set(["login", "logout", "me"]);
const ADMIN_ONLY_WRITE_PATHS = new Set(["plan", "apply", "ops"]);

function clientIp(request: FastifyRequest): string {
  return request.ip;
}

async function controlWriteRole(
  request: FastifyRequest<{ Params: { path: string } }>,
  reply: FastifyReply,
) {
  const guard = ADMIN_ONLY_WRITE_PATHS.has(request.params.path)
    ? requireRole("admin")
    : requireRole("admin", "editor");
  return guard(request, reply);
}

function upstreamHeaders(request: FastifyRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "x-forwarded-for": clientIp(request),
    "x-forwarded-proto": request.protocol,
  };
  if (request.body) headers["content-type"] = "application/json";
  const cookie = request.headers.cookie;
  if (typeof cookie === "string" && cookie.length > 0) headers.cookie = cookie;
  return headers;
}

function extractArsySessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("arsy_session="));
  return match ?? null;
}

function buildControlUpstreamHeaders(request: FastifyRequest): Record<string, string> {
  const headers = upstreamHeaders(request);
  const arsySession = extractArsySessionCookie(headers.cookie);
  if (arsySession) {
    headers.cookie = arsySession;
    return headers;
  }
  // Never forward MoonWitness D1 session cookies to arsy; attach server-side bearer token when configured.
  delete headers.cookie;
  const isWrite = request.method !== "GET" && request.method !== "HEAD";
  const { readonlyToken, adminToken } = getArsyTokens();
  const fallback = isWrite ? adminToken : readonlyToken || adminToken;
  if (fallback) {
    headers.authorization = `Bearer ${fallback}`;
  }
  return headers;
}

function forwardCookies(reply: FastifyReply, upstream: Response) {
  for (const cookie of upstream.headers.getSetCookie()) {
    // Buang atribut Domain agar cookie menempel ke host web, bukan host arsy.
    reply.header("set-cookie", cookie.replace(/;\s*domain=[^;]*/gi, ""));
  }
}

async function forwardAuth(request: FastifyRequest, reply: FastifyReply, subPath: string) {
  const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
  const arsyUrl = getArsyUrl();
  const edgeGuard = getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", arsyUrl);
  if (edgeGuard) {
    return reply.code(503).header("cache-control", "no-store").send(edgeGuard);
  }
  const target = `${arsyUrl}/v1/${subPath}${query}`;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: upstreamHeaders(request),
      body: (() => {
        const b = request.body;
        return typeof b === "string" || b instanceof Buffer ? b : b ? JSON.stringify(b) : undefined;
      })(),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    request.log.warn({ err: error, target }, "arsy tidak dapat dihubungi");
    return reply.code(502).send({ error: "arsy tidak dapat dihubungi", reachable: false });
  }

  const text = await upstream.text();
  forwardCookies(reply, upstream);
  return reply
    .code(upstream.status)
    .header("content-type", "application/json; charset=utf-8")
    .header("cache-control", "no-store")
    .send(text);
}

function sanitizeControlRequestBody(body: unknown): string | null {
  if (body === undefined || body === null) return null;
  if (typeof body === "string") return body.slice(0, 2000);
  if (Buffer.isBuffer(body)) return `[binary:${body.byteLength}]`;
  if (typeof body !== "object") return String(body).slice(0, 2000);
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    redacted[key] = /password|token|secret|private_key/i.test(key) ? "[redacted]" : value;
  }
  return JSON.stringify(redacted).slice(0, 2000);
}

async function recordControlCommand(
  request: FastifyRequest,
  subPath: string,
  targetUrl: string,
  responseStatus: number,
): Promise<void> {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return;
  try {
    const authUser = (request as AuthenticatedRequest).user;
    const outcome =
      responseStatus === 401 || responseStatus === 403
        ? "denied"
        : responseStatus < 400
          ? "success"
          : "failure";
    const correlationHeader = request.headers["x-correlation-id"];
    await controlCommandModel.repository.create(
      {
        actor_id: authUser ? String(authUser.id) : null,
        actor_role: authUser?.role ?? null,
        target_path: subPath.slice(0, 300),
        method: request.method.toUpperCase().slice(0, 16),
        upstream_url: targetUrl.slice(0, 1000),
        request_body_json: sanitizeControlRequestBody(request.body),
        response_status: responseStatus,
        outcome,
        correlation_id:
          typeof correlationHeader === "string" ? correlationHeader.slice(0, 200) : null,
        executed_at: new Date().toISOString(),
      },
      createActorContext(authUser ? String(authUser.id) : null, "api", request.id),
    );
  } catch {
    // Best-effort persistence: never break upstream proxy responses if DB is uninitialized.
  }
}

async function forward(request: FastifyRequest, reply: FastifyReply, subPath: string) {
  const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
  const arsyUrl = getArsyUrl();
  const target = `${arsyUrl}/v1/${subPath}${query}`;

  const edgeGuard = getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", arsyUrl);
  if (edgeGuard) {
    return reply.code(503).header("cache-control", "no-store").send(edgeGuard);
  }
  const headers = buildControlUpstreamHeaders(request);

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body: (() => {
        const b = request.body;
        return typeof b === "string" || b instanceof Buffer ? b : b ? JSON.stringify(b) : undefined;
      })(),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    request.log.warn({ err: error, target }, "arsy tidak dapat dihubungi");
    await recordControlCommand(request, subPath, target, 502);
    return reply.code(502).send({ error: "arsy tidak dapat dihubungi" });
  }

  const text = await response.text();
  forwardCookies(reply, response);
  await recordControlCommand(request, subPath, target, response.status);
  return reply
    .code(response.status)
    .header("content-type", "application/json; charset=utf-8")
    .header("cache-control", "no-store")
    .send(text);
}

function isNativeSetupEnabled(): boolean {
  if (process.env.CONTROL_NATIVE_SETUP === "1") return true;
  if (process.env.CONTROL_NATIVE_SETUP === "0") return false;
  return process.env.NODE_ENV === "development" && !process.env.ARSY_URL?.trim();
}

function isHttpsRequest(request: FastifyRequest): boolean {
  const forwardedProto = request.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
  }
  return request.protocol === "https";
}

function getControlSessionCookieOptions(request: FastifyRequest) {
  return {
    ...getSessionCookieOptions(),
    // Coolify-style first-light setup often runs over http://<VPS_IP> before DNS/TLS;
    // avoid marking the cookie Secure on plain HTTP requests or browsers drop it.
    secure: process.env.NODE_ENV === "production" ? isHttpsRequest(request) : false,
  };
}

function toIsoTimestamp(raw: unknown): string | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(raw < 1e12 ? raw * 1000 : raw).toISOString();
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      const parsedUtc = new Date(`${trimmed.replace(" ", "T")}Z`);
      return Number.isNaN(parsedUtc.getTime()) ? undefined : parsedUtc.toISOString();
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  return undefined;
}

function formatControlUser(user: {
  id: string | number;
  displayName: string;
  email: string;
  role: string;
  createdAt?: Date | string | number;
}) {
  return {
    id: String(user.id),
    name: user.displayName,
    email: user.email,
    role: user.role === "admin" ? "superadmin" : "readonly",
    created_at:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : (toIsoTimestamp(user.createdAt) ?? new Date().toISOString()),
  };
}

function sendNoStoreJson(reply: FastifyReply, statusCode: number, payload: unknown) {
  return reply.code(statusCode).header("cache-control", "no-store").send(payload);
}

async function handleNativeSetupStatus(reply: FastifyReply) {
  const row = await getDb().get<{ count: number; initialized_at: string | number | null }>(
    "SELECT COUNT(*) as count, MIN(create_date) as initialized_at FROM auth_users",
  );
  const initialized = (row?.count ?? 0) > 0;
  const initializedAt = initialized ? toIsoTimestamp(row?.initialized_at) : undefined;
  return sendNoStoreJson(reply, 200, {
    initialized,
    version: "0.1.0",
    instance: {
      id: process.env.INSTANCE_ID?.trim() || "moonwitness-vps",
      name: process.env.INSTANCE_NAME?.trim() || "Moonwitness",
      ...(initializedAt ? { initialized_at: initializedAt } : {}),
      version: "0.1.0",
    },
  });
}

async function syncSuperuserToArsyBestEffort(payload: {
  name: string;
  email: string;
  password: string;
  instance_name: string;
}): Promise<void> {
  if (!process.env.ARSY_URL?.trim()) return;
  const arsyUrl = getArsyUrl();
  if (getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", arsyUrl)) return;
  try {
    await fetch(`${arsyUrl}/v1/setup/superuser`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2_000),
    });
  } catch {
    // Non-blocking sync when host arsy daemon is offline or isolated from container network.
  }
}

async function handleNativeCreateSuperuser(request: FastifyRequest, reply: FastifyReply) {
  const rawBody = request.body as Record<string, unknown> | undefined;
  const name = typeof rawBody?.name === "string" ? rawBody.name.trim() : "";
  const email = typeof rawBody?.email === "string" ? rawBody.email.trim().toLowerCase() : "";
  const password = typeof rawBody?.password === "string" ? rawBody.password : "";
  const instanceName =
    typeof rawBody?.instance_name === "string" ? rawBody.instance_name.trim() : "";

  if (name.length < 2) {
    return sendNoStoreJson(reply, 400, { error: "Nama minimal 2 karakter" });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return sendNoStoreJson(reply, 400, { error: "Format email tidak valid" });
  }
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 12 || passwordBytes > 72) {
    return sendNoStoreJson(reply, 400, { error: "Password harus 12–72 karakter" });
  }

  const existing = await getDb().get<{ count: number }>("SELECT COUNT(*) as count FROM auth_users");
  if ((existing?.count ?? 0) > 0) {
    return sendNoStoreJson(reply, 409, { error: "instance sudah diinisialisasi" });
  }

  const localPart = email.split("@")[0] ?? "admin";
  const username = localPart.replace(/[^a-z0-9_.-]/g, "").slice(0, 32) || "admin";

  let user;
  try {
    user = await createUser({
      username,
      email,
      password,
      role: "admin",
      displayName: name,
    });
  } catch (error) {
    const afterRace = await getDb().get<{ count: number }>(
      "SELECT COUNT(*) as count FROM auth_users",
    );
    if ((afterRace?.count ?? 0) > 0) {
      return sendNoStoreJson(reply, 409, { error: "instance sudah diinisialisasi" });
    }
    throw error;
  }

  if (instanceName) {
    process.env.INSTANCE_NAME = instanceName;
  }

  const sessionId = await createSession(user.id);
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, getControlSessionCookieOptions(request));

  await syncSuperuserToArsyBestEffort({
    name,
    email,
    password,
    instance_name: instanceName || process.env.INSTANCE_NAME || "Moonwitness",
  });

  return sendNoStoreJson(reply, 201, {
    initialized: true,
    user: formatControlUser(user),
  });
}

async function handleNativeAuthLogin(request: FastifyRequest, reply: FastifyReply) {
  const rawBody = request.body as Record<string, unknown> | undefined;
  const identifier = typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const password = typeof rawBody?.password === "string" ? rawBody.password : "";

  if (!identifier || !password) {
    return sendNoStoreJson(reply, 400, { error: "Email dan password wajib diisi" });
  }

  const normalized = identifier.toLowerCase();
  const user =
    (await findUserByEmail(normalized)) ??
    (await findUserByUsername(normalized)) ??
    (await findUserByUsername(identifier));

  if (!user || !(await verifyUserPassword(user, password))) {
    return sendNoStoreJson(reply, 401, { error: "Email atau password salah" });
  }

  const sessionId = await createSession(user.id);
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, getControlSessionCookieOptions(request));

  return sendNoStoreJson(reply, 200, {
    user: formatControlUser(user),
  });
}

async function handleNativeAuthMe(request: FastifyRequest, reply: FastifyReply) {
  const { user, expiredSessionCookie } = await resolveRequestIdentity(request);
  if (!user) {
    if (expiredSessionCookie) {
      reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    }
    return sendNoStoreJson(reply, 401, { error: "Not authenticated" });
  }
  const fullUser = await findUserById(user.id);
  return sendNoStoreJson(reply, 200, {
    user: formatControlUser(fullUser ?? user),
  });
}

async function handleNativeAuthLogout(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];
  if (sessionToken) {
    await revokeSession(sessionToken);
  }
  reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  return sendNoStoreJson(reply, 200, { ok: true });
}

export async function controlRoutes(fastify: FastifyInstance) {
  // Endpoint auth/setup meneruskan kredensial ke control plane, jadi dibatasi
  // per-IP untuk mempersempit brute force (login) dan penyalahgunaan setup.
  await fastify.register(async (authScope) => {
    await authScope.register(rateLimit, {
      max: AUTH_RATE_MAX,
      timeWindow: AUTH_RATE_WINDOW_MS,
      keyGenerator: (request) => clientIp(request as FastifyRequest),
      errorResponseBuilder: () => ({
        statusCode: 429,
        error: "Too Many Requests",
        message: "terlalu banyak percobaan; coba lagi nanti",
      }),
    });

    authScope.get<{ Params: { path: string } }>("/control/setup/:path", async (request, reply) => {
      const { path } = request.params;
      if (!SETUP_PATHS.has(path)) {
        return reply.code(404).send({ error: `path setup tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "status") return handleNativeSetupStatus(reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardAuth(request, reply, `setup/${path}`);
    });

    authScope.post<{ Params: { path: string } }>("/control/setup/:path", async (request, reply) => {
      const { path } = request.params;
      if (!SETUP_PATHS.has(path)) {
        return reply.code(404).send({ error: `path setup tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "superuser") return handleNativeCreateSuperuser(request, reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardAuth(request, reply, `setup/${path}`);
    });

    authScope.get<{ Params: { path: string } }>("/control/auth/:path", async (request, reply) => {
      const { path } = request.params;
      if (!AUTH_PATHS.has(path)) {
        return reply.code(404).send({ error: `path auth tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "me") return handleNativeAuthMe(request, reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardAuth(request, reply, `auth/${path}`);
    });

    authScope.post<{ Params: { path: string } }>("/control/auth/:path", async (request, reply) => {
      const { path } = request.params;
      if (!AUTH_PATHS.has(path)) {
        return reply.code(404).send({ error: `path auth tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "login") return handleNativeAuthLogin(request, reply);
        if (path === "logout") return handleNativeAuthLogout(request, reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardAuth(request, reply, `auth/${path}`);
    });
  });

  // Protected routes - require authentication
  fastify.register(async (protectedScope) => {
    protectedScope.addHook("preHandler", requireAuth());

    protectedScope.get("/control/status", async (request, reply) => {
      const arsyUrl = getArsyUrl();
      const edgeGuard = getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", arsyUrl);
      if (edgeGuard) {
        return reply
          .code(503)
          .header("cache-control", "no-store")
          .send({ ...edgeGuard, arsyUrl });
      }
      const headers = buildControlUpstreamHeaders(request);
      const [hostRes, metricsRes] = await Promise.all([
        fetch(`${arsyUrl}/v1/host`, { headers, signal: AbortSignal.timeout(5_000) }).catch(
          () => null,
        ),
        fetch(`${arsyUrl}/v1/metrics`, { headers, signal: AbortSignal.timeout(10_000) }).catch(
          () => null,
        ),
      ]);

      if (!hostRes?.ok || !metricsRes?.ok) {
        return reply
          .code(502)
          .send({ error: "arsy tidak dapat dihubungi", arsyUrl, reachable: false });
      }
      return reply.send({
        reachable: true,
        host: await hostRes.json(),
        metrics: await metricsRes.json(),
      });
    });

    // ---- Port forwarding ----
    protectedScope.get("/control/portforwards", async (request, reply) => {
      return forward(request, reply, "portforwards");
    });

    protectedScope.post(
      "/control/portforwards",
      {
        preHandler: requireRole("admin", "editor"),
      },
      async (request, reply) => {
        return forward(request, reply, "portforwards");
      },
    );

    protectedScope.delete(
      "/control/portforwards",
      {
        preHandler: requireRole("admin", "editor"),
      },
      async (request, reply) => {
        return forward(request, reply, "portforwards");
      },
    );

    protectedScope.get<{ Params: { path: string } }>("/control/:path", async (request, reply) => {
      const { path } = request.params;
      if (!READ_PATHS.has(path)) {
        return reply.code(404).send({ error: `path control tidak dikenal: ${path}` });
      }
      return forward(request, reply, path);
    });

    protectedScope.post<{ Params: { path: string } }>(
      "/control/:path",
      {
        preHandler: controlWriteRole,
      },
      async (request, reply) => {
        const { path } = request.params;
        if (!WRITE_PATHS.has(path)) {
          return reply.code(404).send({ error: `path control tidak dikenal: ${path}` });
        }
        return forward(request, reply, path);
      },
    );

    // ---- VPN ----
    protectedScope.get("/control/vpn/status", async (request, reply) => {
      return forward(request, reply, "vpn/status");
    });

    protectedScope.get("/control/vpn/subnets", async (request, reply) => {
      return forward(request, reply, "vpn/subnets");
    });

    protectedScope.post(
      "/control/vpn/subnets",
      {
        preHandler: requireRole("admin", "editor"),
      },
      async (request, reply) => {
        return forward(request, reply, "vpn/subnets");
      },
    );

    protectedScope.delete<{ Params: { name: string } }>(
      "/control/vpn/subnets/:name",
      {
        preHandler: requireRole("admin", "editor"),
      },
      async (request, reply) => {
        const name = encodeURIComponent(request.params.name);
        return forward(request, reply, `vpn/subnets/${name}`);
      },
    );

    for (const sub of ["vpn/up", "vpn/down", "vpn/peers"] as const) {
      protectedScope.post(
        `/control/${sub}`,
        {
          preHandler: requireRole("admin", "editor"),
        },
        async (request, reply) => {
          return forward(request, reply, sub);
        },
      );
    }

    protectedScope.get<{ Params: { name: string } }>(
      "/control/vpn/peers/:name/config",
      async (request, reply) => {
        const name = encodeURIComponent(request.params.name);
        return forward(request, reply, `vpn/peers/${name}/config`);
      },
    );

    protectedScope.post<{ Params: { name: string } }>(
      "/control/vpn/peers/:name/quota",
      {
        preHandler: requireRole("admin", "editor"),
      },
      async (request, reply) => {
        const name = encodeURIComponent(request.params.name);
        return forward(request, reply, `vpn/peers/${name}/quota`);
      },
    );

    protectedScope.delete<{ Params: { name: string } }>(
      "/control/vpn/peers/:name",
      {
        preHandler: requireRole("admin", "editor"),
      },
      async (request, reply) => {
        const name = encodeURIComponent(request.params.name);
        return forward(request, reply, `vpn/peers/${name}`);
      },
    );
  });
}
