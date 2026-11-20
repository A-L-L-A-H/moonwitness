export interface Session {
  identity: string;
  role: string;
  username?: string;
  id?: string | number;
}

export function parseSessionPayload(data: unknown): Session | null {
  const user: unknown = (data as { user?: unknown } | null)?.user;
  if (!user || typeof user !== "object") {
    return null;
  }
  const profile = user as {
    id?: unknown;
    displayName?: unknown;
    username?: unknown;
    role?: unknown;
  };
  return {
    identity: typeof profile.displayName === "string" ? profile.displayName : "Operator",
    role: typeof profile.role === "string" ? profile.role.trim().toLowerCase() : "",
    username: typeof profile.username === "string" ? profile.username : undefined,
    id: typeof profile.id === "string" || typeof profile.id === "number" ? profile.id : undefined,
  };
}

/**
 * Fails closed if development auth bypass flags are configured in production.
 */
export function assertProductionAuthSafety(
  env: Record<string, string | undefined> = process.env,
): void {
  if (
    env.NODE_ENV === "production" &&
    (env.MW_DEV_AUTH_BYPASS === "1" || env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1")
  ) {
    throw new Error("Security violation: development auth bypass cannot be enabled in production.");
  }
}

export function isDevSessionFallbackEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  assertProductionAuthSafety(env);
  if (typeof window === "undefined") {
    return false;
  }
  if (env.NODE_ENV !== "development") {
    return false;
  }
  if (env.MW_DEV_AUTH_BYPASS !== "1") {
    return false;
  }
  try {
    return window.localStorage.getItem("mw_dev_user") !== "0";
  } catch {
    return true;
  }
}
