import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type { FastifyError } from "fastify";
import FastifyCookie from "@fastify/cookie";
import FastifyCors from "@fastify/cors";
import { env, parseCorsOrigins } from "../../shared/env";
import { resolveTraceContext } from "../../shared/trace";
import {
  createAsyncRateLimiter,
  createOrmRateLimitStore,
  createRateLimiter,
  resolveRateLimitKey,
} from "../rate-limit";
import { registerHealthRoutes, registerMetricsRoute } from "../../interface/routes/health.routes";
import { createApiMetricsCollector } from "../../interface/routes/metrics";
import { authRoutes } from "../../interface/routes/auth.routes";
import { controlRoutes } from "../../interface/routes/control.routes";
import { radiusRoutes } from "../../interface/routes/radius.routes";
import { storageRoutes } from "../../interface/routes/storage.routes";
import { syslogRoutes } from "../../interface/routes/syslog.routes";
import { snmpPollerRoutes } from "../../interface/routes/snmp-poller.routes";
import { riotAiRoutes } from "../../interface/routes/riot-ai.routes";
import { commandCenterRoutes } from "../../interface/routes/command-center.routes";
import { memoryRoutes } from "../../interface/routes/memory.routes";
import { ensureProbesSchema } from "../../interface/routes/probes.persistence";
import { probesRoutes } from "../../interface/routes/probes.routes";
import { createD1DatabaseFromOrm, getDb, syncModels } from "@moonwitness/orm";
import { initializeRiotAiPersistence } from "../../interface/routes/riot-ai.persistence";
import { workflowModel, alertModel } from "@moonwitness/addons/command-center";
import { controlCommandModel } from "@moonwitness/addons/control";
import { memoryRecordModel } from "@moonwitness/addons/ai";
import { opsEventModel, probeEventModel, probeNodeModel } from "@moonwitness/addons/probes";
import { radiusClientModel, radiusSessionModel } from "@moonwitness/addons/radius";
import { snmpDeviceModel, snmpSampleModel, snmpTargetModel } from "@moonwitness/addons/snmp";
import {
  storageBucketModel,
  storageObjectModel,
  storageUploadSessionModel,
} from "@moonwitness/addons/storage";
import { syslogEntryModel } from "@moonwitness/addons/syslog";
import { TimelineUseCase } from "../../domain/usecases/timeline/timeline.usecase";
import { TimelineRepository } from "@moonwitness/addons/timeline";
import {
  createAuthMidIdentityStore,
  ensureAuthSchema,
  seedBootstrapAdmin,
} from "@moonwitness/addons/auth";
import { attachAuditOutboxSubscriber } from "@moonwitness/addons/audit";
import { midFastifyPlugin } from "@moonwitness/mid";

export interface BootstrapOptions {
  prefix?: string;
  disableDocs?: boolean;
  authExternallyMounted?: boolean;
  externallyMountedAddons?: boolean;
}

function corsOrigin(): string[] | false {
  const configured = parseCorsOrigins(env.CORS_ORIGINS);
  if (configured.length > 0) return configured;
  if (env.NODE_ENV === "production") return false;
  return ["http://localhost:3000"];
}

