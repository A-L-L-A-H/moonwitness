import {
  DEFAULT_MID_ISSUER_URL,
  createJwksKeyResolver,
  normalizeIssuerUrl,
  verifyEs256Jwt,
  type PublicEs256Jwk,
} from "@moonwitness/core";
import {
  checkIgateDatabaseReady,
  listIgateNodes,
  listRecentProbeEvents,
  recordProbeEvent,
} from "./db";
import type { IgateEnv } from "./types";
import { renderIgateClientScript, renderIgateConsoleHtml } from "./ui";

export interface IgateRuntimeDependencies {
  readonly resolveJwkByKid?: (kid: string) => Promise<PublicEs256Jwk | null>;
  readonly probeFetch?: typeof fetch;
  readonly nowEpochSec?: () => number;
}

function corsHeaders(request: Request, env: IgateEnv): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  const allowed = (env.CORS_ORIGINS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, x-request-id, x-correlation-id",
    vary: "Origin",
  };
}

function attachTracingHeaders(headers: Headers, requestId: string, correlationId: string): void {
  headers.set("x-request-id", requestId);
  headers.set("x-correlation-id", correlationId);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
}

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function htmlResponse(html: string, issuerUrl: string, status = 200): Response {
  const csp = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'unsafe-inline'",
    `connect-src 'self' ${issuerUrl}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join("; ");

  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": csp,
      "cache-control": "no-store",
    },
  });
}

async function authenticateBearerRequest(
  request: Request,
  env: IgateEnv,
  deps: IgateRuntimeDependencies,
) {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const issuerUrl = normalizeIssuerUrl(env.MID_ISSUER_URL ?? DEFAULT_MID_ISSUER_URL);
  const resolveJwkByKid =
    deps.resolveJwkByKid ??
    createJwksKeyResolver({
      issuerUrl,
      jwksUrl: env.MID_JWKS_URL,
      fetchFn: deps.probeFetch,
    }).resolveByKid;

  return verifyEs256Jwt({
    token,
    issuerUrl,
    expectedTokenUse: "access",
    resolveJwkByKid,
    nowEpochSec: deps.nowEpochSec?.(),
  });
}

/** Create the Cloudflare Worker fetch handler for `@moonwitness/igate`. */
export function createIgateHandler(deps: IgateRuntimeDependencies = {}) {
  return async (request: Request, env: IgateEnv): Promise<Response> => {
    const url = new URL(request.url);
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    const correlationId = request.headers.get("x-correlation-id") ?? requestId;
    const issuerUrl = normalizeIssuerUrl(env.MID_ISSUER_URL ?? DEFAULT_MID_ISSUER_URL);
    const clientId = env.IGATE_CLIENT_ID?.trim() || "igate-console";
    const cors = corsHeaders(request, env);

    const finalize = (res: Response): Response => {
      const headers = new Headers(res.headers);
      attachTracingHeaders(headers, requestId, correlationId);
      for (const [key, value] of Object.entries(cors)) {
        headers.set(key, value);
      }
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    };

    if (request.method === "OPTIONS") {
      return finalize(new Response(null, { status: 204 }));
    }

    if (request.method === "GET" && url.pathname === "/assets/igate.js") {
      return finalize(
        new Response(renderIgateClientScript(), {
          status: 200,
          headers: {
            "content-type": "application/javascript; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        }),
      );
    }

    if (request.method === "GET" && url.pathname === "/") {
      const accept = request.headers.get("accept") ?? "";
      if (accept.includes("text/html")) {
        return finalize(
          htmlResponse(
            renderIgateConsoleHtml({ issuerUrl, clientId, isCallbackRoute: false }),
            issuerUrl,
          ),
        );
      }
      return finalize(jsonResponse({ service: "igate-worker", status: "ok" }, 200));
    }

    if (request.method === "GET" && url.pathname === "/auth/callback") {
      return finalize(
        htmlResponse(
          renderIgateConsoleHtml({ issuerUrl, clientId, isCallbackRoute: true }),
          issuerUrl,
        ),
      );
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/health" || url.pathname === "/health/live")
    ) {
      return finalize(
        jsonResponse(
          {
            service: "igate-worker",
            status: "ok",
            timestamp: new Date().toISOString(),
          },
          200,
        ),
      );
    }

    if (request.method === "GET" && url.pathname === "/health/ready") {
      const databaseOk = await checkIgateDatabaseReady(env.DB);
      return finalize(
        jsonResponse(
          {
            service: "igate-worker",
            status: databaseOk ? "ready" : "not_ready",
            checks: { database: databaseOk },
            timestamp: new Date().toISOString(),
          },
          databaseOk ? 200 : 503,
        ),
      );
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      const actor = await authenticateBearerRequest(request, env, deps);
      if (!actor) {
        return finalize(jsonResponse({ error: "unauthorized" }, 401));
      }
      if (!env.DB) {
        return finalize(jsonResponse({ error: "database_unconfigured" }, 503));
      }

      const [nodes, recentEvents] = await Promise.all([
        listIgateNodes(env.DB),
        listRecentProbeEvents(env.DB, 25),
      ]);
      return finalize(
        jsonResponse(
          {
            service: "igate-worker",
            actor: {
              sub: actor.sub,
              username: actor.preferred_username ?? actor.sub,
              role: actor.role ?? "viewer",
            },
            nodes,
            recentEvents,
          },
          200,
        ),
      );
    }

    if (url.pathname === "/api/probe" && request.method === "POST") {
      const actor = await authenticateBearerRequest(request, env, deps);
      if (!actor) {
        return finalize(jsonResponse({ error: "unauthorized" }, 401));
      }
      if (actor.role !== "admin" && actor.role !== "editor") {
        return finalize(
          jsonResponse(
            {
              error: "forbidden",
              error_description: "Probe execution requires admin or editor role.",
            },
            403,
          ),
        );
      }
      if (!env.DB) {
        return finalize(jsonResponse({ error: "database_unconfigured" }, 503));
      }

      const body = (await request.json().catch(() => null)) as { nodeId?: string } | null;
      const allNodes = (await listIgateNodes(env.DB)).filter((node) => node.enabled);
      const selectedNodes = body?.nodeId
        ? allNodes.filter((node) => node.id === body.nodeId)
        : allNodes;
      if (body?.nodeId && selectedNodes.length === 0) {
        return finalize(jsonResponse({ error: "unknown_node" }, 404));
      }

      const probeFetch = deps.probeFetch ?? globalThis.fetch;
      const recorded = [];
      for (const node of selectedNodes) {
        const startedAt = Date.now();
        let statusCode: number;
        let probeOk: boolean;
        try {
          const probeRes = await probeFetch(node.targetUrl, {
            method: "GET",
            signal: AbortSignal.timeout(4000),
          });
          statusCode = probeRes.status;
          probeOk = probeRes.ok;
        } catch {
          statusCode = 0;
          probeOk = false;
        }
        const latencyMs = Math.max(0, Date.now() - startedAt);
        const event = await recordProbeEvent(env.DB, {
          nodeId: node.id,
          statusCode,
          ok: probeOk,
          latencyMs,
          actorSub: actor.sub,
        });
        recorded.push(event);
      }

      return finalize(jsonResponse({ probed: recorded }, 200));
    }

    return finalize(jsonResponse({ error: "not_found" }, 404));
  };
}
