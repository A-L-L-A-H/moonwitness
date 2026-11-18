import { buildChildTraceparent, resolveTraceContext } from "./trace";

/**
 * Shared upstream resolution and Cloudflare Workers loopback guards for proxy routes.
 */

export interface EdgeLoopbackErrorPayload {
  readonly error: string;
  readonly reachable: false;
  readonly configured: false;
  readonly mode: "cloudflare-edge";
}

export function isCloudflareWorkersRuntime(): boolean {
  if (typeof process !== "undefined" && process.env.DATABASE_URL?.startsWith("d1:")) {
    return true;
  }
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair === "function";
}

export function isLoopbackServiceUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
  } catch {
    return /^https?:\/\/(127\.0\.0\.1|localhost|\[?::1\]?)(:\d+)?(\/|$)/i.test(urlString);
  }
}

export function resolveUpstreamServiceUrl(envVar: string, defaultLocalUrl: string): string {
  const raw = typeof process !== "undefined" ? process.env[envVar]?.trim() : undefined;
  return (raw && raw.length > 0 ? raw : defaultLocalUrl).replace(/\/+$/, "");
}

export function getEdgeLoopbackErrorPayload(
  serviceName: string,
  envVar: string,
  urlString: string,
): EdgeLoopbackErrorPayload | null {
  if (!isCloudflareWorkersRuntime() || !isLoopbackServiceUrl(urlString)) {
    return null;
  }
  return {
    error: `${serviceName} requires a public or tunnel URL in Cloudflare Workers (set ${envVar})`,
    reachable: false,
    configured: false,
    mode: "cloudflare-edge",
  };
}

export interface UpstreamCorrelationInput {
  id?: string;
  requestId?: string;
  traceparent?: string;
  headers?: Record<string, string | string[] | undefined>;
}

function readCorrelationHeader(
  correlation: UpstreamCorrelationInput | undefined,
  name: string,
): string | undefined {
  if (!correlation?.headers) return undefined;
  const raw = correlation.headers[name];
  if (typeof raw === "string") return raw.trim() || undefined;
  if (Array.isArray(raw)) return raw[0]?.trim() || undefined;
  return undefined;
}

/**
 * Attaches optional shared bridge secret header and propagates `x-request-id`
 * and a child W3C `traceparent` header when calling tunneled host services.
 */
export function getUpstreamBridgeHeaders(
  baseHeaders: Record<string, string> = {},
  correlation?: UpstreamCorrelationInput,
): Record<string, string> {
  const headers: Record<string, string> = { ...baseHeaders };
  const token = typeof process !== "undefined" ? process.env.BRIDGE_SHARED_TOKEN?.trim() : "";
  if (token) {
    headers["x-moonwitness-bridge-token"] = token;
  }
  const requestId =
    correlation?.requestId?.trim() ||
    correlation?.id?.trim() ||
    readCorrelationHeader(correlation, "x-request-id");
  if (requestId && !headers["x-request-id"]) {
    headers["x-request-id"] = requestId;
  }
  const rawTraceparent =
    correlation?.traceparent?.trim() || readCorrelationHeader(correlation, "traceparent");
  if (rawTraceparent && !headers.traceparent) {
    headers.traceparent = buildChildTraceparent(resolveTraceContext(rawTraceparent));
  }
  return headers;
}
