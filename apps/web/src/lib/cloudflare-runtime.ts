export interface ServiceFetcherLike {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

export interface WebWorkerEnv {
  readonly ASSETS?: ServiceFetcherLike;
  readonly API_SERVICE?: ServiceFetcherLike;
  readonly API_INTERNAL_URL?: string;
}

/**
 * Resolves Cloudflare Workers runtime bindings safely without breaking Next.js Node builds or Vitest.
 */
export async function getCloudflareWorkerEnv(): Promise<WebWorkerEnv | null> {
  const moduleSpecifier = ["cloudflare", "workers"].join(":");
  try {
    const workerModule = (await import(
      /* webpackIgnore: true */ /* @vite-ignore */ moduleSpecifier
    )) as {
      readonly env?: WebWorkerEnv;
    };
    return workerModule?.env ?? null;
  } catch {
    return null;
  }
}
