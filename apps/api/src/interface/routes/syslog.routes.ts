import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth } from "../../middleware/auth";
import { getEdgeLoopbackErrorPayload, resolveUpstreamServiceUrl } from "../../shared/upstream";

function getSyslogUrl(): string {
  return resolveUpstreamServiceUrl("SYSLOG_URL", "http://127.0.0.1:8093");
}

function forwardHeaders(request: FastifyRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  if (request.body) headers["content-type"] = "application/json";
  return headers;
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  target: string,
  method: string,
) {
  const baseUrl = getSyslogUrl();
  const edgeGuard = getEdgeLoopbackErrorPayload("syslog", "SYSLOG_URL", baseUrl);
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
    request.log.warn({ err: error, target }, "syslog tidak dapat dihubungi");
    return reply.code(502).send({ error: "syslog tidak dapat dihubungi", reachable: false });
  }

  const text = await upstream.text();
  return reply
    .code(upstream.status)
    .header("content-type", upstream.headers.get("content-type") ?? "application/json")
    .header("cache-control", "no-store")
    .send(text);
}

export async function syslogRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth());

  fastify.get("/syslog/health", async (request, reply) =>
    forward(request, reply, "/health", "GET"),
  );

  fastify.get("/syslog/messages", async (request, reply) => {
    const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
    return forward(request, reply, `/api/messages${query}`, "GET");
  });

  fastify.get<{ Params: { id: string } }>("/syslog/messages/:id", async (request, reply) =>
    forward(request, reply, `/api/messages/${encodeURIComponent(request.params.id)}`, "GET"),
  );

  fastify.get("/syslog/stats", async (request, reply) =>
    forward(request, reply, "/api/stats", "GET"),
  );
}
