import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Hash password menggunakan scrypt dengan random salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifikasi password terhadap scrypt hash dengan safe timing comparison
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Hash satu arah untuk API Key atau Token (SHA-256)
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generate API Key standar industri (mirip Stripe / GitHub)
 * Nilai rawKey hanya ditampilkan satu kali ke user!
 */
export function generateApiKey(prefix = 'rs_live'): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomSecret = randomBytes(24).toString('hex');
  const rawKey = `${prefix}_${randomSecret}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = `${prefix}_${randomSecret.substring(0, 6)}...`;

  return {
    rawKey,
    keyHash,
    keyPrefix,
  };
}

/**
 * Generate session token untuk autentikasi web / client
 */
export function generateSessionToken(): {
  token: string;
  tokenHash: string;
} {
  const token = `st_${randomBytes(32).toString('hex')}`;
  const tokenHash = hashApiKey(token);

  return {
    token,
    tokenHash,
  };
}
