import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  BaseRepository,
  ConflictError,
  compileTupleDomainToFilter,
  modelRegistry,
  PolicyError,
  type FindOptions,
  type RegisteredModelDescriptor,
} from "@moonwitness/orm";
import type {
  AddonRuntimeController,
  CrewRoleOrPublic,
  ModelAclFlags,
  RecordRuleOperation,
} from "./runtime.js";
import {
  assertReadableFilterFields,
  assertReadableRelations,
  assertWritableActionInputFields,
  assertWritableBodyFields,
  canReadField,
  extractFilterFields,
  parseOrderByFields,
  sanitizeActionResultForRole,
  sanitizeHistoryEntriesForRole,
  sanitizeRecordForRole,
} from "./field-policy.js";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
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
  if (error instanceof PolicyError) {
    return reply.code(error.statusCode).send({ error: error.message, code: error.code });
  }
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

function parseFieldsParam(rawFields?: string): string[] | undefined {
  if (!rawFields?.trim()) return undefined;
  const list = rawFields
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

function applyFieldProjection(
  record: Record<string, unknown>,
  projectedFields: string[] | undefined,
  withRels: string[] | undefined,
): Record<string, unknown> {
  if (!projectedFields || projectedFields.length === 0) return record;
  const allowedKeys = new Set(projectedFields);
  for (const relPath of withRels ?? []) {
    const topRel = relPath.split(".")[0]?.trim();
    if (topRel) allowedKeys.add(`$${topRel}`);
  }
  const projected: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (allowedKeys.has(key)) {
      projected[key] = value;
    }
  }
  return projected;
}

const SQL_METADATA_COLUMNS = new Set([
  "id",
  "create_uid",
  "create_date",
  "write_uid",
  "write_date",
  "status",
  "deleted_uid",
  "deleted_date",
  "version",
  "source",
  "source_ref",
  "tenant_id",
]);

function canProjectSqlColumns(desc: RegisteredModelDescriptor, projectedFields: string[]): boolean {
  return projectedFields.every(
    (col) => (desc.fields.has(col) || SQL_METADATA_COLUMNS.has(col)) && col !== "_attrs",
  );
}

function parseDomainParam(rawDomain?: string): Record<string, unknown> | null {
  if (!rawDomain?.trim()) return null;
  const parsed = JSON.parse(rawDomain) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Query parameter 'domain' must be a JSON array of tuple clauses.");
  }
  return compileTupleDomainToFilter(parsed);
}

function readableSearchFields(
  desc: RegisteredModelDescriptor,
  role: CrewRoleOrPublic,
  effectiveGroups?: Set<string>,
): string[] {
  const baseColumns = desc.searchFields?.length
    ? desc.searchFields
    : [...desc.fields.entries()]
        .filter(([name, spec]) => spec.codec === "text" && name !== "_attrs")
        .map(([name]) => name);
  return baseColumns.filter((field) => canReadField(desc, field, role, effectiveGroups));
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
  const actorGroups = auth.getActorGroups?.(request);
  const acl = await runtime.getModelPermissions(target.desc.name, role, actorGroups);
  if (!acl[requiredPerm]) {
    await reply.code(403).send({ error: "Forbidden" });
    return null;
  }
  return target;
}

