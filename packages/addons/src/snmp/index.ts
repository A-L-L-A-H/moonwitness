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
import { snmpDeviceModel, snmpSampleModel, snmpTargetModel } from "./models.js";
import { registerSnmpRoutes } from "./routes.js";

export const snmpManifest = manifestData as AddonManifestInput;
export * from "./models.js";
export { registerSnmpRoutes, type SnmpRoutesOptions } from "./routes.js";

export const snmpRules: IrRuleInput[] = [
  { model_name: "snmp.device", role: "viewer", can_read: true },
  {
    model_name: "snmp.device",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "snmp.device",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "snmp.target", role: "viewer", can_read: true },
  { model_name: "snmp.target", role: "admin", can_read: true, can_create: true, can_update: true },
  { model_name: "snmp.sample", role: "viewer", can_read: true },
];

export const snmpViews: IrViewInput[] = [
  {
    model_name: "snmp.device",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/snmp/devices",
      createUrl: "/api/v1/snmp/devices",
    },
    spec: {
      title: "SNMP Managed Devices",
      description: "Network hosts polled by the SNMP poller daemon.",
      domainIcon: "snmp",
      columns: ["device_key", "name", "host", "snmp_version", "enabled"],
    },
  },
];

export const snmpMenus: IrMenuInput[] = [
  {
    menu_key: "snmp.poller",
    label: "SNMP",
    href: "/snmp",
    icon: "snmp",
    plane: "operations",
    sort_order: 30,
    min_role: "viewer",
  },
];

export function createSnmpAddon(
  options: Partial<AddonHostContext> & {
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");

  return {
    manifest: snmpManifest,
    models: [snmpDeviceModel, snmpTargetModel, snmpSampleModel],
    rules: snmpRules,
    views: snmpViews,
    menus: snmpMenus,
    shouldAutoEnable: () => isOptionalOpsServiceEnabled("snmp"),
    registerRoutes:
      options.registerRoutes ??
      (async (scope) => {
        if (prefix) {
          await scope.register(
            async (scoped) => {
              await registerSnmpRoutes(scoped, { auth: options.auth });
            },
            { prefix },
          );
        } else {
          await registerSnmpRoutes(scope, { auth: options.auth });
        }
      }),
  };
}

export const snmpAddon = createSnmpAddon();
