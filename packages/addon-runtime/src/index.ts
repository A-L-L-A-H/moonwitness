import "./fastify-augment.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import manifestData from "../manifest.json" with { type: "json" };
import { systemModels, runAddonLifecycle } from "./addon.js";
import type { AddonLifecycleDiagnostics, AddonLifecycleResult } from "./addon.js";
import {
  buildMetadataRegistryFromModels,
  createMetadataRegistry,
  registerMetadataRoutes,
  registerRuntimeMetaRoutes,
  type RegisteredModel,
} from "./metadata.js";
import { registerGenericModelRoutes } from "./generic-crud.js";
import type { BaseAddonAuthBridge } from "./host-context.js";
import type { AddonRuntimeController } from "./runtime.js";

export { systemModels, runAddonLifecycle };
export type { AddonLifecycleDiagnostics, AddonLifecycleResult };
export type { RegisteredModel, MetadataRegistry } from "./metadata.js";
export {
  buildMetadataRegistryFromModels,
  createMetadataRegistry,
  registerMetadataRoutes,
  registerRuntimeMetaRoutes,
} from "./metadata.js";
export {
  irAddonModel,
  irModelRecord,
  irModelFieldModel,
  irRuleModel,
  irViewModel,
  irMenuModel,
  resCompanySchema,
  resCompanyModel,
  resTenantModel,
  resGroupsSchema,
  resGroupsModel,
  resPartnerSchema,
  resPartnerModel,
  resLangSchema,
  resLangModel,
  resCountrySchema,
  resCountryModel,
  resCurrencySchema,
  resCurrencyModel,
  irModelDataSchema,
  irModelDataModel,
  irConfigParameterSchema,
  irConfigParameterModel,
  irSequenceSchema,
  irSequenceModel,
  irCronSchema,
  irCronModel,
  irCronLogSchema,
  irCronLogModel,
  irAttachmentSchema,
  irAttachmentModel,
  mailMessageSchema,
  mailMessageModel,
  mailTrackingValueSchema,
  mailTrackingValueModel,
  getConfigParam,
  setConfigParam,
  nextSequenceByCode,
  postChatterMessage,
  irSystemModels,
} from "./ir-models.js";
export { CronRunner, globalCronRunner, type CronExecutionResult } from "./cron-runner.js";
export {
  ADDON_NAME_REGEX,
  SEMVER_REGEX,
  AddonManifestSignatureSchema,
  AddonManifestSchema,
  AddonRegistry,
  AddonRegistryError,
  isValidSemVer,
  parseSemVer,
  compareSemVer,
  isValidSemVerRange,
  satisfiesSemVer,
  parseDependencySpec,
  planUpgrade,
  type AddonContext,
  type AddonManifest,
  type AddonManifestInput,
  type AddonManifestSignature,
  type InstalledAddonSnapshot,
  type ParsedDependencySpec,
  type ParsedSemVer,
  type RegisteredAddon,
  type RegistryState,
  type UpgradePlan,
  type UpgradePlanAction,
  type UpgradePlanInputAddon,
} from "./registry.js";
export {
  canonicalizeAddonManifestPayload,
  signAddonManifest,
  verifyAddonManifestSignature,
  type AddonSignerConfig,
  type TrustedAddonSigningKey,
  type AddonSignatureVerificationResult,
  type AddonSigningPolicy,
} from "./signing.js";
export {
  AddonRuntimeController,
  evaluateModelRecordRules,
  resolveEffectiveGroups,
  type AddonDefinition,
  type AddonDataRecord,
  type AddonInstallPhase,
  type AddonReconcileResult,
  type ActionBindingsSpec,
  type CustomActionSpec,
  type CrewRoleOrPublic,
  type IrCronInput,
  type IrRuleInput,
  type IrRuleRecordLike,
  type IrSequenceInput,
  type IrViewInput,
  type IrMenuInput,
  type ModelAclFlags,
  type RecordRuleEvaluationResult,
  type RecordRuleOperation,
  type RegisteredFieldMetadata,
  type RuntimeViewDescriptor,
} from "./runtime.js";
export {
  assertReadableFilterFields,
  assertReadableRelations,
  assertWritableActionInputFields,
  assertWritableBodyFields,
  canReadField,
  canReadRelation,
  canWriteField,
  getEffectiveFieldPolicies,
} from "./field-policy.js";
export { registerGenericModelRoutes } from "./generic-crud.js";
export {
  defaultFailClosedAuthBridge,
  resolveActorTenantFromBridge,
  resolveActorContextFromBridge,
  getRequestCookie,
  setReplyCookie,
  clearReplyCookie,
  type AddonHostContext,
  type BaseAddonAuthBridge,
  type FastifyPreHandler,
  type HostMidConfig,
  type HostProxyBridge,
  type HostRateLimitFactory,
} from "./host-context.js";
export {
  resolveTraceContext,
  buildChildTraceparent,
  isCloudflareWorkersRuntime,
  isLoopbackServiceUrl,
  resolveUpstreamServiceUrl,
  getEdgeLoopbackErrorPayload,
  getUpstreamBridgeHeaders,
  isBlockedRuntimeHost,
  validateServiceEndpointUrl,
  validateRiotAiRuntimeConfig,
  validateMemoryRuntimeConfig,
  OPTIONAL_OPS_SERVICES,
  isOptionalOpsServiceEnabled,
  getDisabledOptionalOpsErrorPayload,
  probeOptionalOpsServices,
  type EdgeLoopbackErrorPayload,
  type TraceContext,
  type UpstreamCorrelationInput,
  type OptionalOpsServiceKey,
  type OptionalOpsServiceSpec,
  type OpsServiceHealthStatus,
  type OptionalOpsServiceState,
  type DisabledOptionalOpsErrorPayload,
} from "./upstream.js";
export {
  opsJobSchema,
  opsJobModel,
  ensureJobQueueSchema,
  enqueueJob,
  claimNextJob,
  completeJob,
  failJob,
  processNextJob,
  ensureOutboxSchema,
  enqueueOutboxEvent,
  recoverExpiredOutboxLeases,
  dispatchOutboxBatch,
  OutboxDispatcher,
  type OpsJobRecord,
  type EnqueueJobInput,
  type ClaimJobOptions,
  type FailJobOptions,
  type JobHandler,
  type OutboxEventStatus,
  type OutboxEventRecord,
  type OutboxDeliveryRecord,
  type OutboxDispatchContext,
  type OutboxSubscriberHandler,
  type OutboxSubscriber,
  type EnqueueOutboxEventInput,
  type RecoverOutboxLeasesOptions,
  type RecoverOutboxLeasesResult,
  type DispatchOutboxOptions,
  type DispatchOutboxBatchResult,
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

  const runtime = opts.runtime;
  const auth = opts.auth;
  const registrySource = runtime
    ? async (request?: FastifyRequest, reply?: FastifyReply) => {
        if (!request || !auth) {
          return buildMetadataRegistryFromModels(runtime, extraModels);
        }
        if (auth.optionalAuthenticate && reply) {
          try {
            await auth.optionalAuthenticate(request, reply);
          } catch {
            // Optional authentication failure is non-fatal for public metadata lookup
          }
        }
        const role = auth.getActorRole(request);
        const actorGroups = auth.getActorGroups?.(request);
        const effectiveGroups = await runtime.resolveEffectiveActorGroups(role, actorGroups);
        return buildMetadataRegistryFromModels(runtime, extraModels, role, effectiveGroups);
      }
    : createMetadataRegistry(merged);

  await registerMetadataRoutes(fastify, registrySource);

  if (runtime) {
    await registerRuntimeMetaRoutes(fastify, runtime, auth);
    if (opts.apiPrefix) {
      await fastify.register(
        async (scoped) => {
          await registerMetadataRoutes(scoped, registrySource);
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
