import { spawn } from "node:child_process";
import {
  DEFAULT_MID_ISSUER_URL,
  createPkceAuthorizationRequest,
  exchangeAuthorizationCode,
  fetchOidcUserInfo,
  normalizeIssuerUrl,
  refreshAccessTokens,
  revokeOAuthToken,
  type MidUserInfo,
} from "@moonwitness/core";
import { startLoopbackCallbackServer } from "./loopback";
import {
  clearCredentials,
  loadCredentials,
  resolveCredentialsPath,
  saveCredentials,
  type CliCredentials,
} from "./store";

export const DEFAULT_CLI_CLIENT_ID = "moonwitness-cli";

export interface CliIo {
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
  readonly openUrl?: (url: string) => Promise<void>;
  readonly fetchFn?: typeof fetch;
  readonly nowEpochSec?: () => number;
}

export interface EcosystemProbeTarget {
  readonly id: string;
  readonly url: string;
  readonly ok: boolean;
  readonly status: number;
  readonly latencyMs: number;
}

/** Open an HTTPS authorization URL in the user's default system browser without blocking. */
export async function openSystemBrowser(targetUrl: string): Promise<void> {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Refusing to open unsupported browser scheme: ${parsed.protocol}`);
  }

  let command: string;
  let args: string[];
  if (process.platform === "win32") {
    command = "rundll32";
    args = ["url.dll,FileProtocolHandler", parsed.toString()];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [parsed.toString()];
  } else {
    command = "xdg-open";
    args = [parsed.toString()];
  }

  await new Promise<void>((resolve) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
    });
    child.once("error", () => resolve());
    child.unref();
    resolve();
  });
}

/** Load credentials and transparently rotate via refresh_token when within 30s of expiry. */
export async function resolveValidCredentials(params: {
  readonly credentialsPath: string;
  readonly clientId?: string;
  readonly fetchFn?: typeof fetch;
  readonly nowEpochSec?: () => number;
}): Promise<CliCredentials | null> {
  const current = await loadCredentials(params.credentialsPath);
  if (!current) return null;

  const nowSec = (params.nowEpochSec ?? (() => Math.floor(Date.now() / 1000)))();
  if (current.expiresAtEpochSec - 30 > nowSec) {
    return current;
  }

  if (!current.refreshToken) {
    return null;
  }

  const refreshed = await refreshAccessTokens({
    issuerUrl: current.issuerUrl,
    clientId: params.clientId ?? current.clientId,
    refreshToken: current.refreshToken,
    fetchFn: params.fetchFn,
  });

  const next: CliCredentials = {
    issuerUrl: current.issuerUrl,
    clientId: current.clientId,
    accessToken: refreshed.access_token,
    idToken: refreshed.id_token,
    expiresAtEpochSec: nowSec + Math.max(1, refreshed.expires_in),
    ...(refreshed.refresh_token ? { refreshToken: refreshed.refresh_token } : {}),
    ...(refreshed.scope ? { scope: refreshed.scope } : {}),
  };
  await saveCredentials(params.credentialsPath, next);
  return next;
}

/** Execute interactive OAuth 2.1 + PKCE loopback login against MoonWitness ID. */
export async function runLoginCommand(
  options: {
    readonly issuerUrl?: string;
    readonly clientId?: string;
    readonly port?: number;
    readonly scope?: string;
    readonly openBrowser?: boolean;
    readonly credentialsPath?: string;
    readonly timeoutMs?: number;
  },
  io: CliIo,
): Promise<{ readonly credentials: CliCredentials; readonly user: MidUserInfo }> {
  const issuerUrl = normalizeIssuerUrl(options.issuerUrl ?? process.env.MOONWITNESS_ISSUER_URL);
  const clientId = options.clientId?.trim() || DEFAULT_CLI_CLIENT_ID;
  const credentialsPath = resolveCredentialsPath(options.credentialsPath);
  const nowEpochSec = io.nowEpochSec ?? (() => Math.floor(Date.now() / 1000));

  const loopback = await startLoopbackCallbackServer({
    port: options.port ?? 8765,
    timeoutMs: options.timeoutMs,
  });

  const pkce = await createPkceAuthorizationRequest({
    issuerUrl,
    clientId,
    redirectUri: loopback.redirectUri,
    scope: options.scope ?? "openid profile email offline_access",
  });

  io.stdout(`Authorize URL:\n${pkce.authorizeUrl}`);
  if (options.openBrowser !== false) {
    const opener = io.openUrl ?? openSystemBrowser;
    await opener(pkce.authorizeUrl).catch(() => {});
  }

  const callback = await loopback.waitForCallback;
  if (callback.state !== pkce.state) {
    throw new Error("OAuth state mismatch received on loopback callback.");
  }

  const tokens = await exchangeAuthorizationCode({
    issuerUrl,
    clientId,
    code: callback.code,
    redirectUri: pkce.redirectUri,
    codeVerifier: pkce.verifier,
    fetchFn: io.fetchFn,
  });

  const credentials: CliCredentials = {
    issuerUrl,
    clientId,
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    expiresAtEpochSec: nowEpochSec() + Math.max(1, tokens.expires_in),
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    ...(tokens.scope ? { scope: tokens.scope } : {}),
  };
  await saveCredentials(credentialsPath, credentials);

  const user = await fetchOidcUserInfo({
    issuerUrl,
    accessToken: credentials.accessToken,
    fetchFn: io.fetchFn,
  });

  io.stdout(
    `Signed in as ${user.name} (@${user.preferred_username}, ${user.role}) -> ${credentialsPath}`,
  );
  return { credentials, user };
}

/** Resolve active user identity via MoonWitness ID `/oauth/userinfo`. */
export async function runWhoamiCommand(
  options: {
    readonly credentialsPath?: string;
    readonly json?: boolean;
  },
  io: CliIo,
): Promise<MidUserInfo> {
  const credentialsPath = resolveCredentialsPath(options.credentialsPath);
  const creds = await resolveValidCredentials({
    credentialsPath,
    fetchFn: io.fetchFn,
    nowEpochSec: io.nowEpochSec,
  });
  if (!creds) {
    throw new Error(`Not signed in (${credentialsPath}). Run 'moonwitness login'.`);
  }

  const user = await fetchOidcUserInfo({
    issuerUrl: creds.issuerUrl,
    accessToken: creds.accessToken,
    fetchFn: io.fetchFn,
  });

  if (options.json) {
    io.stdout(JSON.stringify(user, null, 2));
  } else {
    io.stdout(`${user.preferred_username} (${user.email}) [${user.role}] sub=${user.sub}`);
  }
  return user;
}

/** Print a valid Bearer access token (auto-refreshing if near expiry). */
export async function runTokenCommand(
  options: {
    readonly credentialsPath?: string;
    readonly json?: boolean;
  },
  io: CliIo,
): Promise<string> {
  const credentialsPath = resolveCredentialsPath(options.credentialsPath);
  const creds = await resolveValidCredentials({
    credentialsPath,
    fetchFn: io.fetchFn,
    nowEpochSec: io.nowEpochSec,
  });
  if (!creds) {
    throw new Error(`No valid session in ${credentialsPath}. Run 'moonwitness login'.`);
  }

  if (options.json) {
    io.stdout(
      JSON.stringify(
        {
          access_token: creds.accessToken,
          token_type: "Bearer",
          expires_at: creds.expiresAtEpochSec,
        },
        null,
        2,
      ),
    );
  } else {
    io.stdout(creds.accessToken);
  }
  return creds.accessToken;
}

/** Revoke remote refresh token when present and delete local CLI credentials. */
export async function runLogoutCommand(
  options: {
    readonly credentialsPath?: string;
  },
  io: CliIo,
): Promise<void> {
  const credentialsPath = resolveCredentialsPath(options.credentialsPath);
  const current = await loadCredentials(credentialsPath);
  if (current?.refreshToken) {
    await revokeOAuthToken({
      issuerUrl: current.issuerUrl,
      clientId: current.clientId,
      token: current.refreshToken,
      tokenTypeHint: "refresh_token",
      fetchFn: io.fetchFn,
    }).catch(() => {});
  }
  await clearCredentials(credentialsPath);
  io.stdout(`Cleared session at ${credentialsPath}`);
}

/** Probe MoonWitness sovereign identity, API, IGate, and Codex edge health endpoints. */
export async function runStatusCommand(
  options: {
    readonly issuerUrl?: string;
    readonly apiUrl?: string;
    readonly igateUrl?: string;
    readonly codexUrl?: string;
    readonly json?: boolean;
    readonly strict?: boolean;
  },
  io: CliIo,
): Promise<readonly EcosystemProbeTarget[]> {
  const fetchFn = io.fetchFn ?? globalThis.fetch;
  const targets = [
    {
      id: "id",
      url: `${normalizeIssuerUrl(options.issuerUrl ?? DEFAULT_MID_ISSUER_URL)}/health`,
    },
    {
      id: "api",
      url: `${normalizeIssuerUrl(options.apiUrl ?? "https://api.moonwitness.biz.id")}/health`,
    },
    {
      id: "igate",
      url: `${normalizeIssuerUrl(options.igateUrl ?? "https://igate.moonwitness.biz.id")}/health/ready`,
    },
    {
      id: "codex",
      url: `${normalizeIssuerUrl(options.codexUrl ?? "https://codex.a-l-l-a-h.com")}/api/codex`,
    },
  ] as const;

  const results = await Promise.all(
    targets.map(async (target): Promise<EcosystemProbeTarget> => {
      const started = Date.now();
      try {
        const res = await fetchFn(target.url, { signal: AbortSignal.timeout(5000) });
        return {
          id: target.id,
          url: target.url,
          ok: res.ok,
          status: res.status,
          latencyMs: Date.now() - started,
        };
      } catch {
        return {
          id: target.id,
          url: target.url,
          ok: false,
          status: 0,
          latencyMs: Date.now() - started,
        };
      }
    }),
  );

  if (options.json) {
    io.stdout(JSON.stringify({ targets: results }, null, 2));
  } else {
    for (const row of results) {
      io.stdout(
        `${row.ok ? "OK" : "DOWN"} ${row.id.padEnd(6)} ${String(row.status).padStart(3)} ${row.latencyMs}ms ${row.url}`,
      );
    }
  }

  if (options.strict && results.some((row) => !row.ok)) {
    throw new Error("One or more sovereign probes failed.");
  }
  return results;
}
