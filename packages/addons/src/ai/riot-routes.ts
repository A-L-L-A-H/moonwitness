import { z } from "zod";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type BaseAddonAuthBridge,
  type FastifyPreHandler,
  type HostRateLimitFactory,
} from "@moonwitness/addon-runtime";
import {
  persistInferenceAudit,
  type InferenceAuditRecord,
  type InferenceUsage,
} from "./audit.js";
import { registerRiotAiChatRoute } from "./chat.js";
import {
  getProviderConfig,
  listOperatorUsageSummary,
  listProviderConfigHistory,
  maintainUsageRetention,
  upsertProviderConfig,
} from "./persistence.js";
import {
  getRiotAiAdapterState,
  getUsageOverview,
  mapRiotAiError,
  parseRiotAiClientAddress,
  resolveRiotAiRuntime,
  setNoStore,
  type RiotAiRuntimeConfig,
} from "./schemas.js";

export interface RiotAiRoutesOptions {
  auth?: BaseAddonAuthBridge;
  rateLimit?: HostRateLimitFactory;
  runtime?: Partial<RiotAiRuntimeConfig>;
}

function createInMemoryChatRateLimiter(
  max: number,
  windowMs: number,
  trustedProxyCount: number,
): { preHandler: FastifyPreHandler; reset: () => void } {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    preHandler: async (request, reply) => {
      const now = Date.now();
      const key = parseRiotAiClientAddress(request, trustedProxyCount);
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count += 1;
      reply.header("x-ratelimit-limit", max);
      reply.header("x-ratelimit-remaining", Math.max(0, max - bucket.count));
      if (bucket.count > max) {
        reply.header("retry-after", Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
        return reply.code(429).send({ error: "too many inference requests", code: "RATE_LIMITED" });
      }
      return undefined;
    },
    reset: () => {
      buckets.clear();
    },
  };
}

