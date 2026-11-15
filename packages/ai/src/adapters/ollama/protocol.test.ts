import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CancelledError,
  InternalProviderError,
  ModelNotFoundError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from "../../errors";
import type { ChatRequest } from "../../types";
import { OllamaAdapter } from "./index";

const request: ChatRequest = {
  requestId: "request-1",
  model: "llama3.2",
  messages: [{ role: "user", content: "Hello" }],
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createAdapter(fetcher: typeof fetch, timeoutMs = 100): OllamaAdapter {
  return new OllamaAdapter({
    baseUrl: "http://localhost:11434",
    timeoutMs,
    fetch: fetcher,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OllamaAdapter", () => {
  it("lists compatible models and maps identity", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: [{ id: "llama3.2", name: "Llama 3.2" }] }));
    const adapter = createAdapter(fetcher);

    await expect(adapter.listModels()).resolves.toMatchObject([
      { id: "llama3.2", name: "Llama 3.2", provider: "ollama" },
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:11434/v1/models",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("reports healthy runtime state and model inventory", async () => {
    const adapter = createAdapter(
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ data: [{ id: "llama3.2" }] })),
    );

    await expect(adapter.checkHealth()).resolves.toMatchObject({
      provider: "ollama",
      status: "healthy",
      models: [{ id: "llama3.2" }],
    });
  });

  it("normalizes chat response, finish reason, and reported usage", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: "chat-1",
        model: "llama3.2",
        created: 1_700_000_000,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello back" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
      }),
    );
    const adapter = createAdapter(fetcher);

    await expect(adapter.chat(request)).resolves.toMatchObject({
      id: "chat-1",
      provider: "ollama",
      choices: [{ message: { role: "assistant", content: "Hello back" }, finishReason: "stop" }],
      usage: { promptTokens: 4, completionTokens: 3, totalTokens: 7 },
    });
    const init = fetcher.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "llama3.2",
      stream: false,
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("does not invent token usage when upstream omits it", async () => {
    const adapter = createAdapter(
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
          id: "chat-1",
          model: "llama3.2",
          created: 1_700_000_000,
          choices: [{ message: { role: "assistant", content: "Hello" }, finish_reason: "stop" }],
        }),
      ),
    );

    await expect(adapter.chat(request)).resolves.toMatchObject({
      usage: { promptTokens: null, completionTokens: null, totalTokens: null },
    });
  });

  it("translates streamed content, tool-call deltas, finish, and usage", async () => {
    const frames = [
      {
        id: "stream-1",
        model: "llama3.2",
        created: 1_700_000_000,
        choices: [
          { index: 0, delta: { role: "assistant", content: "Hello" }, finish_reason: null },
        ],
      },
      {
        id: "stream-1",
        model: "llama3.2",
        created: 1_700_000_000,
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call-1",
                  type: "function",
                  function: { name: "lookup", arguments: '{"key":' },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      },
      {
        id: "stream-1",
        model: "llama3.2",
        choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
        usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
      },
    ];
    const streamBody =
      frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join("") + "data: [DONE]\n\n";
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(streamBody, { headers: { "content-type": "text/event-stream" } }),
      );
    const adapter = createAdapter(fetcher);

    const events = [];
    for await (const event of adapter.chatStream(request)) events.push(event);

    expect(events.map((event) => event.type)).toEqual(["content", "content", "done"]);
    expect(events[0]).toMatchObject({
      type: "content",
      delta: { role: "assistant", content: "Hello" },
      requestId: "request-1",
    });
    expect(events[2]).toMatchObject({
      type: "done",
      response: {
        id: "stream-1",
        choices: [
          {
            finishReason: "tool_calls",
            message: {
              toolCalls: [
                {
                  id: "call-1",
                  function: { name: "lookup", arguments: '{"key":' },
                },
              ],
            },
          },
        ],
        usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
      },
    });
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({
      stream: true,
      stream_options: { include_usage: true },
    });
  });

  it("preserves streamed content through the terminal event", async () => {
    const streamBody = [
      `data: ${JSON.stringify({
        id: "stream-text",
        model: "llama3.2",
        choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null }],
      })}\n\n`,
      `data: ${JSON.stringify({
        id: "stream-text",
        model: "llama3.2",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      })}\n\n`,
      "data: [DONE]\n\n",
    ].join("");
    const adapter = createAdapter(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(streamBody, { headers: { "content-type": "text/event-stream" } }),
        ),
    );

    const events = [];
    for await (const event of adapter.chatStream(request)) events.push(event);

    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      type: "done",
      response: {
        choices: [{ message: { content: "Hello" }, finishReason: "stop" }],
      },
    });
  });

  it("maps HTTP model-not-found responses to typed failures", async () => {
    const adapter = createAdapter(
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ error: "model not found" }, 404)),
    );

    await expect(adapter.chat(request)).rejects.toBeInstanceOf(ModelNotFoundError);
  });

  it("rejects malformed JSON and malformed upstream response shapes", async () => {
    const invalidJson = createAdapter(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("{", { headers: { "content-type": "application/json" } })),
    );
    await expect(invalidJson.chat(request)).rejects.toBeInstanceOf(InternalProviderError);

    const invalidShape = createAdapter(
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ choices: [] })),
    );
    await expect(invalidShape.chat(request)).rejects.toBeInstanceOf(InternalProviderError);

    const invalidModelList = createAdapter(
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ data: [{ name: "missing-id" }] })),
    );
    await expect(invalidModelList.listModels()).rejects.toBeInstanceOf(InternalProviderError);
  });

  it("maps unavailable runtime connection failures", async () => {
    const adapter = createAdapter(
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(adapter.listModels()).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it("aborts a request at its configured timeout", async () => {
    const fetcher = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );
    const adapter = createAdapter(fetcher, 10);

    await expect(adapter.listModels()).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it("propagates caller cancellation as a typed failure", async () => {
    const fetcher = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );
    const adapter = createAdapter(fetcher);
    const controller = new AbortController();
    const operation = adapter.chat({ ...request, signal: controller.signal });
    controller.abort();

    await expect(operation).rejects.toBeInstanceOf(CancelledError);
  });

  it("uses the timeout supplied with each inference request", async () => {
    const fetcher = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );
    const adapter = createAdapter(fetcher, 1_000);

    await expect(adapter.chat({ ...request, timeoutMs: 10 })).rejects.toBeInstanceOf(
      ProviderTimeoutError,
    );
  });

  it("maps provider server failures and preserves context in HTTP errors", async () => {
    const unavailableAdapter = createAdapter(
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ error: "server error" }, 503)),
    );
    await expect(unavailableAdapter.chat(request)).rejects.toBeInstanceOf(ProviderUnavailableError);

    const missingModelAdapter = createAdapter(
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ error: "model not found" }, 404)),
    );
    await expect(missingModelAdapter.listModels()).rejects.toBeInstanceOf(ModelNotFoundError);
  });

  it("cancels the upstream stream when the caller disconnects", async () => {
    let cancelled = false;
    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              id: "stream-cancel",
              model: "llama3.2",
              choices: [{ index: 0, delta: { content: "partial" }, finish_reason: null }],
            })}\n\n`,
          ),
        );
      },
      cancel() {
        cancelled = true;
      },
    });
    const adapter = createAdapter(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(responseStream, { headers: { "content-type": "text/event-stream" } }),
        ),
    );
    const abortController = new AbortController();
    const events = adapter.chatStream({ ...request, signal: abortController.signal });
    const firstEvent = await events.next();
    expect(firstEvent.value).toMatchObject({ type: "content", delta: { content: "partial" } });
    abortController.abort();
    await expect(events.next()).rejects.toBeInstanceOf(CancelledError);

    expect(cancelled).toBe(true);
  });
});
