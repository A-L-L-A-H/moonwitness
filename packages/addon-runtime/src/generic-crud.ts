import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  BaseRepository,
  ConflictError,
  compileTupleDomainToFilter,
  modelRegistry,
  type ActorContext,
  type FindOptions,
} from "@moonwitness/orm";
import type { AddonRuntimeController, CrewRoleOrPublic, ModelAclFlags } from "./runtime.js";
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

function mergeWithRuleDomain(
  userFilters: Record<string, unknown>,
  ruleDomain: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!ruleDomain || Object.keys(ruleDomain).length === 0) return userFilters;
  if (Object.keys(userFilters).length === 0) return ruleDomain;
  return { $and: [userFilters, ruleDomain] };
}

function parseWithParam(rawWith?: string): string[] | undefined {
  if (!rawWith?.trim()) return undefined;
  const list = rawWith
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  return list.length > 0 ? list : undefined;
}

function parseDomainParam(rawDomain?: string): Record<string, unknown> | null {
  if (!rawDomain?.trim()) return null;
  const parsed = JSON.parse(rawDomain) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Query parameter 'domain' must be a JSON array of tuple clauses.");
  }
  return compileTupleDomainToFilter(parsed);
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
  const role = auth.getActorRole(request);
  const acl = await runtime.getModelPermissions(target.desc.name, role);
  if (!acl[requiredPerm]) {
    await reply.code(403).send({ error: "Forbidden" });
    return null;
  }
  return target;
}

