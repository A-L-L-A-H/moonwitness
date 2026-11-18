import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getEdgeLoopbackErrorPayload } from "../../shared/upstream";
import {
  handleNativeAuthLogin,
  handleNativeAuthLogout,
  handleNativeAuthMe,
  handleNativeCreateSuperuser,
  handleNativeSetupStatus,
  isNativeSetupEnabled,
  sendNoStoreJson,
} from "./control.native-auth";
import {
  ARSY_V1_DEFERRED_RESOURCE_KINDS,
  ARSY_V1_SUPPORTED_RESOURCE_KINDS,
  buildControlUpstreamHeaders,
  CONTROL_ADMIN_ONLY_WRITE_PATHS,
  CONTROL_AUTH_PATHS,
  CONTROL_READ_PATHS,
  CONTROL_SETUP_PATHS,
  CONTROL_WRITE_PATHS,
  forwardControlAuth,
  forwardControlRequest,
  getArsyUrl,
} from "./control.upstream";

export { ARSY_V1_DEFERRED_RESOURCE_KINDS, ARSY_V1_SUPPORTED_RESOURCE_KINDS };

const AUTH_RATE_MAX = Number(process.env.ARSY_AUTH_RATE_MAX ?? "30");
const AUTH_RATE_WINDOW_MS = Number(process.env.ARSY_AUTH_RATE_WINDOW_MS ?? "60000");

async function controlWriteRole(
  request: FastifyRequest<{ Params: { path: string } }>,
  reply: FastifyReply,
) {
  const guard = CONTROL_ADMIN_ONLY_WRITE_PATHS.has(request.params.path)
    ? requireRole("admin")
    : requireRole("admin", "editor");
  return guard(request, reply);
}

