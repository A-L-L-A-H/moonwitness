import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import { createAuthService, AuthServiceError } from "@moonwitness/auth";
import {
  createAuditRepository,
  createCreativeEntityRepository,
  createResearchRepository,
  createSourceReferenceRepository,
  createStoryRepository
} from "@moonwitness/database";
import { installAuthContext } from "./plugins/auth-context.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { storyRoutes } from "./routes/stories.js";
import { researchRoutes } from "./routes/research.js";
import { sourceRoutes } from "./routes/sources.js";
import { universeRoutes } from "./routes/universe.js";
import { adminRoutes } from "./routes/admin.js";
import { API_VERSION, CONTRACT_VERSION, PLATFORM_NAME, errorEnvelope } from "@moonwitness/contracts";

function createRepositories(request) {
  if (!request.em) {
    throw new AuthServiceError("CONTENT_UNAVAILABLE", "Content storage is unavailable.", 503);
  }

  return {
    stories: createStoryRepository(request.em),
    audits: createAuditRepository(request.em),
    sources: createSourceReferenceRepository(request.em),
    research: createResearchRepository(request.em),
    entities: createCreativeEntityRepository(request.em)
  };
}

export async function buildApp({
  orm = null,
  redis = null,
  config = {},
  logger = false,
  repositoryFactory = createRepositories
} = {}) {
  const app = Fastify({
    logger: logger ? { level: config.logLevel ?? "info" } : false,
    bodyLimit: 1_048_576,
    trustProxy: false,
    requestIdHeader: "x-request-id"
  });

  app.decorate("dependencies", { orm, redis });
  app.decorate("repositoryFactory", repositoryFactory);
  app.decorateRequest("em", null);

  if (orm) {
    app.addHook("onRequest", async (request) => {
      request.em = orm.em.fork({ clear: true });
    });
  }

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, "request failed");

    const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600
      ? error.statusCode
      : 500;

    reply.code(statusCode).send(errorEnvelope(
      statusCode >= 500 ? "INTERNAL_ERROR" : (error.code ?? "REQUEST_ERROR"),
      statusCode >= 500 ? "An unexpected error occurred." : error.message,
      request.id
    ));
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" }
  });

  await app.register(cors, {
    origin: config.corsOrigins?.length ? config.corsOrigins : false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: (request) => request.url.startsWith("/health/")
  });

  await app.register(cookie);

  const authService = createAuthService();
  app.decorate("authService", authService);
  app.decorate("authorizationService", authService.authorization);
  const cookieName = config.nodeEnv === "production" ? "__Host-mw_session" : "mw_session";
  installAuthContext(app, {
    authService,
    cookieName,
    secureCookie: config.nodeEnv === "production",
    allowedOrigins: config.corsOrigins ?? []
  });

  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(storyRoutes, { prefix: "/api/v1/stories" });
  await app.register(researchRoutes, { prefix: "/api/v1/research" });
  await app.register(sourceRoutes, { prefix: "/api/v1/sources" });
  await app.register(universeRoutes, { prefix: "/api/v1/universe" });
  await app.register(adminRoutes, { prefix: "/api/v1/admin" });

  app.get("/api/v1/meta", async () => ({
    data: {
      name: `${PLATFORM_NAME} API`,
      apiVersion: API_VERSION,
      contractVersion: CONTRACT_VERSION
    },
    meta: {}
  }));

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send(errorEnvelope(
      "ROUTE_NOT_FOUND",
      "The requested resource does not exist.",
      request.id
    ));
  });



  return app;
}
