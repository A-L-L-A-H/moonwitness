import type { FastifyInstance } from "fastify";
import type {
  AddonDefinition,
  AddonManifestInput,
  IrMenuInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-base";
import manifestData from "../manifest.json" with { type: "json" };
import { authOAuthTokenModel, authSessionModel, authUserModel } from "./models.js";
import { importLegacyUsersAndSessions, seedBootstrapAdmin } from "./service.js";

export const authManifest = manifestData as AddonManifestInput;
export {
  authUserModel,
  authUserSchema,
  authSessionModel,
  authSessionSchema,
  authOAuthTokenModel,
  authOAuthTokenSchema,
} from "./models.js";
export * from "./passwords.js";
export * from "./service.js";
export { createAuthMidIdentityStore } from "./mid-store.js";

export const authRules: IrRuleInput[] = [
  { model_name: "auth.user", role: "admin", can_read: true, can_create: true, can_update: true },
  { model_name: "auth.session", role: "admin", can_read: true },
];

export const authViews: IrViewInput[] = [
  {
    model_name: "auth.user",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/auth/users",
      createUrl: "/api/v1/auth/register",
      deleteUrl: "/api/v1/auth/users/{id}",
    },
    spec: {
      title: "Users & Roles",
      description: "Unified MoonWitness & MID account directory.",
      columns: ["username", "email", "role", "display_name", "is_active"],
    },
  },
];

export const authMenus: IrMenuInput[] = [
  {
    menu_key: "auth.users",
    label: "Identity & Users",
    href: "/models/auth.user",
    icon: "id",
    plane: "operations",
    sort_order: 80,
    min_role: "admin",
  },
];

export function createAuthAddon(
  options: {
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
    runBootstrapSeed?: boolean;
  } = {},
): AddonDefinition {
  return {
    manifest: authManifest,
    models: [authUserModel, authSessionModel, authOAuthTokenModel],
    rules: authRules,
    views: authViews,
    menus: authMenus,
    register: async () => {
      await importLegacyUsersAndSessions();
    },
    seed: async () => {
      if (options.runBootstrapSeed ?? true) {
        await seedBootstrapAdmin();
      }
    },
    registerRoutes: options.registerRoutes,
  };
}

export const authAddon = createAuthAddon();
