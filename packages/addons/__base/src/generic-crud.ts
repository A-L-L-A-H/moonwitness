import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  BaseRepository,
  ConflictError,
  createActorContext,
  modelRegistry,
  type FindOptions,
} from "@moonwitness/orm";
import type { AddonRuntimeController, CrewRoleOrPublic } from "./runtime.js";

export interface BaseAddonAuthBridge {
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;
  requireRole: (
    ...roles: Array<"admin" | "editor" | "viewer">
  ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;
  getActorRole: (request: FastifyRequest) => CrewRoleOrPublic;
  getActorId: (request: FastifyRequest) => string | null;
}

export const defaultFailClosedAuthBridge: BaseAddonAuthBridge = {
  authenticate: async (request, reply) => {
    const user = (request as { user?: { id?: unknown; role?: unknown } }).user;
    if (!user) {
      await reply.code(401).send({ error: "Not authenticated" });
    }
  },
  requireRole: (...roles) => {
    return async (request, reply) => {
      const user = (request as { user?: { role?: string } }).user;
      if (!user) {
        await reply.code(401).send({ error: "Not authenticated" });
        return;
      }
      if (!user.role || !roles.includes(user.role as "admin" | "editor" | "viewer")) {
        await reply.code(403).send({ error: "Forbidden: insufficient permissions" });
      }
    };
  },
  getActorRole: (request) => {
    const role = (request as { user?: { role?: string } }).user?.role;
    if (role === "admin" || role === "editor" || role === "viewer") return role;
    return "public";
  },
  getActorId: (request) => {
    const id = (request as { user?: { id?: unknown } }).user?.id;
    return id !== undefined && id !== null ? String(id) : null;
  },
};

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
      const target = repositoryForModel(request.params.model);
      if (!target) {
        return reply
          .code(404)
          .send({ error: `Model '${request.params.model}' is not REST-enabled` });
      }
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canRead) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const query = request.query ?? {};
      const filters: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        if (["limit", "offset", "orderBy", "includeDeleted", "q"].includes(k)) continue;
        if (target.desc.fields.has(k) || k === "status") {
          filters[k] = v;
        }
      }

      const limit = query.limit ? Math.min(200, Math.max(1, Number(query.limit))) : 50;
      const offset = query.offset ? Math.max(0, Number(query.offset)) : 0;
      const opts: FindOptions = {
        limit,
        offset,
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
        : await target.repo.count(filters, { includeDeleted: opts.includeDeleted });
      return reply.send({ data: filtered, total });
    },
  );

  fastify.get<{ Params: { model: string; id: string } }>(
    "/m/:model/:id",
    { preHandler },
    async (request, reply) => {
      const target = repositoryForModel(request.params.model);
      if (!target) {
        return reply
          .code(404)
          .send({ error: `Model '${request.params.model}' is not REST-enabled` });
      }
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canRead) return reply.code(403).send({ error: "Forbidden" });

      const row = await target.repo.findOne(request.params.id);
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.post<{ Params: { model: string }; Body: Record<string, unknown> }>(
    "/m/:model",
    { preHandler },
    async (request, reply) => {
      const target = repositoryForModel(request.params.model);
      if (!target) {
        return reply
          .code(404)
          .send({ error: `Model '${request.params.model}' is not REST-enabled` });
      }
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canCreate) return reply.code(403).send({ error: "Forbidden" });

      try {
        const actor = createActorContext(auth.getActorId(request), "api", request.id);
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
      const target = repositoryForModel(request.params.model);
      if (!target) {
        return reply
          .code(404)
          .send({ error: `Model '${request.params.model}' is not REST-enabled` });
      }
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canUpdate) return reply.code(403).send({ error: "Forbidden" });

      try {
        const actor = createActorContext(auth.getActorId(request), "api", request.id);
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
      const target = repositoryForModel(request.params.model);
      if (!target) return reply.code(404).send({ error: "Model not found" });
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canUpdate) return reply.code(403).send({ error: "Forbidden" });
      const actor = createActorContext(auth.getActorId(request), "api", request.id);
      const row = await target.repo.archive(request.params.id, actor);
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.post<{ Params: { model: string; id: string } }>(
    "/m/:model/:id/restore",
    { preHandler },
    async (request, reply) => {
      const target = repositoryForModel(request.params.model);
      if (!target) return reply.code(404).send({ error: "Model not found" });
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canUpdate) return reply.code(403).send({ error: "Forbidden" });
      const actor = createActorContext(auth.getActorId(request), "api", request.id);
      const row = await target.repo.restore(request.params.id, actor);
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.delete<{ Params: { model: string; id: string } }>(
    "/m/:model/:id",
    { preHandler },
    async (request, reply) => {
      const target = repositoryForModel(request.params.model);
      if (!target) return reply.code(404).send({ error: "Model not found" });
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canDelete) return reply.code(403).send({ error: "Forbidden" });
      const actor = createActorContext(auth.getActorId(request), "api", request.id);
      const row = await target.repo.delete(request.params.id, actor);
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({ data: row });
    },
  );

  fastify.get<{ Params: { model: string; id: string } }>(
    "/m/:model/:id/history",
    { preHandler },
    async (request, reply) => {
      const target = repositoryForModel(request.params.model);
      if (!target) return reply.code(404).send({ error: "Model not found" });
      const acl = await runtime.getModelPermissions(target.desc.name, auth.getActorRole(request));
      if (!acl.canRead) return reply.code(403).send({ error: "Forbidden" });
      const entries = await target.repo.history(request.params.id);
      return reply.send({ data: entries });
    },
  );
}
