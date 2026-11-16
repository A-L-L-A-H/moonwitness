import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  runLoginCommand,
  runLogoutCommand,
  runStatusCommand,
  runTokenCommand,
  runWhoamiCommand,
  type CliIo,
} from "./commands";

export interface ParsedCliArgs {
  readonly command: string;
  readonly flags: Record<string, string | boolean>;
}

/** Parse positional command and `--key value` / `--flag` CLI options cleanly. */
export function parseCliArgs(argv: readonly string[]): ParsedCliArgs {
  let command = "help";
  const flags: Record<string, string | boolean> = {};
  let index = 0;

  while (index < argv.length) {
    const token = argv[index] ?? "";
    if (!token.startsWith("-") && command === "help") {
      command = token;
      index += 1;
      continue;
    }
    if (token.startsWith("--")) {
      const eqIndex = token.indexOf("=");
      if (eqIndex > 2) {
        flags[token.slice(2, eqIndex)] = token.slice(eqIndex + 1);
        index += 1;
        continue;
      }
      const key = token.slice(2);
      const next = argv[index + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        index += 2;
      } else {
        flags[key] = true;
        index += 1;
      }
      continue;
    }
    index += 1;
  }

  return { command, flags };
}

function stringFlag(flags: Record<string, string | boolean>, key: string): string | undefined {
  const val = flags[key];
  return typeof val === "string" ? val : undefined;
}

function numberFlag(flags: Record<string, string | boolean>, key: string): number | undefined {
  const raw = stringFlag(flags, key);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

const HELP_TEXT = `moonwitness - Sovereign CLI for MoonWitness ID & Ecosystem

Commands:
  login    [--issuer <url>] [--port <8765>] [--no-open] [--credentials <file>]
  whoami   [--json] [--credentials <file>]
  token    [--json] [--credentials <file>]
  logout   [--credentials <file>]
  status   [--json] [--strict] [--issuer <url>] [--api <url>] [--igate <url>] [--codex <url>]`;

/** Dispatch CLI subcommands and return exit code without forcefully terminating callers. */
export async function runCli(argv: readonly string[], io: CliIo): Promise<number> {
  const { command, flags } = parseCliArgs(argv);
  const credentialsPath = stringFlag(flags, "credentials");
  const json = Boolean(flags.json);

  try {
    switch (command) {
      case "login":
        await runLoginCommand(
          {
            issuerUrl: stringFlag(flags, "issuer"),
            clientId: stringFlag(flags, "client-id"),
            port: numberFlag(flags, "port"),
            scope: stringFlag(flags, "scope"),
            openBrowser: !flags["no-open"],
            credentialsPath,
          },
          io,
        );
        return 0;
      case "whoami":
        await runWhoamiCommand({ credentialsPath, json }, io);
        return 0;
      case "token":
        await runTokenCommand({ credentialsPath, json }, io);
        return 0;
      case "logout":
        await runLogoutCommand({ credentialsPath }, io);
        return 0;
      case "status":
        await runStatusCommand(
          {
            issuerUrl: stringFlag(flags, "issuer"),
            apiUrl: stringFlag(flags, "api"),
            igateUrl: stringFlag(flags, "igate"),
            codexUrl: stringFlag(flags, "codex"),
            json,
            strict: Boolean(flags.strict),
          },
          io,
        );
        return 0;
      case "help":
      case "--help":
      case "-h":
        io.stdout(HELP_TEXT);
        return 0;
      default:
        io.stderr(`Unknown command: ${command}\n\n${HELP_TEXT}`);
        return 1;
    }
  } catch (err: unknown) {
    io.stderr(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

const entryArg = process.argv[1];
if (entryArg && resolve(entryArg) === resolve(fileURLToPath(import.meta.url))) {
  const code = await runCli(process.argv.slice(2), {
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
  });
  process.exitCode = code;
}
