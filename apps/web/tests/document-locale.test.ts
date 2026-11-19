import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";
import { resolveRequestLocale } from "@/utils/i18n";

const nextHeadersState = vi.hoisted(() => ({
  headers: new Headers(),
  cookies: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  headers: async () => nextHeadersState.headers,
  cookies: async () => ({
    get: (name: string) => {
      const value = nextHeadersState.cookies.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
  }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "mock-font" }),
}));

vi.mock("@moonwitness/ui", () => ({
  SkipLink: () => React.createElement("a", { href: "#main" }, "Skip"),
  SkinProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

describe("resolveRequestLocale & SSR document locale", () => {
  beforeEach(() => {
    nextHeadersState.headers = new Headers();
    nextHeadersState.cookies = new Map();
  });

  it("enforces precedence: /[lang] path > mw-locale cookie > Accept-Language > en", () => {
    expect(
      resolveRequestLocale({
        pathname: "/ar/operations",
        cookieLocale: "id",
        acceptLanguage: "en-US,en;q=0.9",
      }),
    ).toEqual({ lang: "ar", dir: "rtl" });

    expect(
      resolveRequestLocale({
        pathname: "/operations",
        cookieLocale: "id",
        acceptLanguage: "ar,en;q=0.8",
      }),
    ).toEqual({ lang: "id", dir: "ltr" });

    expect(
      resolveRequestLocale({
        pathname: "/",
        cookieLocale: "fr",
        acceptLanguage: "fr-FR,fr;q=0.9,ar-EG;q=0.8,en;q=0.5",
      }),
    ).toEqual({ lang: "ar", dir: "rtl" });

    expect(
      resolveRequestLocale({
        pathname: "/",
        cookieLocale: null,
        acceptLanguage: "en;q=0.4, id-ID;q=0.9",
      }),
    ).toEqual({ lang: "id", dir: "ltr" });

    // Legacy ISO code 'in' maps to 'id'
    expect(
      resolveRequestLocale({
        pathname: "/",
        cookieLocale: null,
        acceptLanguage: "in-ID,en;q=0.7",
      }),
    ).toEqual({ lang: "id", dir: "ltr" });

    expect(
      resolveRequestLocale({
        pathname: "/",
        cookieLocale: null,
        acceptLanguage: "fr,de;q=0.9",
      }),
    ).toEqual({ lang: "en", dir: "ltr" });
  });

  it("renders SSR <html lang and dir> from RootLayout before client hydration", async () => {
    const { default: RootLayout } = await import("@/app/layout");

    nextHeadersState.headers = new Headers({
      "x-mw-pathname": "/ar/operations",
      "accept-language": "en-US",
    });
    const arHtml = renderToStaticMarkup(await RootLayout({ children: React.createElement("div") }));
    expect(arHtml).toContain('<html lang="ar" dir="rtl"');

    nextHeadersState.headers = new Headers({
      "x-mw-pathname": "/",
      "accept-language": "ar",
    });
    nextHeadersState.cookies.set("mw-locale", "id");
    const idHtml = renderToStaticMarkup(await RootLayout({ children: React.createElement("div") }));
    expect(idHtml).toContain('<html lang="id" dir="ltr"');

    nextHeadersState.headers = new Headers({
      "x-mw-pathname": "/",
      "accept-language": "fr-FR,ar;q=0.8",
    });
    nextHeadersState.cookies.clear();
    const acceptArHtml = renderToStaticMarkup(
      await RootLayout({ children: React.createElement("div") }),
    );
    expect(acceptArHtml).toContain('<html lang="ar" dir="rtl"');
  });

  it("preserves root host routing and forwards x-mw-pathname in proxy()", () => {
    const allahRes = proxy(
      new NextRequest("https://a-l-l-a-h.com/", { headers: { host: "a-l-l-a-h.com" } }),
    );
    expect(allahRes.headers.get("x-middleware-next")).toBe("1");
    expect(allahRes.headers.get("x-middleware-rewrite")).toBeNull();
    expect(allahRes.headers.get("x-middleware-request-x-mw-pathname")).toBe("/");

    const mwRes = proxy(
      new NextRequest("https://moonwitness.biz.id/", { headers: { host: "moonwitness.biz.id" } }),
    );
    expect(new URL(mwRes.headers.get("x-middleware-rewrite")!).pathname).toBe("/moonwitness");
    expect(mwRes.headers.get("x-middleware-request-x-mw-pathname")).toBe("/");

    const sanctuaryOptInRes = proxy(
      new NextRequest("https://moonwitness.biz.id/?sanctuary=1", {
        headers: { host: "moonwitness.biz.id" },
      }),
    );
    expect(sanctuaryOptInRes.headers.get("x-middleware-next")).toBe("1");
    expect(sanctuaryOptInRes.headers.get("x-middleware-rewrite")).toBeNull();
    expect(sanctuaryOptInRes.headers.get("x-middleware-request-x-mw-pathname")).toBe("/");
  });
});
