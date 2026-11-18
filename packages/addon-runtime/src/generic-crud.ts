import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  BaseRepository,
  ConflictError,
  modelRegistry,
  type FindOptions,
} from "@moonwitness/orm";
import type { AddonRuntimeController, ModelAclFlags } from "./runtime.js";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type BaseAddonAuthBridge,
} from "./host-context.js";

export { defaultFailClosedAuthBridge, type BaseAddonAuthBridge };

function repositoryForModel(modelName: string) {
  const desc = modelRegistry.get(modelName);
  if (!desc || !desc.restEnabled) return null;
  return {
    desc,
    repo: new BaseRepository(desc.name, desc.table, desc.fullSchema, desc.softDelete, desc.fields),
  };
}

function handleOrmError(error: unknown, reply: FastifyReply): FastifyReply {
  if (error instanceof ConflictError) {
    return reply.code(409).send({ error: error.message, code: "CONFLICT" });
  }
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: error.issues[0]?.message ?? "Validation failed",
      issues: error.issues,
    });
  }
  const msg = error instanceof Error ? error.message : String(error);
  return reply.code(400).send({ error: msg });
}

async function authorizeModelAccess(
  runtime: AddonRuntimeController,
  auth: BaseAddonAuthBridge,
  request: FastifyRequest,
  reply: FastifyReply,
  modelName: string,
  requiredPerm: keyof ModelAclFlags,
) {
  const target = repositoryForModel(modelName);
  if (!target) {
    await reply.code(404).send({ error: `Model '${modelName}' is not REST-enabled` });
    return null;
  }
  if (!runtime.isModelEnabled(target.desc.name)) {
    await reply.code(503).send({
      error: `Addon for model '${target.desc.name}' is disabled`,
      code: "ADDON_DISABLED",
    });
    return null;
  }
  const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
  if (!acl[requiredPerm]) {
    await reply.code(403).send({ error: "Forbidden" });
    return null;
  }
  return target;
}

export async function registerGenericModelRoutes(
  fastify: FastifyInstance,
  runtime: AddonRuntimeController,
  auth: BaseAddonAuthBridge = defaultFailClosedAuthBridge,
): Promise<void> {
  const preHandler = auth.authenticate;

  fastify.get<{ Params: { model: string }; Querystring: Record<string, string | undefined> }>(
    "/m/:model",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canRead",
      );
      if (!target) return reply;

      const query = request.query ?? {};
      const filters: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        if (["limit", "offset", "orderBy", "includeDeleted", "q"].includes(k)) continue;
        if (target.desc.fields.has(k) || k === "status") {
          filters[k] = v;
        }
      }

      const tenantId = resolveActorTenantFromBridge(auth, request);
      const limit = query.limit ? Math.min(200, Math.max(1, Number(query.limit))) : 50;
      const offset = query.offset ? Math.max(0, Number(query.offset)) : 0;
      const opts: FindOptions = {
        limit,
        offset,
        tenantId,
        includeDeleted: query.includeDeleted === "1" || query.includeDeleted === "true",
        ...(query.orderBy ? { orderBy: query.orderBy } : {}),
      };

      const rows = await target.repo.find(filters, opts);
      let filtered = rows as unknown as Array<Record<string, unknown>>;
      if (query.q?.trim()) {
        const needle = query.q.trim().toLowerCase();
        filtered = filtered.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
      }
      const total = query.q?.trim()
        ? filtered.length
        : await target.repo.count(filters, { includeDeleted: opts.includeDeleted, tenantId });
      return reply.send({ data: filtered, total });
    },
  );

  fastify.get<{ Params: { model: string; id: string } }>(
    "/m/:model/:id",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canRead",
      );
      if (!target) return reply;

      const tenantId = resolveActorTenantFromBridge(auth, request);
      const row = await target.repo.findOne(request.params.id, { tenantId });
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.post<{ Params: { model: string }; Body: Record<string, unknown> }>(
    "/m/:model",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canCreate",
      );
      if (!target) return reply;

      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const created = await target.repo.create(request.body ?? {}, actor);
        return reply.code(201).send({ data: created });
      } catch (error) {
        return handleOrmError(error, reply);
      }
    },
  );

  fastify.patch<{ Params: { model: string; id: string }; Body: Record<string, unknown> }>(
    "/m/:model/:id",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canUpdate",
      );
      if (!target) return reply;

      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const updated = await target.repo.update(request.params.id, request.body ?? {}, actor);
        if (!updated) return reply.code(404).send({ error: "Not found" });
        return reply.send({ data: updated });
      } catch (error) {
        return handleOrmError(error, reply);
      }
    },
  );

  fastify.post<{ Params: { model: string; id: string } }>(
    "/m/:model/:id/archive",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canUpdate",
      );
      if (!target) return reply;

      const actor = resolveActorContextFromBridge(auth, request);
      const row = await target.repo.archive(request.params.id, actor);
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.post<{ Params: { model: string; id: string } }>(
    "/m/:model/:id/restore",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canUpdate",
      );
      if (!target) return reply;

      const actor = resolveActorContextFromBridge(auth, request);
      const row = await target.repo.restore(request.params.id, actor);
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.delete<{ Params: { model: string; id: string } }>(
    "/m/:model/:id",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canDelete",
      );
      if (!target) return reply;

      const actor = resolveActorContextFromBridge(auth, request);
      const row = await target.repo.delete(request.params.id, actor);
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.get<{ Params: { model: string; id: string } }>(
    "/m/:model/:id/history",
    { preHandler },
    async (request, reply) => {
      const target = await authorizeModelAccess(
        runtime,
        auth,
        request,
        reply,
        request.params.model,
        "canRead",
      );
      if (!target) return reply;

      const tenantId = resolveActorTenantFromBridge(auth, request);
      const row = await target.repo.findOne(request.params.id, {
        includeDeleted: true,
        tenantId,
      });
      if (!row) return reply.code(404).send({ error: "Not found" });
      const entries = await target.repo.history(request.params.id);
      return reply.send({ data: entries });
    },
  );
}
