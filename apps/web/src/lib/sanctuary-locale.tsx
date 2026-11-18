"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type SanctuaryLocale = "en" | "id";

interface SanctuaryLocaleContextValue {
  readonly locale: SanctuaryLocale;
  readonly setLocale: (next: SanctuaryLocale) => void;
  readonly toggleLocale: () => void;
}

const LOCALE_STORAGE_KEY = "allah-sanctuary-lang-v1";

const SanctuaryLocaleContext = createContext<SanctuaryLocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  toggleLocale: () => {},
});

export function SanctuaryLocaleProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<SanctuaryLocale>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "en" || saved === "id") {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // Ignore storage access failures
    }
  }, []);

  const setLocale = useCallback((next: SanctuaryLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "id" : "en");
  }, [locale, setLocale]);

  return (
    <SanctuaryLocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </SanctuaryLocaleContext.Provider>
  );
}

export function useSanctuaryLocale(): SanctuaryLocaleContextValue {
  return useContext(SanctuaryLocaleContext);
}
