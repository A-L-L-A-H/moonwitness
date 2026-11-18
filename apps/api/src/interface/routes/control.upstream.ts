import type { FastifyReply, FastifyRequest } from "fastify";
import { createActorContext } from "@moonwitness/orm";
import { controlCommandModel } from "@moonwitness/addons/control";
import { type AuthenticatedRequest } from "../../middleware/auth";
import { getEdgeLoopbackErrorPayload, resolveUpstreamServiceUrl } from "../../shared/upstream";

export const ARSY_V1_SUPPORTED_RESOURCE_KINDS = new Set([
  "files",
  "dir",
  "docker",
  "systemd",
  "dockercompose",
  "backup",
  "cert",
]);

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

export const CONTROL_READ_PATHS = new Set([
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

export const CONTROL_WRITE_PATHS = new Set([
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

export const CONTROL_SETUP_PATHS = new Set(["status", "superuser"]);
export const CONTROL_AUTH_PATHS = new Set(["login", "logout", "me"]);
export const CONTROL_ADMIN_ONLY_WRITE_PATHS = new Set(["plan", "apply", "ops"]);

export function getArsyUrl(): string {
  return resolveUpstreamServiceUrl("ARSY_URL", "http://127.0.0.1:8787");
}

function getArsyTokens(): { readonlyToken: string; adminToken: string } {
  return {
    readonlyToken: process.env.ARSY_TOKEN_READONLY ?? "",
    adminToken: process.env.ARSY_TOKEN_ADMIN ?? "",
  };
}

function upstreamHeaders(request: FastifyRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "x-forwarded-for": request.ip,
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

export function buildControlUpstreamHeaders(request: FastifyRequest): Record<string, string> {
  const headers = upstreamHeaders(request);
  const arsySession = extractArsySessionCookie(headers.cookie);
  if (arsySession) {
    headers.cookie = arsySession;
    return headers;
  }
  delete headers.cookie;
  const isWrite = request.method !== "GET" && request.method !== "HEAD";
  const { readonlyToken, adminToken } = getArsyTokens();
  const fallback = isWrite ? adminToken : readonlyToken || adminToken;
  if (fallback) {
    headers.authorization = `Bearer ${fallback}`;
  }
  return headers;
}

function forwardCookies(reply: FastifyReply, upstream: Response): void {
  for (const cookie of upstream.headers.getSetCookie()) {
    reply.header("set-cookie", cookie.replace(/;\s*domain=[^;]*/gi, ""));
  }
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
    // Best-effort audit persistence when control ledger table exists.
  }
}

async function dispatchControlProxy(
  request: FastifyRequest,
  reply: FastifyReply,
  subPath: string,
  options: {
    readonly includeAuthCookieOnly: boolean;
    readonly timeoutMs: number;
    readonly audit: boolean;
  },
) {
  const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
  const arsyUrl = getArsyUrl();
  const edgeGuard = getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", arsyUrl);
  if (edgeGuard) {
    return reply.code(503).header("cache-control", "no-store").send(edgeGuard);
  }
  const target = `${arsyUrl}/v1/${subPath}${query}`;
  const headers = options.includeAuthCookieOnly
    ? buildControlUpstreamHeaders(request)
    : upstreamHeaders(request);

  let upstream: Response;
  try {
    const b = request.body;
    const body =
      typeof b === "string" || b instanceof Buffer ? b : b ? JSON.stringify(b) : undefined;
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    request.log.warn({ err: error, target }, "arsy tidak dapat dihubungi");
    if (options.audit) await recordControlCommand(request, subPath, target, 502);
    return reply
      .code(502)
      .send(
        options.audit
          ? { error: "arsy tidak dapat dihubungi" }
          : { error: "arsy tidak dapat dihubungi", reachable: false },
      );
  }

  const text = await upstream.text();
  forwardCookies(reply, upstream);
  if (options.audit) await recordControlCommand(request, subPath, target, upstream.status);
  return reply
    .code(upstream.status)
    .header("content-type", "application/json; charset=utf-8")
    .header("cache-control", "no-store")
    .send(text);
}

export function forwardControlAuth(request: FastifyRequest, reply: FastifyReply, subPath: string) {
  return dispatchControlProxy(request, reply, subPath, {
    includeAuthCookieOnly: false,
    timeoutMs: 15_000,
    audit: false,
  });
}

export function forwardControlRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  subPath: string,
) {
  return dispatchControlProxy(request, reply, subPath, {
    includeAuthCookieOnly: true,
    timeoutMs: 30_000,
    audit: true,
  });
}
