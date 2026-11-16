import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const rootEnvPath = fileURLToPath(new URL("../../../.env", import.meta.url));
dotenv.config({ path: rootEnvPath, quiet: true });

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function parsePort(value, key = "PORT", fallback = 4000) {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${key} must be an integer between 1 and 65535`);
  }
  return port;
}

function parseUrl(value, key, protocols) {
  let parsed;
  try {
    parsed = new URL(required({ [key]: value }, key));
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }

  if (!protocols.includes(parsed.protocol)) {
    throw new Error(`${key} must use one of: ${protocols.join(", ")}`);
  }

  return parsed.toString();
}

function parseOrigins(value, nodeEnv = "development") {
  if (nodeEnv === "production" && (typeof value !== "string" || value.trim() === "")) {
    throw new Error("CORS_ORIGINS is required in production");
  }

  const origins = (value ?? "http://localhost:3000")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const origin of origins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("CORS_ORIGINS must contain valid origins");
    }

    if (!["http:", "https:"].includes(parsed.protocol) ||
        parsed.origin !== origin.replace(/\/$/, "")) {
      throw new Error("CORS_ORIGINS entries must be exact HTTP(S) origins");
    }
  }

  return [...new Set(origins)];
}

function parseNodeEnv(value) {
  const nodeEnv = value ?? "development";
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }
  return nodeEnv;
}

export function loadApiConfig(env = process.env) {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const databaseUrl = parseUrl(env.DATABASE_URL, "DATABASE_URL", ["postgres:", "postgresql:"]);
  const redisUrl = parseUrl(
    env.REDIS_URL ?? (nodeEnv === "production" ? undefined : "redis://127.0.0.1:6379"),
    "REDIS_URL",
    ["redis:", "rediss:"]
  );

  return Object.freeze({
    nodeEnv,
    host: env.HOST ?? "0.0.0.0",
    port: parsePort(env.PORT),
    logLevel: env.LOG_LEVEL ?? (nodeEnv === "production" ? "info" : "debug"),
    corsOrigins: parseOrigins(env.CORS_ORIGINS, nodeEnv),
    databaseUrl,
    redisUrl
  });
}

export function loadWorkerConfig(env = process.env) {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const redisUrl = parseUrl(
    env.REDIS_URL ?? (nodeEnv === "production" ? undefined : "redis://127.0.0.1:6379"),
    "REDIS_URL",
    ["redis:", "rediss:"]
  );
  const databaseUrl = parseUrl(env.DATABASE_URL, "DATABASE_URL", ["postgres:", "postgresql:"]);
  const concurrency = Number(env.WORKER_CONCURRENCY ?? 5);

  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) {
    throw new Error("WORKER_CONCURRENCY must be an integer between 1 and 100");
  }

  return Object.freeze({ nodeEnv, redisUrl, databaseUrl, concurrency });
}

export function loadDatabaseConfig(env = process.env) {
  return Object.freeze({
    databaseUrl: parseUrl(env.DATABASE_URL, "DATABASE_URL", ["postgres:", "postgresql:"]),
    nodeEnv: parseNodeEnv(env.NODE_ENV)
  });
}
