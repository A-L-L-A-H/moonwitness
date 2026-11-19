import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../next.config";
import {
  DELETE as memoryDELETE,
  GET as memoryGET,
  PATCH as memoryPATCH,
  POST as memoryPOST,
  PUT as memoryPUT,
} from "../src/app/api/memory/[...path]/route";
import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from "../src/app/api/v1/[...path]/route";

describe("/api/v1/[...path] reverse proxy route handler", () => {
  const originalApiInternalUrl = process.env.API_INTERNAL_URL;

  it("keeps Next.js config free of duplicate /api/v1 rewrites in favor of this single BFF handler", () => {
    expect("rewrites" in nextConfig).toBe(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiInternalUrl === undefined) {
      delete process.env.API_INTERNAL_URL;
    } else {
      process.env.API_INTERNAL_URL = originalApiInternalUrl;
    }
  });

  it("dispatches via HTTP fetch to API_INTERNAL_URL, forwards path/query/body/auth headers, strips host/cf-*/hop-by-hop, and preserves multi-value set-cookie", async () => {
    process.env.API_INTERNAL_URL = "http://127.0.0.1:3002";

    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedInit = init;

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

    vi.stubGlobal("fetch", fetchMock);

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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedUrl).toBe(
      "http://127.0.0.1:3002/api/v1/auth/login?next=%2Fmission-control&tab=ops",
    );
    expect(capturedInit?.method).toBe("POST");

    const forwardedHeaders = new Headers(capturedInit?.headers);
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

  it("falls back to process.env.API_INTERNAL_URL over HTTP and returns 502 on network failure", async () => {
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
    process.env.API_INTERNAL_URL = "http://127.0.0.1:3002";

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      if (method === "HEAD") {
        return new Response(null, { status: 200, headers: { "x-head-ok": "1" } });
      }
      const body = init?.body
        ? typeof init.body === "string"
          ? init.body
          : new TextDecoder().decode(init.body as ArrayBuffer)
        : "";
      return new Response(JSON.stringify({ method, body }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

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

  it("propagates and generates x-request-id and W3C traceparent headers end-to-end", async () => {
    let seenHeaders: Headers | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init?: RequestInit) => {
        seenHeaders = new Headers(init?.headers);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const inboundTrace = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    const explicitRes = await GET(
      new Request("https://moonwitness.biz.id/api/v1/healthz", {
        headers: {
          "x-request-id": "web-corr-42",
          traceparent: inboundTrace,
        },
      }),
    );
    expect(seenHeaders!.get("x-request-id")).toBe("web-corr-42");
    expect(seenHeaders!.get("traceparent")).toBe(inboundTrace);
    expect(explicitRes.headers.get("x-request-id")).toBe("web-corr-42");
    expect(explicitRes.headers.get("traceparent")).toBe(inboundTrace);

    const autoRes = await GET(new Request("https://moonwitness.biz.id/api/v1/healthz"));
    expect(autoRes.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(autoRes.headers.get("traceparent")).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("strips spoofable identity headers before forwarding to upstream API", async () => {
    process.env.API_INTERNAL_URL = "http://127.0.0.1:3002";
    let forwardedHeaders: Headers | null = null;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init?: RequestInit) => {
        forwardedHeaders = new Headers(init?.headers);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const res = await GET(
      new Request("https://moonwitness.biz.id/api/v1/auth/me", {
        headers: {
          "x-role": "admin",
          "x-actor-id": "spoofed-actor",
          "x-actor-role": "admin",
          "x-user-role": "admin",
          "x-user-id": "1",
          "x-groups": '["group_admin"]',
          "x-mw-role": "admin",
          "x-mw-actor": "spoof",
        },
      }),
    );

    expect(res.status).toBe(200);
    for (const forbidden of [
      "x-role",
      "x-actor-id",
      "x-actor-role",
      "x-user-role",
      "x-user-id",
      "x-groups",
      "x-mw-role",
      "x-mw-actor",
    ]) {
      expect(forwardedHeaders!.get(forbidden)).toBeNull();
    }
  });

  it("enforces fail-closed editor+ session checks on /api/memory/[...path] mutating methods while preserving GET reads", async () => {
    process.env.API_INTERNAL_URL = "http://127.0.0.1:3002";

    // Unauthenticated mutations fail immediately with 401
    for (const handler of [memoryPOST, memoryPUT, memoryPATCH, memoryDELETE]) {
      const unauthRes = await handler(
        new Request("https://moonwitness.biz.id/api/memory/archives/upload", {
          method: "POST",
        }),
      );
      expect(unauthRes.status).toBe(401);
    }

    // Viewer and unknown roles fail with 403 Forbidden
    for (const role of ["viewer", "unknown-role"]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            new Response(JSON.stringify({ user: { id: "u1", displayName: "User", role } }), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
        ),
      );
      const deniedRes = await memoryPOST(
        new Request("https://moonwitness.biz.id/api/memory/archives/upload", {
          method: "POST",
          headers: { cookie: "mw_session=tok-low" },
        }),
      );
      expect(deniedRes.status).toBe(403);
    }

    // Editor role succeeds and forwards to Memory upstream with spoofed headers stripped
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.endsWith("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({ user: { id: "u2", displayName: "Editor", role: "editor" } }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      const upstreamHeaders = new Headers(init?.headers);
      expect(upstreamHeaders.get("x-role")).toBeNull();
      return new Response(JSON.stringify({ accepted: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const allowedPost = await memoryPOST(
      new Request("https://moonwitness.biz.id/api/memory/archives/upload", {
        method: "POST",
        headers: { cookie: "mw_session=tok-editor", "x-role": "admin" },
        body: JSON.stringify({ name: "archive.zip" }),
      }),
    );
    expect(allowedPost.status).toBe(200);
    await expect(allowedPost.json()).resolves.toEqual({ accepted: true });

    const allowedGet = await memoryGET(
      new Request("https://moonwitness.biz.id/api/memory/system", { method: "GET" }),
    );
    expect(allowedGet.status).toBe(200);
  });
});
