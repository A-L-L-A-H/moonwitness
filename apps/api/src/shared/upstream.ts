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
