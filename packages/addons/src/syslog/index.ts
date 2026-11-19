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
import { syslogEntryModel } from "./models.js";
import { registerSyslogRoutes } from "./routes.js";

export const syslogManifest = manifestData as AddonManifestInput;
export * from "./models.js";
export { registerSyslogRoutes, type SyslogRoutesOptions } from "./routes.js";

export const syslogRules: IrRuleInput[] = [
  { model_name: "syslog.entry", role: "viewer", can_read: true },
  { model_name: "syslog.entry", role: "editor", can_read: true },
  { model_name: "syslog.entry", role: "admin", can_read: true },
];

export const syslogViews: IrViewInput[] = [
  {
    model_name: "syslog.entry",
    view_type: "list",
    actionBindings: { listUrl: "/api/v1/syslog/messages" },
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
  options: Partial<AddonHostContext> & {
    registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");

  return {
    manifest: syslogManifest,
    models: [syslogEntryModel],
    rules: syslogRules,
    views: syslogViews,
    menus: syslogMenus,
    shouldAutoEnable: () => process.env.MW_ADDON_SYSLOG_DISABLED !== "1",
    registerRoutes:
      options.registerRoutes ??
      (async (scope) => {
        if (prefix) {
          await scope.register(
            async (scoped) => {
              await registerSyslogRoutes(scoped, { auth: options.auth });
            },
            { prefix },
          );
        } else {
          await registerSyslogRoutes(scope, { auth: options.auth });
        }
      }),
  };
}

export const syslogAddon = createSyslogAddon();
