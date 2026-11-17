import { chmod, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface CliCredentials {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly accessToken: string;
  readonly idToken: string;
  readonly refreshToken?: string;
  readonly expiresAtEpochSec: number;
  readonly scope?: string;
}

/** Resolve the default or overridden path for MoonWitness CLI credentials. */
export function resolveCredentialsPath(customPath?: string): string {
  const fromArg = customPath?.trim();
  if (fromArg) return fromArg;
  const fromEnv = process.env.MOONWITNESS_CREDENTIALS_FILE?.trim();
  if (fromEnv) return fromEnv;
  return join(homedir(), ".moonwitness", "credentials.json");
}

/** Load persisted CLI OIDC credentials or return `null` when absent or malformed. */
export async function loadCredentials(filePath: string): Promise<CliCredentials | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CliCredentials>;
    if (
      typeof parsed.issuerUrl !== "string" ||
      typeof parsed.clientId !== "string" ||
      typeof parsed.accessToken !== "string" ||
      typeof parsed.idToken !== "string" ||
      typeof parsed.expiresAtEpochSec !== "number"
    ) {
      return null;
    }
    return {
      issuerUrl: parsed.issuerUrl,
      clientId: parsed.clientId,
      accessToken: parsed.accessToken,
      idToken: parsed.idToken,
      expiresAtEpochSec: parsed.expiresAtEpochSec,
      ...(typeof parsed.refreshToken === "string" ? { refreshToken: parsed.refreshToken } : {}),
      ...(typeof parsed.scope === "string" ? { scope: parsed.scope } : {}),
    };
  } catch {
    return null;
  }
}

/** Persist CLI OIDC credentials with restrictive owner-only filesystem permissions. */
export async function saveCredentials(
  filePath: string,
  credentials: CliCredentials,
): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(filePath, `${JSON.stringify(credentials, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(filePath, 0o600).catch(() => {});
}

/** Remove stored CLI OIDC credentials cleanly on logout. */
export async function clearCredentials(filePath: string): Promise<void> {
  await unlink(filePath).catch(() => {});
}
