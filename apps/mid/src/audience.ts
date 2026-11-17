import type { MidEnv } from "./types";

export const DEFAULT_API_ALLOWED_AUDIENCES = [
  "moonwitness-web",
  "moonwitness-cli",
  "rocksoul-dx",
  "allah-sanctuary",
  "moonwitness-api",
] as const;

const RESOURCE_URI_TO_AUDIENCE: Record<string, string> = {
  "https://api.moonwitness.biz.id": "moonwitness-api",
  "https://igate.moonwitness.biz.id": "rocksoul-igate-worker",
  "https://memory-edge.moonwitness.biz.id": "moonwitness-memory",
};

const CLIENT_APPROVED_RESOURCES: Record<string, readonly string[]> = {
  "moonwitness-web": ["moonwitness-web", "moonwitness-api"],
  "allah-sanctuary": ["allah-sanctuary", "moonwitness-api"],
  "moonwitness-cli": ["moonwitness-cli", "moonwitness-api"],
  "rocksoul-dx": ["rocksoul-dx", "moonwitness-api"],
  "igate-console": ["igate-console", "rocksoul-igate-worker"],
  "moonwitness-memory": ["moonwitness-memory"],
};

/** Normalize a resource indicator URI or logical audience identifier. */
export function canonicalizeTargetIndicator(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (trimmed.includes("://")) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return null;
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (parsed.pathname !== "/" && parsed.pathname !== "")
    ) {
      return null;
    }
    return RESOURCE_URI_TO_AUDIENCE[parsed.origin] ?? null;
  }

  return trimmed;
}

/** Validate optional RFC 8707 `resource` / `audience` parameters for a given OIDC client. */
export function resolveRequestedClientTarget(
  clientId: string,
  params: {
    readonly resources: readonly string[];
    readonly audiences: readonly string[];
  },
): { readonly ok: true; readonly resource: string | null } | { readonly ok: false } {
  const combined = [...params.resources, ...params.audiences];
  if (combined.length === 0) {
    return { ok: true, resource: null };
  }

  const canonicalValues = new Set<string>();
  for (const item of combined) {
    const canonical = canonicalizeTargetIndicator(item);
    if (!canonical) return { ok: false };
    canonicalValues.add(canonical);
  }
  if (canonicalValues.size !== 1) return { ok: false };

  const target = Array.from(canonicalValues)[0]!;
  const approved = CLIENT_APPROVED_RESOURCES[clientId] ?? [clientId];
  if (!approved.includes(target)) {
    return { ok: false };
  }
  return { ok: true, resource: target };
}

/** Build access-token `aud` claim (`string` by default, `string[]` for cross-resource grants). */
export function buildAccessTokenAudience(
  clientId: string,
  approvedResource: string | null | undefined,
): string | string[] {
  if (!approvedResource || approvedResource === clientId) {
    return clientId;
  }
  return [clientId, approvedResource];
}

function parseApiAllowlist(raw?: string): readonly string[] {
  if (raw === undefined) return DEFAULT_API_ALLOWED_AUDIENCES;
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Resolve token audiences a confidential introspection caller is authorized to query. */
export function resolveIntrospectionAudiences(
  callerClientId: string,
  env: MidEnv,
): readonly string[] {
  if (callerClientId === "moonwitness-api") {
    return parseApiAllowlist(env.MID_ALLOWED_AUDIENCES);
  }
  if (callerClientId === "rocksoul-igate-worker") {
    return ["igate-console", "rocksoul-igate-worker"];
  }
  if (callerClientId === "moonwitness-memory") {
    return ["moonwitness-memory"];
  }
  return [callerClientId];
}

/** Narrow introspection expected audience to caller-authorized targets and optional target hint. */
export function resolveIntrospectionExpectedAudience(
  callerClientId: string,
  form: URLSearchParams,
  env: MidEnv,
): readonly string[] | null {
  const authorized = resolveIntrospectionAudiences(callerClientId, env);
  if (authorized.length === 0) return null;

  const resources = form.getAll("resource");
  const audiences = form.getAll("audience");
  const combined = [...resources, ...audiences];
  if (combined.length === 0) return authorized;

  const canonicalValues = new Set<string>();
  for (const entry of combined) {
    const canonical = canonicalizeTargetIndicator(entry);
    if (!canonical) return null;
    canonicalValues.add(canonical);
  }
  if (canonicalValues.size !== 1) return null;

  const target = Array.from(canonicalValues)[0]!;
  if (!authorized.includes(target)) return null;
  return [target];
}