export async function buildFastify(options: BootstrapOptions): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: {
      level: env.LOG_LEVEL ?? (env.NODE_ENV === "production" ? "info" : "debug"),
    },
    // Never leak internal error details to clients in production.
    disableRequestLogging: false,
    // Honour an inbound correlation id, otherwise generate one.
    genReqId: (request) => {
      const inbound = request.headers["x-request-id"];
      if (typeof inbound === "string" && inbound.length > 0 && inbound.length <= 200) {
        return inbound;
      }
      return crypto.randomUUID();
    },
  });

  const metrics = createApiMetricsCollector();
  if (!fastify.hasDecorator("metricsCollector")) {
    fastify.decorate("metricsCollector", metrics);
  }

  // Echo correlation and trace identifiers back and observe latency/status telemetry.
  fastify.addHook("onRequest", async (request, reply) => {
    const trace = resolveTraceContext(request.headers["traceparent"]);
    reply.header("x-request-id", request.id);
    reply.header("traceparent", trace.traceparent);
    (request as { traceparent?: string }).traceparent = trace.traceparent;
  });

  fastify.addHook("onResponse", async (request, reply) => {
    metrics.observeRequest(request.method, reply.statusCode, reply.elapsedTime);
  });

  await fastify.register(FastifyCookie);
  await fastify.register(FastifyCors, {
    origin: corsOrigin(),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });

  fastify.addHook("onSend", async (_request, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    return payload;
  });

  const maxRequests = Number(env.RATE_LIMIT_MAX);
  if (Number.isFinite(maxRequests) && maxRequests > 0) {
    const windowMs = Number(env.RATE_LIMIT_WINDOW_MS);
    const useOrmStore = env.RATE_LIMIT_STORE === "orm";
    const syncLimiter = useOrmStore ? null : createRateLimiter({ max: maxRequests, windowMs });
    const asyncLimiter = useOrmStore
      ? createAsyncRateLimiter({ max: maxRequests, windowMs, store: createOrmRateLimitStore() })
      : null;
    fastify.addHook("onRequest", async (request, reply) => {
      const key = resolveRateLimitKey(
        request.ip,
        request.headers["x-forwarded-for"],
        env.TRUSTED_PROXY_COUNT,
      );
      const result = asyncLimiter ? await asyncLimiter.check(key) : syncLimiter!.check(key);
      reply.header("x-ratelimit-limit", maxRequests);
      reply.header("x-ratelimit-remaining", result.remaining);
      if (!result.allowed) {
        reply.header("retry-after", Math.ceil(result.retryAfterMs / 1000));
        return reply.code(429).send({ error: "too many requests" });
      }
      return undefined;
    });
  }

  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;
    request.log.error({ err: error }, "request failed");
    if (env.NODE_ENV === "production" && status >= 500) {
      return reply.code(status).send({ error: "internal server error" });
    }
    return reply.code(status).send({ error: error.message });
  });

  if (env.NODE_ENV !== "production" && !options.disableDocs) {
    const [{ default: FastifySwagger }, { default: FastifySwaggerUi }] = await Promise.all([
      import("@fastify/swagger"),
      import("@fastify/swagger-ui"),
    ]);
    await fastify.register(FastifySwagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "Moonwitness API",
          version: "1.0.0",
          description: "Timeline and witness data API",
        },
        servers: [
          {
            url: `http://${env.HOST}:${env.PORT}`,
            description: "Development server",
          },
        ],
      },
    });

    await fastify.register(FastifySwaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
    });
  }

  // Ensure remaining domain schemas exist before serving routes.
  await initializeRiotAiPersistence();
  if (!options.authExternallyMounted) {
    await ensureAuthSchema();
    attachAuditOutboxSubscriber();
    await seedBootstrapAdmin();
  }
  if (!options.externallyMountedAddons) {
    await syncModels([
      controlCommandModel,
      workflowModel,
      alertModel,
      probeNodeModel,
      probeEventModel,
      opsEventModel,
      memoryRecordModel,
      storageBucketModel,
      storageObjectModel,
      storageUploadSessionModel,
      syslogEntryModel,
      snmpDeviceModel,
      snmpTargetModel,
      snmpSampleModel,
      radiusClientModel,
      radiusSessionModel,
    ]);
  }
  await ensureProbesSchema();

  // Wire persisted timeline use-case backed by canonical timeline_events / timeline_eras.
  if (!fastify.hasDecorator("timelineUseCase")) {
    const repo = new TimelineRepository();
    fastify.decorate(
      "timelineUseCase",
      new TimelineUseCase({
        listEvents: async (filters) => (await repo.listEvents(filters)).data,
        countEvents: async (filters) => (await repo.listEvents(filters)).total,
        getEvent: (id) => repo.getEvent(id),
        getStats: () => repo.getStats(),
        getEras: () => repo.getEras(),
        createEvent: (input, actor) =>
          repo.createEvent(
            {
              ...input,
              excerpt: input.excerpt ?? "",
              body: input.body ?? "",
              location: input.location ?? "",
              tags: input.tags ?? [],
              sources: input.sources ?? 0,
              notes: input.notes ?? 0,
              image: input.image ?? "hero-witness",
              related: input.related ?? [],
            },
            actor,
          ),
        updateEvent: (id, patch, actor) => repo.updateEvent(id, patch, actor),
        archiveEvent: (id, actor) => repo.archiveEvent(id, actor),
        restoreEvent: (id, actor) => repo.restoreEvent(id, actor),
        deleteEvent: (id, actor) => repo.deleteEvent(id, actor),
        getEventHistory: (id) => repo.getEventHistory(id),
      }),
    );
  }

  // Wire MID OIDC authority into Fastify when key-encryption secret is configured.
  const midKeyEncryptionSecret =
    process.env.MID_KEY_ENCRYPTION_SECRET?.trim() || env.MID_KEY_ENCRYPTION_SECRET;
  if (!options.authExternallyMounted && midKeyEncryptionSecret) {
    await fastify.register(midFastifyPlugin, {
      db: createD1DatabaseFromOrm(getDb()),
      identityStore: createAuthMidIdentityStore(),
      keyEncryptionSecret: midKeyEncryptionSecret,
      issuerUrl:
        process.env.MID_ISSUER_URL?.trim() || env.MID_ISSUER_URL || "https://id.moonwitness.biz.id",
      cookieDomain: process.env.MID_COOKIE_DOMAIN?.trim() || env.MID_COOKIE_DOMAIN,
      corsOrigins: process.env.CORS_ORIGINS ?? env.CORS_ORIGINS,
    });
    fastify.decorate("midMounted", true);
  }

  await registerMetricsRoute(fastify, metrics);

  if (options.prefix) {
    await fastify.register(
      async (instance: FastifyInstance) => {
        await registerHealthRoutes(instance, { metrics });
        if (!options.authExternallyMounted) {
          await instance.register(authRoutes);
        }
        if (!options.externallyMountedAddons) {
          await instance.register(radiusRoutes);
          await instance.register(storageRoutes);
          await instance.register(syslogRoutes);
          await instance.register(snmpPollerRoutes);
          await instance.register(controlRoutes);
          await instance.register(riotAiRoutes);
          await instance.register(commandCenterRoutes);
          await instance.register(memoryRoutes);
          await instance.register(probesRoutes);
        }
      },
      { prefix: options.prefix },
    );
  }

  return fastify;
}
