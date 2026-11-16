import * as React from "react";
import type { Lang } from "../i18n";

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "EN" },
  { code: "id", label: "ID" },
];

export function LanguageSwitcher() {
  const [lang, setLang] = React.useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("lang");
      return stored === "id" ? "id" : "en";
    } catch {
      return "en";
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);

  const next = LANGS.find((l) => l.code !== lang);

  return (
    <button
      type="button"
      onClick={() => next && setLang(next.code)}
      className="inline-flex h-8 min-w-[2.25rem] items-center justify-center rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label={`Switch language (current: ${lang})`}
      title={`Switch language (current: ${lang})`}
    >
      {lang.toUpperCase()}
    </button>
  );
}
