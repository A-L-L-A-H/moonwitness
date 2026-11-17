import { describe, expect, it } from "vitest";
import {
  computePkceS256Challenge,
  createJwksKeyResolver,
  createPkceAuthorizationRequest,
  decodeJwtParts,
  encodeBase64Url,
  verifyEs256Jwt,
  type PublicEs256Jwk,
} from "./oidc";

const TEXT_ENCODER = new TextEncoder();

async function createSignedTestJwt(params: {
  readonly payload: Record<string, unknown>;
  readonly kid?: string;
}): Promise<{ jwt: string; publicJwk: PublicEs256Jwk }> {
  const pair = await globalThis.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const rawPublic = (await globalThis.crypto.subtle.exportKey(
    "jwk",
    pair.publicKey,
  )) as PublicEs256Jwk;
  const kid = params.kid ?? "test-key-1";
  const publicJwk: PublicEs256Jwk = {
    kty: "EC",
    crv: "P-256",
    x: rawPublic.x,
    y: rawPublic.y,
    kid,
    use: "sig",
    alg: "ES256",
  };
  const headerB64 = encodeBase64Url(
    TEXT_ENCODER.encode(JSON.stringify({ alg: "ES256", typ: "JWT", kid })),
  );
  const payloadB64 = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(params.payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sigBuffer = await globalThis.crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    pair.privateKey,
    TEXT_ENCODER.encode(signingInput),
  );
  const sigB64 = encodeBase64Url(new Uint8Array(sigBuffer));
  return { jwt: `${signingInput}.${sigB64}`, publicJwk };
}

