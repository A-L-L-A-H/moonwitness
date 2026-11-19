import type { IrMenuInput, IrRuleInput, IrViewInput } from "@moonwitness/addon-runtime";

export const timelineRules: IrRuleInput[] = [
  { model_name: "timeline.event", role: "public", can_read: true },
  { model_name: "timeline.event", role: "viewer", can_read: true },
  {
    model_name: "timeline.event",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "timeline.event",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "timeline.era", role: "public", can_read: true },
  { model_name: "timeline.era", role: "viewer", can_read: true },
  {
    model_name: "timeline.era",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "timeline.era",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const timelineViews: IrViewInput[] = [
  {
    model_name: "timeline.event",
    view_type: "list",
    priority: 10,
    actionBindings: {
      listUrl: "/api/v1/timeline/events",
      createUrl: "/api/v1/timeline/events",
      updateUrl: "/api/v1/timeline/events/{id}",
      archiveUrl: "/api/v1/timeline/events/{id}/archive",
      restoreUrl: "/api/v1/timeline/events/{id}/restore",
      deleteUrl: "/api/v1/timeline/events/{id}",
      historyUrl: "/api/v1/timeline/events/{id}/history",
    },
    spec: {
      title: "Timeline Events",
      description: "Canon chronological events and witness entries.",
      domainIcon: "scripture",
      columns: ["kind", "date", "era", "title", "location"],
    },
  },
  {
    model_name: "timeline.era",
    view_type: "list",
    priority: 10,
    actionBindings: {
      listUrl: "/api/v1/timeline/eras",
      createUrl: "/api/v1/m/timeline.era",
    },
    spec: {
      title: "Narrative Eras",
      description: "Epoch groupings spanning the witness chronicle.",
      domainIcon: "mtime",
      columns: ["name", "years", "tagline", "color"],
    },
  },
];

export const timelineMenus: IrMenuInput[] = [
  {
    menu_key: "timeline.archive",
    label: "Archive",
    href: "/dock",
    icon: "scripture",
    plane: "creator",
    sort_order: 90,
    min_role: "public",
  },
];
