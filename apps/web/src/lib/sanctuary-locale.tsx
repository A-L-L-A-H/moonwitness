"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { i18n, type Direction, type Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import { getLocaleFromPath, isValidLocale } from "@/utils/i18n";

export type SanctuaryLocale = Locale;

interface SanctuaryLocaleContextValue {
  readonly locale: SanctuaryLocale;
  readonly dir: Direction;
  readonly setLocale: (next: SanctuaryLocale) => void;
  readonly toggleLocale: () => void;
}

const LOCALE_STORAGE_KEY = "allah-sanctuary-lang-v1";

const SanctuaryLocaleContext = createContext<SanctuaryLocaleContextValue>({
  locale: "en",
  dir: "ltr",
  setLocale: () => { },
  toggleLocale: () => { },
});

export function SanctuaryLocaleProvider({
  initialLocale,
  children,
}: {
  readonly initialLocale?: SanctuaryLocale;
  readonly children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<SanctuaryLocale>(initialLocale ?? "en");

  useEffect(() => {
    if (initialLocale && isValidLocale(initialLocale)) {
      setLocaleState(initialLocale);
      document.documentElement.lang = initialLocale;
      document.documentElement.dir = i18n.langDirection[initialLocale];
      return;
    }
    const pathLocale =
      typeof window !== "undefined" ? getLocaleFromPath(window.location.pathname) : null;
    if (pathLocale) {
      setLocaleState(pathLocale);
      document.documentElement.lang = pathLocale;
      document.documentElement.dir = i18n.langDirection[pathLocale];
      return;
    }
    let resolved: SanctuaryLocale = "en";
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "id" || saved === "en") {
        resolved = saved;
      } else if (saved === "ar") {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");
      }
    } catch {
      // Ignore storage access failures
    }
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
    document.documentElement.dir = "ltr";
  }, [initialLocale]);

  const setLocale = useCallback((next: SanctuaryLocale) => {
    setLocaleState(next);
    try {
      if (next === "en" || next === "id") {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      }
      document.cookie = `${themeConfig.localeCookieName}=${encodeURIComponent(next)}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = i18n.langDirection[next];
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLocale = useCallback(() => {
    const order: readonly SanctuaryLocale[] = ["en", "id", "ar"];
    const next = order[(order.indexOf(locale) + 1) % order.length] ?? "en";
    setLocale(next);
  }, [locale, setLocale]);

  return (
    <SanctuaryLocaleContext.Provider
      value={{ locale, dir: i18n.langDirection[locale], setLocale, toggleLocale }}
    >
      {children}
    </SanctuaryLocaleContext.Provider>
  );
}

export function useSanctuaryLocale(): SanctuaryLocaleContextValue {
  return useContext(SanctuaryLocaleContext);
}
