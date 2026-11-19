import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  defaultFailClosedAuthBridge,
  getDisabledOptionalOpsErrorPayload,
  getEdgeLoopbackErrorPayload,
  getUpstreamBridgeHeaders,
  resolveActorContextFromBridge,
  resolveUpstreamServiceUrl,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import { tryRecordAuditLog } from "../audit/index.js";

export interface RadiusRoutesOptions {
  auth?: BaseAddonAuthBridge;
}

function getRadiusUrl(): string {
  return resolveUpstreamServiceUrl("RADIUS_URL", "http://127.0.0.1:8090");
}

function radiusProxyAdminEnabled(): boolean {
  return process.env.RADIUS_PROXY_ADMIN === "1";
}

function forwardHeaders(request: FastifyRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  if (request.body) headers["content-type"] = "application/json";
  return getUpstreamBridgeHeaders(headers, request);
}

async function forward(
  auth: BaseAddonAuthBridge,
  request: FastifyRequest,
  reply: FastifyReply,
  target: string,
  method: string,
) {
  const disabledGuard = getDisabledOptionalOpsErrorPayload("radius");
  if (disabledGuard) {
    return reply.code(503).header("cache-control", "no-store").send(disabledGuard);
  }
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
    const actor = resolveActorContextFromBridge(auth, request, "api");
    const actorId = auth.getActorId(request);
    const actorRole = actorId ? auth.getActorRole(request) : null;
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
      actor,
      actorRole,
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

function requireAdminEnvEnabled(reply: FastifyReply): boolean {
  if (!radiusProxyAdminEnabled()) {
    reply.code(403).send({
      error: "aksi tulis radius dimatikan; set RADIUS_PROXY_ADMIN=1 untuk mengaktifkan",
    });
    return false;
  }
  return true;
}

export async function registerRadiusRoutes(
  fastify: FastifyInstance,
  options: RadiusRoutesOptions = {},
) {
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const adminOnly = auth.requireRole("admin");

  fastify.addHook("preHandler", async (request, reply) => {
    if (request.method === "OPTIONS") return;
    return auth.authenticate(request, reply);
  });

  fastify.get("/radius/health", async (request, reply) =>
    forward(auth, request, reply, "/health", "GET"),
  );

  fastify.get("/radius/users", async (request, reply) =>
    forward(auth, request, reply, "/api/users", "GET"),
  );

  fastify.get<{ Params: { username: string } }>("/radius/users/:username", async (request, reply) =>
    forward(
      auth,
      request,
      reply,
      `/api/users/${encodeURIComponent(request.params.username)}`,
      "GET",
    ),
  );

  fastify.post("/radius/users", { preHandler: adminOnly }, async (request, reply) => {
    if (!requireAdminEnvEnabled(reply)) return reply;
    return forward(auth, request, reply, "/api/users", "POST");
  });

  fastify.put<{ Params: { username: string } }>(
    "/radius/users/:username",
    { preHandler: adminOnly },
    async (request, reply) => {
      if (!requireAdminEnvEnabled(reply)) return reply;
      return forward(
        auth,
        request,
        reply,
        `/api/users/${encodeURIComponent(request.params.username)}`,
        "PUT",
      );
    },
  );

  fastify.delete<{ Params: { username: string } }>(
    "/radius/users/:username",
    { preHandler: adminOnly },
    async (request, reply) => {
      if (!requireAdminEnvEnabled(reply)) return reply;
      return forward(
        auth,
        request,
        reply,
        `/api/users/${encodeURIComponent(request.params.username)}`,
        "DELETE",
      );
    },
  );

  fastify.get("/radius/logs", async (request, reply) => {
    const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
    return forward(auth, request, reply, `/api/logs${query}`, "GET");
  });

  fastify.get("/radius/stats", async (request, reply) =>
    forward(auth, request, reply, "/api/stats", "GET"),
  );
}
