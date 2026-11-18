import type { ChatRequest, OllamaAdapter } from "@moonwitness/ai";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { createRateLimiter } from "../../infrastructure/rate-limit";
import { env } from "../../shared/env";
import type { InferenceUsage } from "./riot-ai.audit";
import { getProviderConfig } from "./riot-ai.persistence";
import {
  chatResponseSchema,
  isAuditPersistenceFailure,
  mapRiotAiError,
  parseRiotAiClientAddress,
  requestSchema,
  setNoStore,
  streamingEventSchema,
} from "./riot-ai.schemas";

export interface RiotAiChatRouteDeps {
  readonly authorize: (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;
  readonly adapter: OllamaAdapter | null;
  readonly misconfigured: boolean;
  readonly configuredModelId: string | undefined;
  readonly requestLimit: ReturnType<typeof createRateLimiter>;
  readonly recordAudit: (
    request: FastifyRequest,
    model: string,
    startedAt: number,
    usage: InferenceUsage,
    outcome: "success" | "failure",
    errorCode?: string,
  ) => Promise<boolean>;
}

export function registerRiotAiChatRoute(fastify: FastifyInstance, deps: RiotAiChatRouteDeps): void {
  const { authorize, adapter, misconfigured, configuredModelId, requestLimit, recordAudit } = deps;

  fastify.post(
    "/riot-ai/chat",
    {
      preHandler: async (request, reply) => {
        await authorize(request, reply);
        if (reply.sent) return;
        const result = requestLimit.check(parseRiotAiClientAddress(request));
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
                ? misconfigured
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
        [configuredModelId, providerConfig.preferred_model].filter((id): id is string =>
          Boolean(id),
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
          const mapped = mapRiotAiError(error);
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
          const auditPersisted = clientDisconnected()
            ? await recordAudit(
                request,
                options.model,
                inferenceStartedAt,
                auditUsage,
                "failure",
                "CANCELLED",
              )
            : await recordAudit(
                request,
                options.model,
                inferenceStartedAt,
                auditUsage,
                auditOutcome,
                auditErrorCode,
              );
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
        if (!chatResponseSchema.safeParse(response).success) {
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
        const mapped = mapRiotAiError(error);
        request.log.warn(
          { code: mapped.code, requestId: request.id },
          "RIOT inference request failed",
        );
        if (!isAuditPersistenceFailure(error)) {
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
