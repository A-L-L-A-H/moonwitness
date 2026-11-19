import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  defaultFailClosedAuthBridge,
  getEdgeLoopbackErrorPayload,
  resolveActorContextFromBridge,
  type BaseAddonAuthBridge,
  type FastifyPreHandler,
  type HostRateLimitFactory,
} from "@moonwitness/addon-runtime";
import {
  handleNativeAuthLogin,
  handleNativeAuthLogout,
  handleNativeAuthMe,
  handleNativeCreateSuperuser,
  handleNativeSetupStatus,
  isNativeSetupEnabled,
  sendNoStoreJson,
} from "./native-auth.js";
import { createControlScheduler } from "./scheduler.js";
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
  recordControlCommand,
} from "./upstream.js";

export { ARSY_V1_DEFERRED_RESOURCE_KINDS, ARSY_V1_SUPPORTED_RESOURCE_KINDS };

export interface ControlRoutesOptions {
  auth?: BaseAddonAuthBridge;
  rateLimit?: HostRateLimitFactory;
}

function createInMemoryRateLimitPreHandler(
  max: number,
  windowMs: number,
  message: string,
): FastifyPreHandler {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return async (request, reply) => {
    const now = Date.now();
    const key = request.ip || "unknown";
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    reply.header("x-ratelimit-limit", max);
    reply.header("x-ratelimit-remaining", remaining);
    if (bucket.count > max) {
      reply.header("retry-after", Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      return reply.code(429).send({
        statusCode: 429,
        error: "Too Many Requests",
        message,
        code: "RATE_LIMITED",
      });
    }
    return undefined;
  };
}

export async function registerControlRoutes(
  fastify: FastifyInstance,
  options: ControlRoutesOptions = {},
) {
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const parsedMax = Number(process.env.ARSY_AUTH_RATE_MAX ?? "30");
  const parsedWindowMs = Number(process.env.ARSY_AUTH_RATE_WINDOW_MS ?? "60000");
  const authRateMax = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 30;
  const authRateWindowMs =
    Number.isFinite(parsedWindowMs) && parsedWindowMs > 0 ? parsedWindowMs : 60_000;
  const rateLimitMessage = "terlalu banyak percobaan; coba lagi nanti";
  const authRateLimit = options.rateLimit
    ? options.rateLimit({
        max: authRateMax,
        windowMs: authRateWindowMs,
        scope: "control-auth",
        message: rateLimitMessage,
      })
    : createInMemoryRateLimitPreHandler(authRateMax, authRateWindowMs, rateLimitMessage);

  await fastify.register(async (authScope) => {
    authScope.addHook("preHandler", async (request, reply) => {
      if (request.method === "OPTIONS") return;
      return authRateLimit(request, reply);
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

  const requireControlWriteRole = async (
    request: FastifyRequest<{ Params: { path: string } }>,
    reply: FastifyReply,
  ) => {
    const guard = CONTROL_ADMIN_ONLY_WRITE_PATHS.has(request.params.path)
      ? auth.requireRole("admin")
      : auth.requireRole("admin", "editor");
    return guard(request, reply);
  };
  const editorOrAdmin = auth.requireRole("admin", "editor");

  await fastify.register(async (protectedScope) => {
    protectedScope.addHook("preHandler", async (request, reply) => {
      if (request.method === "OPTIONS") return;
      return auth.authenticate(request, reply);
    });

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
      forwardControlRequest(request, reply, "portforwards", auth),
    );
    protectedScope.post(
      "/control/portforwards",
      { preHandler: editorOrAdmin },
      (request, reply) => forwardControlRequest(request, reply, "portforwards", auth),
    );
    protectedScope.delete(
      "/control/portforwards",
      { preHandler: editorOrAdmin },
      (request, reply) => forwardControlRequest(request, reply, "portforwards", auth),
    );

    protectedScope.get<{ Params: { path: string } }>("/control/:path", async (request, reply) => {
      const { path } = request.params;
      if (!CONTROL_READ_PATHS.has(path)) {
        return reply.code(404).send({ error: `path control tidak dikenal: ${path}` });
      }
      return forwardControlRequest(request, reply, path, auth);
    });

    protectedScope.post<{ Params: { path: string } }>(
      "/control/:path",
      { preHandler: requireControlWriteRole },
      async (request, reply) => {
        const { path } = request.params;
        if (!CONTROL_WRITE_PATHS.has(path)) {
          return reply.code(404).send({ error: `path control tidak dikenal: ${path}` });
        }
        if (path === "plan" || path === "apply") {
          const body = request.body as
            | { resources?: unknown; state?: { resources?: unknown } }
            | undefined;
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

          if (process.env.CONTROL_SCHEDULER === "queue") {
            const actor = resolveActorContextFromBridge(auth, request, "api");
            const firstResource = rawResources.find(
              (item): item is { kind?: unknown; targetPath?: unknown; name?: unknown } =>
                Boolean(item && typeof item === "object"),
            );
            const traceHeader =
              request.headers["x-correlation-id"] ?? request.headers.traceparent;
            const scheduler = createControlScheduler({ mode: "queue" });
            const dispatchResult = await scheduler.dispatch(
              {
                action: path,
                resourceKind:
                  typeof firstResource?.kind === "string" ? firstResource.kind : "files",
                targetPath:
                  typeof firstResource?.targetPath === "string"
                    ? firstResource.targetPath
                    : typeof firstResource?.name === "string"
                      ? firstResource.name
                      : undefined,
                payload:
                  body && typeof body === "object" ? (body as Record<string, unknown>) : {},
                traceparent: typeof traceHeader === "string" ? traceHeader : undefined,
              },
              actor,
            );
            await recordControlCommand(
              request,
              path,
              "queue://control-plane",
              dispatchResult.statusCode,
              auth,
            );
            return reply
              .code(dispatchResult.statusCode)
              .header("cache-control", "no-store")
              .send(dispatchResult);
          }
        }
        return forwardControlRequest(request, reply, path, auth);
      },
    );

    protectedScope.get("/control/vpn/status", (request, reply) =>
      forwardControlRequest(request, reply, "vpn/status", auth),
    );
    protectedScope.get("/control/vpn/subnets", (request, reply) =>
      forwardControlRequest(request, reply, "vpn/subnets", auth),
    );
    protectedScope.post(
      "/control/vpn/subnets",
      { preHandler: editorOrAdmin },
      (request, reply) => forwardControlRequest(request, reply, "vpn/subnets", auth),
    );
    protectedScope.delete<{ Params: { name: string } }>(
      "/control/vpn/subnets/:name",
      { preHandler: editorOrAdmin },
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/subnets/${encodeURIComponent(request.params.name)}`,
          auth,
        ),
    );

    for (const sub of ["vpn/up", "vpn/down", "vpn/peers"] as const) {
      protectedScope.post(
        `/control/${sub}`,
        { preHandler: editorOrAdmin },
        (request, reply) => forwardControlRequest(request, reply, sub, auth),
      );
    }

    protectedScope.get<{ Params: { name: string } }>(
      "/control/vpn/peers/:name/config",
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/peers/${encodeURIComponent(request.params.name)}/config`,
          auth,
        ),
    );
    protectedScope.post<{ Params: { name: string } }>(
      "/control/vpn/peers/:name/quota",
      { preHandler: editorOrAdmin },
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/peers/${encodeURIComponent(request.params.name)}/quota`,
          auth,
        ),
    );
    protectedScope.delete<{ Params: { name: string } }>(
      "/control/vpn/peers/:name",
      { preHandler: editorOrAdmin },
      (request, reply) =>
        forwardControlRequest(
          request,
          reply,
          `vpn/peers/${encodeURIComponent(request.params.name)}`,
          auth,
        ),
    );
  });
}