describe("@moonwitness/core oidc", () => {
  it("constructs PKCE S256 authorization URLs with matching SHA-256 challenge", async () => {
    const auth = await createPkceAuthorizationRequest({
      issuerUrl: "https://id.moonwitness.biz.id/",
      clientId: "moonwitness-cli",
      redirectUri: "http://127.0.0.1:8765/callback",
    });

    const parsed = new URL(auth.authorizeUrl);
    expect(parsed.origin).toBe("https://id.moonwitness.biz.id");
    expect(parsed.pathname).toBe("/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("moonwitness-cli");
    expect(parsed.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:8765/callback");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("state")).toBe(auth.state);
    expect(parsed.searchParams.get("nonce")).toBe(auth.nonce);
    expect(await computePkceS256Challenge(auth.verifier)).toBe(
      parsed.searchParams.get("code_challenge"),
    );
  });

  it("verifies valid ES256 JWTs and caches JWKS lookups by kid", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const { jwt, publicJwk } = await createSignedTestJwt({
      kid: "mid-k1",
      payload: {
        iss: "https://id.moonwitness.biz.id",
        sub: "42",
        aud: "igate-console",
        exp: nowSec + 300,
        iat: nowSec,
        token_use: "access",
        preferred_username: "operator",
        role: "admin",
      },
    });

    let fetchCount = 0;
    const resolver = createJwksKeyResolver({
      issuerUrl: "https://id.moonwitness.biz.id",
      fetchFn: async () => {
        fetchCount += 1;
        return new Response(JSON.stringify({ keys: [publicJwk] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const verified = await verifyEs256Jwt({
      token: jwt,
      expectedTokenUse: "access",
      expectedAudience: "igate-console",
      resolveJwkByKid: resolver.resolveByKid,
      nowEpochSec: nowSec,
    });
    expect(verified?.sub).toBe("42");
    expect(verified?.preferred_username).toBe("operator");

    const decoded = decodeJwtParts(jwt);
    expect(decoded?.header.kid).toBe("mid-k1");

    const rejected = await verifyEs256Jwt({
      token: jwt,
      expectedTokenUse: "id",
      resolveJwkByKid: resolver.resolveByKid,
      nowEpochSec: nowSec,
    });
    expect(rejected).toBeNull();
    expect(fetchCount).toBe(1);
  });

  it("enforces string and array expectedAudience strictly and fails closed on empty/malformed aud", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const pair = await globalThis.crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"],
    );
    const rawPublic = (await globalThis.crypto.subtle.exportKey(
      "jwk",
      pair.publicKey,
    )) as PublicEs256Jwk;
    const sharedJwk: PublicEs256Jwk = {
      kty: "EC",
      crv: "P-256",
      x: rawPublic.x,
      y: rawPublic.y,
      kid: "aud-k1",
      use: "sig",
      alg: "ES256",
    };
    const signWithShared = async (payload: Record<string, unknown>) => {
      const headerB64 = encodeBase64Url(
        TEXT_ENCODER.encode(JSON.stringify({ alg: "ES256", typ: "JWT", kid: sharedJwk.kid })),
      );
      const payloadB64 = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(payload)));
      const signingInput = `${headerB64}.${payloadB64}`;
      const sigBuffer = await globalThis.crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        pair.privateKey,
        TEXT_ENCODER.encode(signingInput),
      );
      return `${signingInput}.${encodeBase64Url(new Uint8Array(sigBuffer))}`;
    };

    const baseClaims = {
      iss: "https://id.moonwitness.biz.id",
      sub: "42",
      exp: nowSec + 300,
      iat: nowSec,
      token_use: "access",
    };

    const stringAud = await signWithShared({ ...baseClaims, aud: "moonwitness-web" });
    const arrayAud = await signWithShared({
      ...baseClaims,
      aud: ["moonwitness-web", "moonwitness-api"],
    });
    const missingAud = await signWithShared(baseClaims);
    const emptyArrayAud = await signWithShared({ ...baseClaims, aud: [] });
    const malformedArrayAud = await signWithShared({
      ...baseClaims,
      aud: ["moonwitness-web", 123],
    });

    const resolveKey = async (kid: string) => (kid === sharedJwk.kid ? sharedJwk : null);

    expect(
      await verifyEs256Jwt({
        token: stringAud,
        expectedTokenUse: "access",
        expectedAudience: ["moonwitness-cli", "moonwitness-web"],
        resolveJwkByKid: resolveKey,
        nowEpochSec: nowSec,
      }),
    ).not.toBeNull();

    expect(
      await verifyEs256Jwt({
        token: arrayAud,
        expectedTokenUse: "access",
        expectedAudience: "moonwitness-api",
        resolveJwkByKid: resolveKey,
        nowEpochSec: nowSec,
      }),
    ).not.toBeNull();

    expect(
      await verifyEs256Jwt({
        token: arrayAud,
        expectedTokenUse: "access",
        expectedAudience: ["igate-console", "moonwitness-api"],
        resolveJwkByKid: resolveKey,
        nowEpochSec: nowSec,
      }),
    ).not.toBeNull();

    expect(
      await verifyEs256Jwt({
        token: stringAud,
        expectedTokenUse: "access",
        expectedAudience: "igate-console",
        resolveJwkByKid: resolveKey,
        nowEpochSec: nowSec,
      }),
    ).toBeNull();

    expect(
      await verifyEs256Jwt({
        token: stringAud,
        expectedTokenUse: "access",
        expectedAudience: [],
        resolveJwkByKid: resolveKey,
        nowEpochSec: nowSec,
      }),
    ).toBeNull();

    expect(
      await verifyEs256Jwt({
        token: stringAud,
        expectedTokenUse: "access",
        expectedAudience: "",
        resolveJwkByKid: resolveKey,
        nowEpochSec: nowSec,
      }),
    ).toBeNull();

    for (const badToken of [missingAud, emptyArrayAud, malformedArrayAud]) {
      expect(
        await verifyEs256Jwt({
          token: badToken,
          expectedTokenUse: "access",
          expectedAudience: ["moonwitness-web"],
          resolveJwkByKid: resolveKey,
          nowEpochSec: nowSec,
        }),
      ).toBeNull();
    }
  });

  it("refreshes JWKS on cache-miss for rotated signing keys and enforces nbf", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const firstKey = await createSignedTestJwt({
      kid: "mid-k1",
      payload: {
        iss: "https://id.moonwitness.biz.id",
        sub: "42",
        aud: "allah-sanctuary",
        exp: nowSec + 300,
        iat: nowSec,
        nbf: nowSec - 5,
        token_use: "id",
      },
    });
    const rotatedKey = await createSignedTestJwt({
      kid: "mid-k2",
      payload: {
        iss: "https://id.moonwitness.biz.id",
        sub: "42",
        aud: "allah-sanctuary",
        exp: nowSec + 300,
        iat: nowSec,
        token_use: "id",
      },
    });
    const futureNbfJwt = await createSignedTestJwt({
      kid: "mid-k2",
      payload: {
        iss: "https://id.moonwitness.biz.id",
        sub: "42",
        aud: "allah-sanctuary",
        exp: nowSec + 600,
        iat: nowSec,
        nbf: nowSec + 120,
        token_use: "id",
      },
    });

    let activeJwks = [firstKey.publicJwk];
    let fetchCount = 0;
    const resolver = createJwksKeyResolver({
      issuerUrl: "https://id.moonwitness.biz.id",
      fetchFn: async () => {
        fetchCount += 1;
        return new Response(JSON.stringify({ keys: activeJwks }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const firstVerified = await verifyEs256Jwt({
      token: firstKey.jwt,
      expectedTokenUse: "id",
      expectedAudience: "allah-sanctuary",
      resolveJwkByKid: resolver.resolveByKid,
      nowEpochSec: nowSec,
    });
    expect(firstVerified?.sub).toBe("42");
    expect(fetchCount).toBe(1);

    // Rotate key on server without clearing resolver cache.
    activeJwks = [rotatedKey.publicJwk];
    const rotatedVerified = await verifyEs256Jwt({
      token: rotatedKey.jwt,
      expectedTokenUse: "id",
      expectedAudience: "allah-sanctuary",
      resolveJwkByKid: resolver.resolveByKid,
      nowEpochSec: nowSec,
    });
    expect(rotatedVerified?.sub).toBe("42");
    expect(fetchCount).toBe(2);

    // Unknown kid refreshes once, then suppresses repeated unknown-kid lookups within TTL.
    const unknown1 = await resolver.resolveByKid("mid-missing");
    const unknown2 = await resolver.resolveByKid("mid-missing");
    expect(unknown1).toBeNull();
    expect(unknown2).toBeNull();
    expect(fetchCount).toBe(3);

    // Future nbf must be rejected.
    const rejectedFutureNbf = await verifyEs256Jwt({
      token: futureNbfJwt.jwt,
      expectedTokenUse: "id",
      expectedAudience: "allah-sanctuary",
      resolveJwkByKid: resolver.resolveByKid,
      nowEpochSec: nowSec,
    });
    expect(rejectedFutureNbf).toBeNull();

    // Non-object JWT segments must return null cleanly without throwing.
    const nullSegment = encodeBase64Url(TEXT_ENCODER.encode("null"));
    expect(decodeJwtParts(`${nullSegment}.${nullSegment}.sig`)).toBeNull();
  });
});
