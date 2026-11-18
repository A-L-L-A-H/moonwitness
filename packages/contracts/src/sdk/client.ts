import { ApiErrorSchema } from "../timeline/endpoints";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_COOKIE = "mw_csrf";

export class MoonwitnessApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "MoonwitnessApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getCsrfTokenFromCookie(): string | null {
  const cookieHeader = (globalThis as { document?: { cookie?: string } }).document?.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function buildCsrfLogoutInit(): RequestInit {
  const init: RequestInit = { method: "POST", credentials: "include" };
  const token = getCsrfTokenFromCookie();
  return token ? { ...init, headers: { "x-csrf-token": token } } : init;
}

/** The single authorized transport: every API call in apps passes through here. */
export async function requestApiResponse(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const token = WRITE_METHODS.has(method) ? getCsrfTokenFromCookie() : null;
  const headers = token
    ? { ...((init?.headers as Record<string, string> | undefined) ?? {}), "x-csrf-token": token }
    : init?.headers;
  return fetch(url, {
    credentials: "include",
    ...init,
    ...(headers ? { headers } : {}),
  });
}

export async function requestApiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers =
    typeof init?.body === "string"
      ? { "content-type": "application/json", ...((init.headers as Record<string, string>) ?? {}) }
      : init?.headers;
  const res = await requestApiResponse(url, {
    cache: "no-store",
    ...init,
    ...(headers ? { headers } : {}),
  });
  const body = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const parsed = ApiErrorSchema.safeParse(body);
    const loose = body as { message?: unknown; error?: unknown } | null;
    const nestedError =
      loose?.error && typeof loose.error === "object" && "message" in loose.error
        ? (loose.error as { message?: unknown }).message
        : undefined;
    const message = parsed.success
      ? parsed.data.error
      : typeof loose?.message === "string"
        ? loose.message
        : typeof loose?.error === "string"
          ? loose.error
          : typeof nestedError === "string"
            ? nestedError
            : `HTTP ${res.status}`;
    throw new MoonwitnessApiError(
      message,
      res.status,
      parsed.success ? parsed.data.code : undefined,
      parsed.success ? parsed.data.details : undefined,
    );
  }
  return body as T;
}

export interface ModelListOptions {
  readonly listUrl?: string | undefined;
  readonly q?: string | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
  readonly orderBy?: string | undefined;
  readonly includeDeleted?: boolean | undefined;
}

export function createMoonwitnessClient(baseUrl = "/api/v1") {
  const modelBase = (name: string) => `${baseUrl}/m/${encodeURIComponent(name)}`;
  return {
    requestJson: <T>(path: string, init?: RequestInit) =>
      requestApiJson<T>(`${baseUrl}${path}`, init),
    requestRaw: (path: string, init?: RequestInit) => requestApiResponse(`${baseUrl}${path}`, init),
    auth: {
      me: <T = unknown>(init?: RequestInit) => requestApiJson<T>(`${baseUrl}/auth/me`, init),
      login: (identifier: string, password: string) =>
        requestApiResponse(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        }),
      logout: () => requestApiResponse(`${baseUrl}/auth/logout`, buildCsrfLogoutInit()),
      bffExchange: (payload: Record<string, unknown>) =>
        requestApiResponse(`${baseUrl}/auth/bff/exchange`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }),
      setupStatus: () =>
        requestApiJson<{ initialized?: boolean }>(`${baseUrl}/control/setup/status`, {
          cache: "no-store",
        }),
    },
    meta: {
      getModels: () => requestApiJson<{ models: string[] }>(`${baseUrl}/_meta/models`),
      getViewDescriptor: <T = unknown>(model: string) =>
        requestApiJson<T>(`${baseUrl}/_meta/views/${encodeURIComponent(model)}`),
      getNavigation: <T = unknown>() =>
        requestApiJson<{ menus?: T[] }>(`${baseUrl}/_meta/navigation`),
      listAddons: <T = unknown>() => requestApiJson<{ addons: T[] }>(`${baseUrl}/_meta/addons`),
      toggleAddon: (name: string, enabled: boolean) =>
        requestApiJson(
          `${baseUrl}/_meta/addons/${encodeURIComponent(name)}/${enabled ? "enable" : "disable"}`,
          { method: "POST" },
        ),
      registerCustomField: (model: string, payload: Record<string, unknown>) =>
        requestApiJson(`${baseUrl}/_meta/models/${encodeURIComponent(model)}/fields`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
    },
    model: (modelName: string) => ({
      list: <T = unknown>(listUrlOrOpts?: string | ModelListOptions) => {
        const opts: ModelListOptions =
          typeof listUrlOrOpts === "string" ? { listUrl: listUrlOrOpts } : (listUrlOrOpts ?? {});
        const target = opts.listUrl ?? modelBase(modelName);
        const params = new URLSearchParams();
        if (opts.q?.trim()) params.set("q", opts.q.trim());
        if (opts.limit !== undefined) params.set("limit", String(opts.limit));
        if (opts.offset !== undefined) params.set("offset", String(opts.offset));
        if (opts.orderBy) params.set("orderBy", opts.orderBy);
        if (opts.includeDeleted) params.set("includeDeleted", "true");
        const suffix = params.size > 0 ? `${target.includes("?") ? "&" : "?"}${params}` : "";
        return requestApiJson<{ data?: T[]; items?: T[]; rows?: T[]; total?: number }>(
          `${target}${suffix}`,
        );
      },
      history: <T = unknown>(id: string, historyUrlTemplate?: string) =>
        requestApiJson<{ data?: T[] }>(
          (historyUrlTemplate ?? `${modelBase(modelName)}/{id}/history`).replace(
            /\{id\}/g,
            encodeURIComponent(id),
          ),
        ),
      mutate: (
        url: string,
        method: "POST" | "PATCH" | "DELETE",
        payload?: Record<string, unknown>,
      ) => requestApiJson(url, { method, ...(payload ? { body: JSON.stringify(payload) } : {}) }),
    }),
  };
}

export const moonwitnessSdk = createMoonwitnessClient("/api/v1");
