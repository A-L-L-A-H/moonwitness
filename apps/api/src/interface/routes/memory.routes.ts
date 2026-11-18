import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createActorContext } from "@moonwitness/orm";
import { z } from "@moonwitness/core";
import { memoryRecordModel } from "../../infrastructure/persistence/domain";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";
import { env, validateMemoryRuntimeConfig } from "../../shared/env";
import { getUpstreamBridgeHeaders } from "../../shared/upstream";

const memorySystemSchema = z.object({
  mode: z.string(),
  gemini_configured: z.boolean(),
  gemini_model: z.string(),
  embeddings_enabled: z.boolean(),
  embedding_model: z.string(),
  drive_configured: z.boolean(),
  moonwitness_sync_configured: z.boolean(),
  max_upload_gb: z.number(),
});

const memoryCountsSchema = z.object({
  archives: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
  knowledge: z.number().int().nonnegative(),
  active_jobs: z.number().int().nonnegative(),
  failed_jobs: z.number().int().nonnegative(),
});

const memoryKnowledgeRecordSchema = z.object({
  id: z.string(),
  archive_id: z.string().optional(),
  conversation_id: z.string().optional(),
  kind: z.string(),
  title: z.string(),
  summary: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  content: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  tags: z.array(z.string()).optional().default([]),
  entities: z.array(z.string()).optional().default([]),
  source_message_ids: z.array(z.string()).optional().default([]),
  confidence: z
    .number()
    .nullish()
    .transform((value) => (typeof value === "number" ? value : 0.5)),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const memoryKnowledgeListSchema = z.array(memoryKnowledgeRecordSchema);

const knowledgeQuerySchema = z.object({
  q: z.string().max(500).optional(),
  limit: z.coerce.number().int().optional(),
});

type MemoryBridgeResolution =
  | { configured: boolean; baseUrl: null; error?: string }
  | { configured: true; baseUrl: string; error?: string };

function resolveMemoryBridge(): MemoryBridgeResolution {
  const envValue =
    typeof process !== "undefined" && process.env.MEMORY_API_URL !== undefined
      ? process.env.MEMORY_API_URL
      : env.MEMORY_API_URL;
  const rawUrl = envValue?.trim();
  if (!rawUrl) {
    return { configured: false, baseUrl: null };
  }
  const problems = validateMemoryRuntimeConfig({ MEMORY_API_URL: rawUrl });
  if (problems.length > 0) {
    return { configured: true, baseUrl: null, error: problems[0] };
  }
  return { configured: true, baseUrl: rawUrl.replace(/\/+$/, "") };
}

class MemoryUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MemoryUpstreamError";
  }
}

async function fetchMemoryJson<T>(url: URL, schema: z.ZodType<T>, timeoutMs: number): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: getUpstreamBridgeHeaders({ accept: "application/json" }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new MemoryUpstreamError(`Archive memory bridge returned HTTP ${response.status}`);
  }
  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new MemoryUpstreamError("Archive memory bridge returned an invalid payload");
  }
  return parsed.data;
}

async function mirrorMemoryRecords(
  request: FastifyRequest,
  records: z.infer<typeof memoryKnowledgeListSchema>,
): Promise<void> {
  try {
    const authUser = (request as AuthenticatedRequest).user;
    const actor = createActorContext(authUser ? String(authUser.id) : null, "api", request.id);
    for (const item of records.slice(0, 25)) {
      const recordKey = item.id.slice(0, 200);
      if (!recordKey) continue;
      await memoryRecordModel.repository.upsert(
        { record_key: recordKey },
        {
          record_key: recordKey,
          owner_id: authUser ? String(authUser.id) : null,
          scope: item.archive_id ? "archive" : "global",
          kind: (item.kind || "note").slice(0, 80),
          title: (item.title || recordKey).slice(0, 300),
          summary: item.summary ? item.summary.slice(0, 4000) : null,
          content: item.content || null,
          tags_json: JSON.stringify(item.tags ?? []),
          metadata_json: JSON.stringify({
            archive_id: item.archive_id ?? null,
            conversation_id: item.conversation_id ?? null,
            confidence: item.confidence,
          }),
          retention_days: null,
          expires_at: null,
        },
        actor,
      );
    }
  } catch {
    // Best-effort ORM mirror for memory knowledge search results
  }
}

