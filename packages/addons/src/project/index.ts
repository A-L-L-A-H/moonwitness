import type { FastifyInstance } from "fastify";
import {
  defaultFailClosedAuthBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { projectProjectModel, projectSyncLogModel, projectTaskModel } from "./models.js";
import { registerProjectRoutes } from "./routes.js";

export const projectManifest = manifestData as AddonManifestInput;
export * from "./models.js";
export * from "./service.js";
export { registerProjectRoutes } from "./routes.js";

export const projectRules: IrRuleInput[] = [
  { model_name: "project.project", role: "viewer", can_read: true },
  {
    model_name: "project.project",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "project.project",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "project.task", role: "viewer", can_read: true },
  {
    model_name: "project.task",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "project.task",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "project.sync_log", role: "viewer", can_read: true },
  {
    model_name: "project.sync_log",
    role: "editor",
    can_read: true,
    can_create: true,
  },
  {
    model_name: "project.sync_log",
    role: "admin",
    can_read: true,
    can_create: true,
    can_delete: true,
  },
];

export const projectViews: IrViewInput[] = [
  {
    model_name: "project.project",
    view_type: "list",
    spec: {
      title: "Project Portfolio",
      description: "Centralized projects and connected GitHub repositories.",
      domainIcon: "arsy",
      columns: ["code", "name", "project_status", "github_repo"],
    },
  },
  {
    model_name: "project.task",
    view_type: "list",
    spec: {
      title: "Project Tasks & Kanban Board",
      description: "Multi-stage tasks synchronized with GitHub Issues.",
      domainIcon: "arsy",
      columns: [
        "project_code",
        "title",
        "task_status",
        "priority",
        "assignee",
        "github_issue_number",
      ],
    },
  },
];

export const projectMenus: IrMenuInput[] = [
  {
    menu_key: "project.tasks",
    label: "Projects & Tasks",
    href: "/models/project.task",
    icon: "arsy",
    plane: "operations",
    sort_order: 27,
    min_role: "viewer",
  },
];

export function createProjectAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: projectManifest,
    models: [projectProjectModel, projectTaskModel, projectSyncLogModel],
    rules: projectRules,
    views: projectViews,
    menus: projectMenus,
    registerRoutes: async (scope: FastifyInstance) => {
      await registerProjectRoutes(scope, { prefix, auth });
    },
  };
}

export const projectAddon = createProjectAddon();
