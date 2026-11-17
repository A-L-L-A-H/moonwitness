import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type { FastifyError } from "fastify";
import FastifyCookie from "@fastify/cookie";
import FastifyCors from "@fastify/cors";
import { env, parseCorsOrigins } from "../../shared/env";
import { createRateLimiter, resolveRateLimitKey } from "../rate-limit";
import { registerHealthRoutes } from "../../interface/routes/health.routes";
import { authRoutes } from "../../interface/routes/auth.routes";
import { controlRoutes } from "../../interface/routes/control.routes";
import { radiusRoutes } from "../../interface/routes/radius.routes";
import { storageRoutes } from "../../interface/routes/storage.routes";
import { syslogRoutes } from "../../interface/routes/syslog.routes";
import { snmpPollerRoutes } from "../../interface/routes/snmp-poller.routes";
import { riotAiRoutes } from "../../interface/routes/riot-ai.routes";
import { commandCenterRoutes } from "../../interface/routes/command-center.routes";
import { memoryRoutes } from "../../interface/routes/memory.routes";
import { commandCenterMigrations } from "../../interface/routes/command-center.persistence";
import { ensureProbesSchema, probesMigrations } from "../../interface/routes/probes.persistence";
import { probesRoutes } from "../../interface/routes/probes.routes";
import { applyMigrations, createD1DatabaseFromOrm, getDb } from "@moonwitness/orm";
import { authMigrations } from "../../db/migrations";
import { seedBootstrapAdmin } from "../../services/user";
import { midFastifyPlugin } from "@moonwitness/mid";

export interface BootstrapOptions {
  prefix?: string;
  disableDocs?: boolean;
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

  // Echo the correlation id back and include it in every structured log line.
  fastify.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
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
    const limiter = createRateLimiter({
      max: maxRequests,
      windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
    });
    fastify.addHook("onRequest", async (request, reply) => {
      const result = limiter.check(
        resolveRateLimitKey(
          request.ip,
          request.headers["x-forwarded-for"],
          env.TRUSTED_PROXY_COUNT,
        ),
      );
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

  // Ensure auth, command center, and probes schemas exist before serving routes.
  await applyMigrations([...authMigrations, ...commandCenterMigrations, ...probesMigrations]);
  await seedBootstrapAdmin();
  await ensureProbesSchema();

  // Wire MID OIDC authority into Fastify when key-encryption secret is configured.
  if (env.MID_KEY_ENCRYPTION_SECRET) {
    await fastify.register(midFastifyPlugin, {
      db: createD1DatabaseFromOrm(getDb()),
      keyEncryptionSecret: env.MID_KEY_ENCRYPTION_SECRET,
      issuerUrl: env.MID_ISSUER_URL ?? "https://id.moonwitness.biz.id",
      cookieDomain: env.MID_COOKIE_DOMAIN,
      corsOrigins: env.CORS_ORIGINS,
    });
  }

  if (options.prefix) {
    await fastify.register(
      async (instance: FastifyInstance) => {
        await registerHealthRoutes(instance);
        await instance.register(authRoutes);
        // Proxy aditif ke control plane arsy & layanan RADIUS.
        await instance.register(controlRoutes);
        await instance.register(radiusRoutes);
        // Proxy ke layanan Rust: storage (S3), syslog, snmp-poller.
        await instance.register(storageRoutes);
        await instance.register(syslogRoutes);
        await instance.register(snmpPollerRoutes);
        await instance.register(riotAiRoutes);
        await instance.register(commandCenterRoutes);
        await instance.register(memoryRoutes);
        await instance.register(probesRoutes);
      },
      { prefix: options.prefix },
    );
  }

  return fastify;
}