export async function memoryRoutes(fastify: FastifyInstance): Promise<void> {
  const authenticate = requireAuth();

  fastify.get(
    "/memory/status",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header("cache-control", "no-store");
      const bridge = resolveMemoryBridge();
      if (!bridge.configured || !bridge.baseUrl) {
        return reply.code(200).send({
          configured: bridge.configured,
          reachable: false,
          system: null,
          counts: null,
          ...(bridge.error ? { error: bridge.error } : {}),
        });
      }

      try {
        const timeoutMs = env.MEMORY_API_TIMEOUT_MS;
        const [system, counts] = await Promise.all([
          fetchMemoryJson(new URL("/api/system", bridge.baseUrl), memorySystemSchema, timeoutMs),
          fetchMemoryJson(new URL("/api/dashboard", bridge.baseUrl), memoryCountsSchema, timeoutMs),
        ]);
        return reply.code(200).send({
          configured: true,
          reachable: true,
          system,
          counts,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Archive memory bridge is unreachable";
        request.log.warn({ err: error }, "memory bridge status check failed");
        return reply.code(200).send({
          configured: true,
          reachable: false,
          system: null,
          counts: null,
          error: message,
        });
      }
    },
  );

  fastify.get(
    "/memory/knowledge",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header("cache-control", "no-store");
      const bridge = resolveMemoryBridge();
      if (!bridge.configured || !bridge.baseUrl) {
        return reply.code(503).send({
          error: bridge.error ?? "Archive memory bridge is not configured",
        });
      }

      const parsedQuery = knowledgeQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        return reply.code(400).send({
          error: parsedQuery.error.issues[0]?.message ?? "Invalid knowledge query parameters",
        });
      }

      const trimmedQuery = parsedQuery.data.q?.trim() ?? "";
      const rawLimit = parsedQuery.data.limit ?? 24;
      const limit = Math.min(100, Math.max(1, rawLimit));

      const upstreamUrl = new URL(trimmedQuery ? "/api/search" : "/api/knowledge", bridge.baseUrl);
      if (trimmedQuery) {
        upstreamUrl.searchParams.set("q", trimmedQuery);
      }
      upstreamUrl.searchParams.set("limit", String(limit));

      try {
        const records = await fetchMemoryJson(
          upstreamUrl,
          memoryKnowledgeListSchema,
          env.MEMORY_API_TIMEOUT_MS,
        );
        await mirrorMemoryRecords(request, records);
        return reply.code(200).send({
          configured: true,
          query: trimmedQuery,
          records,
        });
      } catch (error) {
        request.log.warn({ err: error }, "memory knowledge query failed");
        return reply.code(502).send({
          error:
            error instanceof MemoryUpstreamError
              ? error.message
              : "Failed to query archive memory bridge",
        });
      }
    },
  );

  fastify.get(
    "/memory/export.ndjson",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header("cache-control", "no-store");
      const bridge = resolveMemoryBridge();
      if (!bridge.configured || !bridge.baseUrl) {
        return reply.code(503).send({
          error: bridge.error ?? "Archive memory bridge is not configured",
        });
      }

      try {
        const upstreamUrl = new URL("/api/export.ndjson", bridge.baseUrl);
        const upstream = await fetch(upstreamUrl, {
          method: "GET",
          headers: getUpstreamBridgeHeaders({}, request),
          signal: AbortSignal.timeout(env.MEMORY_API_TIMEOUT_MS),
        });
        if (!upstream.ok) {
          return reply.code(502).send({
            error: `Archive memory export returned HTTP ${upstream.status}`,
          });
        }
        const body = await upstream.text();
        reply.header("content-type", "application/x-ndjson; charset=utf-8");
        reply.header("content-disposition", 'attachment; filename="moonwitness-knowledge.ndjson"');
        return reply.code(200).send(body);
      } catch (error) {
        request.log.warn({ err: error }, "memory ndjson export failed");
        return reply.code(502).send({ error: "Failed to export archive memory knowledge" });
      }
    },
  );
}
