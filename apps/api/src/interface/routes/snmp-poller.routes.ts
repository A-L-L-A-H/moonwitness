import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  getEdgeLoopbackErrorPayload,
  getUpstreamBridgeHeaders,
  resolveUpstreamServiceUrl,
} from "../../shared/upstream";

function getSnmpPollerUrl(): string {
  return resolveUpstreamServiceUrl("SNMP_POLLER_URL", "http://127.0.0.1:8094");
}
const SENSITIVE_FIELD =
  /community|pass(?:word|phrase)|secret|credential|access.?key|auth.?key|priv.?key|token/i;

function redactSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitiveFields);
  if (!value || typeof value !== "object") return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (!SENSITIVE_FIELD.test(key)) redacted[key] = redactSensitiveFields(nested);
  }
  return redacted;
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
  const baseUrl = getSnmpPollerUrl();
  const edgeGuard = getEdgeLoopbackErrorPayload("snmp-poller", "SNMP_POLLER_URL", baseUrl);
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
    request.log.warn({ err: error, target }, "snmp-poller tidak dapat dihubungi");
    return reply.code(502).send({ error: "snmp-poller tidak dapat dihubungi", reachable: false });
  }

  let text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  if (text && contentType.toLowerCase().includes("json")) {
    try {
      text = JSON.stringify(redactSensitiveFields(JSON.parse(text)));
    } catch (error) {
      request.log.error({ err: error, target }, "snmp-poller returned invalid JSON");
      return reply.code(502).send({ error: "snmp-poller returned invalid JSON" });
    }
  }
  return reply
    .code(upstream.status)
    .header("content-type", contentType)
    .header("cache-control", "no-store")
    .send(text);
}

export async function snmpPollerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth());

  fastify.get("/snmp/health", async (request, reply) => forward(request, reply, "/health", "GET"));

  fastify.get("/snmp/devices", async (request, reply) =>
    forward(request, reply, "/api/devices", "GET"),
  );

  fastify.post("/snmp/devices", { preHandler: requireRole("admin") }, async (request, reply) =>
    forward(request, reply, "/api/devices", "POST"),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/devices/:id", async (request, reply) =>
    forward(request, reply, `/api/devices/${encodeURIComponent(request.params.id)}`, "GET"),
  );

  fastify.delete<{ Params: { id: string } }>(
    "/snmp/devices/:id",
    { preHandler: requireRole("admin") },
    async (request, reply) =>
      forward(request, reply, `/api/devices/${encodeURIComponent(request.params.id)}`, "DELETE"),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/devices/:id/targets", async (request, reply) =>
    forward(request, reply, `/api/devices/${encodeURIComponent(request.params.id)}/targets`, "GET"),
  );

  fastify.post<{ Params: { id: string } }>(
    "/snmp/devices/:id/targets",
    { preHandler: requireRole("admin") },
    async (request, reply) =>
      forward(
        request,
        reply,
        `/api/devices/${encodeURIComponent(request.params.id)}/targets`,
        "POST",
      ),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/targets/:id", async (request, reply) =>
    forward(request, reply, `/api/targets/${encodeURIComponent(request.params.id)}`, "GET"),
  );

  fastify.delete<{ Params: { id: string } }>(
    "/snmp/targets/:id",
    { preHandler: requireRole("admin") },
    async (request, reply) =>
      forward(request, reply, `/api/targets/${encodeURIComponent(request.params.id)}`, "DELETE"),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/targets/:id/samples", async (request, reply) => {
    const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
    return forward(
      request,
      reply,
      `/api/targets/${encodeURIComponent(request.params.id)}/samples${query}`,
      "GET",
    );
  });

  fastify.get<{ Params: { id: string } }>("/snmp/targets/:id/latest", async (request, reply) =>
    forward(request, reply, `/api/targets/${encodeURIComponent(request.params.id)}/latest`, "GET"),
  );

  fastify.get("/snmp/stats", async (request, reply) =>
    forward(request, reply, "/api/stats", "GET"),
  );
}
