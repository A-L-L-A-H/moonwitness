import { getCloudflareWorkerEnv, type WebWorkerEnv } from "@/lib/cloudflare-runtime";

export const dynamic = "force-dynamic";

const STRIPPED_REQUEST_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

const STRIPPED_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "set-cookie",
]);

const NULL_BODY_STATUSES = new Set([204, 205, 304]);

function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function resolveFallbackBaseUrl(cfEnv: WebWorkerEnv | null): string {
  const edgeDefault =
    typeof caches !== "undefined" ? "https://api.moonwitness.biz.id" : "http://localhost:3002";
  const configuredUrl =
    cfEnv?.API_INTERNAL_URL?.trim() || process.env.API_INTERNAL_URL?.trim() || edgeDefault;
  return configuredUrl.replace(/\/+$/, "");
}

function buildUpstreamRequestHeaders(incomingHeaders: Headers): Headers {
  const forwardedHeaders = new Headers();
  for (const [headerName, headerValue] of incomingHeaders.entries()) {
    const lowerName = headerName.toLowerCase();
    if (STRIPPED_REQUEST_HEADERS.has(lowerName) || lowerName.startsWith("cf-")) {
      continue;
    }
    forwardedHeaders.append(headerName, headerValue);
  }
  return forwardedHeaders;
}

async function buildUpstreamRequestInit(request: Request): Promise<RequestInit> {
  const method = request.method.toUpperCase();
  const requestInit: RequestInit = {
    method,
    headers: buildUpstreamRequestHeaders(request.headers),
    redirect: "manual",
  };
  if (method !== "GET" && method !== "HEAD") {
    const bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > 0) {
      requestInit.body = bodyBuffer;
    }
  }
  return requestInit;
}

function buildCleanResponseHeaders(upstreamHeaders: Headers): Headers {
  const stripContentEncoding = isNodeRuntime();
  const responseHeaders = new Headers();

  for (const [headerName, headerValue] of upstreamHeaders.entries()) {
    const lowerName = headerName.toLowerCase();
    if (
      STRIPPED_RESPONSE_HEADERS.has(lowerName) ||
      (stripContentEncoding && lowerName === "content-encoding")
    ) {
      continue;
    }
    responseHeaders.append(headerName, headerValue);
  }

  // Re-attach Set-Cookie individually so multiple cookies are never folded into one header value.
  const setCookies =
    typeof upstreamHeaders.getSetCookie === "function" ? upstreamHeaders.getSetCookie() : [];
  if (setCookies.length > 0) {
    for (const cookieValue of setCookies) {
      responseHeaders.append("set-cookie", cookieValue);
    }
  } else {
    const singleCookie = upstreamHeaders.get("set-cookie");
    if (singleCookie) {
      responseHeaders.append("set-cookie", singleCookie);
    }
  }

  return responseHeaders;
}

async function dispatchUpstreamRequest(
  cfEnv: WebWorkerEnv | null,
  pathname: string,
  search: string,
  requestInit: RequestInit,
): Promise<Response> {
  if (cfEnv?.API_SERVICE && typeof cfEnv.API_SERVICE.fetch === "function") {
    return cfEnv.API_SERVICE.fetch(
      new Request(`https://api.internal${pathname}${search}`, requestInit),
    );
  }
  const baseUrl = resolveFallbackBaseUrl(cfEnv);
  return fetch(`${baseUrl}${pathname}${search}`, requestInit);
}

async function toProxyResponse(method: string, upstreamResponse: Response): Promise<Response> {
  const responseHeaders = buildCleanResponseHeaders(upstreamResponse.headers);
  const omitBody = method === "HEAD" || NULL_BODY_STATUSES.has(upstreamResponse.status);
  if (omitBody) {
    await upstreamResponse.body?.cancel().catch(() => {});
    return new Response(null, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  }
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

async function proxyApiRequest(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const [cfEnv, requestInit] = await Promise.all([
    getCloudflareWorkerEnv(),
    buildUpstreamRequestInit(request),
  ]);

  try {
    const upstreamResponse = await dispatchUpstreamRequest(
      cfEnv,
      incomingUrl.pathname,
      incomingUrl.search,
      requestInit,
    );
    return await toProxyResponse(request.method.toUpperCase(), upstreamResponse);
  } catch {
    return new Response(JSON.stringify({ error: "Upstream API unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

/** Proxies GET /api/v1/* requests to the upstream Moonwitness API service. */
export async function GET(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}

/** Proxies POST /api/v1/* requests to the upstream Moonwitness API service. */
export async function POST(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}

/** Proxies PUT /api/v1/* requests to the upstream Moonwitness API service. */
export async function PUT(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}

/** Proxies PATCH /api/v1/* requests to the upstream Moonwitness API service. */
export async function PATCH(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}

/** Proxies DELETE /api/v1/* requests to the upstream Moonwitness API service. */
export async function DELETE(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}

/** Proxies OPTIONS /api/v1/* requests to the upstream Moonwitness API service. */
export async function OPTIONS(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}

/** Proxies HEAD /api/v1/* requests to the upstream Moonwitness API service. */
export async function HEAD(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}
