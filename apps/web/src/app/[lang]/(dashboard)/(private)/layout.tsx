import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { verifyServerRouteAccess } from "@core/auth/serverRouteGuard";
import { i18n, type Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import { AuthGuard } from "@/hocs/AuthGuard";
import { getLocalizedUrl, isValidLocale } from "@/utils/i18n";
import { NotAuthorizedView } from "@/views/NotAuthorized";

export default async function PrivateDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = isValidLocale(rawLang) ? rawLang : i18n.defaultLocale;
  const serverAccess = await verifyServerRouteAccess({ enforcePreviewAuth: true });

  if (!serverAccess.allowed && serverAccess.reason === "forbidden") {
    return <NotAuthorizedView requiredRole={serverAccess.requiredRole} />;
  }

  if (
    !serverAccess.allowed &&
    serverAccess.reason === "unauthenticated" &&
    !serverAccess.deferredToClientGuard
  ) {
    redirect(getLocalizedUrl(themeConfig.loginUrl, lang));
  }

  return (
    <AuthGuard locale={lang} enforceRedirect>
      {children}
    </AuthGuard>
  );
}
