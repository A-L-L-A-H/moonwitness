export interface D1PreparedStatementLike {
  all<T = Record<string, unknown>>(): Promise<{ readonly results?: readonly T[] }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface AssetsFetcherLike {
  fetch(input: string | Request): Promise<Response>;
}

export interface R2ObjectBodyLike {
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
}

export interface KVNamespaceLike {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface SanctuaryWorkerEnv {
  readonly DB?: D1DatabaseLike;
  readonly ASSETS?: AssetsFetcherLike;
  readonly CORPUS_BUCKET?: R2BucketLike;
  readonly CACHE_KV?: KVNamespaceLike;
  readonly WEB_INTERNAL_URL?: string;
  readonly API_INTERNAL_URL?: string;
  readonly ARSY_URL?: string;
  readonly MEMORY_API_URL?: string;
}

/**
 * Resolves Cloudflare Workers runtime bindings safely without breaking Node Next.js builds or Vitest.
 */
export async function getCloudflareWorkerEnv(): Promise<SanctuaryWorkerEnv | null> {
  const modName = ["cloudflare", "workers"].join(":");
  try {
    const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ modName)) as {
      readonly env?: SanctuaryWorkerEnv;
    };
    return mod?.env ?? null;
  } catch {
    return null;
  }
}

/**
 * Loads a JSON artifact from `/public/...` using Cloudflare Worker `ASSETS` on edge or local filesystem in Node.
 */
export async function loadPublicJsonAsset<T>(assetPath: string): Promise<T | null> {
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  const cfEnv = await getCloudflareWorkerEnv();

  if (cfEnv?.ASSETS && typeof cfEnv.ASSETS.fetch === "function") {
    try {
      const response = await cfEnv.ASSETS.fetch(`https://assets.local${normalized}`);
      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      // Fall through to R2 or local Node filesystem loader
    }
  }

  if (cfEnv?.CORPUS_BUCKET && typeof cfEnv.CORPUS_BUCKET.get === "function") {
    try {
      const r2Key = `a-l-l-a-h/${normalized.replace(/^\/+/, "")}`;
      const r2Obj = await cfEnv.CORPUS_BUCKET.get(r2Key);
      if (r2Obj) {
        return await r2Obj.json<T>();
      }
    } catch {
      // Fall through to local Node filesystem loader
    }
  }

  try {
    const fsModName = ["node", "fs/promises"].join(":");
    const pathModName = ["node", "path"].join(":");
    // Fixed dynamic import via non-literal specifiers to isolate Node fs fallback cleanly
    const fsMod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ fsModName)) as {
      readFile(p: string, encoding: "utf-8"): Promise<string>;
    };
    const pathMod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ pathModName)) as {
      join(...parts: string[]): string;
    };
    const localFile = pathMod.join(process.cwd(), "public", normalized.replace(/^\/+/, ""));
    const raw = await fsMod.readFile(localFile, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
