import { describe, expect, it } from "vitest";
import {
  decryptSecretJson,
  encryptSecretJson,
  generateEs256SigningKey,
  hashPassword,
  sha256Base64Url,
  signEs256Jwt,
  verifyEs256Jwt,
  verifyPassword,
  verifyPkceS256,
} from "./crypto";
import { buildSessionCookie, isTrustedOriginMutation } from "./http";
import type { MidEnv, MidTokenClaims } from "./types";

describe("@moonwitness/mid crypto & http primitives", () => {
  it("hashes and verifies PBKDF2-SHA256 passwords identically to apps/api", async () => {
    const digest = await hashPassword("SovereignSecret!2026");
    expect(digest.startsWith("$pbkdf2-sha256$100000$")).toBe(true);
    expect(await verifyPassword("SovereignSecret!2026", digest)).toBe(true);
    expect(await verifyPassword("WrongPassword!2026", digest)).toBe(false);
  });

  it("seals private ES256 JWKs with AES-256-GCM and signs verifiable JWTs", async () => {
    const masterSecret = "unit-test-master-secret-32bytes-ok";
    const generated = await generateEs256SigningKey(masterSecret);
    const decrypted = JSON.parse(
      await decryptSecretJson(generated.encryptedPrivateJwk, masterSecret),
    ) as { kid: string };
    expect(decrypted.kid).toBe(generated.kid);

    const wrapped = await encryptSecretJson('{"hello":"world"}', masterSecret);
    expect(await decryptSecretJson(wrapped, masterSecret)).toBe('{"hello":"world"}');

    const now = Math.floor(Date.now() / 1000);
    const claims: MidTokenClaims = {
      iss: "https://id.moonwitness.biz.id",
      sub: "1",
      aud: "moonwitness-web",
      iat: now,
      exp: now + 300,
      jti: "jti-test",
      token_use: "access",
      preferred_username: "mwadmin",
      name: "Admin",
      email: "admin@moonwitness.biz.id",
      role: "admin",
    };
    const jwt = await signEs256Jwt(
      claims,
      generated.kid,
      generated.encryptedPrivateJwk,
      masterSecret,
    );
    const verified = await verifyEs256Jwt(
      jwt,
      [generated.publicJwk],
      "https://id.moonwitness.biz.id",
    );
    expect(verified?.sub).toBe("1");
    expect(await verifyEs256Jwt(jwt, [generated.publicJwk], "https://other.example")).toBeNull();
  });

  it("verifies PKCE S256 challenges, cookie domains, and CSRF origin checks", async () => {
    const verifier = "pkce_verifier_with_at_least_43_characters_123456";
    const challenge = await sha256Base64Url(verifier);
    expect(await verifyPkceS256(verifier, challenge)).toBe(true);
    expect(await verifyPkceS256("short", challenge)).toBe(false);

    const env: MidEnv = {
      DB: {} as MidEnv["DB"],
      MID_KEY_ENCRYPTION_SECRET: "secret",
      COOKIE_DOMAIN: ".moonwitness.biz.id",
      CORS_ORIGINS: "https://moonwitness.biz.id",
    };
    const cookie = buildSessionCookie("sid-1", 600, new URL("https://id.moonwitness.biz.id/"), env);
    expect(cookie).toContain("Domain=.moonwitness.biz.id");
    expect(cookie).toContain("Secure");

    const trustedReq = new Request("https://id.moonwitness.biz.id/api/clients", {
      method: "POST",
      headers: { origin: "https://moonwitness.biz.id" },
    });
    const evilReq = new Request("https://id.moonwitness.biz.id/api/clients", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(isTrustedOriginMutation(trustedReq, env)).toBe(true);
    expect(isTrustedOriginMutation(evilReq, env)).toBe(false);
  });
});