async function prepareScopedRuleContext(
  runtime: AddonRuntimeController,
  auth: BaseAddonAuthBridge,
  request: FastifyRequest,
  target: NonNullable<ReturnType<typeof repositoryForModel>>,
  operation: RecordRuleOperation,
) {
  const role = auth.getActorRole(request);
  const actorGroups = auth.getActorGroups?.(request);
  const actor = resolveActorContextFromBridge(auth, request);
  const scopedRepo = target.repo.forActor(actor);
  const [evalResult, effectiveGroups] = await Promise.all([
    runtime.evaluateRuleForOperation(target.desc.name, role, actor, operation, actorGroups),
    runtime.resolveEffectiveActorGroups(role, actorGroups),
  ]);
  return { actor, role, actorGroups, effectiveGroups, scopedRepo, evalResult };
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

      try {
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "read",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }

        const query = request.query ?? {};
        const userFilters: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(query)) {
          if (v === undefined) continue;
          if (
            [
              "limit",
              "offset",
              "orderBy",
              "includeDeleted",
              "q",
              "with",
              "domain",
              "fields",
            ].includes(k)
          ) {
            continue;
          }
          if (target.desc.fields.has(k) || k === "status") {
            userFilters[k] = v;
          }
        }

        const projectedFields = parseFieldsParam(query.fields);
        const withRels = parseWithParam(query.with);
        const domainFilter = parseDomainParam(query.domain);
        if (projectedFields) {
          assertReadableFilterFields(target.desc, projectedFields, role, effectiveGroups);
        }
        assertReadableFilterFields(target.desc, Object.keys(userFilters), role, effectiveGroups);
        assertReadableFilterFields(
          target.desc,
          extractFilterFields(domainFilter),
          role,
          effectiveGroups,
        );
        assertReadableFilterFields(
          target.desc,
          parseOrderByFields(query.orderBy),
          role,
          effectiveGroups,
        );
        assertReadableRelations(target.desc, withRels, role, effectiveGroups);

        const filters = mergeWithRuleDomain(
          mergeWithRuleDomain(userFilters, domainFilter),
          evalResult.domain,
        );

        const limit = query.limit ? Math.min(200, Math.max(1, Number(query.limit))) : 50;
        const offset = query.offset ? Math.max(0, Number(query.offset)) : 0;
        const q = query.q?.trim();
        const allowedSearchFields = readableSearchFields(target.desc, role, effectiveGroups);
        const useSqlProjection =
          projectedFields !== undefined && canProjectSqlColumns(target.desc, projectedFields);
        const opts: FindOptions = {
          limit,
          offset,
          includeDeleted: query.includeDeleted === "1" || query.includeDeleted === "true",
          ...(useSqlProjection ? { fields: projectedFields } : {}),
          ...(query.orderBy ? { orderBy: query.orderBy } : {}),
          ...(q ? { q, allowedSearchFields } : {}),
          ...(withRels ? { with: withRels } : {}),
        };

        const rows = await scopedRepo.find(filters, opts);
        let sanitized = rows.map((row) =>
          applyFieldProjection(
            sanitizeRecordForRole(
              target.desc,
              row as unknown as Record<string, unknown>,
              role,
              effectiveGroups,
            ),
            projectedFields,
            withRels,
          ),
        );
        let total: number;
        if (q && (target.desc.searchFields?.length ?? 0) === 0) {
          const needle = q.toLowerCase();
          sanitized = sanitized.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
          total = sanitized.length;
        } else {
          total = await scopedRepo.count(filters, {
            includeDeleted: opts.includeDeleted,
            ...(q ? { q, allowedSearchFields } : {}),
          });
        }
        return reply.send({ data: sanitized, total });
      } catch (error) {
        return handleOrmError(error, reply);
      }
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

      try {
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "read",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }

        const userFilters: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(query)) {
          if (v === undefined) continue;
          if (["groupBy", "orderBy", "includeDeleted", "q", "domain"].includes(k)) continue;
          if (target.desc.fields.has(k) || k === "status") {
            userFilters[k] = v;
          }
        }

        const domainFilter = parseDomainParam(query.domain);
        assertReadableFilterFields(target.desc, groupBy, role, effectiveGroups);
        assertReadableFilterFields(target.desc, Object.keys(userFilters), role, effectiveGroups);
        assertReadableFilterFields(
          target.desc,
          extractFilterFields(domainFilter),
          role,
          effectiveGroups,
        );
        assertReadableFilterFields(
          target.desc,
          parseOrderByFields(query.orderBy),
          role,
          effectiveGroups,
        );

        const filters = mergeWithRuleDomain(
          mergeWithRuleDomain(userFilters, domainFilter),
          evalResult.domain,
        );

        const q = query.q?.trim();
        const allowedSearchFields = q
          ? readableSearchFields(target.desc, role, effectiveGroups)
          : undefined;
        const groups = await scopedRepo.readGroup({
          filters,
          groupBy,
          includeDeleted: query.includeDeleted === "1" || query.includeDeleted === "true",
          ...(q ? { q, allowedSearchFields } : {}),
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
        const actorGroups = auth.getActorGroups?.(request);
        const effectiveGroups = await runtime.resolveEffectiveActorGroups(role, actorGroups);
        const scopedRepo = target.repo.forActor(actor);
        if (actionDef.operation) {
          const evalResult = await runtime.evaluateRuleForOperation(
            target.desc.name,
            role,
            actor,
            actionDef.operation,
            actorGroups,
          );
          if (!evalResult.allowed) {
            return reply.code(403).send({ error: "Forbidden" });
          }
        }
        const rawInput = request.body ?? {};
        if (actionDef.operation !== "read") {
          assertWritableActionInputFields(target.desc, rawInput, role, effectiveGroups);
        }
        const parsedInput = actionDef.input ? actionDef.input.parse(rawInput) : rawInput;
        if (actionDef.operation !== "read") {
          assertWritableActionInputFields(target.desc, parsedInput, role, effectiveGroups);
        }
        const result = await actionDef.handler({
          model: target.desc.name,
          record: null,
          input: parsedInput,
          actor,
          repository: scopedRepo,
        });
        return reply.send({
          data: sanitizeActionResultForRole(target.desc, result, role, effectiveGroups),
        });
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

      try {
        const actionOp = actionDef.operation ?? "update";
        const { actor, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          actionOp,
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const rows = await scopedRepo.find(
          mergeWithRuleDomain({ id: request.params.id }, evalResult.domain),
          { limit: 1 },
        );
        const record = rows[0] as Record<string, unknown> | undefined;
        if (!record) {
          return reply.code(404).send({ error: "Not found" });
        }

        const rawInput = request.body ?? {};
        if (actionOp !== "read") {
          assertWritableActionInputFields(target.desc, rawInput, role, effectiveGroups);
        }
        const parsedInput = actionDef.input ? actionDef.input.parse(rawInput) : rawInput;
        if (actionOp !== "read") {
          assertWritableActionInputFields(target.desc, parsedInput, role, effectiveGroups);
        }
        const result = await actionDef.handler({
          model: target.desc.name,
          record,
          input: parsedInput,
          actor,
          repository: scopedRepo,
        });
        return reply.send({
          data: sanitizeActionResultForRole(target.desc, result, role, effectiveGroups),
        });
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

    try {
      const actor = resolveActorContextFromBridge(auth, request);
      const actorGroups = auth.getActorGroups?.(request);
      const effectiveGroups = await runtime.resolveEffectiveActorGroups(role, actorGroups);
      const scopedRepo = target.repo.forActor(actor);
      const scope = actionDef.scope ?? "record";
      let record: Record<string, unknown> | null = null;
      if (scope === "record") {
        const actionOp = actionDef.operation ?? "update";
        const evalResult = await runtime.evaluateRuleForOperation(
          target.desc.name,
          role,
          actor,
          actionOp,
          actorGroups,
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden", code: "AUTH_FORBIDDEN" });
        }
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
        const rows = await scopedRepo.find(
          mergeWithRuleDomain({ id: targetId }, evalResult.domain),
          { limit: 1 },
        );
        record = (rows[0] as Record<string, unknown> | undefined) ?? null;
        if (!record) {
          return reply.code(404).send({ error: "Not found", code: "RECORD_NOT_FOUND" });
        }
      } else if (actionDef.operation) {
        const evalResult = await runtime.evaluateRuleForOperation(
          target.desc.name,
          role,
          actor,
          actionDef.operation,
          actorGroups,
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden", code: "AUTH_FORBIDDEN" });
        }
      }

      const rawInput =
        body.kwargs ?? (scope === "model" ? (body.args?.[0] ?? {}) : (body.args?.[1] ?? {}));
      const effectiveOp = actionDef.operation ?? (scope === "record" ? "update" : undefined);
      if (effectiveOp !== "read") {
        assertWritableActionInputFields(target.desc, rawInput, role, effectiveGroups);
      }
      const parsedInput = actionDef.input ? actionDef.input.parse(rawInput) : rawInput;
      if (effectiveOp !== "read") {
        assertWritableActionInputFields(target.desc, parsedInput, role, effectiveGroups);
      }
      const result = await actionDef.handler({
        model: target.desc.name,
        record,
        input: parsedInput,
        actor,
        repository: scopedRepo,
      });
      return reply.send({
        result: sanitizeActionResultForRole(target.desc, result, role, effectiveGroups),
      });
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

    try {
      const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
        runtime,
        auth,
        request,
        target,
        "read",
      );
      if (!evalResult.allowed) {
        return reply.code(403).send({ error: "Forbidden" });
      }
      const projectedFields = parseFieldsParam(request.query?.fields);
      const withRels = parseWithParam(request.query?.with);
      if (projectedFields) {
        assertReadableFilterFields(target.desc, projectedFields, role, effectiveGroups);
      }
      assertReadableRelations(target.desc, withRels, role, effectiveGroups);
      const useSqlProjection =
        projectedFields !== undefined && canProjectSqlColumns(target.desc, projectedFields);
      const rows = await scopedRepo.find(
        mergeWithRuleDomain({ id: request.params.id }, evalResult.domain),
        {
          limit: 1,
          ...(useSqlProjection ? { fields: projectedFields } : {}),
          ...(withRels ? { with: withRels } : {}),
        },
      );
      const row = rows[0];
      if (!row) return reply.code(404).send({ error: "Not found" });
      return reply.send({
        data: applyFieldProjection(
          sanitizeRecordForRole(
            target.desc,
            row as unknown as Record<string, unknown>,
            role,
            effectiveGroups,
          ),
          projectedFields,
          withRels,
        ),
      });
    } catch (error) {
      return handleOrmError(error, reply);
    }
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
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "create",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const body = request.body ?? {};
        assertWritableBodyFields(target.desc, body, role, effectiveGroups);
        const created = await scopedRepo.create(body, { createRuleDomain: evalResult.domain });
        return reply.code(201).send({
          data: sanitizeRecordForRole(
            target.desc,
            created as unknown as Record<string, unknown>,
            role,
            effectiveGroups,
          ),
        });
      } catch (error) {
        return handleOrmError(error, reply);
      }
    },
  );

  fastify.post<{
    Params: { model: string };
    Body: { where?: Record<string, unknown>; values?: Record<string, unknown> };
  }>("/m/:model/upsert", { preHandler }, async (request, reply) => {
    const target = repositoryForModel(request.params.model);
    if (!target) {
      return reply.code(404).send({ error: `Model '${request.params.model}' is not REST-enabled` });
    }
    if (!runtime.isModelEnabled(target.desc.name)) {
      return reply.code(503).send({
        error: `Addon for model '${target.desc.name}' is disabled`,
        code: "ADDON_DISABLED",
      });
    }

    const body = request.body ?? {};
    const where = body.where;
    const values = body.values;
    if (
      !where ||
      typeof where !== "object" ||
      Array.isArray(where) ||
      Object.keys(where).length === 0 ||
      !values ||
      typeof values !== "object" ||
      Array.isArray(values)
    ) {
      return reply.code(400).send({ error: "Upsert body requires 'where' and 'values' objects" });
    }

    const role = auth.getActorRole(request);
    const actorGroups = auth.getActorGroups?.(request);
    const actor = resolveActorContextFromBridge(auth, request);

    try {
      const [acl, effectiveGroups, createEval, updateEval] = await Promise.all([
        runtime.getModelPermissions(target.desc.name, role, actorGroups),
        runtime.resolveEffectiveActorGroups(role, actorGroups),
        runtime.evaluateRuleForOperation(target.desc.name, role, actor, "create", actorGroups),
        runtime.evaluateRuleForOperation(target.desc.name, role, actor, "update", actorGroups),
      ]);
      if (!acl.canCreate && !acl.canUpdate) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      assertReadableFilterFields(target.desc, Object.keys(where), role, effectiveGroups);
      assertWritableBodyFields(target.desc, values, role, effectiveGroups);

      const scopedRepo = target.repo.forActor(actor);
      const existingRows = await scopedRepo.find(where, { limit: 1 });
      if (existingRows.length > 0) {
        if (!acl.canUpdate || !updateEval.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
      } else {
        if (!acl.canCreate || !createEval.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const nonIdWhere: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(where)) {
          if (k !== "id") nonIdWhere[k] = v;
        }
        assertWritableBodyFields(target.desc, nonIdWhere, role, effectiveGroups);
      }

      const upserted = await scopedRepo.upsert(where, values, {
        createRuleDomain: createEval.domain,
        ruleDomain: updateEval.domain,
      });
      return reply.send({
        data: sanitizeRecordForRole(
          target.desc,
          upserted as unknown as Record<string, unknown>,
          role,
          effectiveGroups,
        ),
      });
    } catch (error) {
      return handleOrmError(error, reply);
    }
  });

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
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "update",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const body = request.body ?? {};
        assertWritableBodyFields(target.desc, body, role, effectiveGroups);
        const updated = await scopedRepo.update(request.params.id, body, {
          ruleDomain: evalResult.domain,
        });
        if (!updated) return reply.code(404).send({ error: "Not found" });
        return reply.send({
          data: sanitizeRecordForRole(
            target.desc,
            updated as unknown as Record<string, unknown>,
            role,
            effectiveGroups,
          ),
        });
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

      try {
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "update",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const row = await scopedRepo.archive(request.params.id, {
          ruleDomain: evalResult.domain,
        });
        if (!row) return reply.code(404).send({ error: "Not found" });
        return reply.send({
          data: sanitizeRecordForRole(
            target.desc,
            row as unknown as Record<string, unknown>,
            role,
            effectiveGroups,
          ),
        });
      } catch (error) {
        return handleOrmError(error, reply);
      }
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

      try {
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "update",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const row = await scopedRepo.restore(request.params.id, {
          ruleDomain: evalResult.domain,
        });
        if (!row) return reply.code(404).send({ error: "Not found" });
        return reply.send({
          data: sanitizeRecordForRole(
            target.desc,
            row as unknown as Record<string, unknown>,
            role,
            effectiveGroups,
          ),
        });
      } catch (error) {
        return handleOrmError(error, reply);
      }
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
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "delete",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const row = await scopedRepo.delete(request.params.id, {
          ruleDomain: evalResult.domain,
        });
        if (!row) return reply.code(404).send({ error: "Not found" });
        return reply.send({
          data: sanitizeRecordForRole(
            target.desc,
            row as unknown as Record<string, unknown>,
            role,
            effectiveGroups,
          ),
        });
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

      try {
        const { role, effectiveGroups, scopedRepo, evalResult } = await prepareScopedRuleContext(
          runtime,
          auth,
          request,
          target,
          "read",
        );
        if (!evalResult.allowed) {
          return reply.code(403).send({ error: "Forbidden" });
        }
        const rows = await scopedRepo.find(
          mergeWithRuleDomain({ id: request.params.id }, evalResult.domain),
          { limit: 1, includeDeleted: true },
        );
        if (!rows[0]) return reply.code(404).send({ error: "Not found" });
        const entries = await scopedRepo.history(request.params.id);
        return reply.send({
          data: sanitizeHistoryEntriesForRole(target.desc, entries, role, effectiveGroups),
        });
      } catch (error) {
        return handleOrmError(error, reply);
      }
    },
  );
}
