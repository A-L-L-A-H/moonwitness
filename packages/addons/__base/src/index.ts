import type { FastifyInstance } from "fastify";
import manifestData from "../manifest.json" with { type: "json" };
import { systemModels, runAddonLifecycle } from "./addon.js";
import type { AddonLifecycleDiagnostics, AddonLifecycleResult } from "./addon.js";
import {
  createMetadataRegistry,
  registerMetadataRoutes,
  registerRuntimeMetaRoutes,
  type RegisteredModel,
} from "./metadata.js";
import { registerGenericModelRoutes, type BaseAddonAuthBridge } from "./generic-crud.js";
import type { AddonRuntimeController } from "./runtime.js";

export { systemModels, runAddonLifecycle };
export type { AddonLifecycleDiagnostics, AddonLifecycleResult };
export type { RegisteredModel, MetadataRegistry } from "./metadata.js";
export { registerMetadataRoutes, registerRuntimeMetaRoutes } from "./metadata.js";
export {
  irAddonModel,
  irModelRecord,
  irModelFieldModel,
  irRuleModel,
  irViewModel,
  irMenuModel,
  irSystemModels,
} from "./ir-models.js";
export {
  AddonManifestSchema,
  AddonRegistry,
  AddonRegistryError,
  type AddonContext,
  type AddonManifest,
  type AddonManifestInput,
  type RegisteredAddon,
  type RegistryState,
} from "./registry.js";
export {
  AddonRuntimeController,
  type AddonDefinition,
  type ActionBindingsSpec,
  type CustomActionSpec,
  type CrewRoleOrPublic,
  type IrRuleInput,
  type IrViewInput,
  type IrMenuInput,
  type ModelAclFlags,
  type RegisteredFieldMetadata,
  type RuntimeViewDescriptor,
} from "./runtime.js";
export {
  registerGenericModelRoutes,
  defaultFailClosedAuthBridge,
  type BaseAddonAuthBridge,
} from "./generic-crud.js";
export {
  opsJobSchema,
  opsJobModel,
  ensureJobQueueSchema,
  enqueueJob,
  claimNextJob,
  completeJob,
  failJob,
  processNextJob,
  type OpsJobRecord,
  type EnqueueJobInput,
  type ClaimJobOptions,
  type FailJobOptions,
  type JobHandler,
} from "./job-queue.js";

export interface BaseManifest {
  name: "__base";
  version: string;
  description: string;
  depends: string[];
  provides: {
    routes: string[];
    models: string[];
    auditActions: string[];
  };
}

export const baseManifest = manifestData as BaseManifest;

/**
 * Approved model metadata for this addon. Only these fields are published via
 * /_meta/*; the database schema is never introspected for public output.
 */
export const baseMetadata = createMetadataRegistry([
  {
    name: "timeline.event",
    description: "A timeline event (story-world record).",
    publicFields: [
      { name: "id", type: "string" },
      { name: "kind", type: "string" },
      { name: "date", type: "string" },
      { name: "era", type: "string" },
      { name: "title", type: "string" },
      { name: "excerpt", type: "string" },
      { name: "tags", type: "string[]" },
    ],
  },
  {
    name: "timeline.era",
    description: "A narrative era grouping timeline events.",
    publicFields: [
      { name: "id", type: "string" },
      { name: "name", type: "string" },
      { name: "years", type: "string" },
      { name: "color", type: "string" },
    ],
  },
]);

export interface RegisterBaseAddonOptions {
  extraModels?: RegisteredModel[];
  runtime?: AddonRuntimeController;
  auth?: BaseAddonAuthBridge;
  apiPrefix?: string;
}

export async function registerBaseAddon(
  fastify: FastifyInstance,
  extraModelsOrOptions: RegisteredModel[] | RegisterBaseAddonOptions = [],
): Promise<void> {
  const opts: RegisterBaseAddonOptions = Array.isArray(extraModelsOrOptions)
    ? { extraModels: extraModelsOrOptions }
    : extraModelsOrOptions;
  const extraModels = opts.extraModels ?? [];

  if (!fastify.hasRoute({ method: "GET", url: "/health" })) {
    fastify.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });
  }

  const seen = new Set(baseMetadata.models.map((m) => m.name));
  const merged = [...baseMetadata.models];
  for (const model of extraModels) {
    if (!seen.has(model.name)) {
      seen.add(model.name);
      merged.push(model);
    }
  }

  await registerMetadataRoutes(fastify, createMetadataRegistry(merged));

  if (opts.runtime) {
    const runtime = opts.runtime;
    const auth = opts.auth;
    await registerRuntimeMetaRoutes(fastify, runtime, auth);
    if (opts.apiPrefix) {
      await fastify.register(
        async (scoped) => {
          await registerRuntimeMetaRoutes(scoped, runtime, auth);
          await registerGenericModelRoutes(scoped, runtime, auth);
        },
        { prefix: opts.apiPrefix },
      );
    } else {
      await registerGenericModelRoutes(fastify, runtime, auth);
    }
  }
}
