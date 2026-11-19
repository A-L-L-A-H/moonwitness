import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel, SYSTEM_ACTOR } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  resolveActorTenantFromBridge,
  type AddonDataRecord,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const performanceManifest = manifestData as AddonManifestInput;

export const pxSystemSchema = z.object({
  rss_mb: z.number().nonnegative(),
  heap_used_mb: z.number().nonnegative(),
  heap_total_mb: z.number().nonnegative(),
  uptime_sec: z.number().nonnegative(),
  recorded_at: z.string(),
});

export const pxSystemModel = defineModel({
  name: "px.system",
  table: "px_system_metrics",
  schema: pxSystemSchema,
  softDelete: false,
  restEnabled: true,
  retention: { maxRows: 500, orderField: "recorded_at" },
  searchFields: ["recorded_at"],
  publicFields: ["rss_mb", "heap_used_mb", "heap_total_mb", "uptime_sec", "recorded_at"],
  actions: {
    capture_snapshot: {
      scope: "model",
      roles: ["admin"],
      label: "Capture Process Metrics",
      handler: async ({ repository, actor }) => {
        const mem = process.memoryUsage();
        return repository.create(
          {
            rss_mb: Number((mem.rss / 1024 / 1024).toFixed(2)),
            heap_used_mb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
            heap_total_mb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
            uptime_sec: Number(process.uptime().toFixed(1)),
            recorded_at: new Date().toISOString(),
          },
          actor ?? SYSTEM_ACTOR,
        );
      },
    },
  },
  indexes: [{ fields: ["recorded_at"] }],
});

export const irDashboardWidgetSchema = z.object({
  widget_key: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  model_name: z.string().min(1).max(120),
  widget_type: z.enum(["metric", "chart", "list", "kanban"]).default("metric"),
  domain_json: z.string().default("{}"),
  group_by_field: z.string().max(80).nullable().default(null),
  accent_color: z.enum(["cyan", "green", "yellow", "purple", "pink"]).default("cyan"),
  sort_order: z.number().int().default(10),
});

export const irDashboardWidgetModel = defineModel({
  name: "ir.dashboard.widget",
  table: "ir_dashboard_widgets",
  schema: irDashboardWidgetSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["widget_key", "title", "model_name"],
  publicFields: ["widget_key", "title", "model_name", "widget_type", "accent_color", "sort_order"],
  indexes: [{ fields: ["tenant_id", "widget_key"], unique: true }, { fields: ["sort_order"] }],
});

export const performanceData: AddonDataRecord[] = [
  {
    id: "kpi_timeline_events",
    model: "ir.dashboard.widget",
    key: { widget_key: "kpi_timeline_events" },
    noupdate: true,
    values: {
      widget_key: "kpi_timeline_events",
      title: "Timeline Events",
      model_name: "timeline.event",
      widget_type: "metric",
      group_by_field: "era",
      accent_color: "cyan",
      sort_order: 10,
    },
  },
  {
    id: "kpi_witness_claims",
    model: "ir.dashboard.widget",
    key: { widget_key: "kpi_witness_claims" },
    noupdate: true,
    values: {
      widget_key: "kpi_witness_claims",
      title: "Witness Claims",
      model_name: "witness.claim",
      widget_type: "metric",
      group_by_field: "verdict",
      accent_color: "green",
      sort_order: 20,
    },
  },
  {
    id: "kpi_cab_changes",
    model: "ir.dashboard.widget",
    key: { widget_key: "kpi_cab_changes" },
    noupdate: true,
    values: {
      widget_key: "kpi_cab_changes",
      title: "CAB RFC Changes",
      model_name: "cab.change",
      widget_type: "kanban",
      group_by_field: "change_status",
      accent_color: "yellow",
      sort_order: 30,
    },
  },
];

export const performanceRules: IrRuleInput[] = [
  { model_name: "px.system", role: "viewer", can_read: true },
  {
    model_name: "px.system",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "ir.dashboard.widget", role: "viewer", can_read: true },
  {
    model_name: "ir.dashboard.widget",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const performanceViews: IrViewInput[] = [
  {
    model_name: "ir.dashboard.widget",
    view_type: "list",
    spec: {
      title: "KPI Dashboard Widgets",
      description: "Configurable Matrix dashboard KPI widgets & group-by cards.",
      domainIcon: "arsy",
      columns: ["widget_key", "title", "model_name", "widget_type", "accent_color", "sort_order"],
    },
  },
];

export const performanceMenus: IrMenuInput[] = [
  {
    menu_key: "performance.widgets",
    label: "APM & KPIs",
    href: "/models/ir.dashboard.widget",
    icon: "arsy",
    plane: "operations",
    sort_order: 86,
    min_role: "viewer",
  },
];

export function createPerformanceAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: performanceManifest,
    models: [pxSystemModel, irDashboardWidgetModel],
    rules: performanceRules,
    views: performanceViews,
    menus: performanceMenus,
    data: performanceData,
    crons: [
      {
        cron_key: "px.capture_system_metrics",
        name: "Capture Process Telemetry",
        model_name: "px.system",
        action_name: "capture_snapshot",
        interval_sec: 300,
      },
    ],
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(
        `${prefix}/performance/summary`,
        { preHandler: auth.authenticate },
        async (request) => {
          const tenantId = resolveActorTenantFromBridge(auth, request);
          const mem = process.memoryUsage();
          const widgets = await irDashboardWidgetModel.repository.find(
            {},
            { orderBy: "sort_order ASC", tenantId },
          );
          return {
            runtime: {
              rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
              heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
              heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
              uptimeSec: Number(process.uptime().toFixed(1)),
            },
            widgets,
          };
        },
      );
    },
  };
}

export const performanceAddon = createPerformanceAddon();
