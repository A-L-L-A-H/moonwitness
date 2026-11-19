import type { FastifyInstance } from "fastify";
import type {
  AddonDefinition,
  AddonHostContext,
  AddonManifestInput,
  IrMenuInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { memoryRecordModel, providerConfigModel, usageSummaryModel } from "./models.js";
import { registerMemoryRoutes } from "./memory-routes.js";
import { registerRiotAiRoutes } from "./riot-routes.js";
import type { RiotAiRuntimeConfig } from "./schemas.js";

export const aiManifest = manifestData as AddonManifestInput;
export {
  providerConfigModel,
  providerConfigSchema,
  usageSummaryModel,
  usageSummarySchema,
  memoryRecordModel,
  memoryRecordSchema,
} from "./models.js";
export * from "./persistence.js";
export * from "./audit.js";
export * from "./schemas.js";
export { registerRiotAiRoutes, type RiotAiRoutesOptions } from "./riot-routes.js";
export { registerMemoryRoutes, type MemoryRoutesOptions } from "./memory-routes.js";

export const aiRules: IrRuleInput[] = [
  { model_name: "riot_ai.provider_config", role: "viewer", can_read: true },
  {
    model_name: "riot_ai.provider_config",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  { model_name: "riot_ai.usage_summary", role: "admin", can_read: true },
  { model_name: "memory.record", role: "viewer", can_read: true },
  {
    model_name: "memory.record",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "memory.record",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const aiViews: IrViewInput[] = [
  {
    model_name: "riot_ai.provider_config",
    view_type: "list",
    actionBindings: { listUrl: "/api/v1/riot-ai/config" },
    spec: {
      title: "RIOT AI Provider Profiles",
      description: "Configured local inference backends and usage policies.",
      domainIcon: "mycelium",
      columns: ["profile_key", "label", "provider", "preferred_model", "enabled"],
    },
  },
  {
    model_name: "memory.record",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/memory/entries",
      createUrl: "/api/v1/memory/entries",
    },
    spec: {
      title: "Semantic Memory Records",
      description: "Long-lived archive memory nodes mirrored for RIOT agents.",
      domainIcon: "memory",
      columns: ["record_key", "kind", "title", "scope"],
    },
  },
];

export const aiMenus: IrMenuInput[] = [
  {
    menu_key: "ai.intelligence",
    label: "RIOT Intelligence",
    href: "/intelligence",
    icon: "mycelium",
    plane: "creator",
    sort_order: 60,
    min_role: "viewer",
  },
];

export function createAiAddon(
  options: Partial<AddonHostContext> & {
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
    runtime?: Partial<RiotAiRuntimeConfig>;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");

  return {
    manifest: aiManifest,
    models: [providerConfigModel, usageSummaryModel, memoryRecordModel],
    rules: aiRules,
    views: aiViews,
    menus: aiMenus,
    registerRoutes:
      options.registerRoutes ??
      (async (scope) => {
        const registerBoth = async (target: FastifyInstance) => {
          await registerRiotAiRoutes(target, {
            auth: options.auth,
            rateLimit: options.rateLimit,
            runtime: options.runtime,
          });
          await registerMemoryRoutes(target, {
            auth: options.auth,
            runtime: options.runtime,
          });
        };
        if (prefix) {
          await scope.register(registerBoth, { prefix });
        } else {
          await registerBoth(scope);
        }
      }),
  };
}

export const aiAddon = createAiAddon();
