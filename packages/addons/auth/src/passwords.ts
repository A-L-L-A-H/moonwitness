import { verifyPassword as verifyMidPassword } from "@moonwitness/mid";

const BCRYPT_COST = Number(process.env.BCRYPT_COST ?? "12");
const PBKDF2_SCHEME = "pbkdf2-sha256";
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;

interface BcryptModule {
  hash(data: string, saltOrRounds: number): Promise<string>;
  compare(data: string, encrypted: string): Promise<boolean>;
}

let cachedBcrypt: BcryptModule | null | undefined;

async function loadNodeBcrypt(): Promise<BcryptModule | null> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent === "Cloudflare-Workers"
  ) {
    return null;
  }
  if (cachedBcrypt !== undefined) return cachedBcrypt;
  try {
    const moduleName = "bc" + "rypt";
    const mod = (await import(moduleName)) as { default?: BcryptModule } & Partial<BcryptModule>;
    const resolved = mod.default ?? mod;
    if (typeof resolved.hash === "function" && typeof resolved.compare === "function") {
      cachedBcrypt = {
        hash: resolved.hash.bind(resolved),
        compare: resolved.compare.bind(resolved),
      };
      return cachedBcrypt;
    }
  } catch {
    // Fall back to WebCrypto PBKDF2 when native bcrypt is unavailable.
  }
  cachedBcrypt = null;
  return null;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

async function derivePbkdf2Sha256(
  plaintext: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as Uint8Array<ArrayBuffer>,
      iterations,
    },
    keyMaterial,
    DERIVED_BITS,
  );
  return new Uint8Array(derived);
}

export async function hashPasswordPbkdf2(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derivePbkdf2Sha256(plaintext, salt, PBKDF2_ITERATIONS);
  return `$${PBKDF2_SCHEME}$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

export async function hashAuthPassword(plaintext: string): Promise<string> {
  const bcrypt = await loadNodeBcrypt();
  if (bcrypt) return bcrypt.hash(plaintext, BCRYPT_COST);
  return hashPasswordPbkdf2(plaintext);
}

export async function verifyAuthPassword(plaintext: string, hash: string): Promise<boolean> {
  if (/^\$2[aby]\$/.test(hash)) {
    const bcrypt = await loadNodeBcrypt();
    if (!bcrypt) return false;
    return bcrypt.compare(plaintext, hash);
  }
  if (hash.startsWith(`$${PBKDF2_SCHEME}$`)) {
    const parts = hash.split("$");
    if (parts.length !== 5) return false;
    const iterations = Number(parts[2]);
    if (!Number.isInteger(iterations) || iterations < 10_000 || iterations > 1_000_000) {
      return false;
    }
    const salt = hexToBytes(parts[3] ?? "");
    const expected = hexToBytes(parts[4] ?? "");
    if (!salt || !expected) return false;
    const actual = await derivePbkdf2Sha256(plaintext, salt, iterations);
    return timingSafeEqualBytes(actual, expected);
  }
  return verifyMidPassword(plaintext, hash);
}