export async function controlRoutes(fastify: FastifyInstance) {
  await fastify.register(async (authScope) => {
    await authScope.register(rateLimit, {
      max: AUTH_RATE_MAX,
      timeWindow: AUTH_RATE_WINDOW_MS,
      keyGenerator: (request) => request.ip,
      errorResponseBuilder: () => ({
        statusCode: 429,
        error: "Too Many Requests",
        message: "terlalu banyak percobaan; coba lagi nanti",
      }),
    });

    authScope.get<{ Params: { path: string } }>("/control/setup/:path", async (request, reply) => {
      const { path } = request.params;
      if (!CONTROL_SETUP_PATHS.has(path)) {
        return reply.code(404).send({ error: `path setup tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "status") return handleNativeSetupStatus(reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardControlAuth(request, reply, `setup/${path}`);
    });

    authScope.post<{ Params: { path: string } }>("/control/setup/:path", async (request, reply) => {
      const { path } = request.params;
      if (!CONTROL_SETUP_PATHS.has(path)) {
        return reply.code(404).send({ error: `path setup tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "superuser") return handleNativeCreateSuperuser(request, reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardControlAuth(request, reply, `setup/${path}`);
    });

    authScope.get<{ Params: { path: string } }>("/control/auth/:path", async (request, reply) => {
      const { path } = request.params;
      if (!CONTROL_AUTH_PATHS.has(path)) {
        return reply.code(404).send({ error: `path auth tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "me") return handleNativeAuthMe(request, reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardControlAuth(request, reply, `auth/${path}`);
    });

    authScope.post<{ Params: { path: string } }>("/control/auth/:path", async (request, reply) => {
      const { path } = request.params;
      if (!CONTROL_AUTH_PATHS.has(path)) {
        return reply.code(404).send({ error: `path auth tidak dikenal: ${path}` });
      }
      if (isNativeSetupEnabled()) {
        if (path === "login") return handleNativeAuthLogin(request, reply);
        if (path === "logout") return handleNativeAuthLogout(request, reply);
        return sendNoStoreJson(reply, 405, { error: "Method Not Allowed" });
      }
      return forwardControlAuth(request, reply, `auth/${path}`);
    });
  });

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

    protectedScope.get("/control/portforwards", (request, reply) =>
      forwardControlRequest(request, reply, "portforwards"),
    );
    protectedScope.post(
      "/control/portforwards",
      { preHandler: requireRole("admin", "editor") },
      (request, reply) => forwardControlRequest(request, reply, "portforwards"),
    );
    protectedScope.delete(
      "/control/portforwards",
      { preHandler: requireRole("admin", "editor") },
      (request, reply) => forwardControlRequest(request, reply, "portforwards"),
    );

    protectedScope.get<{ Params: { path: string } }>("/control/:path", async (request, reply) => {
      const { path } = request.params;
      if (!CONTROL_READ_PATHS.has(path)) {
        return reply.code(404).send({ error: `path control tidak dikenal: ${path}` });
      }
      return forwardControlRequest(request, reply, path);
    });

    protectedScope.post<{ Params: { path: string } }>(
      "/control/:path",
      { preHandler: controlWriteRole },
      async (request, reply) => {
        const { path } = request.params;
        if (!CONTROL_WRITE_PATHS.has(path)) {
          return reply.code(404).send({ error: `path control tidak dikenal: ${path}` });
        }
        if (path === "plan" || path === "apply") {
          const body = request.body as
            { resources?: unknown; state?: { resources?: unknown } } | undefined;
          const rawResources = Array.isArray(body?.resources)
            ? body.resources
            : Array.isArray(body?.state?.resources)
              ? body.state.resources
              : [];
          const unsupportedKinds = Array.from(
            new Set(
              rawResources
                .map((item) =>
                  item && typeof item === "object" ? (item as { kind?: unknown }).kind : undefined,
                )
                .filter(
                  (kind): kind is string =>
                    typeof kind === "string" &&
                    (ARSY_V1_DEFERRED_RESOURCE_KINDS.has(kind) ||
                      !ARSY_V1_SUPPORTED_RESOURCE_KINDS.has(kind)),
                ),
            ),
          );
          if (unsupportedKinds.length > 0) {
            return reply.code(400).send({
              error: `Unsupported arsy V1 resource kind(s): ${unsupportedKinds.join(", ")}`,
              unsupportedKinds,
              supportedKinds: Array.from(ARSY_V1_SUPPORTED_RESOURCE_KINDS),
            });
          }
        }
        return forwardControlRequest(request, reply, path);
      },
    );

    protectedScope.get("/control/vpn/status", (request, reply) =>
      forwardControlRequest(request, reply, "vpn/status"),
    );
    protectedScope.get("/control/vpn/subnets", (request, reply) =>
      forwardControlRequest(request, reply, "vpn/subnets"),
    );
    protectedScope.post(
      "/control/vpn/subnets",
      { preHandler: requireRole("admin", "editor") },
      (request, reply) => forwardControlRequest(request, reply, "vpn/subnets"),
    );
    protectedScope.delete<{ Params: { name: string } }>(
      "/control/vpn/subnets/:name",
      { preHandler: requireRole("admin", "editor") },
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/subnets/${encodeURIComponent(request.params.name)}`,
        ),
    );

    for (const sub of ["vpn/up", "vpn/down", "vpn/peers"] as const) {
      protectedScope.post(
        `/control/${sub}`,
        { preHandler: requireRole("admin", "editor") },
        (request, reply) => forwardControlRequest(request, reply, sub),
      );
    }

    protectedScope.get<{ Params: { name: string } }>(
      "/control/vpn/peers/:name/config",
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/peers/${encodeURIComponent(request.params.name)}/config`,
        ),
    );
    protectedScope.post<{ Params: { name: string } }>(
      "/control/vpn/peers/:name/quota",
      { preHandler: requireRole("admin", "editor") },
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/peers/${encodeURIComponent(request.params.name)}/quota`,
        ),
    );
    protectedScope.delete<{ Params: { name: string } }>(
      "/control/vpn/peers/:name",
      { preHandler: requireRole("admin", "editor") },
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/peers/${encodeURIComponent(request.params.name)}`,
        ),
    );
  });
}
