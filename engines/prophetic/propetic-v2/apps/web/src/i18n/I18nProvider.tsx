import * as React from "react";
import { createContext, useContext } from "react";
import type { Lang, NestedDict } from "./translations";
import { dictionaries } from "./translations";

type I18nContextValue = {
  lang: Lang;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = React.useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("lang");
      return stored === "id" ? "id" : "en";
    } catch {
      return "en";
    }
  });

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[lang] as NestedDict;
      const parts = key.split(".");
      let value: string | NestedDict = dict;
      for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
          value = value[part];
        } else {
          return key;
        }
      }
      if (typeof value !== "string") return key;
      if (!params) return value;
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
