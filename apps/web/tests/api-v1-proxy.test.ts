import { afterEach, describe, expect, it, vi } from "vitest";
import type * as CloudflareRuntimeModule from "@/lib/cloudflare-runtime";
import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from "../src/app/api/v1/[...path]/route";

const mockGetCloudflareWorkerEnv =
  vi.fn<() => Promise<CloudflareRuntimeModule.WebWorkerEnv | null>>();

vi.mock("@/lib/cloudflare-runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof CloudflareRuntimeModule>();
  return {
    ...actual,
    getCloudflareWorkerEnv: () => mockGetCloudflareWorkerEnv(),
  };
});

describe("/api/v1/[...path] reverse proxy route handler", () => {
  const originalApiInternalUrl = process.env.API_INTERNAL_URL;

  afterEach(() => {
    vi.unstubAllGlobals();
    mockGetCloudflareWorkerEnv.mockReset();
    if (originalApiInternalUrl === undefined) {
      delete process.env.API_INTERNAL_URL;
    } else {
      process.env.API_INTERNAL_URL = originalApiInternalUrl;
    }
  });

  it("resolves Cloudflare runtime bindings to null safely outside Workers runtime", async () => {
    const actualRuntime = await vi.importActual<typeof CloudflareRuntimeModule>(
      "@/lib/cloudflare-runtime",
    );
    const resolvedEnv = await actualRuntime.getCloudflareWorkerEnv();
    expect(resolvedEnv).toBeNull();
  });

  it("dispatches via API_SERVICE binding, forwards path/query/body/auth headers, strips host/cf-*/hop-by-hop, and preserves multi-value set-cookie", async () => {
    let capturedUpstreamRequest: Request | null = null;
    let capturedBodyText = "";

    const serviceFetchMock = vi.fn(async (upstreamInput: Request | string) => {
      capturedUpstreamRequest =
        upstreamInput instanceof Request ? upstreamInput : new Request(upstreamInput);
      capturedBodyText = await capturedUpstreamRequest.text();

      const upstreamHeaders = new Headers({
        "content-type": "application/json",
        "x-upstream-trace": "mw-api-1",
        connection: "keep-alive",
        "content-length": "25",
      });
      upstreamHeaders.append("set-cookie", "mw_session=tok123; Path=/; HttpOnly; Secure");
      upstreamHeaders.append("set-cookie", "mw_csrf=csrf456; Path=/; SameSite=Lax");

      return new Response(JSON.stringify({ authenticated: true }), {
        status: 200,
        headers: upstreamHeaders,
      });
    });

    mockGetCloudflareWorkerEnv.mockResolvedValue({
      API_SERVICE: { fetch: serviceFetchMock },
      API_INTERNAL_URL: "https://api.moonwitness.biz.id",
    });

    const jsonPayload = JSON.stringify({ email: "operator@moonwitness.biz.id", password: "pw" });
    const incomingRequest = new Request(
      "https://moonwitness.biz.id/api/v1/auth/login?next=%2Fmission-control&tab=ops",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": String(jsonPayload.length),
          host: "moonwitness.biz.id",
          authorization: "Bearer jwt-token-1",
          cookie: "mw_locale=en",
          "cf-ray": "999999-SIN",
          "cf-connecting-ip": "203.0.113.10",
          "cf-visitor": '{"scheme":"https"}',
          connection: "keep-alive",
          "keep-alive": "timeout=5",
          "proxy-authenticate": "Basic",
          "proxy-authorization": "Basic abc",
          te: "trailers",
          trailer: "Expires",
          "transfer-encoding": "chunked",
          upgrade: "websocket",
        },
        body: jsonPayload,
      },
    );

    const proxyResponse = await POST(incomingRequest);

    expect(serviceFetchMock).toHaveBeenCalledTimes(1);
    expect(capturedUpstreamRequest).not.toBeNull();
    expect(capturedUpstreamRequest!.url).toBe(
      "https://api.internal/api/v1/auth/login?next=%2Fmission-control&tab=ops",
    );
    expect(capturedUpstreamRequest!.method).toBe("POST");
    expect(capturedBodyText).toBe(jsonPayload);

    const forwardedHeaders = capturedUpstreamRequest!.headers;
    expect(forwardedHeaders.get("authorization")).toBe("Bearer jwt-token-1");
    expect(forwardedHeaders.get("cookie")).toBe("mw_locale=en");
    expect(forwardedHeaders.get("content-type")).toBe("application/json");
    expect(forwardedHeaders.get("host")).toBeNull();
    expect(forwardedHeaders.get("content-length")).toBeNull();
    expect(forwardedHeaders.get("cf-ray")).toBeNull();
    expect(forwardedHeaders.get("cf-connecting-ip")).toBeNull();
    expect(forwardedHeaders.get("cf-visitor")).toBeNull();
    expect(forwardedHeaders.get("connection")).toBeNull();
    expect(forwardedHeaders.get("keep-alive")).toBeNull();
    expect(forwardedHeaders.get("proxy-authenticate")).toBeNull();
    expect(forwardedHeaders.get("proxy-authorization")).toBeNull();
    expect(forwardedHeaders.get("te")).toBeNull();
    expect(forwardedHeaders.get("trailer")).toBeNull();
    expect(forwardedHeaders.get("transfer-encoding")).toBeNull();
    expect(forwardedHeaders.get("upgrade")).toBeNull();

    expect(proxyResponse.status).toBe(200);
    expect(proxyResponse.headers.get("x-upstream-trace")).toBe("mw-api-1");
    expect(proxyResponse.headers.get("connection")).toBeNull();
    expect(proxyResponse.headers.get("content-length")).toBeNull();
    expect(proxyResponse.headers.getSetCookie()).toEqual([
      "mw_session=tok123; Path=/; HttpOnly; Secure",
      "mw_csrf=csrf456; Path=/; SameSite=Lax",
    ]);
    await expect(proxyResponse.json()).resolves.toEqual({ authenticated: true });
  });

  it("falls back to process.env.API_INTERNAL_URL over HTTP when API_SERVICE is absent and returns 502 on network failure", async () => {
    mockGetCloudflareWorkerEnv.mockResolvedValue(null);
    process.env.API_INTERNAL_URL = "http://127.0.0.1:4321/";

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ workflows: [], alerts: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockRejectedValueOnce(new Error("connect ECONNREFUSED 127.0.0.1:4321"));

    vi.stubGlobal("fetch", fetchMock);

    const successRequest = new Request(
      "https://moonwitness.biz.id/api/v1/command-center/state?limit=10",
      {
        method: "GET",
        headers: {
          host: "moonwitness.biz.id",
          "cf-ray": "12345-CGK",
          cookie: "mw_session=abc",
        },
      },
    );

    const okResponse = await GET(successRequest);
    expect(okResponse.status).toBe(200);
    await expect(okResponse.json()).resolves.toEqual({ workflows: [], alerts: [] });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] ?? [];
    expect(calledUrl).toBe("http://127.0.0.1:4321/api/v1/command-center/state?limit=10");
    expect(calledInit?.method).toBe("GET");
    expect(calledInit?.body).toBeUndefined();
    const sentHeaders = new Headers(calledInit?.headers);
    expect(sentHeaders.get("cookie")).toBe("mw_session=abc");
    expect(sentHeaders.get("host")).toBeNull();
    expect(sentHeaders.get("cf-ray")).toBeNull();

    const failedRequest = new Request("https://moonwitness.biz.id/api/v1/healthz", {
      method: "GET",
    });
    const errorResponse = await GET(failedRequest);
    expect(errorResponse.status).toBe(502);
    expect(errorResponse.headers.get("content-type")).toBe("application/json");
    await expect(errorResponse.json()).resolves.toEqual({ error: "Upstream API unreachable" });
  });

  it("handles PUT, PATCH, DELETE, OPTIONS, and HEAD methods including empty 204 responses", async () => {
    const serviceFetchMock = vi.fn(async (upstreamInput: Request | string) => {
      const upstreamRequest =
        upstreamInput instanceof Request ? upstreamInput : new Request(upstreamInput);
      if (upstreamRequest.method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      if (upstreamRequest.method === "HEAD") {
        return new Response(null, { status: 200, headers: { "x-head-ok": "1" } });
      }
      return new Response(
        JSON.stringify({ method: upstreamRequest.method, body: await upstreamRequest.text() }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    mockGetCloudflareWorkerEnv.mockResolvedValue({
      API_SERVICE: { fetch: serviceFetchMock },
    });

    const putResponse = await PUT(
      new Request("https://moonwitness.biz.id/api/v1/radius/users/u1", {
        method: "PUT",
        body: JSON.stringify({ active: true }),
      }),
    );
    await expect(putResponse.json()).resolves.toEqual({
      method: "PUT",
      body: JSON.stringify({ active: true }),
    });

    const patchResponse = await PATCH(
      new Request("https://moonwitness.biz.id/api/v1/command-center/workflows/wf-1/toggle", {
        method: "PATCH",
      }),
    );
    await expect(patchResponse.json()).resolves.toEqual({ method: "PATCH", body: "" });

    const deleteResponse = await DELETE(
      new Request("https://moonwitness.biz.id/api/v1/command-center/alerts/a-1", {
        method: "DELETE",
      }),
    );
    expect(deleteResponse.status).toBe(204);

    const optionsResponse = await OPTIONS(
      new Request("https://moonwitness.biz.id/api/v1/auth/me", { method: "OPTIONS" }),
    );
    expect(optionsResponse.status).toBe(200);

    const headResponse = await HEAD(
      new Request("https://moonwitness.biz.id/api/v1/healthz", { method: "HEAD" }),
    );
    expect(headResponse.status).toBe(200);
    expect(headResponse.headers.get("x-head-ok")).toBe("1");
    expect(headResponse.body).toBeNull();
  });
});
