import type { FastifyInstance } from "fastify";
import type {
  AddonDefinition,
  AddonManifestInput,
  IrMenuInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { controlCommandModel } from "./models.js";

export const controlManifest = manifestData as AddonManifestInput;
export { controlCommandModel, controlCommandSchema } from "./models.js";
export {
  ArsyHttpSchedulerAdapter,
  DurableQueueSchedulerAdapter,
  createControlScheduler,
  processControlSchedulerJob,
  type ControlSchedulerAction,
  type ControlDispatchRequest,
  type ControlDispatchResult,
  type ControlSchedulerBackend,
  type FetchLike,
} from "./scheduler.js";

export const controlRules: IrRuleInput[] = [
  { model_name: "control.command", role: "viewer", can_read: true },
  { model_name: "control.command", role: "editor", can_read: true },
  { model_name: "control.command", role: "admin", can_read: true },
];

export const controlViews: IrViewInput[] = [
  {
    model_name: "control.command",
    view_type: "list",
    actionBindings: { listUrl: "/api/v1/control/audit" },
    spec: {
      title: "Control Plane Commands",
      description: "Execution history routed through ARSY host control plane.",
      domainIcon: "arsy",
      columns: ["method", "target_path", "actor_role", "response_status", "outcome", "executed_at"],
    },
  },
];

export const controlMenus: IrMenuInput[] = [
  {
    menu_key: "control.plane",
    label: "Control Plane",
    href: "/control",
    icon: "arsy",
    plane: "operations",
    sort_order: 10,
    min_role: "viewer",
  },
];

export function createControlAddon(
  options: { registerRoutes?: (scope: FastifyInstance) => Promise<void> | void } = {},
): AddonDefinition {
  return {
    manifest: controlManifest,
    models: [controlCommandModel],
    rules: controlRules,
    views: controlViews,
    menus: controlMenus,
    registerRoutes: options.registerRoutes,
  };
}

export const controlAddon = createControlAddon();
