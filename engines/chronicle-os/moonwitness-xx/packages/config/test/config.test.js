import test from "node:test";
import assert from "node:assert/strict";
import { loadApiConfig, loadWorkerConfig, loadDatabaseConfig } from "../src/index.js";

const base = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
  PORT: "4010",
  CORS_ORIGINS: "http://localhost:3000,https://example.test"
};

test("API config parses valid service configuration", () => {
  const config = loadApiConfig(base);
  assert.equal(config.port, 4010);
  assert.deepEqual(config.corsOrigins, ["http://localhost:3000", "https://example.test"]);
});

test("API config rejects malformed port and CORS origins", () => {
  assert.throws(() => loadApiConfig({ ...base, PORT: "99999" }), /PORT/);
  assert.throws(() => loadApiConfig({ ...base, CORS_ORIGINS: "javascript:alert(1)" }), /CORS_ORIGINS/);
});

test("worker and database config use only their own required services", () => {
  assert.equal(loadWorkerConfig({ NODE_ENV: "test", REDIS_URL: base.REDIS_URL, DATABASE_URL: base.DATABASE_URL }).concurrency, 5);
  assert.equal(loadDatabaseConfig({ NODE_ENV: "test", DATABASE_URL: base.DATABASE_URL }).nodeEnv, "test");
});

test("worker config rejects invalid concurrency", () => {
  assert.throws(() => loadWorkerConfig({
    NODE_ENV: "test",
    REDIS_URL: base.REDIS_URL,
    DATABASE_URL: base.DATABASE_URL,
    WORKER_CONCURRENCY: "0"
  }), /WORKER_CONCURRENCY/);
});

test("configuration rejects missing and malformed required URLs without echoing secret values", () => {
  assert.throws(
    () => loadApiConfig({ NODE_ENV: "test", REDIS_URL: base.REDIS_URL }),
    /DATABASE_URL/
  );
  assert.throws(
    () => loadApiConfig({ ...base, DATABASE_URL: "postgresql://user:top-secret@" }),
    (error) => error.message.includes("DATABASE_URL") && !error.message.includes("top-secret")
  );
  assert.throws(
    () => loadWorkerConfig({ NODE_ENV: "test", DATABASE_URL: base.DATABASE_URL, REDIS_URL: "https://redis.example" }),
    /REDIS_URL/
  );
});

test("production requires explicit Redis and CORS origins instead of development defaults", () => {
  const production = {
    NODE_ENV: "production",
    DATABASE_URL: base.DATABASE_URL
  };

  assert.throws(() => loadApiConfig(production), /REDIS_URL/);
  assert.throws(() => loadWorkerConfig(production), /REDIS_URL/);
  assert.throws(() => loadApiConfig({
    ...production,
    REDIS_URL: base.REDIS_URL
  }), /CORS_ORIGINS/);

  const valid = loadApiConfig({
    ...production,
    REDIS_URL: base.REDIS_URL,
    CORS_ORIGINS: "https://moonwitness.example"
  });
  assert.deepEqual(valid.corsOrigins, ["https://moonwitness.example"]);
});

test("unsupported NODE_ENV values fail with a named variable error", () => {
  assert.throws(() => loadApiConfig({ ...base, NODE_ENV: "staging" }), /NODE_ENV/);
});
