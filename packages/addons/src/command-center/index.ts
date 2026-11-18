import type { FastifyInstance } from "fastify";
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
import { alertModel, workflowModel } from "./models.js";
import { registerCommandCenterRoutes } from "./routes.js";
import { importLegacyCommandCenter } from "./service.js";

export const commandCenterManifest = manifestData as AddonManifestInput;
export { workflowModel, workflowSchema, alertModel, alertSchema } from "./models.js";
export * from "./service.js";
export { registerCommandCenterRoutes } from "./routes.js";

export const commandCenterRules: IrRuleInput[] = [
  { model_name: "command.workflow", role: "viewer", can_read: true },
  {
    model_name: "command.workflow",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "command.workflow",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "command.alert", role: "viewer", can_read: true },
  {
    model_name: "command.alert",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "command.alert",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const commandCenterViews: IrViewInput[] = [
  {
    model_name: "command.workflow",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/command-center/state",
      createUrl: "/api/v1/command-center/workflows",
      customActions: [
        {
          id: "toggle",
          label: "Toggle State",
          method: "PATCH",
          urlTemplate: "/api/v1/command-center/workflows/{id}/toggle",
          roles: ["editor", "admin"],
        },
      ],
    },
    spec: {
      title: "Mission Workflows",
      description: "State-machine orchestrated workflows executed by Command Center.",
      domainIcon: "arsy",
      columns: ["workflow_key", "name", "detail", "workflow_status"],
    },
  },
  {
    model_name: "command.alert",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/command-center/state",
      customActions: [
        {
          id: "dismiss",
          label: "Dismiss",
          method: "DELETE",
          urlTemplate: "/api/v1/command-center/alerts/{id}",
          roles: ["editor", "admin"],
        },
      ],
    },
    spec: {
      title: "Mission Alerts",
      description: "Active operational alerts for Command Center.",
      columns: ["alert_key", "level", "text", "dismissed"],
    },
  },
];

export const commandCenterMenus: IrMenuInput[] = [
  {
    menu_key: "command.mission",
    label: "Dashboard",
    href: "/mission-control",
    icon: "arsy",
    plane: "creator",
    sort_order: 10,
    min_role: "viewer",
  },
];

export function createCommandCenterAddon(
  options: Partial<AddonHostContext> & {
    auth?: BaseAddonAuthBridge;
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: commandCenterManifest,
    models: [workflowModel, alertModel],
    rules: commandCenterRules,
    views: commandCenterViews,
    menus: commandCenterMenus,
    register: async () => {
      await importLegacyCommandCenter();
    },
    registerRoutes:
      options.registerRoutes ??
      (async (scope) => {
        if (prefix) {
          await scope.register(
            async (scoped) => {
              await registerCommandCenterRoutes(scoped, { auth });
            },
            { prefix },
          );
        } else {
          await registerCommandCenterRoutes(scope, { auth });
        }
      }),
  };
}

export const commandCenterAddon = createCommandCenterAddon();
