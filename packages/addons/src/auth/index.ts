import type { FastifyInstance } from "fastify";
import { createD1DatabaseFromOrm, getDb } from "@moonwitness/orm";
import { midFastifyPlugin } from "@moonwitness/mid";
import {
  defaultFailClosedAuthBridge,
  type AddonDefinition,
  type AddonHostContext,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { authOAuthTokenModel, authSessionModel, authUserModel } from "./models.js";
import { createAuthMidIdentityStore } from "./mid-store.js";
import { registerAuthRoutes } from "./routes.js";
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
export * from "./mid-jwt.js";
export * from "./bff.js";
export { registerAuthAdminRoutes } from "./admin-routes.js";
export { registerAuthRoutes, type AuthRoutesOptions } from "./routes.js";
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
      createUrl: "/api/v1/auth/users",
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
  options: Partial<AddonHostContext> & {
    auth?: BaseAddonAuthBridge;
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
    runBootstrapSeed?: boolean;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: authManifest,
    models: [authUserModel, authSessionModel, authOAuthTokenModel],
    rules: authRules,
    views: authViews,
    menus: authMenus,
    crons: [
      {
        cron_key: "auth.cleanup_expired_sessions",
        name: "Cleanup Expired Sessions",
        model_name: "auth.session",
        action_name: "cleanup_expired",
        interval_sec: 3600,
      },
    ],
    register: async () => {
      await importLegacyUsersAndSessions();
    },
    seed: async () => {
      if (options.runBootstrapSeed ?? true) {
        await seedBootstrapAdmin();
      }
    },
    registerRoutes:
      options.registerRoutes ??
      (async (scope) => {
        if (options.mid?.keyEncryptionSecret) {
          await scope.register(midFastifyPlugin, {
            db: createD1DatabaseFromOrm(getDb()),
            identityStore: createAuthMidIdentityStore(),
            keyEncryptionSecret: options.mid.keyEncryptionSecret,
            issuerUrl: options.mid.issuerUrl,
            cookieDomain: options.mid.cookieDomain,
            corsOrigins: options.mid.corsOrigins,
          });
          if (!scope.hasDecorator("midMounted")) {
            scope.decorate("midMounted", true);
          }
        }
        if (prefix) {
          await scope.register(
            async (scoped) => {
              await registerAuthRoutes(scoped, {
                auth,
                rateLimit: options.rateLimit,
                midHost: scope,
              });
            },
            { prefix },
          );
        } else {
          await registerAuthRoutes(scope, {
            auth,
            rateLimit: options.rateLimit,
            midHost: scope,
          });
        }
      }),
  };
}

export const authAddon = createAuthAddon();
