"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthRedirect } from "@/components/AuthRedirect";
import type { Locale } from "@/configs/i18n";
import {
  evaluateRouteAccess,
  hasRequiredRole,
  resolveRoutePolicy,
  type RoleName,
} from "@/configs/routePolicy";
import { useCurrentSessionState } from "@/lib/session";
import { NotAuthorizedView } from "@/views/NotAuthorized";

export function AuthGuard({
  children,
  locale,
  enforceRedirect = true,
  minRole,
}: {
  children: ReactNode;
  locale?: Locale;
  enforceRedirect?: boolean;
  minRole?: RoleName;
}) {
  const pathname = usePathname() ?? "/";
  const { session, loading } = useCurrentSessionState();
  const policy = resolveRoutePolicy(pathname);

  if (policy.access === "public") {
    return <>{children}</>;
  }

  if (policy.access === "guest-only") {
    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center font-mono text-xs text-[var(--muted-foreground)]">
          VERIFYING SOVEREIGN SESSION…
        </div>
      );
    }
    if (session) {
      return <AuthRedirect lang={locale} />;
    }
    return <>{children}</>;
  }

  const requiresAuth = policy.access === "protected" || enforceRedirect;

  if (loading) {
    if (!requiresAuth) {
      return <>{children}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-xs text-[var(--muted-foreground)]">
        VERIFYING SOVEREIGN SESSION…
      </div>
    );
  }

  const decision = evaluateRouteAccess(pathname, {
    isAuthenticated: Boolean(session),
    role: session?.role,
    enforcePreviewAuth: enforceRedirect,
  });

  if (!decision.allowed) {
    if (decision.reason === "unauthenticated") {
      return <AuthRedirect lang={locale} />;
    }
    return <NotAuthorizedView requiredRole={minRole ?? decision.requiredRole ?? policy.minRole} />;
  }

  const effectiveMinRole = minRole ?? policy.minRole;
  if (session && effectiveMinRole && !hasRequiredRole(session.role, effectiveMinRole)) {
    return <NotAuthorizedView requiredRole={effectiveMinRole} />;
  }

  return <>{children}</>;
}
export default AuthGuard;
