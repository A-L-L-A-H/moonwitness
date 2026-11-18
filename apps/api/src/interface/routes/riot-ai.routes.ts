import { z } from "zod";
import { createActorContext } from "@moonwitness/orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createRateLimiter } from "../../infrastructure/rate-limit";
import { requireRole } from "../../middleware/auth";
import { env } from "../../shared/env";
import {
  persistInferenceAudit,
  type InferenceAuditRecord,
  type InferenceUsage,
} from "./riot-ai.audit";
import {
  getProviderConfig,
  listProviderConfigHistory,
  initializeRiotAiPersistence,
  listOperatorUsageSummary,
  maintainUsageRetention,
  upsertProviderConfig,
} from "./riot-ai.persistence";
import { registerRiotAiChatRoute } from "./riot-ai.chat";
import {
  getRiotAiAdapterState,
  getUsageOverview,
  mapRiotAiError,
  setNoStore,
} from "./riot-ai.schemas";

export async function riotAiRoutes(fastify: FastifyInstance): Promise<void> {
  await initializeRiotAiPersistence();
  const authorize = requireRole("admin", "editor");
  const adapterState = getRiotAiAdapterState();
  const adapter = adapterState.adapter;
  const configuredModelId = env.RIOT_AI_MODEL;
  const configuredBaseUrl = env.RIOT_AI_BASE_URL;

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
      const record: InferenceAuditRecord = {
        actorId: request.user ? String(request.user.id) : "unknown",
        requestId: request.id,
        provider: "ollama",
        model,
        outcome,
        durationMs: Date.now() - startedAt,
        usage,
        ...(errorCode ? { errorCode } : {}),
        ...(request.tenantId ? { tenantId: request.tenantId } : {}),
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

  const requestLimit = createRateLimiter({
    max: env.RIOT_AI_RATE_LIMIT_MAX,
    windowMs: env.RIOT_AI_RATE_LIMIT_WINDOW_MS,
  });

  fastify.addHook("onClose", async () => {
    requestLimit.reset();
  });

  fastify.addHook("onReady", async () => {
    try {
      await maintainUsageRetention(env.RIOT_AI_USAGE_RETENTION_DAYS);
    } catch (error) {
      fastify.log.error({ err: error }, "RIOT inference usage retention failed");
    }
  });

  fastify.get("/riot-ai/health", { preHandler: authorize }, async (request, reply) => {
    setNoStore(reply);
    const providerConfig = await getProviderConfig("default");
    if (request.user?.role !== "admin") {
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
        : env.RIOT_AI_BASE_URL
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
    const providerConfig = await getProviderConfig("default");
    if (request.user?.role !== "admin") {
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
    const config = await getProviderConfig("default");
    const operator = request.user?.role === "admin";
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
            preferredModel: operator ? (env.RIOT_AI_MODEL ?? null) : null,
            canEditConfig: operator,
          },
      endpoint: configuredBaseUrl ? "server-configured" : "not-configured",
    });
  });

  fastify.put("/riot-ai/config", { preHandler: requireRole("admin") }, async (request, reply) => {
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
    const current = await getProviderConfig("default");
    const { enabled, preferredModel, label } = body.data;
    if (enabled && !env.RIOT_AI_BASE_URL) {
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
      createActorContext(
        request.user ? String(request.user.id) : null,
        "api",
        request.id,
        request.tenantId,
      ),
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

  fastify.get("/riot-ai/usage", { preHandler: requireRole("admin") }, async (request, reply) => {
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
    const since = new Date(Date.now() - query.data.days * 24 * 60 * 60 * 1000).toISOString();
    const entries = await listOperatorUsageSummary({
      limit: query.data.limit + 1,
      since,
      tenantId: request.tenantId,
    });
    const truncated = entries.length > query.data.limit;
    return reply.send({
      entries: truncated ? entries.slice(0, query.data.limit) : entries,
      summary: await getUsageOverview(query.data.days, query.data.limit, request.tenantId),
    });
  });

  fastify.get(
    "/riot-ai/config/history",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      setNoStore(reply);
      return reply.send({
        history: await listProviderConfigHistory("default", request.tenantId),
      });
    },
  );

  registerRiotAiChatRoute(fastify, {
    authorize,
    adapter,
    misconfigured: adapterState.misconfigured,
    configuredModelId,
    requestLimit,
    recordAudit,
  });
}
