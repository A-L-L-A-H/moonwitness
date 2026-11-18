import type { FastifyInstance } from "fastify";
import { getDb, SYSTEM_ACTOR } from "@moonwitness/orm";
import type {
  AddonDefinition,
  AddonManifestInput,
  IrMenuInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { alertModel, workflowModel } from "./models.js";

export const commandCenterManifest = manifestData as AddonManifestInput;
export { workflowModel, workflowSchema, alertModel, alertSchema } from "./models.js";

export async function importLegacyCommandCenter(): Promise<{
  workflowsImported: number;
  alertsImported: number;
}> {
  const db = getDb();
  let workflowsImported = 0;
  let alertsImported = 0;

  try {
    const wfTable = await db.get<{ name?: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'command_center_workflows'",
    );
    if (wfTable?.name) {
      const rows = await db.all<Record<string, unknown>>(
        "SELECT id, actor_id, name, detail, status, sort_order FROM command_center_workflows",
      );
      for (const row of rows) {
        const key = String(row.id);
        const actorId = String(row.actor_id);
        const existing = await workflowModel.repository.find({
          actor_id: actorId,
          workflow_key: key,
        });
        if (existing.length > 0) continue;
        await workflowModel.repository.upsert(
          { actor_id: actorId, workflow_key: key },
          {
            workflow_key: key,
            actor_id: actorId,
            name: String(row.name),
            detail: String(row.detail),
            workflow_status: String(row.status) as
              "Queued" | "Running" | "Paused" | "Succeeded" | "Failed" | "Cancelled",
            sort_order: Number(row.sort_order ?? 0),
            metadata_json: null,
          },
          SYSTEM_ACTOR,
        );
        workflowsImported += 1;
      }
    }
  } catch {
    // Legacy table absent or Postgres without sqlite_master.
  }

  try {
    const alTable = await db.get<{ name?: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'command_center_alerts'",
    );
    if (alTable?.name) {
      const rows = await db.all<Record<string, unknown>>(
        "SELECT id, actor_id, text, ago, level, dismissed FROM command_center_alerts",
      );
      for (const row of rows) {
        const key = String(row.id);
        const actorId = String(row.actor_id);
        const existing = await alertModel.repository.find({ actor_id: actorId, alert_key: key });
        if (existing.length > 0) continue;
        await alertModel.repository.upsert(
          { actor_id: actorId, alert_key: key },
          {
            alert_key: key,
            actor_id: actorId,
            text: String(row.text),
            ago_label: typeof row.ago === "string" ? row.ago : null,
            level: String(row.level) as "high" | "medium" | "low",
            dismissed: Boolean(row.dismissed),
            dismissed_at: null,
          },
          SYSTEM_ACTOR,
        );
        alertsImported += 1;
      }
    }
  } catch {
    // Legacy table absent or Postgres without sqlite_master.
  }

  return { workflowsImported, alertsImported };
}

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
      listUrl: "/api/v1/command-center/overview",
      createUrl: "/api/v1/command-center/workflows",
      customActions: [
        {
          id: "advance",
          label: "Advance State",
          method: "POST",
          urlTemplate: "/api/v1/command-center/workflows/{id}/advance",
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
      listUrl: "/api/v1/command-center/overview",
      createUrl: "/api/v1/command-center/alerts",
      customActions: [
        {
          id: "dismiss",
          label: "Dismiss",
          method: "POST",
          urlTemplate: "/api/v1/command-center/alerts/{id}/dismiss",
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
  options: { registerRoutes?: (scope: FastifyInstance) => Promise<void> | void } = {},
): AddonDefinition {
  return {
    manifest: commandCenterManifest,
    models: [workflowModel, alertModel],
    rules: commandCenterRules,
    views: commandCenterViews,
    menus: commandCenterMenus,
    register: async () => {
      await importLegacyCommandCenter();
    },
    registerRoutes: options.registerRoutes,
  };
}

export const commandCenterAddon = createCommandCenterAddon();
