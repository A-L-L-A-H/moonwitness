import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

function makeRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, { headers });
}

describe("host-based root routing proxy", () => {
  it("matches only the root path in proxy config", () => {
    expect(config.matcher).toEqual(["/"]);
  });

  it("rewrites / to /moonwitness for moonwitness.biz.id and www.moonwitness.biz.id", () => {
    for (const host of ["moonwitness.biz.id", "www.moonwitness.biz.id"]) {
      const response = proxy(makeRequest(`https://${host}/`, { host }));
      const rewriteHeader = response.headers.get("x-middleware-rewrite");
      expect(rewriteHeader).not.toBeNull();
      expect(new URL(rewriteHeader!).pathname).toBe("/moonwitness");
      expect(response.headers.get("x-middleware-next")).toBeNull();
    }
  });

  it("allows explicit sanctuary opt-in on moonwitness.biz.id via ?sanctuary=1", () => {
    const response = proxy(
      makeRequest("https://moonwitness.biz.id/?sanctuary=1", {
        host: "moonwitness.biz.id",
      }),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("normalizes uppercase, port, and trailing dot on host headers", () => {
    const mwUpper = proxy(
      makeRequest("http://127.0.0.1:3000/", {
        host: "MOONWITNESS.BIZ.ID:3000",
      }),
    );
    expect(new URL(mwUpper.headers.get("x-middleware-rewrite")!).pathname).toBe("/moonwitness");

    const mwWwwDot = proxy(
      makeRequest("http://127.0.0.1:3000/", {
        host: "WWW.MOONWITNESS.BIZ.ID.:443",
      }),
    );
    expect(new URL(mwWwwDot.headers.get("x-middleware-rewrite")!).pathname).toBe("/moonwitness");

    const allahUpper = proxy(
      makeRequest("http://127.0.0.1:3000/", {
        host: "A-L-L-A-H.COM.:443",
      }),
    );
    expect(allahUpper.headers.get("x-middleware-next")).toBe("1");
    expect(allahUpper.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("prioritizes the first non-empty comma-separated value in x-forwarded-host", () => {
    const forwardedFirst = proxy(
      makeRequest("http://127.0.0.1:3000/", {
        "x-forwarded-host": "moonwitness.biz.id, 10.0.0.1",
        host: "127.0.0.1:3000",
      }),
    );
    expect(new URL(forwardedFirst.headers.get("x-middleware-rewrite")!).pathname).toBe(
      "/moonwitness",
    );

    const forwardedSanctuaryFirst = proxy(
      makeRequest("http://127.0.0.1:3000/", {
        "x-forwarded-host": "a-l-l-a-h.com, moonwitness.biz.id",
        host: "moonwitness.biz.id",
      }),
    );
    expect(forwardedSanctuaryFirst.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedSanctuaryFirst.headers.get("x-middleware-rewrite")).toBeNull();

    const emptyForwardedFallsBackToHost = proxy(
      makeRequest("http://127.0.0.1:3000/", {
        "x-forwarded-host": " , ",
        host: "moonwitness.biz.id",
      }),
    );
    expect(
      new URL(emptyForwardedFallsBackToHost.headers.get("x-middleware-rewrite")!).pathname,
    ).toBe("/moonwitness");
  });

  it("preserves query string parameters when rewriting to /moonwitness", () => {
    const response = proxy(
      makeRequest("https://moonwitness.biz.id/?tab=ops&ref=1", {
        host: "moonwitness.biz.id",
      }),
    );
    const rewriteHeader = response.headers.get("x-middleware-rewrite");
    expect(rewriteHeader).not.toBeNull();
    const targetUrl = new URL(rewriteHeader!);
    expect(targetUrl.pathname).toBe("/moonwitness");
    expect(targetUrl.search).toBe("?tab=ops&ref=1");
  });

  it("passes through / for sanctuary, loopback, IPv6, subdomain, and unknown hosts", () => {
    const passthroughHosts = [
      "a-l-l-a-h.com",
      "www.a-l-l-a-h.com",
      "localhost",
      "localhost:3000",
      "127.0.0.1",
      "127.0.0.1:3000",
      "[::1]:3000",
      "[::1]",
      "api.moonwitness.biz.id",
      "unknown.example.com",
    ];

    for (const host of passthroughHosts) {
      const response = proxy(makeRequest("http://localhost:3000/", { host }));
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    }

    const fallbackNextUrl = proxy(makeRequest("https://moonwitness.biz.id/"));
    expect(new URL(fallbackNextUrl.headers.get("x-middleware-rewrite")!).pathname).toBe(
      "/moonwitness",
    );
  });

  it("passes through non-root paths even when host is moonwitness.biz.id", () => {
    const nonRootPaths = [
      "/dock",
      "/api/health",
      "/_next/static/chunk.js",
      "/auth/callback",
      "/moonwitness",
      "/scriptures",
    ];

    for (const path of nonRootPaths) {
      const response = proxy(
        makeRequest(`https://moonwitness.biz.id${path}`, {
          host: "moonwitness.biz.id",
        }),
      );
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });
});
