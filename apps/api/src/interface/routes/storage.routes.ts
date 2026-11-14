import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  getStorageSigningCredentials,
  hasCallerSignatureQuery,
  signStorageRequest,
} from "../../services/storage-sigv4";

const STORAGE_URL = process.env.STORAGE_URL ?? "http://127.0.0.1:8091";

// Allow application/octet-stream and other binary content types for storage uploads
function configureContentTypeParsers(fastify: FastifyInstance): void {
  fastify.addContentTypeParser(
    "application/octet-stream",
    { parseAs: "buffer" },
    (request, payload, done) => {
      done(null, payload);
    },
  );
  fastify.addContentTypeParser("*/*", { parseAs: "buffer" }, (request, payload, done) => {
    done(null, payload);
  });
}

function forwardHeaders(request: FastifyRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const incomingContentType = request.headers["content-type"];
  if (typeof incomingContentType === "string" && incomingContentType.length > 0) {
    headers["content-type"] = incomingContentType;
  } else if (request.body) {
    headers["content-type"] = "application/json";
  }
  return headers;
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  target: string,
  method: string,
  sign = true,
) {
  const body = request.body;
  const bodyBytes =
    body === undefined || body === null
      ? Buffer.alloc(0)
      : Buffer.isBuffer(body)
        ? body
        : typeof body === "string"
          ? Buffer.from(body)
          : Buffer.from(JSON.stringify(body));
  const upstreamHeaders = forwardHeaders(request);
  let upstreamUrl: URL;

  try {
    const rawPath = target.split("?", 1)[0] ?? "";
    if (
      rawPath.split("/").some((segment) => {
        const decoded = decodeURIComponent(segment);
        return decoded === "." || decoded === "..";
      })
    ) {
      return reply.code(400).send({ error: "invalid storage path" });
    }

    upstreamUrl = new URL(target, STORAGE_URL);
    if (sign) {
      const rawQuery = upstreamUrl.search.slice(1);
      if (hasCallerSignatureQuery(rawQuery)) {
        return reply.code(400).send({ error: "caller-supplied S3 signatures are not accepted" });
      }
      const credentials = getStorageSigningCredentials();
      if (!credentials) {
        request.log.error("Storage SigV4 credentials are not configured");
        return reply.code(503).send({ error: "storage signing is not configured" });
      }
      Object.assign(
        upstreamHeaders,
        signStorageRequest(method, upstreamUrl, bodyBytes, credentials),
      );
    }
  } catch (error) {
    request.log.warn({ err: error, target }, "invalid storage request target");
    return reply.code(400).send({ error: "invalid storage request target" });
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body: bodyBytes.length > 0 ? bodyBytes : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    request.log.warn({ err: error, target }, "storage tidak dapat dihubungi");
    return reply.code(502).send({ error: "storage tidak dapat dihubungi", reachable: false });
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  return reply
    .code(upstream.status)
    .header("content-type", upstream.headers.get("content-type") ?? "application/xml")
    .header("cache-control", "no-store")
    .send(body);
}

interface WildcardParams {
  "*": string;
}

/**
 * Parse the wildcard tail into bucket + optional key.
 * `/storage/buckets/*` captures everything after `/storage/buckets/`.
 * - `mybucket`            → bucket="mybucket", key=""
 * - `mybucket/path/to.js` → bucket="mybucket", key="path/to.js"
 */
function parseBucketKey(wildcard: string): { bucket: string; key: string } {
  const trimmed = wildcard.replace(/^\/+/, "").split("?")[0] ?? "";
  const slash = trimmed.indexOf("/");
  if (slash === -1) return { bucket: trimmed, key: "" };
  return { bucket: trimmed.slice(0, slash), key: trimmed.slice(slash + 1) };
}

function queryOf(request: FastifyRequest): string {
  return request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "";
}

export async function storageRoutes(fastify: FastifyInstance) {
  configureContentTypeParsers(fastify);
  fastify.addHook("preHandler", requireAuth());

  fastify.get("/storage/health", async (request, reply) =>
    forward(request, reply, "/health", "GET", false),
  );

  fastify.get("/storage/buckets", async (request, reply) => forward(request, reply, "/", "GET"));

  // All bucket/object operations share one wildcard route to avoid Fastify
  // route conflicts between `/:bucket` and `/:bucket/*`.
  fastify.put<{ Params: WildcardParams }>(
    "/storage/buckets/*",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { bucket, key } = parseBucketKey(request.params["*"]);
      if (key) {
        return forward(request, reply, `/${bucket}/${key}${queryOf(request)}`, "PUT");
      }
      return forward(request, reply, `/${bucket}${queryOf(request)}`, "PUT");
    },
  );

  fastify.head<{ Params: WildcardParams }>("/storage/buckets/*", async (request, reply) => {
    const { bucket, key } = parseBucketKey(request.params["*"]);
    if (key) {
      return forward(request, reply, `/${bucket}/${key}${queryOf(request)}`, "HEAD");
    }
    return forward(request, reply, `/${bucket}${queryOf(request)}`, "HEAD");
  });

  fastify.delete<{ Params: WildcardParams }>(
    "/storage/buckets/*",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { bucket, key } = parseBucketKey(request.params["*"]);
      if (key) {
        return forward(request, reply, `/${bucket}/${key}${queryOf(request)}`, "DELETE");
      }
      return forward(request, reply, `/${bucket}${queryOf(request)}`, "DELETE");
    },
  );

  fastify.post<{ Params: WildcardParams }>(
    "/storage/buckets/*",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { bucket, key } = parseBucketKey(request.params["*"]);
      if (key) {
        return forward(request, reply, `/${bucket}/${key}${queryOf(request)}`, "POST");
      }
      return forward(request, reply, `/${bucket}${queryOf(request)}`, "POST");
    },
  );

  fastify.get<{ Params: WildcardParams }>("/storage/buckets/*", async (request, reply) => {
    const { bucket, key } = parseBucketKey(request.params["*"]);
    const query = queryOf(request);
    const isListingAlias =
      key === "objects" &&
      /[?&](list-type|prefix|delimiter|max-keys|continuation-token|start-after|key-marker|marker|encoding-type|fetch-owner|versions)=/i.test(
        query,
      );

    if (!key || isListingAlias) {
      // Bucket listing: GET /storage/buckets/:bucket?list-type=2
      // Also accept /storage/buckets/:bucket/objects?... used by the web client.
      return forward(request, reply, `/${bucket}${query}`, "GET");
    }
    return forward(request, reply, `/${bucket}/${key}${query}`, "GET");
  });
}
