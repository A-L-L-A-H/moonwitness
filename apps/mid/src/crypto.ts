import type { MidTokenClaims, PublicEs256Jwk } from "./types";

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();
const PBKDF2_PREFIX = "$pbkdf2-sha256$";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/** Encode arbitrary bytes as unpadded URL-safe Base64. */
export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Decode unpadded URL-safe Base64 string into bytes. */
export function decodeBase64Url(encoded: string): Uint8Array {
  const padded =
    encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (encoded.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.charCodeAt(index);
  }
  return out;
}

/** Encode UTF-8 string as Base64URL. */
export function encodeJsonBase64Url(payload: unknown): string {
  return encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(payload)));
}

/** Decode Base64URL JSON segment into an untyped record. */
export function decodeJsonBase64Url<TRecord>(segment: string): TRecord {
  return JSON.parse(TEXT_DECODER.decode(decodeBase64Url(segment))) as TRecord;
}

/** Encode bytes as lowercase hexadecimal string. */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let index = 0; index < bytes.length; index += 1) {
    hex += (bytes[index] ?? 0).toString(16).padStart(2, "0");
  }
  return hex;
}

/** Decode even-length hexadecimal string into bytes. */
export function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let index = 0; index < out.length; index += 1) {
    out[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

/** Constant-time byte slice comparison immune to early-exit timing leaks. */
export function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return diff === 0;
}

/** Constant-time UTF-8 string comparison. */
export function constantTimeEqualString(left: string, right: string): boolean {
  return constantTimeEqual(TEXT_ENCODER.encode(left), TEXT_ENCODER.encode(right));
}

/** Generate cryptographically random opaque Base64URL token. */
export function generateOpaqueToken(byteLength = 32): string {
  const entropy = new Uint8Array(byteLength);
  crypto.getRandomValues(entropy);
  return encodeBase64Url(entropy);
}

/** Compute SHA-256 digest bytes for UTF-8 input. */
export async function sha256Bytes(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(TEXT_ENCODER.encode(input)));
  return new Uint8Array(digest);
}

/** Compute lowercase hex SHA-256 hash. */
export async function sha256Hex(input: string): Promise<string> {
  return bytesToHex(await sha256Bytes(input));
}

/** Compute Base64URL SHA-256 hash (RFC 7636 PKCE S256). */
export async function sha256Base64Url(input: string): Promise<string> {
  return encodeBase64Url(await sha256Bytes(input));
}

/** Hash password using WebCrypto PBKDF2-SHA256 matching apps/api format. */
export async function hashPassword(plainPassword: string, iterations = 100_000): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const imported = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(TEXT_ENCODER.encode(plainPassword)),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations, hash: "SHA-256" },
    imported,
    256,
  );
  return `${PBKDF2_PREFIX}${iterations}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(derived))}`;
}

/** Verify password against stored `$pbkdf2-sha256$<iters>$<saltHex>$<hashHex>` digest. */
export async function verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith(PBKDF2_PREFIX)) return false;
  const segments = storedHash.slice(PBKDF2_PREFIX.length).split("$");
  if (segments.length !== 3) return false;
  const iterations = Number(segments[0]);
  if (!Number.isInteger(iterations) || iterations < 10_000 || iterations > 1_000_000) return false;
  const saltBytes = hexToBytes(segments[1] ?? "");
  const expectedBytes = hexToBytes(segments[2] ?? "");
  if (!saltBytes || !expectedBytes) return false;

  const imported = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(TEXT_ENCODER.encode(plainPassword)),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(saltBytes),
      iterations,
      hash: "SHA-256",
    },
    imported,
    expectedBytes.length * 8,
  );
  return constantTimeEqual(new Uint8Array(derived), expectedBytes);
}

/** Verify RFC 7636 PKCE S256 code_verifier against stored code_challenge. */
export async function verifyPkceS256(verifier: string, challenge: string): Promise<boolean> {
  if (verifier.length < 43 || verifier.length > 128) return false;
  if (!/^[A-Za-z0-9\-._~]+$/.test(verifier)) return false;
  const computed = await sha256Base64Url(verifier);
  return constantTimeEqualString(computed, challenge);
}

async function deriveAesWrapKey(masterSecret: string): Promise<CryptoKey> {
  const keyMaterial = await sha256Bytes(masterSecret);
  return crypto.subtle.importKey("raw", toArrayBuffer(keyMaterial), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encrypt sensitive private key JSON using AES-256-GCM. */
export async function encryptSecretJson(plainJson: string, masterSecret: string): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const wrapKey = await deriveAesWrapKey(masterSecret);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    wrapKey,
    toArrayBuffer(TEXT_ENCODER.encode(plainJson)),
  );
  return `${encodeBase64Url(iv)}.${encodeBase64Url(new Uint8Array(ciphertext))}`;
}

