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
import { snmpDeviceModel, snmpTargetModel } from "./models.js";

export interface SnmpRoutesOptions {
  auth?: BaseAddonAuthBridge;
}

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

function normalizeSnmpVersion(raw: unknown): "v1" | "v2c" | "v3" {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value === "v1" || value === "1") return "v1";
  if (value === "v3" || value === "3") return "v3";
  return "v2c";
}

async function mirrorSnmpMutation(
  auth: BaseAddonAuthBridge,
  request: FastifyRequest,
  target: string,
  method: string,
  status: number,
  responseText: string,
): Promise<void> {
  if (status >= 400 || (method !== "POST" && method !== "DELETE")) return;
  try {
    const actor = resolveActorContextFromBridge(auth, request, "api");
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
            port: Number.isInteger(portRaw) && portRaw > 0 && portRaw <= 65535 ? portRaw : 161,
            snmp_version: normalizeSnmpVersion(
              resObj.snmp_version ?? resObj.version ?? bodyObj.snmp_version ?? bodyObj.version,
            ),
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
        const existing = await snmpDeviceModel.repository.find(
          { device_key: deviceKey },
          { tenantId: actor.tenantId },
        );
        for (const row of existing) {
          await snmpDeviceModel.repository.delete(row.id, actor);
        }
      }
      return;
    }

    const addTargetMatch = /^\/api\/devices\/([^/]+)\/targets$/.exec(target);
    if (addTargetMatch && method === "POST") {
      const deviceKey = decodeURIComponent(addTargetMatch[1] ?? "").slice(0, 120);
      const oid = String(resObj.oid ?? bodyObj.oid ?? "").slice(0, 200);
      const targetKey = String(resObj.id ?? bodyObj.id ?? `${deviceKey}:${oid}`).slice(0, 120);
      if (deviceKey && oid && targetKey) {
        const intervalRaw = Number(resObj.interval_sec ?? bodyObj.interval_sec ?? 60);
        const rawLabel = resObj.label ?? resObj.name ?? bodyObj.label ?? bodyObj.name ?? oid;
        await snmpTargetModel.repository.upsert(
          { target_key: targetKey },
          {
            target_key: targetKey,
            device_key: deviceKey,
            oid,
            label: String(rawLabel).slice(0, 200),
            interval_sec: Number.isInteger(intervalRaw) && intervalRaw > 0 ? intervalRaw : 60,
            enabled: typeof resObj.enabled === "boolean" ? resObj.enabled : true,
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
        const existing = await snmpTargetModel.repository.find(
          { target_key: targetKey },
          { tenantId: actor.tenantId },
        );
        for (const row of existing) {
          await snmpTargetModel.repository.delete(row.id, actor);
        }
      }
    }
  } catch (err) {
    request.log.warn({ err, target, method }, "snmp ORM mirror failed");
  }
}

async function forward(
  auth: BaseAddonAuthBridge,
  request: FastifyRequest,
  reply: FastifyReply,
  target: string,
  method: string,
) {
  const disabledGuard = getDisabledOptionalOpsErrorPayload("snmp");
  if (disabledGuard) {
    return reply.code(503).header("cache-control", "no-store").send(disabledGuard);
  }
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
  await mirrorSnmpMutation(auth, request, target, method, upstream.status, text);
  return reply
    .code(upstream.status)
    .header("content-type", contentType)
    .header("cache-control", "no-store")
    .send(text);
}

export async function registerSnmpRoutes(
  fastify: FastifyInstance,
  options: SnmpRoutesOptions = {},
) {
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const adminOnly = auth.requireRole("admin");

  fastify.addHook("preHandler", async (request, reply) => {
    if (request.method === "OPTIONS") return;
    return auth.authenticate(request, reply);
  });

  fastify.get("/snmp/health", async (request, reply) =>
    forward(auth, request, reply, "/health", "GET"),
  );

  fastify.get("/snmp/devices", async (request, reply) =>
    forward(auth, request, reply, "/api/devices", "GET"),
  );

  fastify.post("/snmp/devices", { preHandler: adminOnly }, async (request, reply) =>
    forward(auth, request, reply, "/api/devices", "POST"),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/devices/:id", async (request, reply) =>
    forward(auth, request, reply, `/api/devices/${encodeURIComponent(request.params.id)}`, "GET"),
  );

  fastify.delete<{ Params: { id: string } }>(
    "/snmp/devices/:id",
    { preHandler: adminOnly },
    async (request, reply) =>
      forward(
        auth,
        request,
        reply,
        `/api/devices/${encodeURIComponent(request.params.id)}`,
        "DELETE",
      ),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/devices/:id/targets", async (request, reply) =>
    forward(
      auth,
      request,
      reply,
      `/api/devices/${encodeURIComponent(request.params.id)}/targets`,
      "GET",
    ),
  );

  fastify.post<{ Params: { id: string } }>(
    "/snmp/devices/:id/targets",
    { preHandler: adminOnly },
    async (request, reply) =>
      forward(
        auth,
        request,
        reply,
        `/api/devices/${encodeURIComponent(request.params.id)}/targets`,
        "POST",
      ),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/targets/:id", async (request, reply) =>
    forward(auth, request, reply, `/api/targets/${encodeURIComponent(request.params.id)}`, "GET"),
  );

  fastify.delete<{ Params: { id: string } }>(
    "/snmp/targets/:id",
    { preHandler: adminOnly },
    async (request, reply) =>
      forward(
        auth,
        request,
        reply,
        `/api/targets/${encodeURIComponent(request.params.id)}`,
        "DELETE",
      ),
  );

  fastify.get<{ Params: { id: string } }>("/snmp/targets/:id/samples", async (request, reply) => {
    const query = request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
    return forward(
      auth,
      request,
      reply,
      `/api/targets/${encodeURIComponent(request.params.id)}/samples${query}`,
      "GET",
    );
  });

  fastify.get<{ Params: { id: string } }>("/snmp/targets/:id/latest", async (request, reply) =>
    forward(
      auth,
      request,
      reply,
      `/api/targets/${encodeURIComponent(request.params.id)}/latest`,
      "GET",
    ),
  );

  fastify.get("/snmp/stats", async (request, reply) =>
    forward(auth, request, reply, "/api/stats", "GET"),
  );
}
