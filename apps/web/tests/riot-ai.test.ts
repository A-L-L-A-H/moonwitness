import { afterEach, describe, expect, it, vi } from "vitest";
import { streamRiotAiChat } from "../src/lib/api/riot-ai";

const response = {
  id: "reply-1",
  model: "llama3.2",
  provider: "ollama",
  choices: [
    {
      index: 0,
      message: { role: "assistant" as const, content: "Hello there." },
      finishReason: "stop",
    },
  ],
  usage: { promptTokens: 2, completionTokens: 3, totalTokens: 5 },
  createdAt: 1_700_000_000_000,
};

function sseResponse(frames: string[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const frame of frames) controller.enqueue(new TextEncoder().encode(frame));
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}

describe("RIOT Intelligence browser client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends an authenticated streaming request and returns the final response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        sseResponse([
          'data: {"type":"content","requestId":"req-1","delta":{"content":"Hello "}}\n\n',
          'data: {"type":"content","requestId":"req-1","delta":{"content":"there."}}\n\n',
          `data: ${JSON.stringify({ type: "done", requestId: "req-1", response })}\n\n`,
          "data: [DONE]\n\n",
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);
    const content: string[] = [];

    const result = await streamRiotAiChat({
      model: "llama3.2",
      messages: [{ role: "user", content: "Hi" }],
      signal: new AbortController().signal,
      onContent: (chunk) => content.push(chunk),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/riot-ai/chat",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream",
        },
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toMatchObject({
      model: "llama3.2",
      messages: [{ role: "user", content: "Hi" }],
      stream: true,
    });
    expect(content.join("")).toBe("Hello there.");
    expect(result).toEqual(response);
  });

  it("rejects API failures without reading a stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ error: "local inference runtime is not configured" }, { status: 503 }),
        ),
    );

    await expect(
      streamRiotAiChat({
        model: "llama3.2",
        messages: [{ role: "user", content: "Hi" }],
        signal: new AbortController().signal,
        onContent: vi.fn(),
      }),
    ).rejects.toThrow("local inference runtime is not configured");
  });

  it("rejects stream errors and incomplete streams", async () => {
    const request = {
      model: "llama3.2",
      messages: [{ role: "user" as const, content: "Hi" }],
      signal: new AbortController().signal,
      onContent: vi.fn(),
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          sseResponse([
            'data: {"type":"error","requestId":"req-1","error":{"code":"TIMEOUT","message":"runtime timed out","provider":"ollama","retryable":true}}\n\n',
          ]),
        ),
    );
    await expect(streamRiotAiChat(request)).rejects.toThrow("runtime timed out");

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(sseResponse(["data: [DONE]\n\n"])),
    );
    await expect(streamRiotAiChat(request)).rejects.toThrow(
      "The inference stream ended without a completed response.",
    );
  });

  it("rejects malformed stream events", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(sseResponse(["data: {not-json}\n\n"])),
    );

    await expect(
      streamRiotAiChat({
        model: "llama3.2",
        messages: [{ role: "user", content: "Hi" }],
        signal: new AbortController().signal,
        onContent: vi.fn(),
      }),
    ).rejects.toThrow("The inference runtime returned an invalid stream event.");
  });

  it("rejects invalid final responses and oversized histories", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          sseResponse(['data: {"type":"done","requestId":"req-1","response":{"id":"broken"}}\n\n']),
        ),
    );
    await expect(
      streamRiotAiChat({
        model: "llama3.2",
        messages: [{ role: "user", content: "Hi" }],
        signal: new AbortController().signal,
        onContent: vi.fn(),
      }),
    ).rejects.toThrow("The inference runtime returned an invalid final response.");

    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      streamRiotAiChat({
        model: "llama3.2",
        messages: Array.from({ length: 65 }, () => ({ role: "user" as const, content: "Hi" })),
        signal: new AbortController().signal,
        onContent: vi.fn(),
      }),
    ).rejects.toThrow("Inference request exceeds the supported conversation limits.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
