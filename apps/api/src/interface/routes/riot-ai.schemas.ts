import { z } from "zod";
import { OllamaAdapter } from "@moonwitness/ai";
import type { FastifyReply, FastifyRequest } from "fastify";
import { resolveRateLimitKey } from "../../infrastructure/rate-limit";
import { env, validateRiotAiRuntimeConfig } from "../../shared/env";
import { listOperatorUsageSummary } from "./riot-ai.persistence";

export const requestToolCallSchema = z
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

export const requestSchema = z
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

export const chatResponseSchema = z
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

export const streamingEventSchema = z.discriminatedUnion("type", [
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

function aggregateTokenMetric(
  values: Array<number | null>,
  complete: boolean,
  truncated: boolean,
): {
  value: number | null;
  measurement: "measured" | "estimated" | "unavailable";
  estimatedValue?: number;
} {
  const known = values.filter((value): value is number => value !== null);
  const estimatedValue =
    known.length > 0 ? known.reduce((total, value) => total + value, 0) : undefined;
  if (known.length === values.length && complete) {
    return { value: known.reduce((total, value) => total + value, 0), measurement: "measured" };
  }
  return {
    value: null,
    measurement:
      estimatedValue === undefined
        ? "unavailable"
        : truncated || known.length < values.length
          ? "estimated"
          : "unavailable",
    ...(estimatedValue === undefined ? {} : { estimatedValue }),
  };
}

export async function getUsageOverview(days = 30, limit = 5000) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const entries = await listOperatorUsageSummary({ limit: limit + 1, since });
  const isComplete = entries.length <= limit;
  const measuredEntries = isComplete ? entries : entries.slice(0, limit + 1);
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
    promptTokens: aggregateTokenMetric(
      measuredEntries.map((entry) => entry.promptTokens),
      isComplete,
      !isComplete,
    ),
    completionTokens: aggregateTokenMetric(
      measuredEntries.map((entry) => entry.completionTokens),
      isComplete,
      !isComplete,
    ),
    totalTokens: aggregateTokenMetric(
      measuredEntries.map((entry) => entry.totalTokens),
      isComplete,
      !isComplete,
    ),
  };
}

export function getRiotAiAdapterState(): { adapter: OllamaAdapter | null; misconfigured: boolean } {
  const baseUrl = env.RIOT_AI_BASE_URL;
  if (!baseUrl) return { adapter: null, misconfigured: false };
  const problems = validateRiotAiRuntimeConfig({ RIOT_AI_BASE_URL: baseUrl });
  if (problems.length > 0) return { adapter: null, misconfigured: true };
  return {
    adapter: new OllamaAdapter({
      baseUrl,
      defaultModel: env.RIOT_AI_MODEL,
      timeoutMs: env.RIOT_AI_TIMEOUT_MS,
    }),
    misconfigured: false,
  };
}

export function parseRiotAiClientAddress(request: FastifyRequest): string {
  return resolveRateLimitKey(
    request.ip,
    request.headers["x-forwarded-for"],
    env.TRUSTED_PROXY_COUNT,
  );
}

export function setNoStore(reply: FastifyReply): void {
  reply.header("cache-control", "no-store");
  reply.header("x-accel-buffering", "no");
}

export function mapRiotAiError(error: unknown): { status: number; code: string; message: string } {
  const candidate = error as { code?: unknown };
  const code = typeof candidate?.code === "string" ? candidate.code : "INFERENCE_ERROR";
  const statusMap: Record<string, [number, string]> = {
    INVALID_REQUEST: [400, "Inference request was rejected"],
    MODEL_NOT_FOUND: [404, "Configured inference model is unavailable"],
    RATE_LIMITED: [429, "Inference request rate-limited"],
    TIMEOUT: [504, "Inference runtime timed out"],
    CANCELLED: [499, "Inference request was cancelled"],
    PROVIDER_UNAVAILABLE: [503, "Local inference runtime is unavailable"],
  };
  const [status, message] = statusMap[code] ?? [
    502,
    "Inference runtime returned an invalid response",
  ];
  return { status, code, message };
}

export function isAuditPersistenceFailure(error: unknown): boolean {
  return error instanceof Error && error.message === "inference usage could not be persisted";
}
