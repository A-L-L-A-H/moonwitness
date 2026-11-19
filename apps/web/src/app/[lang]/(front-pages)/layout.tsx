import type { ReactNode } from "react";
import { SkinRoot } from "@moonwitness/ui/imperium";
import { imperiumLumenCssVariables } from "@moonwitness/ui/tokens";
import { i18n, type Locale } from "@/configs/i18n";
import { SanctuaryLocaleProvider } from "@/lib/sanctuary-locale";
import { isValidLocale } from "@/utils/i18n";

export default async function FrontPagesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = isValidLocale(rawLang) ? rawLang : i18n.defaultLocale;

  return (
    <SkinRoot
      dnaId="01-imperium-lumen"
      style={imperiumLumenCssVariables()}
      className="mw-sanctuary-scope min-h-screen bg-[var(--dna-canvas)] font-sans text-[var(--dna-text)] antialiased selection:bg-[var(--dna-accent)] selection:text-[var(--dna-canvas)]"
    >
      <SanctuaryLocaleProvider initialLocale={lang}>{children}</SanctuaryLocaleProvider>
    </SkinRoot>
  );
}
