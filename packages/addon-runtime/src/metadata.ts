import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { modelRegistry } from "@moonwitness/orm";
import type { AddonRuntimeController, CrewRoleOrPublic } from "./runtime.js";
import { canReadField } from "./field-policy.js";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  type BaseAddonAuthBridge,
} from "./host-context.js";

function jsonTypeForCodec(codec: string): string {
  switch (codec) {
    case "integer":
      return "integer";
    case "real":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

export function buildMetadataRegistryFromModels(
  runtime: AddonRuntimeController,
  extraModels: RegisteredModel[] = [],
  role: CrewRoleOrPublic = "public",
): MetadataRegistry {
  const models: RegisteredModel[] = [];
  const seen = new Set<string>();
  for (const desc of modelRegistry.list()) {
    if (!desc.publicFields || desc.publicFields.length === 0) continue;
    if (!runtime.isModelEnabled(desc.name)) continue;
    const publicFields = desc.publicFields
      .filter((name) => canReadField(desc, name, role))
      .map((name) => {
        const spec = desc.fields.get(name);
        const type =
          name === "tags" || name === "related"
            ? "string[]"
            : spec
              ? jsonTypeForCodec(spec.codec)
              : "string";
        return { name, type };
      });
    models.push({ name: desc.name, publicFields });
    seen.add(desc.name);
  }
  for (const extra of extraModels) {
    if (!seen.has(extra.name)) {
      seen.add(extra.name);
      models.push(extra);
    }
  }
  return createMetadataRegistry(models);
}

/**
 * Registered model metadata, declared by addons rather than introspected from
 * the database. Only `publicFields` are ever exposed; anything else (internal
 * columns, secrets, framework metadata) stays private.
 */
export interface RegisteredModel {
  /** Namespaced model name, e.g. "timeline.event". */
  name: string;
  /** Human description safe to publish. */
  description?: string;
  /** Field names that are approved for public metadata exposure. */
  publicFields: Array<{ name: string; type: string; description?: string }>;
}

export interface MetadataRegistry {
  models: RegisteredModel[];
}

/**
 * Build a metadata registry from addon manifests. Callers pass only approved
 * models; this function does not read the database.
 */
export function createMetadataRegistry(models: RegisteredModel[] = []): MetadataRegistry {
  const seen = new Set<string>();
  for (const model of models) {
    if (seen.has(model.name)) {
      throw new Error(`Duplicate metadata model '${model.name}'.`);
    }
    seen.add(model.name);
  }
  return { models: [...models] };
}

/**
 * Register `/_meta/*` endpoints backed by the metadata registry.
 * This replaces raw sqlite_master/pragma introspection with approved,
 * addon-declared metadata so private schema internals never leak.
 */
export async function registerMetadataRoutes(
  fastify: FastifyInstance,
  registryOrResolver: MetadataRegistry | (() => MetadataRegistry),
): Promise<void> {
  const resolveRegistry = (): MetadataRegistry =>
    typeof registryOrResolver === "function" ? registryOrResolver() : registryOrResolver;

  fastify.get("/_meta/models", async () => ({
    models: resolveRegistry().models.map((model) => model.name),
  }));

  fastify.get("/_meta/models/:name", async (request, reply) => {
    const { name } = request.params as { name: string };
    const model = resolveRegistry().models.find((entry) => entry.name === name);
    if (!model) {
      return reply.code(404).send({ error: `Model '${name}' not found` });
    }
    return {
      name: model.name,
      description: model.description ?? null,
      fields: model.publicFields.map((field) => ({
        name: field.name,
        type: field.type,
        description: field.description ?? null,
      })),
    };
  });

  fastify.get("/_meta/openapi.json", async () => {
    const registry = resolveRegistry();
    const schemas: Record<string, unknown> = {};
    for (const model of registry.models) {
      const properties: Record<string, { type: string; description?: string }> = {};
      for (const field of model.publicFields) {
        properties[field.name] = {
          type: field.type === "string[]" ? "array" : field.type,
          ...(field.description ? { description: field.description } : {}),
        };
      }
      schemas[model.name] = {
        type: "object",
        ...(model.description ? { description: model.description } : {}),
        properties,
      };
    }
    const paths: Record<string, unknown> = {
      "/health": { get: { summary: "Base health check" } },
      "/_meta/models": { get: { summary: "List registered models" } },
      "/_meta/models/{name}": { get: { summary: "Get public metadata for a model" } },
      "/_meta/openapi.json": { get: { summary: "OpenAPI specification" } },
      "/api/v1/timeline/events": {
        get: { summary: "List timeline events" },
        post: { summary: "Create timeline event" },
      },
      "/api/v1/timeline/events/{id}": {
        get: { summary: "Get timeline event" },
        patch: { summary: "Update timeline event" },
        delete: { summary: "Soft-delete timeline event" },
      },
      "/api/v1/timeline/eras": { get: { summary: "List eras" } },
      "/api/v1/timeline/stats": { get: { summary: "Timeline stats" } },
      "/api/v1/auth/login": { post: { summary: "Login with identifier and password" } },
      "/api/v1/auth/me": { get: { summary: "Current authenticated identity" } },
      "/api/v1/auth/users": {
        get: { summary: "List crew users" },
        post: { summary: "Create crew user" },
      },
      "/api/v1/audit/logs": { get: { summary: "List audit logs" } },
      "/api/v1/command-center/state": { get: { summary: "Command center state" } },
    };
    for (const model of registry.models) {
      const desc = modelRegistry.get(model.name);
      if (desc?.restEnabled) {
        paths[`/api/v1/m/${encodeURIComponent(model.name)}`] = {
          get: { summary: `List ${model.name}` },
          post: { summary: `Create ${model.name}` },
        };
      }
    }
    return {
      openapi: "3.0.0",
      info: {
        title: "Moonwitness API",
        version: "0.13.0",
      },
      paths,
      components: { schemas },
    };
  });

  fastify.get("/_meta/llms.txt", async (_request, reply) => {
    const registry = resolveRegistry();
    const lines = [
      "# Moonwitness API",
      "",
      "Machine-readable manifest for AI agents.",
      "",
      "## Models",
      ...registry.models.map((model) => `- ${model.name}`),
      "",
      "## Endpoints",
      "- GET /health — service health",
      "- GET /_meta/models — list registered models",
      "- GET /_meta/models/:name — approved fields of one model",
      "- GET /_meta/openapi.json — OpenAPI 3.0 specification",
      "- GET /_meta/addons — list installed/disabled addons (admin)",
      "- POST /_meta/addons/:name/enable|disable — live addon toggle without restart (admin)",
      "- POST /_meta/models/:name/fields — register typed custom field on extensible model (admin)",
      "- GET /_meta/navigation — role-filtered console navigation menus (auth)",
      "- GET /_meta/views/:model — dynamic UI view + actionBindings + ACL (auth)",
      "- GET/POST /api/v1/m/:model — generic opt-in model CRUD + history (auth + ir_rules)",
      "- GET/POST /api/v1/timeline/events — timeline chronicle CRUD",
      "- PATCH/DELETE /api/v1/timeline/events/:id — timeline mutations",
      "- GET /api/v1/timeline/eras — timeline eras",
      "- GET /api/v1/timeline/stats — timeline stats",
      "- POST /api/v1/auth/login — session sign-in",
      "- GET /api/v1/auth/me — current identity",
      "- GET/POST /api/v1/auth/users — admin crew management",
      "- GET /api/v1/audit/logs — operational audit log",
      "- GET /api/v1/command-center/state — workflows, alerts, feed",
    ];
    return reply.type("text/plain; charset=utf-8").send(lines.join("\n"));
  });
}

const registerCustomFieldBodySchema = z.object({
  field_name: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z_][a-z0-9_]*$/, "field_name must be snake_case alphanumeric"),
  field_type: z.enum(["text", "integer", "real", "boolean", "date", "json", "selection"]),
  nullable: z.boolean().optional(),
  required: z.boolean().optional(),
  ui_widget: z.string().max(40).optional(),
  label: z.string().max(160).optional(),
  selection: z.array(z.string().min(1)).optional(),
  default_value: z.unknown().optional(),
});

