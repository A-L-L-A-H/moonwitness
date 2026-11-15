import { z } from "zod";
import { OllamaAdapter, type ChatRequest } from "@moonwitness/ai";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createRateLimiter } from "../../infrastructure/rate-limit";
import { requireRole } from "../../middleware/auth";
import { env, validateRiotAiRuntimeConfig } from "../../shared/env";
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

const requestToolCallSchema = z
  .object({
    id: z.string().min(1).max(200),
    type: z.literal("function"),
    function: z
      .object({
        name: z.string().min(1).max(200),
        arguments: z.string().max(48_000),
      })
      .strict(),
  })
  .strict();

const requestSchema = z
  .object({
    requestId: z.string().min(1).max(200),
    model: z.string().min(1).max(200).optional(),
    messages: z
      .array(
        z
          .object({
            role: z.enum(["system", "user", "assistant", "tool"]),
            content: z.string().max(48_000),
            name: z.string().max(200).optional(),
            toolCalls: z.array(requestToolCallSchema).max(16).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(64),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    maxTokens: z.number().int().positive().max(16_384).optional(),
    stop: z.array(z.string().max(200)).max(8).optional(),
    seed: z.number().int().optional(),
    user: z.string().max(200).optional(),
    tools: z
      .array(
        z
          .object({
            type: z.literal("function"),
            function: z
              .object({
                name: z.string().min(1).max(200),
                description: z.string().max(2_000),
                parameters: z.record(z.string(), z.unknown()),
              })
              .strict(),
          })
          .strict(),
      )
      .max(32)
      .optional(),
    toolChoice: z
      .union([
        z.literal("none"),
        z.literal("auto"),
        z.literal("required"),
        z
          .object({
            type: z.literal("function"),
            function: z.object({ name: z.string().min(1).max(200) }).strict(),
          })
          .strict(),
      ])
      .optional(),
    responseFormat: z
      .union([
        z.object({ type: z.literal("json_object") }).strict(),
        z
          .object({
            type: z.literal("json_schema"),
            jsonSchema: z.record(z.string(), z.unknown()),
          })
          .strict(),
      ])
      .optional(),
    stream: z.boolean().default(false),
  })
  .strict();

const chatResponseSchema = z
  .object({
    id: z.string().min(1),
    model: z.string().min(1),
    provider: z.string().min(1),
    choices: z
      .array(
        z
          .object({
            index: z.number().int().nonnegative(),
            message: z
              .object({
                role: z.literal("assistant"),
                content: z.string(),
              })
              .strict(),
            finishReason: z.enum([
              "stop",
              "length",
              "tool_calls",
              "content_filter",
              "cancelled",
              "error",
              "unknown",
            ]),
          })
          .strict(),
      )
      .min(1),
    usage: z
      .object({
        promptTokens: z.number().int().nonnegative().nullable(),
        completionTokens: z.number().int().nonnegative().nullable(),
        totalTokens: z.number().int().nonnegative().nullable(),
        tokensPerSecond: z.number().nonnegative().nullable().optional(),
      })
      .strict(),
    createdAt: z.number().int().positive(),
    providerMetadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const streamingEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("content"),
      requestId: z.string().min(1),
      delta: z
        .object({
          role: z.enum(["system", "user", "assistant", "tool"]).optional(),
          content: z.string().optional(),
          toolCalls: z
            .array(
              z
                .object({
                  index: z.number().int().nonnegative(),
                  id: z.string().optional(),
                  type: z.literal("function").optional(),
                  function: z
                    .object({
                      name: z.string().optional(),
                      arguments: z.string().optional(),
                    })
                    .optional(),
                })
                .strict(),
            )
            .optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("done"),
      requestId: z.string().min(1),
      response: chatResponseSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("error"),
      requestId: z.string().min(1),
      error: z
        .object({
          code: z.string(),
          message: z.string(),
          provider: z.string(),
          retryable: z.boolean(),
          cause: z.unknown().optional(),
        })
        .strict(),
    })
    .strict(),
]);

async function getUsageOverview(days = 30, limit = 5000) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const entries = await listOperatorUsageSummary({ limit: limit + 1, since });
  const isComplete = entries.length <= limit;
  const measuredEntries = isComplete ? entries : entries.slice(0, limit + 1);
  const tokenValue = (
    values: Array<number | null>,
    complete: boolean,
    truncated: boolean,
  ): {
    value: number | null;
    measurement: "measured" | "estimated" | "unavailable";
    estimatedValue?: number;
  } => {
    const known = values.filter((value): value is number => value !== null);
    const estimatedValue =
      known.length > 0 ? known.reduce((total, value) => total + value, 0) : undefined;
    return known.length === values.length && complete
      ? {
          value: known.reduce((total, value) => total + value, 0),
          measurement: "measured",
        }
      : {
          value: null,
          measurement:
            estimatedValue === undefined
              ? "unavailable"
              : truncated || known.length < values.length
                ? "estimated"
                : "unavailable",
          ...(estimatedValue === undefined ? {} : { estimatedValue }),
        };
  };
  return {
    measurement: isComplete
      ? ("measured" as const)
      : measuredEntries.some(
            (entry) =>
              entry.promptTokens !== null ||
              entry.completionTokens !== null ||
              entry.totalTokens !== null,
          )
        ? ("estimated" as const)
        : ("unavailable" as const),
    truncated: !isComplete,
    requests: isComplete ? measuredEntries.length : null,
    successful: isComplete
      ? measuredEntries.filter((entry) => entry.outcome === "success").length
      : null,
    failed: isComplete
      ? measuredEntries.filter((entry) => entry.outcome === "failure").length
      : null,
    promptTokens: tokenValue(
      measuredEntries.map((entry) => entry.promptTokens),
      isComplete,
      !isComplete,
    ),
    completionTokens: tokenValue(
      measuredEntries.map((entry) => entry.completionTokens),
      isComplete,
      !isComplete,
    ),
    totalTokens: tokenValue(
      measuredEntries.map((entry) => entry.totalTokens),
      isComplete,
      !isComplete,
    ),
  };
}

function getAdapter(): OllamaAdapter | null {
  const baseUrl = env.RIOT_AI_BASE_URL;
  if (!baseUrl) return null;
  const problems = validateRiotAiRuntimeConfig({ RIOT_AI_BASE_URL: baseUrl });
  if (problems.length > 0) {
    throw new Error(`Invalid RIOT inference runtime configuration: ${problems.join(" ")}`);
  }
  return new OllamaAdapter({
    baseUrl,
    defaultModel: env.RIOT_AI_MODEL,
    timeoutMs: env.RIOT_AI_TIMEOUT_MS,
  });
}

function getAdapterState(): { adapter: OllamaAdapter | null; misconfigured: boolean } {
  try {
    return { adapter: getAdapter(), misconfigured: false };
  } catch {
    return { adapter: null, misconfigured: true };
  }
}

function parseClientAddress(request: FastifyRequest): string {
  return request.ip;
}

function setNoStore(reply: FastifyReply): void {
  reply.header("cache-control", "no-store");
  reply.header("x-accel-buffering", "no");
}

function safeError(error: unknown): { status: number; code: string; message: string } {
  const candidate = error as { code?: unknown; message?: unknown; retryable?: unknown };
  const code = typeof candidate?.code === "string" ? candidate.code : "INFERENCE_ERROR";
  const status =
    code === "INVALID_REQUEST"
      ? 400
      : code === "MODEL_NOT_FOUND"
        ? 404
        : code === "RATE_LIMITED"
          ? 429
          : code === "TIMEOUT"
            ? 504
            : code === "CANCELLED"
              ? 499
              : code === "PROVIDER_UNAVAILABLE"
                ? 503
                : 502;
  const message =
    code === "MODEL_NOT_FOUND"
      ? "Configured inference model is unavailable"
      : code === "INVALID_REQUEST"
        ? "Inference request was rejected"
        : code === "TIMEOUT"
          ? "Inference runtime timed out"
          : code === "CANCELLED"
            ? "Inference request was cancelled"
            : code === "PROVIDER_UNAVAILABLE"
              ? "Local inference runtime is unavailable"
              : "Inference runtime returned an invalid response";
  return { status, code, message };
}

function auditPersistenceFailed(error: unknown): boolean {
  return error instanceof Error && error.message === "inference usage could not be persisted";
}

export async function riotAiRoutes(fastify: FastifyInstance): Promise<void> {
  await initializeRiotAiPersistence();
  const authorize = requireRole("admin", "editor");
  const adapterState = getAdapterState();
  const adapter = adapterState.adapter;
  const configuredModelId = env.RIOT_AI_MODEL;
  const configuredBaseUrl = env.RIOT_AI_BASE_URL;
  const respondWithError = (request: FastifyRequest, reply: FastifyReply, error: unknown) => {
    const mapped = safeError(error);
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
      const health = await adapter.checkHealth();
      return reply.send(health);
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
            error:
              request.user?.role === "admin"
                ? "Local inference has not been enabled by an operator."
                : "Local inference is unavailable.",
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
          request.user?.role === "admin"
            ? providerConfig?.enabled === false
              ? "local inference is disabled by the operator"
              : adapterState.misconfigured
                ? "local inference runtime configuration is invalid"
                : "local inference runtime is not configured"
            : "local inference is unavailable",
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
        const approvedModels = models.filter(
          (model) =>
            (!configuredModelId || model.id === configuredModelId) &&
            (!providerConfig?.preferred_model || model.id === providerConfig.preferred_model),
        );
        return reply.send({ models: approvedModels });
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
    const enabled = body.data.enabled;
    const preferredModel = body.data.preferredModel;
    const label = body.data.label;
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
      {
        profileKey: "default",
        label,
        enabled,
        preferredModel,
      },
      {
        actorId: request.user ? String(request.user.id) : null,
        source: "api",
        requestId: request.id,
      },
    );
    const configResponse = {
      config: {
        profileKey: config.profile_key,
        label: config.label,
        provider: config.provider,
        enabled: config.enabled,
        preferredModel: config.preferred_model,
      },
      endpoint: configuredBaseUrl ? "server-configured" : "not-configured",
    };
    return reply.send(configResponse);
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
    });
    const truncated = entries.length > query.data.limit;
    const visibleEntries = truncated ? entries.slice(0, query.data.limit) : entries;
    return reply.send({
      entries: visibleEntries,
      summary: await getUsageOverview(query.data.days, query.data.limit),
    });
  });

  fastify.get(
    "/riot-ai/config/history",
    { preHandler: requireRole("admin") },
    async (_request, reply) => {
      setNoStore(reply);
      const history = await listProviderConfigHistory("default");
      return reply.send({ history });
    },
  );

  fastify.post(
    "/riot-ai/chat",
    {
      preHandler: async (request, reply) => {
        await authorize(request, reply);
        if (reply.sent) return;
        const result = requestLimit.check(parseClientAddress(request));
        reply.header("x-ratelimit-limit", env.RIOT_AI_RATE_LIMIT_MAX);
        reply.header("x-ratelimit-remaining", result.remaining);
        if (!result.allowed) {
          reply.header("retry-after", Math.ceil(result.retryAfterMs / 1000));
          return reply
            .code(429)
            .send({ error: "too many inference requests", code: "RATE_LIMITED" });
        }
      },
      bodyLimit: env.RIOT_AI_MAX_REQUEST_BYTES,
    },
    async (request, reply) => {
      setNoStore(reply);
      const parsed = requestSchema.safeParse(request.body);
      if (!parsed.success) {
        request.log.warn({ requestId: request.id }, "RIOT inference request validation failed");
        return reply
          .code(400)
          .send({ error: "invalid inference request", code: "INVALID_REQUEST" });
      }
      const { stream, ...chatRequest } = parsed.data;
      const providerConfig = await getProviderConfig("default");
      if (!adapter || !providerConfig?.enabled) {
        return reply.code(503).send({
          error:
            providerConfig && !providerConfig.enabled
              ? "local inference is disabled by the operator"
              : request.user?.role === "admin"
                ? adapterState.misconfigured
                  ? "local inference runtime configuration is invalid"
                  : "local inference runtime is not configured"
                : "local inference is unavailable",
        });
      }
      if (providerConfig?.enabled && !providerConfig.preferred_model) {
        return reply.code(503).send({ error: "no preferred inference model is configured" });
      }
      const selectedModel =
        chatRequest.model ?? providerConfig?.preferred_model ?? env.RIOT_AI_MODEL ?? "";
      if (request.user?.role !== "admin" && !providerConfig?.preferred_model) {
        return reply.code(503).send({ error: "no inference model is approved for this operator" });
      }
      if (!selectedModel) {
        return reply
          .code(400)
          .send({ error: "no inference model is configured", code: "INVALID_REQUEST" });
      }
      if (request.user?.role !== "admin" && selectedModel !== providerConfig.preferred_model) {
        return reply.code(400).send({ error: "model is not the selected operator preference" });
      }
      const approvedModelIds = new Set(
        [configuredModelId, providerConfig.preferred_model].filter((modelId): modelId is string =>
          Boolean(modelId),
        ),
      );
      if (approvedModelIds.size > 0 && !approvedModelIds.has(selectedModel)) {
        return reply.code(400).send({ error: "model is not allowed", code: "INVALID_REQUEST" });
      }
      if (
        providerConfig?.preferred_model &&
        chatRequest.model &&
        selectedModel !== providerConfig.preferred_model
      ) {
        return reply.code(400).send({ error: "model is not the selected operator preference" });
      }
      const requestController = new AbortController();
      const abortOnDisconnect = () => {
        if (request.raw.aborted || reply.raw.destroyed) requestController.abort();
      };
      request.raw.once("aborted", abortOnDisconnect);
      const options: ChatRequest = {
        ...chatRequest,
        model: selectedModel,
        timeoutMs: env.RIOT_AI_TIMEOUT_MS,
        signal: requestController.signal,
      };
      const inferenceStartedAt = Date.now();
      const onStreamDisconnect = () => {
        if (reply.raw.destroyed) requestController.abort();
      };

      if (stream) {
        const clientDisconnected = () => requestController.signal.aborted;
        reply.raw.once("close", onStreamDisconnect);
        reply.raw.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-store",
          connection: "keep-alive",
          "x-accel-buffering": "no",
          "x-request-id": request.id,
        });
        let auditUsage: InferenceUsage = {
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
        };
        let auditOutcome: "success" | "failure" = "success";
        let auditErrorCode: string | undefined;
        try {
          for await (const event of adapter.chatStream(options)) {
            if (clientDisconnected()) {
              requestController.abort();
              break;
            }
            if (!streamingEventSchema.safeParse(event).success) {
              throw new Error("Inference adapter returned an invalid streaming event");
            }
            if (event.type === "done") {
              auditUsage = event.response.usage;
              if (event.response.choices.some((choice) => choice.finishReason === "error")) {
                auditOutcome = "failure";
              }
            }
            reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
            if (event.type === "done") reply.raw.write("data: [DONE]\n\n");
          }
        } catch (error) {
          auditOutcome = "failure";
          if (clientDisconnected()) return reply;
          const mapped = safeError(error);
          auditErrorCode = mapped.code;
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "error",
              requestId: options.requestId,
              error: {
                code: mapped.code,
                message: mapped.message,
                provider: "ollama",
                retryable: mapped.status === 503 || mapped.status === 504,
              },
            })}\n\n`,
          );
        } finally {
          let auditPersisted: boolean;
          if (clientDisconnected()) {
            auditPersisted = await recordAudit(
              request,
              options.model,
              inferenceStartedAt,
              auditUsage,
              "failure",
              "CANCELLED",
            );
          } else {
            auditPersisted = await recordAudit(
              request,
              options.model,
              inferenceStartedAt,
              auditUsage,
              auditOutcome,
              auditErrorCode,
            );
          }
          request.raw.off("aborted", abortOnDisconnect);
          reply.raw.off("close", onStreamDisconnect);
          if (!reply.raw.destroyed) {
            if (!auditPersisted) {
              reply.raw.write(
                `data: ${JSON.stringify({
                  type: "error",
                  requestId: options.requestId,
                  error: {
                    code:
                      auditOutcome === "success" ? "AUDIT_PERSISTENCE_FAILED" : "AUDIT_LOG_FAILED",
                    message: "Inference result could not be recorded.",
                    provider: "ollama",
                    retryable: true,
                  },
                })}\n\n`,
              );
            }
            reply.raw.end();
          }
        }
        return reply;
      }

      try {
        const response = await adapter.chat(options);
        const validResponse = chatResponseSchema.safeParse(response);
        if (!validResponse.success) {
          throw new Error("Inference adapter returned an invalid response");
        }
        const auditPersisted = await recordAudit(
          request,
          options.model,
          inferenceStartedAt,
          response.usage,
          "success",
        );
        if (!auditPersisted) {
          throw new Error("inference usage could not be persisted");
        }
        return reply.send(response);
      } catch (error) {
        const mapped = safeError(error);
        request.log.warn(
          { code: mapped.code, requestId: request.id },
          "RIOT inference request failed",
        );
        if (!auditPersistenceFailed(error)) {
          await recordAudit(
            request,
            options.model,
            inferenceStartedAt,
            { promptTokens: null, completionTokens: null, totalTokens: null },
            "failure",
            mapped.code,
          );
        }
        return reply.code(mapped.status).send({ error: mapped.message, code: mapped.code });
      } finally {
        request.raw.off("aborted", abortOnDisconnect);
      }
    },
  );
}
