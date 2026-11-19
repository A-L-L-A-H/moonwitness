"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { i18n, type Direction, type Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import { getDictionarySync, type Dictionary } from "@/utils/getDictionary";
import { getLocaleFromPath, isValidLocale } from "@/utils/i18n";

export interface TranslationContextValue {
  readonly locale: Locale;
  readonly direction: Direction;
  readonly dictionary: Dictionary;
  readonly setLocale: (next: Locale) => void;
}

const DEFAULT_DICT = getDictionarySync(i18n.defaultLocale);

const TranslationContext = createContext<TranslationContextValue>({
  locale: i18n.defaultLocale,
  direction: i18n.langDirection[i18n.defaultLocale],
  dictionary: DEFAULT_DICT,
  setLocale: () => {},
});

const LOCALE_STORAGE_KEY = "allah-sanctuary-lang-v1";

function applyDocumentLocale(next: Locale): void {
  if (typeof window === "undefined") return;
  document.documentElement.lang = next;
  document.documentElement.dir = i18n.langDirection[next];
}

function persistLocaleClient(next: Locale, persistUnprefixed = false): void {
  if (typeof window === "undefined") return;
  if (persistUnprefixed && (next === "en" || next === "id")) {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Ignore localStorage failure
    }
  }
  try {
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `${themeConfig.localeCookieName}=${encodeURIComponent(next)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Ignore cookie failure
  }
  applyDocumentLocale(next);
}

export function TranslationWrapper({
  lang,
  dictionary: initialDictionary,
  children,
}: {
  lang?: string;
  dictionary?: Dictionary;
  children: ReactNode;
}) {
  const initialLocale: Locale = isValidLocale(lang) ? lang : i18n.defaultLocale;
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (isValidLocale(lang)) {
      setLocaleState(lang);
      persistLocaleClient(lang, false);
      return;
    }
    const pathLocale =
      typeof window !== "undefined" ? getLocaleFromPath(window.location.pathname) : null;
    if (pathLocale) {
      setLocaleState(pathLocale);
      applyDocumentLocale(pathLocale);
      return;
    }
    let resolved: Locale = i18n.defaultLocale;
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "id" || saved === "en") {
        resolved = saved;
      } else if (saved === "ar") {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");
      }
    } catch {
      // Ignore storage access failure
    }
    setLocaleState(resolved);
    applyDocumentLocale(resolved);
  }, [lang]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      persistLocaleClient(next, !isValidLocale(lang) && next !== "ar");
    },
    [lang],
  );

  const dictionary = useMemo(() => {
    if (initialDictionary && locale === initialLocale) {
      return initialDictionary;
    }
    return getDictionarySync(locale);
  }, [initialDictionary, initialLocale, locale]);

  const direction = i18n.langDirection[locale];

  return (
    <TranslationContext.Provider value={{ locale, direction, dictionary, setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  return useContext(TranslationContext);
}
