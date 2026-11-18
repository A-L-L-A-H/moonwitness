import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ConflictError, createActorContext } from "@moonwitness/orm";
import { z } from "@moonwitness/core";
import {
  MemorySyncBatchPayloadSchema,
  type MemorySyncRecordPayload,
} from "@moonwitness/contracts/continuity";
import { memoryRecordModel } from "../../infrastructure/persistence/domain";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../middleware/auth";
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

const memoryEntriesQuerySchema = z.object({
  q: z.string().max(200).optional(),
  kind: z.string().min(1).max(80).optional(),
  scope: z.string().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const memoryEntryCreateSchema = z.object({
  record_key: z.string().min(1).max(200).optional(),
  owner_id: z.string().max(200).nullable().optional(),
  scope: z.string().min(1).max(80).default("global"),
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(300),
  summary: z.string().max(4000).nullable().optional(),
  content: z.string().nullable().optional(),
  tags: z.array(z.string().max(80)).max(50).optional(),
  tags_json: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  metadata_json: z.string().nullable().optional(),
  retention_days: z.number().int().positive().nullable().optional(),
  expires_at: z.string().nullable().optional(),
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

function toMemoryRecordData(item: MemorySyncRecordPayload, ownerIdFallback: string | null) {
  const recordKey = (item.record_key ?? item.id ?? "").trim().slice(0, 200);
  return {
    record_key: recordKey,
    owner_id: item.owner_id ?? ownerIdFallback,
    scope: (item.scope ?? (item.archive_id ? "archive" : "global")).slice(0, 80),
    kind: (item.kind || "note").slice(0, 80),
    title: (item.title || recordKey).slice(0, 300),
    summary: item.summary ? item.summary.slice(0, 4000) : null,
    content: item.content || null,
    tags_json: JSON.stringify(item.tags ?? []),
    metadata_json: JSON.stringify({
      archive_id: item.archive_id ?? null,
      conversation_id: item.conversation_id ?? null,
      confidence: item.confidence,
      entities: item.entities ?? [],
      source_message_ids: item.source_message_ids ?? [],
      ...(item.metadata ?? {}),
    }),
    retention_days: item.retention_days ?? null,
    expires_at: item.expires_at ?? null,
  };
}

function resolveConfiguredSyncToken(): string {
  const raw =
    typeof process !== "undefined" && process.env.MOONWITNESS_SYNC_TOKEN !== undefined
      ? process.env.MOONWITNESS_SYNC_TOKEN
      : env.MOONWITNESS_SYNC_TOKEN;
  return raw?.trim() ?? "";
}

function matchesSyncBearerToken(request: FastifyRequest): boolean {
  const configured = resolveConfiguredSyncToken();
  if (!configured) return false;
  const authHeader = request.headers.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const provided = authHeader.slice(7).trim();
  if (!provided) return false;
  const expectedDigest = createHash("sha256").update(configured, "utf8").digest();
  const actualDigest = createHash("sha256").update(provided, "utf8").digest();
  return timingSafeEqual(expectedDigest, actualDigest);
}

async function mirrorMemoryRecords(
  request: FastifyRequest,
  records: z.infer<typeof memoryKnowledgeListSchema>,
): Promise<void> {
  try {
    const authUser = (request as AuthenticatedRequest).user;
    const ownerId = authUser ? String(authUser.id) : null;
    const actor = createActorContext(ownerId, "api", request.id);
    for (const item of records.slice(0, 25)) {
      const payload = toMemoryRecordData(item, ownerId);
      if (!payload.record_key) continue;
      await memoryRecordModel.repository.upsert({ record_key: payload.record_key }, payload, actor);
    }
  } catch {
    // Best-effort ORM mirror for memory knowledge search results
  }
}

export async function memoryRoutes(fastify: FastifyInstance): Promise<void> {
  const authenticate = requireAuth();
  const requireWriteRole = requireRole("admin", "editor");

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

  fastify.get(
    "/memory/entries",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header("cache-control", "no-store");
      const parsed = memoryEntriesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid memory entries query",
        });
      }

      const { q, kind, scope, limit, offset } = parsed.data;
      const filters: Record<string, unknown> = {};
      if (kind?.trim()) filters.kind = kind.trim();
      if (scope?.trim()) filters.scope = scope.trim();

      const needle = q?.trim().toLowerCase() ?? "";
      if (!needle) {
        const [data, total] = await Promise.all([
          memoryRecordModel.repository.find(filters, {
            limit,
            offset,
            orderBy: [{ field: "write_date", direction: "DESC" }],
          }),
          memoryRecordModel.repository.count(filters),
        ]);
        return reply.code(200).send({ data, total, limit, offset });
      }

      const candidates = await memoryRecordModel.repository.find(filters, {
        limit: 500,
        orderBy: [{ field: "write_date", direction: "DESC" }],
      });
      const matched = candidates.filter((entry) => {
        const haystack = [
          entry.record_key,
          entry.title,
          entry.summary ?? "",
          entry.content ?? "",
          entry.tags_json ?? "",
        ]
          .join("\n")
          .toLowerCase();
        return haystack.includes(needle);
      });
      return reply.code(200).send({
        data: matched.slice(offset, offset + limit),
        total: matched.length,
        limit,
        offset,
      });
    },
  );

  fastify.post(
    "/memory/entries",
    { preHandler: requireWriteRole },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = memoryEntryCreateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid memory record payload",
        });
      }

      const authUser = (request as AuthenticatedRequest).user;
      const ownerId = authUser ? String(authUser.id) : null;
      const actor = createActorContext(ownerId, "api", request.id);
      const body = parsed.data;
      const recordKey = (body.record_key ?? `mem-${randomUUID()}`).trim().slice(0, 200);

      try {
        const created = await memoryRecordModel.repository.create(
          {
            record_key: recordKey,
            owner_id: body.owner_id !== undefined ? body.owner_id : ownerId,
            scope: body.scope,
            kind: body.kind.trim().slice(0, 80),
            title: body.title.trim().slice(0, 300),
            summary: body.summary ?? null,
            content: body.content ?? null,
            tags_json:
              body.tags_json !== undefined ? body.tags_json : JSON.stringify(body.tags ?? []),
            metadata_json:
              body.metadata_json !== undefined
                ? body.metadata_json
                : body.metadata
                  ? JSON.stringify(body.metadata)
                  : null,
            retention_days: body.retention_days ?? null,
            expires_at: body.expires_at ?? null,
          },
          actor,
        );
        return reply.code(201).send({ data: created });
      } catch (error) {
        if (
          error instanceof ConflictError ||
          (error instanceof Error && /UNIQUE constraint/i.test(error.message))
        ) {
          return reply.code(409).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  fastify.post(
    "/memory/sync",
    {
      preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
        if (matchesSyncBearerToken(request)) {
          (request as AuthenticatedRequest).user = {
            id: "sync-worker",
            username: "memory-sync",
            email: "sync@moonwitness.local",
            role: "editor",
            displayName: "Memory Sync Worker",
          };
          return;
        }
        await requireWriteRole(request, reply);
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = MemorySyncBatchPayloadSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid memory sync payload",
        });
      }

      const authUser = (request as AuthenticatedRequest).user;
      const actor = createActorContext(
        authUser ? String(authUser.id) : `sync:${parsed.data.source}`,
        "api",
        request.id,
      );

      const syncedKeys: string[] = [];
      for (const item of parsed.data.records) {
        const payload = toMemoryRecordData(item, item.owner_id ?? null);
        if (!payload.record_key) continue;
        await memoryRecordModel.repository.upsert(
          { record_key: payload.record_key },
          payload,
          actor,
        );
        syncedKeys.push(payload.record_key);
      }

      return reply.code(200).send({
        ok: true,
        source: parsed.data.source,
        schema_version: parsed.data.schema_version,
        synced: syncedKeys.length,
        record_keys: syncedKeys,
      });
    },
  );
}
