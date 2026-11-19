import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { i18n, type Locale } from "@/configs/i18n";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import { getDictionarySync } from "@/utils/getDictionary";
import { isValidLocale } from "@/utils/i18n";
import { SettingsProvider } from "@core/contexts/settingsContext";

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = isValidLocale(rawLang) ? rawLang : i18n.defaultLocale;
  const direction = i18n.langDirection[lang];
  const dictionary = getDictionarySync(lang);

  return (
    <div lang={lang} dir={direction} data-locale={lang} className="min-h-screen">
      <Providers>
        <SettingsProvider>
          <TranslationWrapper lang={lang} dictionary={dictionary}>
            {children}
          </TranslationWrapper>
        </SettingsProvider>
      </Providers>
    </div>
  );
}
