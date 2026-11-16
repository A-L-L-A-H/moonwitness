import { parseEnv, z } from "@moonwitness/core";
import { isIP } from "node:net";

const envSchema = {
  PORT: z.string().default("3002"),
  HOST: z.string().default("127.0.0.1"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z.string().optional(),
  /** Comma-separated list of allowed browser origins. Required in production. */
  CORS_ORIGINS: z.string().optional(),
  /**
   * Number of trusted reverse proxies in front of this API. `0` (default) means
   * the socket peer is the client; `1` trusts the last `X-Forwarded-For` hop.
   * Never raise this above the real proxy depth, otherwise callers can spoof
   * their rate-limit identity.
   */
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).max(5).default(0),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),
  /** Max requests per window per client IP. 0 disables rate limiting. */
  RATE_LIMIT_MAX: z.string().default("120"),
  /** Rate-limit window in milliseconds. */
  RATE_LIMIT_WINDOW_MS: z.string().default("60000"),
  /** Upstream Rust service base URLs (proxied by this API). */
  RADIUS_URL: z.string().default("http://127.0.0.1:8090"),
  STORAGE_URL: z.string().default("http://127.0.0.1:8091"),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  SYSLOG_URL: z.string().default("http://127.0.0.1:8093"),
  SNMP_POLLER_URL: z.string().default("http://127.0.0.1:8094"),
  /** Approved local OpenAI-compatible inference runtime endpoint, configured by the operator. */
  RIOT_AI_BASE_URL: z.string().max(2048).optional(),
  RIOT_AI_MODEL: z.string().min(1).max(200).optional(),
  RIOT_AI_TIMEOUT_MS: z.coerce.number().int().positive().max(600_000).default(30_000),
  RIOT_AI_MAX_REQUEST_BYTES: z.coerce.number().int().positive().max(1_048_576).default(65_536),
  RIOT_AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(10_000).default(20),
  RIOT_AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().max(3_600_000).default(60_000),
  RIOT_AI_USAGE_RETENTION_DAYS: z.coerce.number().int().positive().max(3_650).default(90),
  /** Optional local apps/memory FastAPI bridge URL (e.g. http://127.0.0.1:8000). */
  MEMORY_API_URL: z.string().max(2048).optional(),
  MEMORY_API_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(10_000),
  /** Canonical MoonWitness centralized Identity issuer & optional JWKS override. */
  MID_ISSUER_URL: z.string().max(2048).optional(),
  MID_JWKS_URL: z.string().max(2048).optional(),
};

export const env = parseEnv(envSchema);
export type Env = typeof env;

interface IpRange {
  network: bigint;
  broadcast: bigint;
}

function ipv4ToBigInt(address: string): bigint | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8n) + BigInt(octet);
  }
  return value;
}

function parseIpv4Cidr(cidr: string): IpRange | null {
  const [address, prefix, extra] = cidr.split("/");
  if (extra !== undefined || !address || prefix === undefined) return null;
  if (!/^\d{1,2}$/.test(prefix)) return null;
  const prefixLength = Number(prefix);
  if (prefixLength > 32) return null;
  const value = ipv4ToBigInt(address);
  if (value === null) return null;
  const size = 1n << BigInt(32 - prefixLength);
  const network = (value / size) * size;
  return { network, broadcast: network + size - 1n };
}

/**
 * Non-routable IPv4 ranges an inference runtime must never reach. The metadata
 * address (169.254.169.254) and its 169.254/16 link-local block are covered by
 * `169.254.0.0/16`.
 */
const blockedIpv4Ranges: IpRange[] = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4",
  "240.0.0.0/4",
].map((cidr) => {
  const range = parseIpv4Cidr(cidr);
  if (!range) throw new Error(`Invalid internal IPv4 range definition: ${cidr}`);
  return range;
});

/** Non-routable IPv6 prefixes (loopback, link-local, unique-local, mapped). */
const blockedIpv6Prefixes: Array<{ prefix: string; bits: number }> = [
  { prefix: "::", bits: 128 },
  { prefix: "::1", bits: 128 },
  { prefix: "::ffff:0:0", bits: 96 },
  { prefix: "64:ff9b::", bits: 96 },
  { prefix: "64:ff9b:1::", bits: 48 },
  { prefix: "100::", bits: 64 },
  { prefix: "2001:db8::", bits: 32 },
  { prefix: "fc00::", bits: 7 },
  { prefix: "fe80::", bits: 10 },
  { prefix: "ff00::", bits: 8 },
];

function ipv6ToBigInt(address: string): bigint | null {
  let working = address.toLowerCase();
  if (working.startsWith("[") && working.endsWith("]")) {
    working = working.slice(1, -1);
  }
  if (working.includes("%")) return null;

  const lastColon = working.lastIndexOf(":");
  if (working.includes(".")) {
    const value = ipv4ToBigInt(working.slice(lastColon + 1));
    if (value === null || lastColon < 0) return null;
    working = `${working.slice(0, lastColon)}:${(value >> 16n).toString(16)}:${(value & 0xffffn).toString(16)}`;
  }

  const compressionIndex = working.indexOf("::");
  let groups: string[];
  if (compressionIndex >= 0) {
    if (working.indexOf("::", compressionIndex + 1) >= 0) return null;
    const head = working.slice(0, compressionIndex);
    const tail = working.slice(compressionIndex + 2);
    const headGroups = head ? head.split(":") : [];
    const tailGroups = tail ? tail.split(":") : [];
    const missing = 8 - headGroups.length - tailGroups.length;
    if (missing < 1) return null;
    groups = [...headGroups, ...Array<string>(missing).fill("0"), ...tailGroups];
  } else {
    groups = working.split(":");
  }

  if (groups.length !== 8) return null;
  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    value = (value << 16n) + BigInt(parseInt(group, 16));
  }
  return value;
}

