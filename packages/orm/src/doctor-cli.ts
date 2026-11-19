import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { closeDb, initPostgresDb } from "./driver.js";
import { isPostgresUrl } from "./drivers/postgres.driver.js";
import { modelRegistry } from "./registry.js";
import { inspectSchemaDrift, type SchemaDriftReport } from "./schema-drift.js";

export const DOCTOR_EXIT_OK = 0;
export const DOCTOR_EXIT_DRIFT = 1;
export const DOCTOR_EXIT_USAGE = 2;
export const DOCTOR_EXIT_RUNTIME = 3;

export const DOCTOR_USAGE = `Usage: orm:doctor --models <module> [--models <module> ...] [--model <name> ...] [--json] [--help]

Read-only PostgreSQL schema drift diagnostics for registered ORM models.

Options:
  --models <module>  Module (path or specifier) that registers models via defineModel(). Repeatable; required.
  --model <name>     Restrict inspection to a registered model. Repeatable.
  --json             Emit versioned JSON report (version 1) on stdout.
  --help             Show this help.

Environment:
  DATABASE_URL       PostgreSQL connection string (postgres:// or postgresql://). Required.

Exit codes:
  0  no drift
  1  drift found
  2  invalid arguments or missing/invalid configuration
  3  connection or runtime error
`;

export interface DoctorIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export interface DoctorOptions {
  help: boolean;
  json: boolean;
  modules: string[];
  models: string[];
}

export class DoctorUsageError extends Error {}

export function parseDoctorArgs(argv: readonly string[]): DoctorOptions {
  const options: DoctorOptions = { help: false, json: false, modules: [], models: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index] as string;
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--models" || arg === "--model") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new DoctorUsageError(`Option ${arg} requires a value.`);
      }
      (arg === "--models" ? options.modules : options.models).push(value);
      index++;
    } else {
      throw new DoctorUsageError(`Unknown argument '${arg}'.`);
    }
  }
  return options;
}

/** Remove credentials and query-string secrets from any text derived from a connection string. */
export function redactSecrets(text: string, connectionString: string | undefined): string {
  let redacted = text;
  if (connectionString) {
    const secrets = new Set<string>([connectionString]);
    try {
      const url = new URL(connectionString);
      if (url.password && url.password.length >= 2) secrets.add(decodeURIComponent(url.password));
      if (url.username && url.username.length >= 2) secrets.add(decodeURIComponent(url.username));
      for (const value of url.searchParams.values()) {
        if (value && value.length >= 2) secrets.add(value);
      }
    } catch {
      // unparseable URL: only the raw string is redacted
    }
    for (const secret of [...secrets].sort((a, b) => b.length - a.length)) {
      redacted = redacted.split(secret).join("[redacted]");
    }
  }
  return redacted.replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, "[redacted-url]");
}

export function formatDoctorReport(report: SchemaDriftReport): string {
  const lines: string[] = [];
  const errors = report.findings.filter((finding) => finding.severity === "error").length;
  const warnings = report.findings.length - errors;
  lines.push(
    `ORM Doctor: ${report.ok ? "no drift" : "DRIFT"} (${report.models.length} models, ${errors} errors, ${warnings} warnings)`,
  );
  for (const finding of report.findings) {
    lines.push(
      `[${finding.severity}] ${finding.code} ${finding.model} ${finding.table} ${finding.objectKind} ${finding.objectName}`,
      `    expected: ${finding.expected ?? "-"}`,
      `    observed: ${finding.observed ?? "-"}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

export async function runDoctor(
  argv: readonly string[],
  env: Record<string, string | undefined>,
  io: DoctorIo,
): Promise<number> {
  const connectionString = env.DATABASE_URL?.trim();
  let connected = false;
  try {
    const options = parseDoctorArgs(argv);
    if (options.help) {
      io.stdout(DOCTOR_USAGE);
      return DOCTOR_EXIT_OK;
    }
    if (options.modules.length === 0) {
      throw new DoctorUsageError("At least one --models <module> is required.");
    }
    if (!connectionString) {
      throw new DoctorUsageError("DATABASE_URL is required.");
    }
    if (!isPostgresUrl(connectionString)) {
      throw new DoctorUsageError("DATABASE_URL must use postgres:// or postgresql://.");
    }

    for (const specifier of options.modules) {
      const isPath = /^[./\\]|^[A-Za-z]:/.test(specifier);
      await import(isPath ? pathToFileURL(resolve(specifier)).href : specifier);
    }
    if (modelRegistry.list().length === 0) {
      throw new DoctorUsageError("No models registered by the supplied --models modules.");
    }

    await initPostgresDb(connectionString);
    connected = true;
    const report = await inspectSchemaDrift(options.models.length > 0 ? options.models : undefined);
    io.stdout(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatDoctorReport(report));
    return report.ok ? DOCTOR_EXIT_OK : DOCTOR_EXIT_DRIFT;
  } catch (error) {
    const message = redactSecrets(
      error instanceof Error ? error.message : String(error),
      connectionString,
    );
    if (error instanceof DoctorUsageError) {
      io.stderr(`${message}\n\n${DOCTOR_USAGE}`);
      return DOCTOR_EXIT_USAGE;
    }
    io.stderr(`ORM Doctor runtime error: ${message}\n`);
    return DOCTOR_EXIT_RUNTIME;
  } finally {
    if (connected) closeDb();
  }
}