/** Decrypt sensitive private key JSON sealed with `encryptSecretJson`. */
export async function decryptSecretJson(
  sealedPayload: string,
  masterSecret: string,
): Promise<string> {
  const parts = sealedPayload.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Malformed encrypted key envelope");
  }
  const iv = decodeBase64Url(parts[0]);
  const ciphertext = decodeBase64Url(parts[1]);
  const wrapKey = await deriveAesWrapKey(masterSecret);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    wrapKey,
    toArrayBuffer(ciphertext),
  );
  return TEXT_DECODER.decode(plaintext);
}

/** Generate a persistent ES256 (P-256) keypair and wrap its private JWK. */
export async function generateEs256SigningKey(masterSecret: string): Promise<{
  kid: string;
  publicJwk: PublicEs256Jwk;
  encryptedPrivateJwk: string;
}> {
  const keyPair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;

  const exportedPublic = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey;
  const exportedPrivate = (await crypto.subtle.exportKey("jwk", keyPair.privateKey)) as JsonWebKey;
  const kid = `mid-${generateOpaqueToken(8)}`;

  const publicJwk: PublicEs256Jwk = {
    kty: "EC",
    crv: "P-256",
    x: exportedPublic.x ?? "",
    y: exportedPublic.y ?? "",
    kid,
    use: "sig",
    alg: "ES256",
  };
  const encryptedPrivateJwk = await encryptSecretJson(
    JSON.stringify({ ...exportedPrivate, kid, use: "sig", alg: "ES256" }),
    masterSecret,
  );
  return { kid, publicJwk, encryptedPrivateJwk };
}

/** Sign an ES256 JWT payload using an encrypted private JWK. */
export async function signEs256Jwt(
  claims: MidTokenClaims,
  kid: string,
  encryptedPrivateJwk: string,
  masterSecret: string,
): Promise<string> {
  const privateJwk = JSON.parse(
    await decryptSecretJson(encryptedPrivateJwk, masterSecret),
  ) as JsonWebKey;
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const headerSegment = encodeJsonBase64Url({ alg: "ES256", typ: "JWT", kid });
  const payloadSegment = encodeJsonBase64Url(claims);
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    toArrayBuffer(TEXT_ENCODER.encode(signingInput)),
  );
  return `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
}

function normalizeExpectedAudiences(
  expectedAudience: string | readonly string[],
): readonly string[] {
  const raw = typeof expectedAudience === "string" ? [expectedAudience] : expectedAudience;
  return raw.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean);
}

function extractJwtAudiences(rawAud: unknown): readonly string[] | null {
  if (typeof rawAud === "string") {
    return rawAud.trim().length > 0 ? [rawAud] : null;
  }
  if (Array.isArray(rawAud)) {
    if (
      rawAud.length === 0 ||
      rawAud.some((entry) => typeof entry !== "string" || entry.trim().length === 0)
    ) {
      return null;
    }
    return rawAud as string[];
  }
  return null;
}

/** Verify an ES256 JWT against active public JWKs, checking `iss`, `exp`, `token_use`, and `aud`. */
export async function verifyEs256Jwt(
  token: string,
  publicJwks: PublicEs256Jwk[],
  expectedIssuer: string,
  options?: {
    expectedTokenUse?: "access" | "id";
    expectedAudience?: string | readonly string[];
  },
): Promise<MidTokenClaims | null> {
  const segments = token.split(".");
  if (segments.length !== 3 || !segments[0] || !segments[1] || !segments[2]) return null;

  let header: { alg?: string; kid?: string };
  let claims: MidTokenClaims;
  try {
    header = decodeJsonBase64Url<{ alg?: string; kid?: string }>(segments[0]);
    claims = decodeJsonBase64Url<MidTokenClaims>(segments[1]);
  } catch {
    return null;
  }

  if (header.alg !== "ES256" || !header.kid) return null;
  const normalizedIssuer = expectedIssuer.replace(/\/+$/g, "");
  if (claims.iss !== normalizedIssuer) return null;

  if (options?.expectedTokenUse && claims.token_use !== options.expectedTokenUse) {
    return null;
  }

  if (options?.expectedAudience !== undefined) {
    const allowedAudiences = normalizeExpectedAudiences(options.expectedAudience);
    if (allowedAudiences.length === 0) return null;

    const tokenAudiences = extractJwtAudiences(claims.aud as unknown);
    if (!tokenAudiences) return null;

    const allowedSet = new Set(allowedAudiences);
    if (!tokenAudiences.some((aud) => allowedSet.has(aud))) return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp <= nowSec) {
    return null;
  }
  if (
    claims.nbf !== undefined &&
    (typeof claims.nbf !== "number" || !Number.isFinite(claims.nbf) || claims.nbf > nowSec)
  ) {
    return null;
  }
  if (typeof claims.sub !== "string" || !claims.sub.trim()) return null;

  const matchingJwk = publicJwks.find((candidate) => candidate.kid === header.kid);
  if (!matchingJwk) return null;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    matchingJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const signatureValid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    toArrayBuffer(decodeBase64Url(segments[2])),
    toArrayBuffer(TEXT_ENCODER.encode(`${segments[0]}.${segments[1]}`)),
  );
  if (!signatureValid) return null;
  return claims;
}
