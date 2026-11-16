/**
 * Minimal dependency-free fixed-window rate limiter.
 *
 * Each key (typically a client IP) gets `max` requests per `windowMs`. Counters
 * reset lazily when a window expires, so memory is bounded by active keys.
 * Intended for a single-process API; a multi-instance deployment should back
 * this with a shared store.
 */
export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
  reset(key?: string): void;
  size(): number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Resolves the rate-limit identity for a request.
 *
 * Node only reports the socket peer, so a deployment behind `n` reverse
 * proxies must opt in with `TRUSTED_PROXY_COUNT=n`. Anything above that is
 * caller-controlled and ignored, which stops `X-Forwarded-For` spoofing from
 * minting unlimited buckets.
 */
export function resolveRateLimitKey(
  peer: string,
  forwardedFor: string | string[] | undefined,
  trustedProxyCount: number,
): string {
  if (!Number.isInteger(trustedProxyCount) || trustedProxyCount <= 0) return peer;
  const header = Array.isArray(forwardedFor)
    ? forwardedFor.join(",")
    : typeof forwardedFor === "string"
      ? forwardedFor
      : "";
  const hops = header
    .split(",")
    .map((hop) => hop.trim())
    .filter((hop) => hop.length > 0);
  if (hops.length < trustedProxyCount) return peer;
  const client = hops[hops.length - trustedProxyCount];
  return client && client.length > 0 ? client : peer;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, max } = options;
  const now = options.now ?? (() => Date.now());
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): RateLimitResult {
      const t = now();
      let bucket = buckets.get(key);
      if (!bucket || t >= bucket.resetAt) {
        bucket = { count: 0, resetAt: t + windowMs };
        buckets.set(key, bucket);
      }
      if (bucket.count >= max) {
        return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - t };
      }
      bucket.count += 1;
      return { allowed: true, remaining: max - bucket.count, retryAfterMs: 0 };
    },
    reset(key?: string): void {
      if (key === undefined) buckets.clear();
      else buckets.delete(key);
    },
    size(): number {
      return buckets.size;
    },
  };
}
