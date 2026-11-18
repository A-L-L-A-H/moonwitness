import type { IgateEnv } from "./types";

export interface IgateRuntimeDependencies {
  readonly resolveJwkByKid?: (kid: string) => Promise<unknown>;
  readonly probeFetch?: typeof fetch;
  readonly nowEpochSec?: () => number;
}

const RETIRED_PAYLOAD = {
  service: "igate-worker",
  status: "retired",
  replacement: "/api/v1/probes",
  compatRoutes: ["/api/v1/igate/status", "/api/v1/igate/probe"],
} as const;

/** Transitional stub while standalone `apps/igate` is retired into `@moonwitness/api` (`MW-0105`). */
export function createIgateHandler(_deps: IgateRuntimeDependencies = {}) {
  return async (request: Request, _env: IgateEnv): Promise<Response> => {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname === "/health/live") {
      return new Response(JSON.stringify(RETIRED_PAYLOAD), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return new Response(JSON.stringify({ ...RETIRED_PAYLOAD, error: "igate_worker_retired" }), {
      status: 410,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  };
}