export async function registerRiotAiRoutes(
  fastify: FastifyInstance,
  options: RiotAiRoutesOptions = {},
): Promise<void> {
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const authorize = auth.requireRole("admin", "editor");
  const adminOnly = auth.requireRole("admin");
  const runtime = resolveRiotAiRuntime(options.runtime);
  const adapterState = getRiotAiAdapterState(options.runtime);
  const adapter = adapterState.adapter;
  const configuredModelId = runtime.RIOT_AI_MODEL;
  const configuredBaseUrl = runtime.RIOT_AI_BASE_URL;

  const respondWithError = (request: FastifyRequest, reply: FastifyReply, error: unknown) => {
    const mapped = mapRiotAiError(error);
    request.log.warn({ code: mapped.code, requestId: request.id }, "RIOT inference request failed");
    return reply.code(mapped.status).send({ error: mapped.message, code: mapped.code });
  };

  const recordAudit = async (
    request: FastifyRequest,
    model: string,
    startedAt: number,
    usage: InferenceUsage,
    outcome: "success" | "failure",
    errorCode?: string,
  ): Promise<boolean> => {
    let auditEventWritten = false;
    try {
      const tenantId = resolveActorTenantFromBridge(auth, request);
      const record: InferenceAuditRecord = {
        actorId: auth.getActorId(request) ?? "unknown",
        requestId: request.id,
        provider: "ollama",
        model,
        outcome,
        durationMs: Date.now() - startedAt,
        usage,
        ...(errorCode ? { errorCode } : {}),
        tenantId,
      };
      await persistInferenceAudit(record);
      auditEventWritten = true;
      return true;
    } catch (error) {
      if (!auditEventWritten) {
        request.log.error({ err: error, requestId: request.id }, "RIOT inference audit failed");
      }
      return false;
    }
  };

  const fallbackRateLimiter = createInMemoryChatRateLimiter(
    runtime.RIOT_AI_RATE_LIMIT_MAX,
    runtime.RIOT_AI_RATE_LIMIT_WINDOW_MS,
    runtime.TRUSTED_PROXY_COUNT,
  );
  const rateLimitPreHandler = options.rateLimit
    ? options.rateLimit({
        max: runtime.RIOT_AI_RATE_LIMIT_MAX,
        windowMs: runtime.RIOT_AI_RATE_LIMIT_WINDOW_MS,
        scope: "riot-ai",
        message: "too many inference requests",
      })
    : fallbackRateLimiter.preHandler;

  fastify.addHook("onClose", async () => {
    fallbackRateLimiter.reset();
  });

  fastify.addHook("onReady", async () => {
    try {
      await maintainUsageRetention(runtime.RIOT_AI_USAGE_RETENTION_DAYS);
    } catch (error) {
      fastify.log.error({ err: error }, "RIOT inference usage retention failed");
    }
  });

  fastify.get("/riot-ai/health", { preHandler: authorize }, async (request, reply) => {
    setNoStore(reply);
    const tenantId = resolveActorTenantFromBridge(auth, request);
    const providerConfig = await getProviderConfig("default", tenantId);
    if (auth.getActorRole(request) !== "admin") {
      if (!providerConfig?.enabled) {
        return reply.code(503).send({ status: "unconfigured", provider: "ollama" });
      }
      if (!adapter) {
        return reply.code(503).send({ status: "unhealthy", provider: "ollama" });
      }
      return reply.send(await adapter.checkHealth());
    }
    if (!adapter) {
      return reply.code(503).send({
        status: adapterState.misconfigured
          ? "misconfigured"
          : providerConfig?.enabled
            ? "unhealthy"
            : "unconfigured",
        provider: "ollama",
      });
    }
    const health = await adapter.checkHealth();
    return reply.send({
      ...health,
      status: providerConfig?.enabled
        ? health.status
        : runtime.RIOT_AI_BASE_URL
          ? "unhealthy"
          : "unconfigured",
      ...(!providerConfig?.enabled
        ? {
            error: "Local inference has not been enabled by an operator.",
          }
        : {}),
    });
  });

  fastify.get("/riot-ai/models", { preHandler: authorize }, async (request, reply) => {
    setNoStore(reply);
    const tenantId = resolveActorTenantFromBridge(auth, request);
    const providerConfig = await getProviderConfig("default", tenantId);
    if (auth.getActorRole(request) !== "admin") {
      if (!providerConfig?.enabled || !adapter) {
        return reply.code(503).send({ error: "local inference is unavailable" });
      }
      try {
        const models = await adapter.listModels();
        return reply.send({
          models: models.filter(
            (model) =>
              (!configuredModelId || model.id === configuredModelId) &&
              (!providerConfig.preferred_model || model.id === providerConfig.preferred_model),
          ),
        });
      } catch {
        return reply.code(503).send({ error: "local inference is unavailable" });
      }
    }
    if (!adapter || providerConfig?.enabled === false) {
      return reply.code(503).send({
        error:
          providerConfig?.enabled === false
            ? "local inference is disabled by the operator"
            : adapterState.misconfigured
              ? "local inference runtime configuration is invalid"
              : "local inference runtime is not configured",
      });
    }
    try {
      const requestController = new AbortController();
      const abortOnDisconnect = () => {
        if (request.raw.aborted) requestController.abort();
      };
      request.raw.once("aborted", abortOnDisconnect);
      try {
        const models = await adapter.listModels(requestController.signal);
        return reply.send({
          models: models.filter(
            (model) =>
              (!configuredModelId || model.id === configuredModelId) &&
              (!providerConfig?.preferred_model || model.id === providerConfig.preferred_model),
          ),
        });
      } finally {
        request.raw.off("aborted", abortOnDisconnect);
      }
    } catch (error) {
      return respondWithError(request, reply, error);
    }
  });

  fastify.get("/riot-ai/config", { preHandler: authorize }, async (request, reply) => {
    setNoStore(reply);
    const tenantId = resolveActorTenantFromBridge(auth, request);
    const config = await getProviderConfig("default", tenantId);
    const operator = auth.getActorRole(request) === "admin";
    return reply.send({
      config: config
        ? {
            profileKey: config.profile_key,
            label: config.label,
            provider: config.provider,
            enabled: config.enabled,
            preferredModel: operator ? config.preferred_model : null,
            canEditConfig: operator,
          }
        : {
            profileKey: "default",
            label: "Local inference",
            provider: "ollama",
            enabled: false,
            preferredModel: operator ? (configuredModelId ?? null) : null,
            canEditConfig: operator,
          },
      endpoint: configuredBaseUrl ? "server-configured" : "not-configured",
    });
  });

  fastify.put("/riot-ai/config", { preHandler: adminOnly }, async (request, reply) => {
    setNoStore(reply);
    const body = z
      .object({
        label: z.string().trim().min(1).max(120),
        enabled: z.boolean(),
        preferredModel: z.union([z.string().trim().min(1).max(200), z.null()]),
      })
      .strict()
      .safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "invalid inference configuration" });
    }
    const actor = resolveActorContextFromBridge(auth, request, "api");
    const current = await getProviderConfig("default", actor.tenantId);
    const { enabled, preferredModel, label } = body.data;
    if (enabled && !runtime.RIOT_AI_BASE_URL) {
      return reply.code(409).send({ error: "configure the runtime endpoint on the API first" });
    }
    if (preferredModel && configuredModelId && preferredModel !== configuredModelId) {
      return reply.code(400).send({ error: "model is not approved by server configuration" });
    }
    if (preferredModel && current?.preferred_model && current.preferred_model !== preferredModel) {
      return reply.code(409).send({
        error: "changing the preferred model requires an API restart with the new model allowlist",
      });
    }
    if (enabled && !preferredModel) {
      return reply.code(400).send({ error: "select an approved model before enabling inference" });
    }
    if (enabled && preferredModel && adapter) {
      try {
        const availableModels = await adapter.listModels();
        const approvedModel = availableModels.filter(
          (model) => !configuredModelId || model.id === configuredModelId,
        );
        if (!approvedModel.some((model) => model.id === preferredModel)) {
          return reply.code(400).send({ error: "selected model is unavailable" });
        }
      } catch {
        return reply.code(503).send({ error: "inference runtime is unavailable" });
      }
    }
    if (enabled && !adapter) {
      return reply.code(503).send({
        error: adapterState.misconfigured
          ? "local inference runtime configuration is invalid"
          : "local inference runtime is unavailable",
      });
    }
    const config = await upsertProviderConfig(
      { profileKey: "default", label, enabled, preferredModel },
      actor,
    );
    return reply.send({
      config: {
        profileKey: config.profile_key,
        label: config.label,
        provider: config.provider,
        enabled: config.enabled,
        preferredModel: config.preferred_model,
      },
      endpoint: configuredBaseUrl ? "server-configured" : "not-configured",
    });
  });

  fastify.get("/riot-ai/usage", { preHandler: adminOnly }, async (request, reply) => {
    setNoStore(reply);
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(5000).default(1000),
        days: z.coerce.number().int().min(1).max(90).default(30),
      })
      .safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "invalid usage summary query" });
    }
    const tenantId = resolveActorTenantFromBridge(auth, request);
    const since = new Date(Date.now() - query.data.days * 24 * 60 * 60 * 1000).toISOString();
    const entries = await listOperatorUsageSummary({
      limit: query.data.limit + 1,
      since,
      tenantId,
    });
    const truncated = entries.length > query.data.limit;
    return reply.send({
      entries: truncated ? entries.slice(0, query.data.limit) : entries,
      summary: await getUsageOverview(query.data.days, query.data.limit, tenantId),
    });
  });

  fastify.get("/riot-ai/config/history", { preHandler: adminOnly }, async (request, reply) => {
    setNoStore(reply);
    const tenantId = resolveActorTenantFromBridge(auth, request);
    return reply.send({
      history: await listProviderConfigHistory("default", tenantId),
    });
  });

  registerRiotAiChatRoute(fastify, {
    auth,
    authorize,
    adapter,
    misconfigured: adapterState.misconfigured,
    runtime,
    rateLimitPreHandler,
    recordAudit,
  });
}
