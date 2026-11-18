import type { FastifyInstance } from "fastify";
import type {
  AddonDefinition,
  AddonManifestInput,
  IrMenuInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { syslogEntryModel } from "./models.js";

export const syslogManifest = manifestData as AddonManifestInput;
export * from "./models.js";

export const syslogRules: IrRuleInput[] = [
  { model_name: "syslog.entry", role: "viewer", can_read: true },
  { model_name: "syslog.entry", role: "editor", can_read: true },
  { model_name: "syslog.entry", role: "admin", can_read: true },
];

export const syslogViews: IrViewInput[] = [
  {
    model_name: "syslog.entry",
    view_type: "list",
    actionBindings: { listUrl: "/api/v1/syslog/entries" },
    spec: {
      title: "Syslog Stream",
      description: "Structured logs forwarded from the syslog daemon.",
      domainIcon: "syslog",
      columns: ["received_at", "source_host", "app_name", "severity", "message"],
    },
  },
];

export const syslogMenus: IrMenuInput[] = [
  {
    menu_key: "syslog.entries",
    label: "Syslog",
    href: "/syslog",
    icon: "syslog",
    plane: "operations",
    sort_order: 20,
    min_role: "viewer",
  },
];

export function createSyslogAddon(
  options: { registerRoutes?: (scope: FastifyInstance) => Promise<void> | void } = {},
): AddonDefinition {
  return {
    manifest: syslogManifest,
    models: [syslogEntryModel],
    rules: syslogRules,
    views: syslogViews,
    menus: syslogMenus,
    shouldAutoEnable: () => process.env.MW_ADDON_SYSLOG_DISABLED !== "1",
    registerRoutes: options.registerRoutes,
  };
}

export const syslogAddon = createSyslogAddon();