async function ensureRecordMatchesRuleDomain(
  runtime: AddonRuntimeController,
  target: NonNullable<ReturnType<typeof repositoryForModel>>,
  id: string,
  role: CrewRoleOrPublic,
  actor: ActorContext,
  options: { includeDeleted?: boolean; with?: string[] } = {},
) {
  const ruleDomain = await runtime.getModelRuleDomain(target.desc.name, role, actor);
  const filters = mergeWithRuleDomain({ id }, ruleDomain);
  const rows = await target.repo.find(filters, {
    limit: 1,
    tenantId: actor.tenantId,
    includeDeleted: options.includeDeleted,
    ...(options.with ? { with: options.with } : {}),
  });
  return rows[0] ?? null;
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
      const userFilters: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        if (["limit", "offset", "orderBy", "includeDeleted", "q", "with", "domain"].includes(k)) {
          continue;
        }
        if (target.desc.fields.has(k) || k === "status") {
          userFilters[k] = v;
        }
      }

      let domainFilter: Record<string, unknown> | null;
      try {
        domainFilter = parseDomainParam(query.domain);
      } catch (error) {
        return handleOrmError(error, reply);
      }

      const actor = resolveActorContextFromBridge(auth, request);
      const role = auth.getActorRole(request);
      const ruleDomain = await runtime.getModelRuleDomain(target.desc.name, role, actor);
      const filters = mergeWithRuleDomain(
        mergeWithRuleDomain(userFilters, domainFilter),
        ruleDomain,
      );

      const tenantId = actor.tenantId ?? resolveActorTenantFromBridge(auth, request);
      const limit = query.limit ? Math.min(200, Math.max(1, Number(query.limit))) : 50;
      const offset = query.offset ? Math.max(0, Number(query.offset)) : 0;
      const q = query.q?.trim();
      const withRels = parseWithParam(query.with);
      const opts: FindOptions = {
        limit,
        offset,
        tenantId,
        includeDeleted: query.includeDeleted === "1" || query.includeDeleted === "true",
        ...(query.orderBy ? { orderBy: query.orderBy } : {}),
        ...(q ? { q } : {}),
        ...(withRels ? { with: withRels } : {}),
      };

      const rows = await target.repo.find(filters, opts);
      let filtered = rows as unknown as Array<Record<string, unknown>>;
      let total: number;
      if (q && (target.desc.searchFields?.length ?? 0) === 0) {
        const needle = q.toLowerCase();
        filtered = filtered.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
        total = filtered.length;
      } else {
        total = await target.repo.count(filters, {
          includeDeleted: opts.includeDeleted,
          tenantId,
          ...(q ? { q } : {}),
        });
      }
      return reply.send({ data: filtered, total });
    },
  );

  fastify.get<{ Params: { model: string }; Querystring: Record<string, string | undefined> }>(
    "/m/:model/read-group",
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
      const groupByRaw = query.groupBy ?? "";
      const groupBy = groupByRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (groupBy.length === 0) {
        return reply.code(400).send({ error: "Query parameter 'groupBy' is required" });
      }

      const userFilters: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        if (["groupBy", "orderBy", "includeDeleted", "q", "domain"].includes(k)) continue;
        if (target.desc.fields.has(k) || k === "status") {
          userFilters[k] = v;
        }
      }

      let domainFilter: Record<string, unknown> | null;
      try {
        domainFilter = parseDomainParam(query.domain);
      } catch (error) {
        return handleOrmError(error, reply);
      }

      const actor = resolveActorContextFromBridge(auth, request);
      const role = auth.getActorRole(request);
      const ruleDomain = await runtime.getModelRuleDomain(target.desc.name, role, actor);
      const filters = mergeWithRuleDomain(
        mergeWithRuleDomain(userFilters, domainFilter),
        ruleDomain,
      );
      const tenantId = actor.tenantId ?? resolveActorTenantFromBridge(auth, request);

      try {
        const groups = await target.repo.readGroup({
          filters,
          groupBy,
          tenantId,
          includeDeleted: query.includeDeleted === "1" || query.includeDeleted === "true",
          ...(query.q?.trim() ? { q: query.q.trim() } : {}),
          ...(query.orderBy ? { orderBy: query.orderBy } : {}),
        });
        return reply.send({ groups });
      } catch (error) {
        return handleOrmError(error, reply);
      }
    },
  );

  fastify.post<{ Params: { model: string; action: string }; Body: unknown }>(
    "/m/:model/call/:action",
    { preHandler },
    async (request, reply) => {
      const target = repositoryForModel(request.params.model);
      if (!target) {
        return reply
          .code(404)
          .send({ error: `Model '${request.params.model}' is not REST-enabled` });
      }
      if (!runtime.isModelEnabled(target.desc.name)) {
        return reply.code(503).send({
          error: `Addon for model '${target.desc.name}' is disabled`,
          code: "ADDON_DISABLED",
        });
      }

      const actionDef = target.desc.actions?.[request.params.action];
      if (!actionDef || (actionDef.scope ?? "record") !== "model") {
        return reply.code(404).send({ error: `Model action '${request.params.action}' not found` });
      }

      const role = auth.getActorRole(request);
      const allowedRoles = actionDef.roles ?? ["editor", "admin"];
      if (!allowedRoles.includes(role)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const parsedInput = actionDef.input
          ? actionDef.input.parse(request.body ?? {})
          : (request.body ?? {});
        const result = await actionDef.handler({
          model: target.desc.name,
          record: null,
          input: parsedInput,
          actor,
          repository: target.repo,
        });
        return reply.send({ data: result });
      } catch (error) {
        return handleOrmError(error, reply);
      }
    },
  );

  fastify.post<{ Params: { model: string; id: string; action: string }; Body: unknown }>(
    "/m/:model/:id/call/:action",
    { preHandler },
    async (request, reply) => {
      const target = repositoryForModel(request.params.model);
      if (!target) {
        return reply
          .code(404)
          .send({ error: `Model '${request.params.model}' is not REST-enabled` });
      }
      if (!runtime.isModelEnabled(target.desc.name)) {
        return reply.code(503).send({
          error: `Addon for model '${target.desc.name}' is disabled`,
          code: "ADDON_DISABLED",
        });
      }

      const actionDef = target.desc.actions?.[request.params.action];
      if (!actionDef || (actionDef.scope ?? "record") !== "record") {
        return reply
          .code(404)
          .send({ error: `Record action '${request.params.action}' not found` });
      }

      const role = auth.getActorRole(request);
      const allowedRoles = actionDef.roles ?? ["editor", "admin"];
      if (!allowedRoles.includes(role)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const actor = resolveActorContextFromBridge(auth, request);
      const record = await ensureRecordMatchesRuleDomain(
        runtime,
        target,
        request.params.id,
        role,
        actor,
      );
      if (!record) {
        return reply.code(404).send({ error: "Not found" });
      }

      try {
        const parsedInput = actionDef.input
          ? actionDef.input.parse(request.body ?? {})
          : (request.body ?? {});
        const result = await actionDef.handler({
          model: target.desc.name,
          record,
          input: parsedInput,
          actor,
          repository: target.repo,
        });
        return reply.send({ data: result });
      } catch (error) {
        return handleOrmError(error, reply);
      }
    },
  );

  fastify.post<{
    Body: {
      model?: string;
      method?: string;
      id?: string;
      args?: unknown[];
      kwargs?: Record<string, unknown>;
    };
  }>("/rpc", { preHandler }, async (request, reply) => {
    const body = request.body ?? {};
    const modelName = typeof body.model === "string" ? body.model.trim() : "";
    const methodName = typeof body.method === "string" ? body.method.trim() : "";
    if (!modelName || !methodName) {
      return reply.code(400).send({
        error: "RPC body requires 'model' and 'method'",
        code: "INVALID_REQUEST",
      });
    }

    const target = repositoryForModel(modelName);
    if (!target) {
      return reply.code(404).send({
        error: `Model '${modelName}' is not REST-enabled`,
        code: "MODEL_NOT_FOUND",
      });
    }
    if (!runtime.isModelEnabled(target.desc.name)) {
      return reply.code(503).send({
        error: `Addon for model '${target.desc.name}' is disabled`,
        code: "ADDON_DISABLED",
      });
    }

    const actionDef = target.desc.actions?.[methodName];
    if (!actionDef) {
      return reply.code(403).send({
        error: `Method '${methodName}' is not registered for RPC on '${modelName}'`,
        code: "FORBIDDEN_METHOD",
      });
    }

    const role = auth.getActorRole(request);
    const allowedRoles = actionDef.roles ?? ["editor", "admin"];
    if (!allowedRoles.includes(role)) {
      return reply.code(403).send({ error: "Forbidden", code: "AUTH_FORBIDDEN" });
    }

    const actor = resolveActorContextFromBridge(auth, request);
    const scope = actionDef.scope ?? "record";
    let record: Record<string, unknown> | null = null;
    if (scope === "record") {
      const targetId =
        typeof body.id === "string"
          ? body.id
          : typeof body.args?.[0] === "string"
            ? body.args[0]
            : "";
      if (!targetId) {
        return reply.code(400).send({
          error: `Record action '${methodName}' requires 'id' or args[0]`,
          code: "INVALID_REQUEST",
        });
      }
      record = (await ensureRecordMatchesRuleDomain(
        runtime,
        target,
        targetId,
        role,
        actor,
      )) as Record<string, unknown> | null;
      if (!record) {
        return reply.code(404).send({ error: "Not found", code: "RECORD_NOT_FOUND" });
      }
    }

    try {
      const rawInput =
        body.kwargs ?? (scope === "model" ? (body.args?.[0] ?? {}) : (body.args?.[1] ?? {}));
      const parsedInput = actionDef.input ? actionDef.input.parse(rawInput) : rawInput;
      const result = await actionDef.handler({
        model: target.desc.name,
        record,
        input: parsedInput,
        actor,
        repository: target.repo,
      });
      return reply.send({ result });
    } catch (error) {
      return handleOrmError(error, reply);
    }
  });

  fastify.get<{
    Params: { model: string; id: string };
    Querystring: Record<string, string | undefined>;
  }>("/m/:model/:id", { preHandler }, async (request, reply) => {
    const target = await authorizeModelAccess(
      runtime,
      auth,
      request,
      reply,
      request.params.model,
      "canRead",
    );
    if (!target) return reply;

    const actor = resolveActorContextFromBridge(auth, request);
    const role = auth.getActorRole(request);
    const row = await ensureRecordMatchesRuleDomain(
      runtime,
      target,
      request.params.id,
      role,
      actor,
      { with: parseWithParam(request.query?.with) },
    );
    if (!row) return reply.code(404).send({ error: "Not found" });
    return reply.send({ data: row });
  });

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
        const role = auth.getActorRole(request);
        const current = await ensureRecordMatchesRuleDomain(
          runtime,
          target,
          request.params.id,
          role,
          actor,
        );
        if (!current) return reply.code(404).send({ error: "Not found" });
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
      const role = auth.getActorRole(request);
      const current = await ensureRecordMatchesRuleDomain(
        runtime,
        target,
        request.params.id,
        role,
        actor,
      );
      if (!current) return reply.code(404).send({ error: "Not found" });
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
      const role = auth.getActorRole(request);
      const current = await ensureRecordMatchesRuleDomain(
        runtime,
        target,
        request.params.id,
        role,
        actor,
        { includeDeleted: true },
      );
      if (!current) return reply.code(404).send({ error: "Not found" });
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

      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const role = auth.getActorRole(request);
        const current = await ensureRecordMatchesRuleDomain(
          runtime,
          target,
          request.params.id,
          role,
          actor,
        );
        if (!current) return reply.code(404).send({ error: "Not found" });
        const row = await target.repo.delete(request.params.id, actor);
        if (!row) return reply.code(404).send({ error: "Not found" });
        return reply.send({ data: row });
      } catch (error) {
        return handleOrmError(error, reply);
      }
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

      const actor = resolveActorContextFromBridge(auth, request);
      const role = auth.getActorRole(request);
      const row = await ensureRecordMatchesRuleDomain(
        runtime,
        target,
        request.params.id,
        role,
        actor,
        { includeDeleted: true },
      );
      if (!row) return reply.code(404).send({ error: "Not found" });
      const entries = await target.repo.history(request.params.id);
      return reply.send({ data: entries });
    },
  );
}
