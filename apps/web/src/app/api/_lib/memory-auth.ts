import { hasRequiredRole } from "@/configs/routePolicy";
import { parseSessionPayload } from "@/lib/session-shared";

export type MemoryWriteAuthResult = { ok: true; role: string } | { ok: false; response: Response };

function resolveApiInternalBaseUrl(): string {
  return (process.env.API_INTERNAL_URL?.trim() || "http://127.0.0.1:3002").replace(/\/+$/, "");
}

function hasMemoryRequestCredential(
  cookieHeader: string | null,
  authorizationHeader: string | null,
): boolean {
  if (authorizationHeader?.trim()) return true;
  if (!cookieHeader) return false;
  return /(?:^|;\s*)mw_session=[^;\s]+/.test(cookieHeader);
}

/**
 * Verifies that mutating requests proxied through `/api/memory/[...path]` carry a valid
 * authenticated session with `editor` or higher privileges before reaching the Memory backend.
 */
export async function verifyMemoryWriteAuth(
  request: Request,
  options?: { apiBaseUrl?: string; fetchImpl?: typeof fetch },
): Promise<MemoryWriteAuthResult> {
  const cookieHeader = request.headers.get("cookie");
  const authorizationHeader = request.headers.get("authorization");

  if (!hasMemoryRequestCredential(cookieHeader, authorizationHeader)) {
    return {
      ok: false,
      response: Response.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  const apiBase = (options?.apiBaseUrl ?? resolveApiInternalBaseUrl()).replace(/\/+$/, "");
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  const authHeaders = new Headers();
  if (cookieHeader) authHeaders.set("cookie", cookieHeader);
  if (authorizationHeader) authHeaders.set("authorization", authorizationHeader);

  try {
    const authRes = await fetchFn(`${apiBase}/api/v1/auth/me`, {
      method: "GET",
      headers: authHeaders,
      cache: "no-store",
    });

    if (!authRes.ok) {
      return {
        ok: false,
        response: Response.json({ error: "Authentication required" }, { status: 401 }),
      };
    }

    const body = (await authRes.json()) as unknown;
    const session = parseSessionPayload(body);
    if (!session) {
      return {
        ok: false,
        response: Response.json({ error: "Authentication required" }, { status: 401 }),
      };
    }

    if (!hasRequiredRole(session.role, "editor")) {
      return {
        ok: false,
        response: Response.json(
          { error: "Forbidden: editor role or higher required" },
          { status: 403 },
        ),
      };
    }

    return { ok: true, role: session.role };
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Upstream auth check failed" }, { status: 502 }),
    };
  }
}
