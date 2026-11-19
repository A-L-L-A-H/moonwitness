import type { FastifyInstance } from "fastify";
import {
  defaultFailClosedAuthBridge,
  type AddonDataRecord,
  type AddonDefinition,
  type AddonHostContext,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { opsEventModel, probeEventModel, probeNodeModel } from "./models.js";
import { registerProbesRoutes } from "./routes.js";
import { DEFAULT_PROBE_NODES, importLegacyProbes } from "./service.js";

export const probesManifest = manifestData as AddonManifestInput;
export {
  probeNodeModel,
  probeNodeSchema,
  probeEventModel,
  probeEventSchema,
  opsEventModel,
  opsEventSchema,
} from "./models.js";
export * from "./service.js";
export { registerProbesRoutes } from "./routes.js";

export const probesRules: IrRuleInput[] = [
  { model_name: "probe.node", role: "viewer", can_read: true },
  { model_name: "probe.node", role: "editor", can_read: true, can_create: true, can_update: true },
  {
    model_name: "probe.node",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "probe.event", role: "viewer", can_read: true },
  { model_name: "probe.event", role: "admin", can_read: true },
  { model_name: "ops.event", role: "viewer", can_read: true },
  { model_name: "ops.event", role: "editor", can_read: true, can_create: true, can_update: true },
  {
    model_name: "ops.event",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const probesViews: IrViewInput[] = [
  {
    model_name: "probe.node",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/probes/nodes",
      createUrl: "/api/v1/m/probe.node",
      customActions: [
        {
          id: "run_probe",
          label: "Run Probe",
          method: "POST",
          urlTemplate: "/api/v1/probes/run",
          roles: ["editor", "admin"],
        },
      ],
    },
    spec: {
      title: "Telemetry Probe Targets",
      description: "SSRF-guarded endpoint checks and edge uptime monitors.",
      domainIcon: "snmp",
      columns: ["node_key", "name", "target_url", "category", "enabled"],
    },
  },
];

export const probesMenus: IrMenuInput[] = [
  {
    menu_key: "probes.targets",
    label: "Probe Targets",
    href: "/models/probe.node",
    icon: "snmp",
    plane: "operations",
    sort_order: 35,
    min_role: "viewer",
  },
];

export const probesData: AddonDataRecord[] = DEFAULT_PROBE_NODES.map((node) => ({
  id: `probe_node_${node.id.replace(/-/g, "_")}`,
  model: "probe.node",
  key: { node_key: node.id },
  noupdate: true,
  values: {
    node_key: node.id,
    name: node.name,
    target_url: node.targetUrl,
    category: node.category,
    enabled: true,
    metadata_json: null,
  },
}));

export function createProbesAddon(
  options: Partial<AddonHostContext> & {
    auth?: BaseAddonAuthBridge;
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: probesManifest,
    models: [probeNodeModel, probeEventModel, opsEventModel],
    rules: probesRules,
    views: probesViews,
    menus: probesMenus,
    data: probesData,
    register: async () => {
      await importLegacyProbes();
    },
    registerRoutes:
      options.registerRoutes ??
      (async (scope) => {
        if (prefix) {
          await scope.register(
            async (scoped) => {
              await registerProbesRoutes(scoped, { auth });
            },
            { prefix },
          );
        } else {
          await registerProbesRoutes(scope, { auth });
        }
      }),
  };
}

export const probesAddon = createProbesAddon();
