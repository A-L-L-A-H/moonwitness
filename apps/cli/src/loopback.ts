import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export interface LoopbackCallbackResult {
  readonly code: string;
  readonly state: string;
}

export interface LoopbackServerHandle {
  readonly redirectUri: string;
  readonly port: number;
  readonly waitForCallback: Promise<LoopbackCallbackResult>;
  readonly close: () => Promise<void>;
}

function htmlPage(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:ui-monospace,monospace;background:#0a0a0c;color:#f8f7f2;padding:48px;text-align:center;">
  <h1 style="letter-spacing:0.08em;">${title}</h1>
  <p style="color:#d4d4d8;">${message}</p>
</body>
</html>`;
}

/** Start an ephemeral HTTP loopback server at `127.0.0.1` to receive an OAuth 2.1 callback. */
export async function startLoopbackCallbackServer(options?: {
  readonly port?: number;
  readonly path?: string;
  readonly timeoutMs?: number;
}): Promise<LoopbackServerHandle> {
  const callbackPath = options?.path ?? "/callback";
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const requestedPort = options?.port ?? 8765;

  let settled = false;
  let resolveCallback!: (value: LoopbackCallbackResult) => void;
  let rejectCallback!: (reason: Error) => void;

  const waitForCallback = new Promise<LoopbackCallbackResult>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });

  const server = createServer((req, res) => {
    const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
    if (requestUrl.pathname !== callbackPath) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const oauthError = requestUrl.searchParams.get("error");
    const oauthErrorDescription = requestUrl.searchParams.get("error_description");
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");

    if (oauthError || !code || !state) {
      const reason = oauthErrorDescription || oauthError || "Missing authorization code or state.";
      res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
      res.end(
        htmlPage("MOONWITNESS CLI // ERROR", "Authentication failed. Return to your terminal."),
      );
      if (!settled) {
        settled = true;
        rejectCallback(new Error(reason));
      }
      return;
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      htmlPage(
        "MOONWITNESS CLI // AUTHORIZED",
        "Authentication complete. You may close this window.",
      ),
    );
    if (!settled) {
      settled = true;
      resolveCallback({ code, state });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(requestedPort, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo;
  const redirectUri = `http://127.0.0.1:${address.port}${callbackPath}`;

  const timer = setTimeout(() => {
    if (!settled) {
      settled = true;
      rejectCallback(new Error(`Timed out waiting for OAuth callback on ${redirectUri}.`));
    }
  }, timeoutMs);
  timer.unref?.();

  const close = async (): Promise<void> => {
    clearTimeout(timer);
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  };

  return {
    redirectUri,
    port: address.port,
    waitForCallback: waitForCallback.finally(() => close()),
    close,
  };
}
