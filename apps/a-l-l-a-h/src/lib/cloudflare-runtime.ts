import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface D1PreparedStatementLike {
  all<T = Record<string, unknown>>(): Promise<{ readonly results?: readonly T[] }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface SanctuaryWorkerEnv {
  readonly DB?: D1DatabaseLike;
  readonly WEB_INTERNAL_URL?: string;
  readonly API_INTERNAL_URL?: string;
  readonly ARSY_URL?: string;
  readonly MEMORY_API_URL?: string;
}

/**
 * In native Node.js production runtime, Cloudflare Workers environment bindings are absent.
 */
export async function getCloudflareWorkerEnv(): Promise<SanctuaryWorkerEnv | null> {
  return null;
}

/**
 * Loads a JSON artifact from `/public/...` using the local filesystem in Node.
 */
export async function loadPublicJsonAsset<T>(assetPath: string): Promise<T | null> {
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  try {
    const localFile = join(process.cwd(), "public", normalized.replace(/^\/+/, ""));
    const raw = await readFile(localFile, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
