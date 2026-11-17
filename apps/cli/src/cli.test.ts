import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeBase64Url, type PublicEs256Jwk } from "@moonwitness/core";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "./cli";

const TEXT_ENCODER = new TextEncoder();

async function createMockOidcServer() {
  const keyPair = await globalThis.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const rawPublic = (await globalThis.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey,
  )) as PublicEs256Jwk;
  const publicJwk: PublicEs256Jwk = {
    kty: "EC",
    crv: "P-256",
    x: rawPublic.x,
    y: rawPublic.y,
    kid: "cli-test-kid",
    use: "sig",
    alg: "ES256",
  };

  let refreshCount = 0;
  let revokedToken: string | null = null;

  const signJwt = async (payload: Record<string, unknown>) => {
    const header = encodeBase64Url(
      TEXT_ENCODER.encode(JSON.stringify({ alg: "ES256", typ: "JWT", kid: publicJwk.kid })),
    );
    const body = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(payload)));
    const input = `${header}.${body}`;
    const sig = await globalThis.crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      keyPair.privateKey,
      TEXT_ENCODER.encode(input),
    );
    return `${input}.${encodeBase64Url(new Uint8Array(sig))}`;
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/.well-known/jwks.json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ keys: [publicJwk] }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/oauth/token") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
      const grantType = form.get("grant_type");
      const nowSec = Math.floor(Date.now() / 1000);

      if (grantType === "authorization_code") {
        const accessToken = await signJwt({
          iss: issuer,
          sub: "7",
          aud: "moonwitness-cli",
          exp: nowSec + 600,
          iat: nowSec,
          token_use: "access",
          preferred_username: "operator",
          role: "admin",
        });
        const idToken = await signJwt({
          iss: issuer,
          sub: "7",
          aud: "moonwitness-cli",
          exp: nowSec + 3600,
          iat: nowSec,
          token_use: "id",
        });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            access_token: accessToken,
            id_token: idToken,
            token_type: "Bearer",
            expires_in: 600,
            refresh_token: "rt_initial_1",
            scope: "openid profile email offline_access",
          }),
        );
        return;
      }

      if (grantType === "refresh_token") {
        refreshCount += 1;
        const rotatedAccess = await signJwt({
          iss: issuer,
          sub: "7",
          aud: "moonwitness-cli",
          exp: nowSec + 900,
          iat: nowSec,
          token_use: "access",
          preferred_username: "operator",
          role: "admin",
        });
        const idToken = await signJwt({
          iss: issuer,
          sub: "7",
          aud: "moonwitness-cli",
          exp: nowSec + 3600,
          iat: nowSec,
          token_use: "id",
        });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            access_token: rotatedAccess,
            id_token: idToken,
            token_type: "Bearer",
            expires_in: 900,
            refresh_token: `rt_rotated_${refreshCount}`,
          }),
        );
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/oauth/userinfo") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          sub: "7",
          preferred_username: "operator",
          name: "Edge Operator",
          email: "ops@moonwitness.biz.id",
          role: "admin",
        }),
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/oauth/revoke") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
      revokedToken = form.get("token");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    issuer,
    getRefreshCount: () => refreshCount,
    getRevokedToken: () => revokedToken,
    close: async () => {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

describe("@moonwitness/cli", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      if (fn) await fn();
    }
  });

  it("completes loopback PKCE login, auto-refreshes expired token, reports status, and revokes on logout", async () => {
    const mockOidc = await createMockOidcServer();
    cleanups.push(mockOidc.close);

    const tempDir = await mkdtemp(join(tmpdir(), "mw-cli-test-"));
    cleanups.push(() => rm(tempDir, { recursive: true, force: true }));
    const credentialsFile = join(tempDir, "credentials.json");

    let clockSec = 1_800_000_000;
    const out: string[] = [];
    const err: string[] = [];

    const loginCode = await runCli(
      ["login", "--issuer", mockOidc.issuer, "--port", "0", "--credentials", credentialsFile],
      {
        stdout: (line) => out.push(line),
        stderr: (line) => err.push(line),
        nowEpochSec: () => clockSec,
        openUrl: async (authorizeUrl) => {
          const auth = new URL(authorizeUrl);
          const redirectUri = new URL(auth.searchParams.get("redirect_uri") ?? "");
          redirectUri.searchParams.set("code", "auth_code_cli_1");
          redirectUri.searchParams.set("state", auth.searchParams.get("state") ?? "");
          const cbRes = await fetch(redirectUri.toString());
          expect(cbRes.status).toBe(200);
        },
      },
    );
    expect(loginCode).toBe(0);
    expect(err).toEqual([]);
    expect(out.some((line) => line.includes("@operator"))).toBe(true);

    const fileStats = await stat(credentialsFile);
    expect(fileStats.isFile()).toBe(true);

    out.length = 0;
    const whoamiCode = await runCli(["whoami", "--json", "--credentials", credentialsFile], {
      stdout: (line) => out.push(line),
      stderr: (line) => err.push(line),
      nowEpochSec: () => clockSec,
    });
    expect(whoamiCode).toBe(0);
    expect(JSON.parse(out.join("\n"))).toMatchObject({
      preferred_username: "operator",
      role: "admin",
    });

    // Advance clock past expiresAtEpochSec so `token` forces transparent refresh rotation.
    clockSec += 590;
    out.length = 0;
    const tokenCode = await runCli(["token", "--credentials", credentialsFile], {
      stdout: (line) => out.push(line),
      stderr: (line) => err.push(line),
      nowEpochSec: () => clockSec,
    });
    expect(tokenCode).toBe(0);
    expect(mockOidc.getRefreshCount()).toBe(1);
    const savedAfterRefresh = JSON.parse(await readFile(credentialsFile, "utf8")) as {
      refreshToken?: string;
    };
    expect(savedAfterRefresh.refreshToken).toBe("rt_rotated_1");

    out.length = 0;
    const statusCode = await runCli(
      [
        "status",
        "--json",
        "--strict",
        "--issuer",
        mockOidc.issuer,
        "--api",
        mockOidc.issuer,
        "--igate",
        mockOidc.issuer,
        "--codex",
        mockOidc.issuer,
      ],
      {
        stdout: (line) => out.push(line),
        stderr: (line) => err.push(line),
        fetchFn: async (input) => {
          const urlStr = typeof input === "string" ? input : input.toString();
          if (urlStr.endsWith("/api/codex") || urlStr.endsWith("/health/ready")) {
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }
          return globalThis.fetch(input);
        },
      },
    );
    expect(statusCode).toBe(0);

    const logoutCode = await runCli(["logout", "--credentials", credentialsFile], {
      stdout: (line) => out.push(line),
      stderr: (line) => err.push(line),
    });
    expect(logoutCode).toBe(0);
    expect(mockOidc.getRevokedToken()).toBe("rt_rotated_1");
  });
});
