// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import {
  TranslationWrapper,
  useOptionalTranslation,
  useTranslation,
} from "@/hocs/TranslationWrapper";
import { SanctuaryLocaleProvider, useSanctuaryLocale } from "@/lib/sanctuary-locale";

const LEGACY_STORAGE_KEY = "allah-sanctuary-lang-v1";

let container: HTMLDivElement;
let root: Root;

function clearLocaleState() {
  localStorage.clear();
  document.cookie = `${themeConfig.localeCookieName}=; path=/; max-age=0; SameSite=Lax`;
  document.documentElement.lang = "";
  document.documentElement.dir = "";
  window.history.replaceState({}, "", "/");
}

function DualConsumerProbe() {
  const translation = useTranslation();
  const sanctuary = useSanctuaryLocale();
  const optional = useOptionalTranslation();

  return (
    <div>
      <span data-testid="has-outer">{optional ? "yes" : "no"}</span>
      <span data-testid="t-locale">{translation.locale}</span>
      <span data-testid="t-dir">{translation.direction}</span>
      <span data-testid="s-locale">{sanctuary.locale}</span>
      <span data-testid="s-dir">{sanctuary.dir}</span>
      <span data-testid="dict-title">{translation.dictionary.sanctuary.title}</span>
      <button type="button" data-testid="t-set-id" onClick={() => translation.setLocale("id")}>
        t-id
      </button>
      <button type="button" data-testid="t-set-ar" onClick={() => translation.setLocale("ar")}>
        t-ar
      </button>
      <button
        type="button"
        data-testid="t-set-fr"
        onClick={() => translation.setLocale("fr" as Locale)}
      >
        t-fr
      </button>
      <button type="button" data-testid="s-set-en" onClick={() => sanctuary.setLocale("en")}>
        s-en
      </button>
      <button type="button" data-testid="s-set-ar" onClick={() => sanctuary.setLocale("ar")}>
        s-ar
      </button>
      <button type="button" data-testid="s-toggle" onClick={() => sanctuary.toggleLocale()}>
        s-toggle
      </button>
    </div>
  );
}

function text(testId: string): string {
  const el = container.querySelector(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`Missing element [data-testid="${testId}"]`);
  return el.textContent ?? "";
}

async function click(testId: string) {
  const el = container.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`Missing button [data-testid="${testId}"]`);
  await act(async () => {
    el.click();
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  clearLocaleState();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  clearLocaleState();
  vi.unstubAllGlobals();
});

describe("TranslationWrapper & SanctuaryLocaleProvider single locale ownership", () => {
  it("keeps useTranslation() and useSanctuaryLocale() synchronized across en, id, and ar", async () => {
    await act(async () => {
      root.render(
        <TranslationWrapper>
          <SanctuaryLocaleProvider>
            <DualConsumerProbe />
          </SanctuaryLocaleProvider>
        </TranslationWrapper>,
      );
    });

    expect(text("has-outer")).toBe("yes");
    expect(text("t-locale")).toBe("en");
    expect(text("s-locale")).toBe("en");
    expect(text("t-dir")).toBe("ltr");
    expect(text("s-dir")).toBe("ltr");

    await click("t-set-id");
    expect(text("t-locale")).toBe("id");
    expect(text("s-locale")).toBe("id");
    expect(text("t-dir")).toBe("ltr");
    expect(text("s-dir")).toBe("ltr");
    expect(document.cookie).toContain(`${themeConfig.localeCookieName}=id`);
    expect(document.documentElement.lang).toBe("id");
    expect(document.documentElement.dir).toBe("ltr");

    await click("s-set-ar");
    expect(text("t-locale")).toBe("ar");
    expect(text("s-locale")).toBe("ar");
    expect(text("t-dir")).toBe("rtl");
    expect(text("s-dir")).toBe("rtl");
    expect(document.cookie).toContain(`${themeConfig.localeCookieName}=ar`);
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");

    // toggleLocale cycles en -> id -> ar -> en
    await click("s-toggle");
    expect(text("t-locale")).toBe("en");
    expect(text("s-locale")).toBe("en");
    expect(text("s-dir")).toBe("ltr");
    expect(document.cookie).toContain(`${themeConfig.localeCookieName}=en`);

    await click("s-toggle");
    expect(text("t-locale")).toBe("id");
    expect(text("s-locale")).toBe("id");

    await click("s-toggle");
    expect(text("t-locale")).toBe("ar");
    expect(text("s-locale")).toBe("ar");
    expect(text("s-dir")).toBe("rtl");
  });

  it("rejects unsupported locales like 'fr' and falls back deterministically to 'en'", async () => {
    await act(async () => {
      root.render(
        <SanctuaryLocaleProvider initialLocale={"fr" as Locale}>
          <DualConsumerProbe />
        </SanctuaryLocaleProvider>,
      );
    });

    expect(text("t-locale")).toBe("en");
    expect(text("s-locale")).toBe("en");
    expect(text("t-dir")).toBe("ltr");
    expect(text("s-dir")).toBe("ltr");

    await click("t-set-ar");
    expect(text("t-locale")).toBe("ar");
    expect(text("s-locale")).toBe("ar");

    await click("t-set-fr");
    expect(text("t-locale")).toBe("en");
    expect(text("s-locale")).toBe("en");
    expect(text("s-dir")).toBe("ltr");
    expect(document.cookie).toContain(`${themeConfig.localeCookieName}=en`);
  });

  it("reads mw-locale cookie first and migrates legacy localStorage key once", async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, "ar");

    await act(async () => {
      root.render(
        <TranslationWrapper>
          <SanctuaryLocaleProvider>
            <DualConsumerProbe />
          </SanctuaryLocaleProvider>
        </TranslationWrapper>,
      );
    });

    expect(text("t-locale")).toBe("ar");
    expect(text("s-locale")).toBe("ar");
    expect(text("s-dir")).toBe("rtl");
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(document.cookie).toContain(`${themeConfig.localeCookieName}=ar`);

    // Cookie takes precedence over any legacy storage entry
    act(() => {
      root.unmount();
    });
    root = createRoot(container);
    document.cookie = `${themeConfig.localeCookieName}=id; path=/; max-age=3600; SameSite=Lax`;
    localStorage.setItem(LEGACY_STORAGE_KEY, "en");

    await act(async () => {
      root.render(
        <TranslationWrapper>
          <SanctuaryLocaleProvider>
            <DualConsumerProbe />
          </SanctuaryLocaleProvider>
        </TranslationWrapper>,
      );
    });

    expect(text("t-locale")).toBe("id");
    expect(text("s-locale")).toBe("id");
  });

  it("bridges matching initialLocale on [lang] routes without creating a second state or flashing 'en'", async () => {
    const snapshots: string[] = [];

    function InitialRenderProbe() {
      const { locale } = useSanctuaryLocale();
      snapshots.push(locale);
      return <DualConsumerProbe />;
    }

    await act(async () => {
      root.render(
        <TranslationWrapper lang="ar">
          <SanctuaryLocaleProvider initialLocale="ar">
            <InitialRenderProbe />
          </SanctuaryLocaleProvider>
        </TranslationWrapper>,
      );
    });

    expect(snapshots[0]).toBe("ar");
    expect(snapshots).not.toContain("en");
    expect(text("t-locale")).toBe("ar");
    expect(text("s-locale")).toBe("ar");

    await click("s-set-en");
    expect(text("t-locale")).toBe("en");
    expect(text("s-locale")).toBe("en");
  });
});
