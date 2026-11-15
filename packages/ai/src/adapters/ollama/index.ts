import {
  CancelledError,
  createProviderError,
  InternalProviderError,
  InvalidRequestError,
  ModelNotFoundError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  UnknownProviderError,
} from "../../errors";
import type {
  ChatRole,
  ChatRequest,
  ChatResponse,
  FinishReason,
  ModelIdentity,
  ProviderCapabilities,
  ProviderHealth,
  ProviderInfo,
  StreamingEvent,
  ToolCall,
  ToolCallDelta,
  UsageMetadata,
} from "../../types";

export interface OllamaAdapterOptions {
  baseUrl: string;
  timeoutMs?: number;
  defaultModel?: string;
  fetch?: typeof globalThis.fetch;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asError(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(fallback);
}

function mapFinishReason(reason: unknown): FinishReason {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "tool_calls":
    case "function_call":
      return "tool_calls";
    case "content_filter":
      return "content_filter";
    default:
      return "unknown";
  }
}

function mapUsage(usage: unknown): UsageMetadata {
  if (!isRecord(usage)) {
    return { promptTokens: null, completionTokens: null, totalTokens: null };
  }

  const promptTokens = mapReportedTokenCount(usage.prompt_tokens);
  const completionTokens = mapReportedTokenCount(usage.completion_tokens);
  const totalTokens = mapReportedTokenCount(usage.total_tokens);
  return { promptTokens, completionTokens, totalTokens };
}

function mapReportedTokenCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function parseToolCalls(value: unknown): ToolCall[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const toolCalls = value.map((entry) => {
    if (!isRecord(entry) || !isRecord(entry.function)) {
      throw new Error("Malformed tool call in provider response");
    }
    const fn = entry.function;
    if (
      typeof entry.id !== "string" ||
      typeof fn.name !== "string" ||
      (typeof fn.arguments !== "string" && !isRecord(fn.arguments) && !Array.isArray(fn.arguments))
    ) {
      throw new Error("Malformed tool call in provider response");
    }
    const args =
      typeof fn.arguments === "string" ? fn.arguments : JSON.stringify(fn.arguments ?? {});
    return {
      id: entry.id,
      type: "function" as const,
      function: {
        name: fn.name,
        arguments: args,
      },
    };
  });
  return toolCalls;
}

function mapChatResponse(payload: unknown, request: ChatRequest): ChatResponse {
  if (
    !isRecord(payload) ||
    typeof payload.id !== "string" ||
    typeof payload.model !== "string" ||
    typeof payload.created !== "number" ||
    !Array.isArray(payload.choices) ||
    payload.choices.length === 0
  ) {
    throw new Error("Malformed chat completion response");
  }

  const choices = payload.choices.map((entry, index) => {
    if (!isRecord(entry) || !isRecord(entry.message)) {
      throw new Error("Malformed choice in chat completion response");
    }
    const message = entry.message;
    if (message.role !== "assistant") {
      throw new Error("Provider returned a non-assistant chat completion message");
    }
    const content =
      typeof message.content === "string"
        ? message.content
        : message.content === null
          ? ""
          : undefined;
    if (content === undefined) {
      throw new Error("Malformed assistant content in chat completion response");
    }
    const toolCalls = parseToolCalls(message.tool_calls);
    return {
      index: typeof entry.index === "number" ? entry.index : index,
      message: {
        role: "assistant" as const,
        content,
        ...(toolCalls ? { toolCalls } : {}),
      },
      finishReason: mapFinishReason(entry.finish_reason),
    };
  });

  return {
    id: payload.id,
    model: payload.model,
    provider: "ollama",
    choices,
    usage: mapUsage(payload.usage),
    createdAt: payload.created * 1000,
    providerMetadata: { requestId: request.requestId },
  };
}

