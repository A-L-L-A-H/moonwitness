import { cookies, headers } from "next/headers";
import {
  evaluateRouteAccess,
  type RoleName,
  type RouteAccessEvaluation,
} from "@/configs/routePolicy";
import { parseSessionPayload } from "@/lib/session-shared";

export interface ServerRouteAccessResult extends RouteAccessEvaluation {
  readonly deferredToClientGuard: boolean;
  readonly resolvedPathname: string;
}

function resolveApiInternalBaseUrl(): string {
  return (process.env.API_INTERNAL_URL?.trim() || "http://127.0.0.1:3002").replace(/\/+$/, "");
}

function hasSessionCredential(
  cookieHeader: string | null | undefined,
  authorizationHeader: string | null | undefined,
): boolean {
  if (authorizationHeader?.trim()) return true;
  if (!cookieHeader) return false;
  return /(?:^|;\s*)mw_session=[^;\s]+/.test(cookieHeader);
}

/**
 * Pure server-side route authorization evaluator used by App Router layouts/pages and tests.
 * When a session cookie or bearer header is present, verifies identity and role against `/api/v1/auth/me`
 * using `evaluateRouteAccess` (deny-by-default for missing, insufficient, or unknown roles).
 */
export async function evaluateServerRequestAccess(input: {
  pathname: string;
  cookieHeader?: string | null;
  authorizationHeader?: string | null;
  apiBaseUrl?: string;
  enforcePreviewAuth?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<ServerRouteAccessResult> {
  const pathname = input.pathname || "/";
  const baseEval = evaluateRouteAccess(pathname, {
    isAuthenticated: false,
    enforcePreviewAuth: input.enforcePreviewAuth,
  });

  if (baseEval.policy.access === "public" || baseEval.policy.access === "guest-only") {
    return {
      ...baseEval,
      deferredToClientGuard: false,
      resolvedPathname: pathname,
    };
  }

  const hasCredential = hasSessionCredential(input.cookieHeader, input.authorizationHeader);
  if (!hasCredential) {
    if (baseEval.policy.access === "protected" || input.enforcePreviewAuth) {
      return {
        allowed: false,
        policy: baseEval.policy,
        reason: "unauthenticated",
        deferredToClientGuard: true,
        resolvedPathname: pathname,
      };
    }
    return {
      ...baseEval,
      deferredToClientGuard: true,
      resolvedPathname: pathname,
    };
  }

  const apiBase = (input.apiBaseUrl ?? resolveApiInternalBaseUrl()).replace(/\/+$/, "");
  const fetchFn = input.fetchImpl ?? globalThis.fetch;

  try {
    const authHeaders = new Headers();
    if (input.cookieHeader) authHeaders.set("cookie", input.cookieHeader);
    if (input.authorizationHeader) authHeaders.set("authorization", input.authorizationHeader);
    const res = await fetchFn(`${apiBase}/api/v1/auth/me`, {
      method: "GET",
      headers: authHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      const denied = evaluateRouteAccess(pathname, {
        isAuthenticated: false,
        enforcePreviewAuth: input.enforcePreviewAuth,
      });
      return {
        ...denied,
        deferredToClientGuard: false,
        resolvedPathname: pathname,
      };
    }

    const body = (await res.json()) as unknown;
    const session = parseSessionPayload(body);
    if (!session) {
      const denied = evaluateRouteAccess(pathname, {
        isAuthenticated: false,
        enforcePreviewAuth: input.enforcePreviewAuth,
      });
      return {
        ...denied,
        deferredToClientGuard: false,
        resolvedPathname: pathname,
      };
    }

    const decision = evaluateRouteAccess(pathname, {
      isAuthenticated: true,
      role: session.role,
      enforcePreviewAuth: input.enforcePreviewAuth,
    });
    return {
      ...decision,
      deferredToClientGuard: false,
      resolvedPathname: pathname,
    };
  } catch {
    return {
      ...baseEval,
      deferredToClientGuard: true,
      resolvedPathname: pathname,
    };
  }
}

/**
 * Reads incoming Next.js request headers and cookies to enforce server-side route policy
 * before protected views are returned.
 */
export async function verifyServerRouteAccess(options: {
  pathname?: string | null;
  enforcePreviewAuth?: boolean;
}): Promise<ServerRouteAccessResult> {
  let pathname = options.pathname ?? null;
  let cookieHeader: string | null = null;
  let authorizationHeader: string | null = null;

  try {
    const headerStore = await headers();
    pathname =
      pathname ??
      headerStore.get("x-mw-pathname") ??
      headerStore.get("next-url") ??
      headerStore.get("x-invoke-path");
    authorizationHeader = headerStore.get("authorization");
    cookieHeader = headerStore.get("cookie");
  } catch {
    // Outside request context (e.g., static generation)
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("mw_session")?.value;
    if (sessionToken && !cookieHeader) {
      cookieHeader = `mw_session=${sessionToken}`;
    }
  } catch {
    // Outside request context
  }

  return evaluateServerRequestAccess({
    pathname: pathname ?? "/",
    cookieHeader,
    authorizationHeader,
    enforcePreviewAuth: options.enforcePreviewAuth,
  });
}

export type { RoleName };
