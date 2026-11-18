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

function resolveUpstreamBaseUrl(): string {
  const configuredUrl = process.env.API_INTERNAL_URL?.trim() || "http://127.0.0.1:3002";
  return configuredUrl.replace(/\/+$/, "");
}

function createFallbackTraceparent(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `00-${hex.slice(0, 32)}-${hex.slice(32, 48)}-01`;
}

function buildUpstreamRequestHeaders(incomingHeaders: Headers): {
  headers: Headers;
  requestId: string;
  traceparent: string;
} {
  const forwardedHeaders = new Headers();
  for (const [headerName, headerValue] of incomingHeaders.entries()) {
    const lowerName = headerName.toLowerCase();
    if (STRIPPED_REQUEST_HEADERS.has(lowerName) || lowerName.startsWith("cf-")) {
      continue;
    }
    forwardedHeaders.append(headerName, headerValue);
  }
  const requestId = incomingHeaders.get("x-request-id")?.trim() || globalThis.crypto.randomUUID();
  const traceparent = incomingHeaders.get("traceparent")?.trim() || createFallbackTraceparent();
  forwardedHeaders.set("x-request-id", requestId);
  forwardedHeaders.set("traceparent", traceparent);
  return { headers: forwardedHeaders, requestId, traceparent };
}

async function buildUpstreamRequestInit(request: Request): Promise<{
  init: RequestInit;
  requestId: string;
  traceparent: string;
}> {
  const method = request.method.toUpperCase();
  const { headers, requestId, traceparent } = buildUpstreamRequestHeaders(request.headers);
  const requestInit: RequestInit = {
    method,
    headers,
    redirect: "manual",
  };
  if (method !== "GET" && method !== "HEAD") {
    const bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > 0) {
      requestInit.body = bodyBuffer;
    }
  }
  return { init: requestInit, requestId, traceparent };
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
  pathname: string,
  search: string,
  requestInit: RequestInit,
): Promise<Response> {
  const baseUrl = resolveUpstreamBaseUrl();
  return fetch(`${baseUrl}${pathname}${search}`, requestInit);
}

async function toProxyResponse(
  method: string,
  upstreamResponse: Response,
  correlation: { requestId: string; traceparent: string },
): Promise<Response> {
  const responseHeaders = buildCleanResponseHeaders(upstreamResponse.headers);
  if (!responseHeaders.has("x-request-id")) {
    responseHeaders.set("x-request-id", correlation.requestId);
  }
  if (!responseHeaders.has("traceparent")) {
    responseHeaders.set("traceparent", correlation.traceparent);
  }
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
  const { init, requestId, traceparent } = await buildUpstreamRequestInit(request);

  try {
    const upstreamResponse = await dispatchUpstreamRequest(
      incomingUrl.pathname,
      incomingUrl.search,
      init,
    );
    return await toProxyResponse(request.method.toUpperCase(), upstreamResponse, {
      requestId,
      traceparent,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Upstream API unreachable" }), {
      status: 502,
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
        traceparent,
      },
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

/** Proxies HEAD /api/v1/* requests to the upstream Moonwitness API service. */
export async function HEAD(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}

/** Proxies OPTIONS /api/v1/* requests to the upstream Moonwitness API service. */
export async function OPTIONS(request: Request): Promise<Response> {
  return proxyApiRequest(request);
}