function mapHttpError(status: number, payload: unknown, model: string, timeoutMs: number) {
  if (status === 404) return new ModelNotFoundError(model, "ollama");
  if (status === 400 || status === 422) {
    return new InvalidRequestError("The inference runtime rejected the request", "ollama");
  }
  if (status === 401) return createProviderError({ error: "unauthorized" }, "ollama");
  if (status === 403) return createProviderError({ error: "forbidden" }, "ollama");
  if (status === 429) return createProviderError({ error: "rate limit" }, "ollama");
  if (status >= 500) return new ProviderUnavailableError("ollama");
  if (isRecord(payload) && typeof payload.error === "string") {
    return createProviderError(payload, "ollama", { modelId: model, timeoutMs });
  }
  return new UnknownProviderError(`Inference runtime returned HTTP ${status}`, "ollama");
}

export class OllamaAdapter {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly defaultModel?: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: OllamaAdapterOptions) {
    const normalized = options.baseUrl.replace(/\/+$/, "");
    this.baseUrl = normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.defaultModel = options.defaultModel;
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);

    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new RangeError("timeoutMs must be a positive finite number");
    }
  }

  get provider(): string {
    return "ollama";
  }

  get capabilities(): ProviderCapabilities {
    return {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: false,
      vision: false,
      embeddings: false,
      modelListing: true,
      healthCheck: true,
      cancellation: true,
    };
  }

  async listModels(signal?: AbortSignal): Promise<ModelIdentity[]> {
    const response = await this.request("/models", { method: "GET" }, signal);
    if (!response.ok) {
      const payload = await this.readJson(response, "model list error");
      throw mapHttpError(response.status, payload, "", this.timeoutMs);
    }
    const payload: unknown = await this.readJson(response, "model list");
    if (!isRecord(payload) || !Array.isArray(payload.data)) {
      throw new InternalProviderError("Malformed model list response", this.provider);
    }

    return payload.data.map((entry) => {
      if (!isRecord(entry) || typeof entry.id !== "string" || entry.id.length === 0) {
        throw new InternalProviderError("Malformed model identity in model list", this.provider);
      }
      return {
        id: entry.id,
        name: typeof entry.name === "string" ? entry.name : entry.id,
        provider: this.provider,
        capabilities: {
          chat: true,
          streaming: true,
          tools: true,
          structuredOutput: false,
          vision: false,
          embeddings: false,
        },
      };
    });
  }

  async checkHealth(signal?: AbortSignal): Promise<ProviderHealth> {
    const startedAt = Date.now();
    try {
      const models = await this.listModels(signal);
      return {
        provider: this.provider,
        status: "healthy",
        lastCheckAt: Date.now(),
        latencyMs: Date.now() - startedAt,
        models,
      };
    } catch (error) {
      return {
        provider: this.provider,
        status: "unhealthy",
        lastCheckAt: Date.now(),
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Inference runtime unavailable",
      };
    }
  }

  async getProviderInfo(): Promise<ProviderInfo> {
    return {
      id: this.provider,
      name: "Ollama",
      capabilities: this.capabilities,
      defaultModel: this.defaultModel,
    };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel;
    if (!model) throw new InvalidRequestError("A model must be specified", this.provider);

    const response = await this.request(
      "/chat/completions",
      {
        method: "POST",
        body: JSON.stringify(this.toOpenAIRequest(request, model, false)),
      },
      request.signal,
      request.timeoutMs,
    );
    const payload: unknown = await this.readJson(response, "chat completion");
    if (!response.ok) {
      throw mapHttpError(response.status, payload, model, request.timeoutMs ?? this.timeoutMs);
    }

    try {
      return mapChatResponse(payload, request);
    } catch (error) {
      throw new InternalProviderError(
        "Malformed chat completion response",
        this.provider,
        asError(error, "Invalid response"),
      );
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamingEvent> {
    const model = request.model || this.defaultModel;
    if (!model) throw new InvalidRequestError("A model must be specified", this.provider);

    const response = await this.request(
      "/chat/completions",
      {
        method: "POST",
        body: JSON.stringify(this.toOpenAIRequest(request, model, true)),
        headers: { Accept: "text/event-stream" },
      },
      request.signal,
      request.timeoutMs,
    );
    if (!response.ok) {
      const payload = await this.readJson(response, "streaming chat completion");
      throw mapHttpError(response.status, payload, model, request.timeoutMs ?? this.timeoutMs);
    }
    if (!response.body) {
      throw new InternalProviderError("Streaming response has no body", this.provider);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let responseId = request.requestId;
    let responseModel = model;
    let createdAt = Date.now();
    let responseContent = "";
    let roleSent = false;
    let done = false;
    let sawDoneMarker = false;
    let usage: UsageMetadata = {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    };
    const toolCalls = new Map<number, ToolCallDelta>();

    const processFrame = (frame: string): { event?: StreamingEvent; terminal?: boolean } => {
      const data = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) return {};
      if (data === "[DONE]") {
        sawDoneMarker = true;
        return { terminal: true };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch (error) {
        throw new InternalProviderError(
          "Malformed SSE event from inference runtime",
          this.provider,
          asError(error, "Invalid JSON"),
        );
      }
      if (!isRecord(payload) || !Array.isArray(payload.choices)) {
        throw new InternalProviderError(
          "Malformed SSE event from inference runtime",
          this.provider,
        );
      }
      if (typeof payload.id === "string") responseId = payload.id;
      if (typeof payload.model === "string") responseModel = payload.model;
      if (typeof payload.created === "number") createdAt = payload.created * 1000;
      if (payload.usage !== undefined) usage = mapUsage(payload.usage);

      const firstChoice = payload.choices[0];
      if (!isRecord(firstChoice) || !isRecord(firstChoice.delta)) return {};
      const delta = firstChoice.delta;
      const contentDelta: {
        role?: ChatRole;
        content?: string;
        toolCalls?: ToolCallDelta[];
      } = {};
      if (typeof delta.role === "string" && !roleSent) {
        contentDelta.role = "assistant";
        roleSent = true;
      }
      if (typeof delta.content === "string" && delta.content.length > 0) {
        contentDelta.content = delta.content;
        responseContent += delta.content;
      }
      if (Array.isArray(delta.tool_calls)) {
        contentDelta.toolCalls = delta.tool_calls.map((entry) => {
          if (!isRecord(entry)) {
            throw new InternalProviderError("Malformed tool-call delta", this.provider);
          }
          const index = typeof entry.index === "number" ? entry.index : 0;
          const previous = toolCalls.get(index) ?? { index };
          if (typeof entry.id === "string") previous.id = entry.id;
          if (isRecord(entry.function)) {
            previous.function ??= {};
            if (typeof entry.function.name === "string") {
              previous.function.name = (previous.function.name ?? "") + entry.function.name;
            }
            if (typeof entry.function.arguments === "string") {
              previous.function.arguments =
                (previous.function.arguments ?? "") + entry.function.arguments;
            }
          }
          toolCalls.set(index, previous);
          return {
            index,
            ...(typeof entry.id === "string" ? { id: entry.id } : {}),
            type: "function" as const,
            ...(isRecord(entry.function) ? { function: entry.function } : {}),
          };
        });
      }

      if (contentDelta.role || contentDelta.content || contentDelta.toolCalls?.length) {
        return {
          event: {
            type: "content",
            delta: contentDelta,
            requestId: request.requestId,
          },
        };
      }
      if (firstChoice.finish_reason !== null && firstChoice.finish_reason !== undefined) {
        const calls = [...toolCalls.values()].sort((left, right) => left.index - right.index);
        const assistantToolCalls = calls
          .filter(
            (
              call,
            ): call is ToolCallDelta & {
              id: string;
              function: { name: string; arguments: string };
            } =>
              typeof call.id === "string" &&
              typeof call.function?.name === "string" &&
              typeof call.function.arguments === "string",
          )
          .map((call) => ({
            id: call.id,
            type: "function" as const,
            function: { name: call.function.name, arguments: call.function.arguments },
          }));
        return {
          terminal: true,
          event: {
            type: "done",
            requestId: request.requestId,
            response: {
              id: responseId,
              model: responseModel,
              provider: this.provider,
              choices: [
                {
                  index: typeof firstChoice.index === "number" ? firstChoice.index : 0,
                  message: {
                    role: "assistant",
                    content: responseContent,
                    ...(assistantToolCalls.length ? { toolCalls: assistantToolCalls } : {}),
                  },
                  finishReason: mapFinishReason(firstChoice.finish_reason),
                },
              ],
              usage,
              createdAt,
              providerMetadata: { requestId: request.requestId },
            },
          },
        };
      }
      return {};
    };

    try {
      while (!done && !sawDoneMarker) {
        if (request.signal?.aborted) {
          throw new CancelledError(this.provider);
        }
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true }).replace(/\r\n/g, "\n");
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const result = processFrame(frame);
          if (result.event) yield result.event;
          if (result.terminal) {
            done = true;
            break;
          }
        }
      }
      buffer += decoder.decode();
      if (buffer.trim() && !done && !sawDoneMarker) {
        const result = processFrame(buffer);
        if (result.event) yield result.event;
        if (result.terminal) done = true;
      }
      if (!done) {
        throw new InternalProviderError(
          "Inference stream ended before a completion event",
          this.provider,
        );
      }
    } catch (error) {
      await reader.cancel(error).catch(() => undefined);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  private toOpenAIRequest(request: ChatRequest, model: string, stream: boolean): JsonRecord {
    return {
      model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.name ? { name: message.name } : {}),
        ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
        ...(message.toolCalls
          ? {
              tool_calls: message.toolCalls.map((toolCall) => ({
                id: toolCall.id,
                type: toolCall.type,
                function: {
                  name: toolCall.function.name,
                  arguments: toolCall.function.arguments,
                },
              })),
            }
          : {}),
      })),
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.topP !== undefined ? { top_p: request.topP } : {}),
      ...(request.maxTokens !== undefined ? { max_tokens: request.maxTokens } : {}),
      ...(request.stop ? { stop: request.stop } : {}),
      ...(request.tools ? { tools: request.tools } : {}),
      ...(request.toolChoice !== undefined ? { tool_choice: request.toolChoice } : {}),
      ...(request.seed !== undefined ? { seed: request.seed } : {}),
      ...(request.user ? { user: request.user } : {}),
      ...(request.responseFormat?.type === "json_object"
        ? { response_format: { type: "json_object" } }
        : {}),
      ...(request.responseFormat?.type === "json_schema"
        ? {
            response_format: {
              type: "json_schema",
              json_schema: request.responseFormat.jsonSchema,
            },
          }
        : {}),
    };
  }

  private async request(
    path: string,
    init: RequestInit,
    externalSignal?: AbortSignal,
    timeoutMs = this.timeoutMs,
  ): Promise<Response> {
    const controller = new AbortController();
    const requestSignal = externalSignal
      ? AbortSignal.any([controller.signal, externalSignal])
      : controller.signal;
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error("Inference request timed out"));
    }, timeoutMs);
    const abortExternal = () => controller.abort(externalSignal?.reason);
    if (externalSignal?.aborted) abortExternal();
    else externalSignal?.addEventListener("abort", abortExternal, { once: true });

    try {
      return await this.fetcher(`${this.baseUrl}${path}`, {
        ...init,
        signal: requestSignal,
        headers: {
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
    } catch (error) {
      if (timedOut)
        throw new ProviderTimeoutError(timeoutMs, this.provider, asError(error, "Timeout"));
      if (externalSignal?.aborted)
        throw new CancelledError(this.provider, asError(error, "Cancelled"));
      const cause = asError(error, "Inference runtime unavailable");
      if (cause instanceof TypeError || cause.message.includes("fetch")) {
        throw new ProviderUnavailableError(this.provider, cause);
      }
      throw createProviderError(cause, this.provider, { timeoutMs });
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortExternal);
    }
  }

  private async readJson(response: Response, operation: string): Promise<unknown> {
    try {
      return await response.json();
    } catch (error) {
      throw new InternalProviderError(
        `Malformed ${operation} response from inference runtime`,
        this.provider,
        asError(error, "Invalid JSON"),
      );
    }
  }
}