const patchCustomFieldBodySchema = z.object({
  label: z.string().max(160).optional(),
  required: z.boolean().optional(),
  nullable: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  ui_widget: z.string().max(40).optional(),
  selection: z.array(z.string().min(1)).optional(),
  default_value: z.unknown().optional(),
});

export async function registerRuntimeMetaRoutes(
  fastify: FastifyInstance,
  runtime: AddonRuntimeController,
  auth: BaseAddonAuthBridge = defaultFailClosedAuthBridge,
): Promise<void> {
  const adminOnly = auth.requireRole("admin");

  fastify.get("/_meta/addons", { preHandler: adminOnly }, async () => {
    const addons = await runtime.listAddons();
    return {
      addons: addons.map((a) => ({
        ...a,
        enabled: runtime.isEnabled(a.name),
      })),
    };
  });

  fastify.post<{ Params: { name: string } }>(
    "/_meta/addons/:name/enable",
    { preHandler: adminOnly },
    async (request, reply) => {
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        await runtime.enable(request.params.name, actor);
        return { ok: true, name: request.params.name, enabled: true };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const status = /Unknown addon/i.test(msg) ? 404 : /Cannot enable/i.test(msg) ? 409 : 400;
        return reply.code(status).send({ error: msg });
      }
    },
  );

  fastify.post<{ Params: { name: string } }>(
    "/_meta/addons/:name/disable",
    { preHandler: adminOnly },
    async (request, reply) => {
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        await runtime.disable(request.params.name, actor);
        return { ok: true, name: request.params.name, enabled: false };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const status = /Unknown addon/i.test(msg) ? 404 : /Cannot disable/i.test(msg) ? 409 : 400;
        return reply.code(status).send({ error: msg });
      }
    },
  );

  fastify.post<{ Params: { name: string }; Body: unknown }>(
    "/_meta/models/:name/fields",
    { preHandler: adminOnly },
    async (request, reply) => {
      const parsed = registerCustomFieldBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: parsed.error.issues[0]?.message ?? "Invalid custom field payload" });
      }
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const saved = await runtime.registerCustomField(request.params.name, parsed.data, actor);
        return reply.code(201).send({ field: saved });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const status = /Unknown model/i.test(msg) ? 404 : 400;
        return reply.code(status).send({ error: msg });
      }
    },
  );

  fastify.patch<{ Params: { id: string }; Body: unknown }>(
    "/_meta/fields/:id",
    { preHandler: adminOnly },
    async (request, reply) => {
      const parsed = patchCustomFieldBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: parsed.error.issues[0]?.message ?? "Invalid custom field update" });
      }
      const actor = resolveActorContextFromBridge(auth, request);
      const updated = await runtime.updateCustomField(request.params.id, parsed.data, actor);
      if (!updated) return reply.code(404).send({ error: "Field not found" });
      return { field: updated };
    },
  );

  fastify.get("/_meta/navigation", { preHandler: auth.authenticate }, async (request) => {
    const menus = await runtime.getNavigationForRole(auth.getActorRole(request));
    return { menus };
  });

  fastify.get<{ Params: { model: string } }>(
    "/_meta/views/:model",
    { preHandler: auth.authenticate },
    async (request, reply) => {
      const view = await runtime.getViewDescriptor(
        request.params.model,
        auth.getActorRole(request),
      );
      if (!view) {
        return reply
          .code(404)
          .send({ error: `View metadata not available for '${request.params.model}'` });
      }
      return view;
    },
  );
}
