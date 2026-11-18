import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createActorContext } from "@moonwitness/orm";
import { tryRecordAuditLog } from "../../infrastructure/audit/audit-log";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../middleware/auth";
import {
  getEdgeLoopbackErrorPayload,
  getUpstreamBridgeHeaders,
  resolveUpstreamServiceUrl,
} from "../../shared/upstream";

function getRadiusUrl(): string {
  return resolveUpstreamServiceUrl("RADIUS_URL", "http://127.0.0.1:8090");
}

// Write endpoints dikunci di balik env, sama seperti control.routes.ts.
function radiusProxyAdminEnabled(): boolean {
  return process.env.RADIUS_PROXY_ADMIN === "1";
}

function forwardHeaders(request: FastifyRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  if (request.body) headers["content-type"] = "application/json";
  return getUpstreamBridgeHeaders(headers);
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  target: string,
  method: string,
) {
  const baseUrl = getRadiusUrl();
  const edgeGuard = getEdgeLoopbackErrorPayload("radius", "RADIUS_URL", baseUrl);
  if (edgeGuard) {
    return reply.code(503).header("cache-control", "no-store").send(edgeGuard);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}${target}`, {
      method,
      headers: forwardHeaders(request),
      body: (() => {
        const b = request.body;
        return typeof b === "string" || b instanceof Buffer ? b : b ? JSON.stringify(b) : undefined;
      })(),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    request.log.warn({ err: error, target }, "radius tidak dapat dihubungi");
    return reply.code(502).send({ error: "radius tidak dapat dihubungi", reachable: false });
  }

  const text = await upstream.text();
  if (
    upstream.status < 400 &&
    (method === "POST" || method === "PUT" || method === "DELETE") &&
    target.startsWith("/api/users")
  ) {
    const authUser = (request as AuthenticatedRequest).user;
    const bodyObj =
      request.body && typeof request.body === "object"
        ? (request.body as Record<string, unknown>)
        : {};
    const targetSuffix = target.replace(/^\/api\/users\/?/, "");
    const entityId =
      decodeURIComponent(targetSuffix || String(bodyObj.username ?? "unknown")).slice(0, 200) ||
      "unknown";
    const action = method === "POST" ? "CREATE" : method === "PUT" ? "UPDATE" : "DELETE";
    await tryRecordAuditLog({
      domain: "radius",
      entity: "radius_user",
      entityId,
      action,
      actor: createActorContext(authUser ? String(authUser.id) : null, "api", request.id),
      actorRole: authUser?.role ?? null,
      requestPath: request.url,
      outcome: "success",
      metadata: {
        method,
        target,
        username: bodyObj.username ? String(bodyObj.username) : entityId,
        enabled: typeof bodyObj.enabled === "boolean" ? bodyObj.enabled : undefined,
      },
    });
  }
  return reply
    .code(upstream.status)
    .header("content-type", upstream.headers.get("content-type") ?? "application/json")
    .header("cache-control", "no-store")
    .send(text);
}

function requireAdmin(reply: FastifyReply): boolean {
  if (!radiusProxyAdminEnabled()) {
    reply.code(403).send({
      error: "aksi tulis radius dimatikan; set RADIUS_PROXY_ADMIN=1 untuk mengaktifkan",
    });
    return false;
  }
  return true;
}

export async function radiusRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth());

  fastify.get("/radius/health", async (request, reply) =>
    forward(request, reply, "/health", "GET"),
  );

  fastify.get("/radius/users", async (request, reply) =>
    forward(request, reply, "/api/users", "GET"),
  );

  fastify.get<{ Params: { username: string } }>("/radius/users/:username", async (request, reply) =>
    forward(request, reply, `/api/users/${encodeURIComponent(request.params.username)}`, "GET"),
  );

  fastify.post("/radius/users", { preHandler: requireRole("admin") }, async (request, reply) => {
    if (!requireAdmin(reply)) return reply;
    return forward(request, reply, "/api/users", "POST");
  });

  fastify.put<{ Params: { username: string } }>(
    "/radius/users/:username",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      if (!requireAdmin(reply)) return reply;
      return forward(
        request,
        reply,
        `/api/users/${encodeURIComponent(request.params.username)}`,
        "PUT",
      );
    },
  );

  fastify.delete<{ Params: { username: string } }>(
    "/radius/users/:username",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      if (!requireAdmin(reply)) return reply;
      return forward(
        request,
        reply,
        `/api/users/${encodeURIComponent(request.params.username)}`,
        "DELETE",
      );
    },
  );

  fastify.get("/radius/logs", async (request, reply) => {
    const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
    return forward(request, reply, `/api/logs${query}`, "GET");
  });

  fastify.get("/radius/stats", async (request, reply) =>
    forward(request, reply, "/api/stats", "GET"),
  );
}
