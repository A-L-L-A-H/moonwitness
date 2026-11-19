import type { FastifyInstance } from "fastify";
import {
  isOptionalOpsServiceEnabled,
  type AddonDefinition,
  type AddonHostContext,
  type AddonManifestInput,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { radiusClientModel, radiusSessionModel } from "./models.js";
import { registerRadiusRoutes } from "./routes.js";

export const radiusManifest = manifestData as AddonManifestInput;
export * from "./models.js";
export { registerRadiusRoutes, type RadiusRoutesOptions } from "./routes.js";

export const radiusRules: IrRuleInput[] = [
  { model_name: "radius.client", role: "viewer", can_read: true },
  {
    model_name: "radius.client",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "radius.client",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "radius.session", role: "viewer", can_read: true },
];

export const radiusViews: IrViewInput[] = [
  {
    model_name: "radius.client",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/radius/users",
      createUrl: "/api/v1/radius/users",
    },
    spec: {
      title: "RADIUS NAS Clients",
      description: "Authenticated AAA NAS devices serviced by the RADIUS daemon.",
      domainIcon: "radius",
      columns: ["client_key", "name", "address", "enabled"],
    },
  },
];

export const radiusMenus: IrMenuInput[] = [
  {
    menu_key: "radius.aaa",
    label: "RADIUS",
    href: "/radius",
    icon: "radius",
    plane: "operations",
    sort_order: 50,
    min_role: "viewer",
  },
];

export function createRadiusAddon(
  options: Partial<AddonHostContext> & {
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");

  return {
    manifest: radiusManifest,
    models: [radiusClientModel, radiusSessionModel],
    rules: radiusRules,
    views: radiusViews,
    menus: radiusMenus,
    shouldAutoEnable: () => isOptionalOpsServiceEnabled("radius"),
    registerRoutes:
      options.registerRoutes ??
      (async (scope) => {
        if (prefix) {
          await scope.register(
            async (scoped) => {
              await registerRadiusRoutes(scoped, { auth: options.auth });
            },
            { prefix },
          );
        } else {
          await registerRadiusRoutes(scope, { auth: options.auth });
        }
      }),
  };
}

export const radiusAddon = createRadiusAddon();
