#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const POSTGRES_PROTOCOL_RE = /^postgres(ql)?:\/\//i;

function resolveExplicitTestPostgresUrl(env) {
  const candidates = [env.TEST_POSTGRES_URL?.trim(), env.POSTGRES_TEST_URL?.trim()];
  for (const candidate of candidates) {
    if (candidate) return candidate;
  }
  return "";
}

function main() {
  const rawUrl = resolveExplicitTestPostgresUrl(process.env);
  if (!rawUrl) {
    console.error(
      "[pg-conformance] Fatal: TEST_POSTGRES_URL or POSTGRES_TEST_URL must be explicitly provided for bun run test:conformance:pg. Silent skipping and DATABASE_URL/SQLite/D1 fallbacks are disabled.",
    );
    process.exit(1);
  }

  if (!POSTGRES_PROTOCOL_RE.test(rawUrl)) {
    console.error(
      `[pg-conformance] Fatal: Conformance target must use postgres:// or postgresql:// protocol (received '${rawUrl.split("://")[0] ?? rawUrl}').`,
    );
    process.exit(1);
  }

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.hostname) {
      throw new Error("missing hostname");
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[pg-conformance] Fatal: Invalid PostgreSQL test URL (${reason}).`);
    process.exit(1);
  }

  const childEnv = {
    ...process.env,
    TEST_POSTGRES_URL: rawUrl,
    POSTGRES_TEST_URL: rawUrl,
    MW_REQUIRE_POSTGRES_CONFORMANCE: "1",
  };

  const suites = [
    ["--cwd", "packages/orm", "x", "vitest", "run", "src/__tests__/postgres.live.test.ts"],
    ["--filter", "@moonwitness/api", "exec", "vitest", "run", "src/pg-conformance.test.ts"],
  ];

  for (const args of suites) {
    const result = spawnSync("bun", args, {
      stdio: "inherit",
      env: childEnv,
      shell: process.platform === "win32",
    });
    if (result.error) {
      console.error(`[pg-conformance] Failed to spawn bun: ${result.error.message}`);
      process.exit(1);
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

main();
