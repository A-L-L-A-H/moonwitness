import { randomBytes } from "node:crypto";
import { isIP } from "node:net";

const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
const ZERO_TRACE_ID = "00000000000000000000000000000000";
const ZERO_SPAN_ID = "0000000000000000";

export interface TraceContext {
  traceparent: string;
  traceId: string;
  spanId: string;
  sampled: boolean;
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

/**
 * Parses an incoming W3C `traceparent` header or mints a fresh trace context,
 * returning the active trace identifiers and child-span header value.
 */
export function resolveTraceContext(incoming?: string | string[]): TraceContext {
  const raw = firstHeaderValue(incoming)?.trim();
  const match = raw ? TRACEPARENT_PATTERN.exec(raw) : null;
  if (match) {
    const traceId = match[1]!.toLowerCase();
    const spanId = match[2]!.toLowerCase();
    const flags = match[3]!.toLowerCase();
    if (traceId !== ZERO_TRACE_ID && spanId !== ZERO_SPAN_ID) {
      return {
        traceparent: `00-${traceId}-${spanId}-${flags}`,
        traceId,
        spanId,
        sampled: (Number.parseInt(flags, 16) & 0x01) === 1,
      };
    }
  }

  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return {
    traceparent: `00-${traceId}-${spanId}-01`,
    traceId,
    spanId,
    sampled: true,
  };
}

/** Creates a child `traceparent` span under an existing trace context for upstream propagation. */
export function buildChildTraceparent(ctx: TraceContext): string {
  const childSpan = randomHex(8);
  const flags = ctx.sampled ? "01" : "00";
  return `00-${ctx.traceId}-${childSpan}-${flags}`;
}

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
 * True when a runtime endpoint hostname targets a non-routable address.
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

export function validateServiceEndpointUrl(
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

export type OptionalOpsServiceKey = "radius" | "snmp" | "syslog" | "storage";

export interface OptionalOpsServiceSpec {
  readonly key: OptionalOpsServiceKey;
  readonly envEnableKey: string;
  readonly legacyDisableKey: string;
  readonly urlEnvKey: string;
  readonly defaultUrl: string;
}

export const OPTIONAL_OPS_SERVICES: readonly OptionalOpsServiceSpec[] = [
  {
    key: "radius",
    envEnableKey: "MW_OPS_RADIUS_ENABLED",
    legacyDisableKey: "MW_ADDON_RADIUS_DISABLED",
    urlEnvKey: "RADIUS_URL",
    defaultUrl: "http://127.0.0.1:8090",
  },
  {
    key: "snmp",
    envEnableKey: "MW_OPS_SNMP_ENABLED",
    legacyDisableKey: "MW_ADDON_SNMP_DISABLED",
    urlEnvKey: "SNMP_POLLER_URL",
    defaultUrl: "http://127.0.0.1:8094",
  },
  {
    key: "syslog",
    envEnableKey: "MW_OPS_SYSLOG_ENABLED",
    legacyDisableKey: "MW_ADDON_SYSLOG_DISABLED",
    urlEnvKey: "SYSLOG_URL",
    defaultUrl: "http://127.0.0.1:8093",
  },
  {
    key: "storage",
    envEnableKey: "MW_OPS_STORAGE_ENABLED",
    legacyDisableKey: "MW_ADDON_STORAGE_DISABLED",
    urlEnvKey: "STORAGE_URL",
    defaultUrl: "http://127.0.0.1:8091",
  },
];

export type OpsServiceHealthStatus = "disabled" | "healthy" | "unhealthy";

export interface OptionalOpsServiceState {
  enabled: boolean;
  status: OpsServiceHealthStatus;
}

function parseOptionalFlag(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "0" || normalized === "false" || normalized === "off" || normalized === "no") {
    return false;
  }
  if (normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes") {
    return true;
  }
  return undefined;
}

/**
 * Evaluates whether an optional `ops` profile capability is enabled for this API process.
 * Respects per-service disable/enable variables and the global `MW_OPS_ENABLED` flag.
 */
export function isOptionalOpsServiceEnabled(
  serviceKey: OptionalOpsServiceKey,
  envSource: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): boolean {
  const spec = OPTIONAL_OPS_SERVICES.find((entry) => entry.key === serviceKey);
  if (!spec) return false;
  if (envSource[spec.legacyDisableKey]?.trim() === "1") return false;
  const explicit = parseOptionalFlag(envSource[spec.envEnableKey]);
  if (explicit !== undefined) return explicit;
  const globalOps = parseOptionalFlag(envSource.MW_OPS_ENABLED);
  if (globalOps !== undefined) return globalOps;
  return true;
}

/**
 * Probes enabled optional operations services (`/health`) with a bounded timeout while
 * reporting disabled capabilities explicitly as `{ enabled: false, status: "disabled" }`.
 */
export async function probeOptionalOpsServices(
  options: {
    envSource?: Record<string, string | undefined>;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<Record<OptionalOpsServiceKey, OptionalOpsServiceState>> {
  const envSource = options.envSource ?? (typeof process !== "undefined" ? process.env : {});
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 600;

  const entries = await Promise.all(
    OPTIONAL_OPS_SERVICES.map(
      async (spec): Promise<[OptionalOpsServiceKey, OptionalOpsServiceState]> => {
        if (!isOptionalOpsServiceEnabled(spec.key, envSource)) {
          return [spec.key, { enabled: false, status: "disabled" }];
        }
        const rawUrl = envSource[spec.urlEnvKey]?.trim();
        const baseUrl = (rawUrl && rawUrl.length > 0 ? rawUrl : spec.defaultUrl).replace(
          /\/+$/,
          "",
        );
        if (isCloudflareWorkersRuntime() && isLoopbackServiceUrl(baseUrl)) {
          return [spec.key, { enabled: true, status: "unhealthy" }];
        }
        try {
          const res = await fetchImpl(`${baseUrl}/health`, {
            method: "GET",
            signal: AbortSignal.timeout(timeoutMs),
            headers: getUpstreamBridgeHeaders(),
          });
          return [spec.key, { enabled: true, status: res.ok ? "healthy" : "unhealthy" }];
        } catch {
          return [spec.key, { enabled: true, status: "unhealthy" }];
        }
      },
    ),
  );

  return Object.fromEntries(entries) as Record<OptionalOpsServiceKey, OptionalOpsServiceState>;
}