function isBlockedIpv6(address: string): boolean {
  const value = ipv6ToBigInt(address);
  if (value === null) return true;
  return blockedIpv6Prefixes.some(({ prefix, bits }) => {
    const base = ipv6ToBigInt(prefix);
    if (base === null) return false;
    const shift = BigInt(128 - bits);
    return value >> shift === base >> shift;
  });
}

/**
 * True when a runtime endpoint hostname targets a non-routable address. Literal
 * IPs are classified exactly; hostnames remain allowed so operators can point
 * at an internal DNS name that resolves to a sanctioned private runtime.
 */
export function isBlockedRuntimeHost(hostname: string): boolean {
  const candidate = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!candidate) return true;
  const family = isIP(candidate);
  if (family === 4) {
    const value = ipv4ToBigInt(candidate);
    if (value === null) return true;
    return blockedIpv4Ranges.some(
      ({ network, broadcast }) => value >= network && value <= broadcast,
    );
  }
  if (family === 6) return isBlockedIpv6(candidate);
  return false;
}

function validateServiceEndpointUrl(
  rawUrl: string | undefined,
  envKey: string,
  allowV1Path: boolean,
): string[] {
  if (!rawUrl) return [];
  const problems: string[] = [];
  try {
    const targetUrl = new URL(rawUrl);
    const loopback =
      targetUrl.hostname === "localhost" ||
      targetUrl.hostname === "127.0.0.1" ||
      targetUrl.hostname === "[::1]";
    if (isBlockedRuntimeHost(targetUrl.hostname) && !loopback) {
      problems.push(`${envKey} must not target private, link-local, or metadata network ranges.`);
    }
    if (targetUrl.protocol !== "https:" && !loopback) {
      problems.push(`${envKey} must use HTTPS except for a loopback local runtime.`);
    }
    if (targetUrl.protocol === "https:" && loopback) {
      problems.push(`${envKey} must use HTTP for a loopback local runtime.`);
    }
    if (targetUrl.protocol !== "https:" && targetUrl.protocol !== "http:") {
      problems.push(`${envKey} must use HTTP or HTTPS.`);
    }
    if (targetUrl.username || targetUrl.password) {
      problems.push(`${envKey} must not contain embedded credentials.`);
    }
    if (targetUrl.search || targetUrl.hash) {
      problems.push(`${envKey} must not contain query parameters or fragments.`);
    }
    if (allowV1Path) {
      if (targetUrl.pathname !== "/" && !targetUrl.pathname.endsWith("/v1")) {
        problems.push(`${envKey} must target the OpenAI-compatible root or /v1 path.`);
      }
    } else if (targetUrl.pathname !== "/") {
      problems.push(`${envKey} must target the service root URL without a sub-path.`);
    }
  } catch {
    problems.push(`${envKey} must be an absolute URL.`);
  }
  return problems;
}

export function validateRiotAiRuntimeConfig(config: { RIOT_AI_BASE_URL?: string }): string[] {
  return validateServiceEndpointUrl(config.RIOT_AI_BASE_URL, "RIOT_AI_BASE_URL", true);
}

export function validateMemoryRuntimeConfig(config: { MEMORY_API_URL?: string }): string[] {
  return validateServiceEndpointUrl(config.MEMORY_API_URL, "MEMORY_API_URL", false);
}

export function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Reject production configuration that is missing required values or relies on
 * insecure development defaults. Returns a list of human-readable problems; an
 * empty list means the configuration is acceptable to boot in production.
 */
export function validateProductionEnv(config: typeof env): string[] {
  if (config.NODE_ENV !== "production") return [];

  const problems: string[] = [];

  if (!config.DATABASE_URL || config.DATABASE_URL.trim() === "") {
    problems.push("DATABASE_URL must be set to a persistent database in production.");
  }
  if (config.DATABASE_URL === ":memory:") {
    problems.push("DATABASE_URL must not be an in-memory database in production.");
  }
  if (!config.CORS_ORIGINS || parseCorsOrigins(config.CORS_ORIGINS).length === 0) {
    problems.push("CORS_ORIGINS must list explicit allowed origins in production.");
  }
  if (config.CORS_ORIGINS && parseCorsOrigins(config.CORS_ORIGINS).includes("*")) {
    problems.push("CORS_ORIGINS must not use '*' in production.");
  }
  if (!config.STORAGE_ACCESS_KEY?.trim()) {
    problems.push("STORAGE_ACCESS_KEY must be set for server-side Storage signing in production.");
  }
  problems.push(...validateRiotAiRuntimeConfig(config));
  problems.push(...validateMemoryRuntimeConfig(config));
  if (!config.STORAGE_SECRET_KEY?.trim()) {
    problems.push("STORAGE_SECRET_KEY must be set for server-side Storage signing in production.");
  } else if (config.STORAGE_SECRET_KEY.trim() === "change-me-storage-secret") {
    problems.push("STORAGE_SECRET_KEY must not use the example placeholder in production.");
  }

  return problems;
}

/** Throws when production configuration is unsafe; call once at startup. */
export function assertProductionEnv(config: typeof env): void {
  const problems = validateProductionEnv(config);
  if (problems.length > 0) {
    throw new Error(
      `Insecure or incomplete production configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
  }
}
