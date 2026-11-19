"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { i18n, type Direction, type Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import { getDictionarySync, type Dictionary } from "@/utils/getDictionary";
import { isValidLocale } from "@/utils/i18n";

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

function persistLocaleClient(next: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch {
    // Ignore localStorage failure
  }
  try {
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `${themeConfig.localeCookieName}=${encodeURIComponent(next)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Ignore cookie failure
  }
  document.documentElement.lang = next;
  document.documentElement.dir = i18n.langDirection[next];
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
      persistLocaleClient(lang);
      return;
    }
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isValidLocale(saved)) {
        setLocaleState(saved);
        persistLocaleClient(saved);
      }
    } catch {
      // Ignore storage access failure
    }
  }, [lang]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocaleClient(next);
  }, []);

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
