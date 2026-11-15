import { parseEnv, z } from "@moonwitness/core";

const envSchema = {
  PORT: z.string().default("3002"),
  HOST: z.string().default("127.0.0.1"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z.string().optional(),
  /** Comma-separated list of allowed browser origins. Required in production. */
  CORS_ORIGINS: z.string().optional(),
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
};

export const env = parseEnv(envSchema);
export type Env = typeof env;

export function validateRiotAiRuntimeConfig(config: { RIOT_AI_BASE_URL?: string }): string[] {
  if (!config.RIOT_AI_BASE_URL) return [];
  const problems: string[] = [];
  try {
    const inferenceUrl = new URL(config.RIOT_AI_BASE_URL);
    const loopback =
      inferenceUrl.hostname === "localhost" ||
      inferenceUrl.hostname === "127.0.0.1" ||
      inferenceUrl.hostname === "[::1]";
    if (inferenceUrl.protocol !== "https:" && !loopback) {
      problems.push("RIOT_AI_BASE_URL must use HTTPS except for a loopback local runtime.");
    }
    if (inferenceUrl.protocol === "https:" && loopback) {
      problems.push("RIOT_AI_BASE_URL must use HTTP for a loopback local runtime.");
    }
    if (inferenceUrl.protocol !== "https:" && inferenceUrl.protocol !== "http:") {
      problems.push("RIOT_AI_BASE_URL must use HTTP or HTTPS.");
    }
    if (inferenceUrl.username || inferenceUrl.password) {
      problems.push("RIOT_AI_BASE_URL must not contain embedded credentials.");
    }
    if (inferenceUrl.search || inferenceUrl.hash) {
      problems.push("RIOT_AI_BASE_URL must not contain query parameters or fragments.");
    }
    if (inferenceUrl.pathname !== "/" && !inferenceUrl.pathname.endsWith("/v1")) {
      problems.push("RIOT_AI_BASE_URL must target the OpenAI-compatible root or /v1 path.");
    }
  } catch {
    problems.push("RIOT_AI_BASE_URL must be an absolute URL.");
  }
  return problems;
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
