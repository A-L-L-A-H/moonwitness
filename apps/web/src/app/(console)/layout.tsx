import { Providers } from "@/components/providers";
import { AuthGuard } from "@/hocs/AuthGuard";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import { SettingsProvider } from "@core/contexts/settingsContext";

export default function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Providers>
      <SettingsProvider>
        <AuthGuard enforceRedirect={false}>
          <TranslationWrapper>{children}</TranslationWrapper>
        </AuthGuard>
      </SettingsProvider>
    </Providers>
  );
}
