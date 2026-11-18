import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createActorContext } from "@moonwitness/orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../middleware/auth";
import { snmpDeviceModel, snmpTargetModel } from "../../infrastructure/persistence/domain";
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
  return getUpstreamBridgeHeaders(headers, request);
}

async function mirrorSnmpMutation(
  request: FastifyRequest,
  target: string,
  method: string,
  status: number,
  responseText: string,
): Promise<void> {
  if (status >= 400 || (method !== "POST" && method !== "DELETE")) return;
  try {
    const authUser = (request as AuthenticatedRequest).user;
    const actor = createActorContext(authUser ? String(authUser.id) : null, "api", request.id);
    const bodyObj =
      request.body && typeof request.body === "object"
        ? (request.body as Record<string, unknown>)
        : {};
    let resObj: Record<string, unknown> = {};
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          resObj = parsed as Record<string, unknown>;
        }
      } catch {
        // non-JSON upstream response
      }
    }

    if (target === "/api/devices" && method === "POST") {
      const host = String(resObj.host ?? bodyObj.host ?? "").slice(0, 255);
      const name = String(resObj.name ?? bodyObj.name ?? host).slice(0, 200);
      const deviceKey = String(resObj.id ?? bodyObj.id ?? (name || host)).slice(0, 120);
      if (deviceKey && host && name) {
        const portRaw = Number(resObj.port ?? bodyObj.port ?? 161);
        await snmpDeviceModel.repository.upsert(
          { device_key: deviceKey },
          {
            device_key: deviceKey,
            name,
            host,
            port: Number.isInteger(portRaw) && portRaw > 0 ? portRaw : 161,
            version:
              resObj.version != null
                ? String(resObj.version).slice(0, 20)
                : bodyObj.version != null
                  ? String(bodyObj.version).slice(0, 20)
                  : null,
            enabled: typeof resObj.enabled === "boolean" ? resObj.enabled : true,
            metadata_json: null,
          },
          actor,
        );
      }
      return;
    }

    const deviceMatch = /^\/api\/devices\/([^/]+)$/.exec(target);
    if (deviceMatch && method === "DELETE") {
      const deviceKey = decodeURIComponent(deviceMatch[1] ?? "").slice(0, 120);
      if (deviceKey) {
        const existing = await snmpDeviceModel.repository.find({ device_key: deviceKey });
        for (const row of existing) {
          await snmpDeviceModel.repository.delete(row.id, actor);
        }
      }
      return;
    }

    const addTargetMatch = /^\/api\/devices\/([^/]+)\/targets$/.exec(target);
    if (addTargetMatch && method === "POST") {
      const deviceKey = decodeURIComponent(addTargetMatch[1] ?? "").slice(0, 120);
      const oid = String(resObj.oid ?? bodyObj.oid ?? "").slice(0, 500);
      const targetKey = String(resObj.id ?? bodyObj.id ?? `${deviceKey}:${oid}`).slice(0, 120);
      if (deviceKey && oid && targetKey) {
        const intervalRaw = Number(resObj.interval_sec ?? bodyObj.interval_sec ?? 60);
        await snmpTargetModel.repository.upsert(
          { target_key: targetKey },
          {
            target_key: targetKey,
            device_key: deviceKey,
            oid,
            name:
              resObj.name != null
                ? String(resObj.name).slice(0, 200)
                : bodyObj.name != null
                  ? String(bodyObj.name).slice(0, 200)
                  : null,
            poll_interval_sec:
              Number.isInteger(intervalRaw) && intervalRaw > 0 ? intervalRaw : null,
            enabled: typeof resObj.enabled === "boolean" ? resObj.enabled : true,
            metadata_json: null,
          },
          actor,
        );
      }
      return;
    }

    const delTargetMatch = /^\/api\/targets\/([^/]+)$/.exec(target);
    if (delTargetMatch && method === "DELETE") {
      const targetKey = decodeURIComponent(delTargetMatch[1] ?? "").slice(0, 120);
      if (targetKey) {
        const existing = await snmpTargetModel.repository.find({ target_key: targetKey });
        for (const row of existing) {
          await snmpTargetModel.repository.delete(row.id, actor);
        }
      }
    }
  } catch {
    // Best-effort ORM mirror for SNMP proxy operations
  }
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
  await mirrorSnmpMutation(request, target, method, upstream.status, text);
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
