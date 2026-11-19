import { HUD_NAV_ICON_PATHS } from "@moonwitness/ui/icons";
import type { NavItem } from "@/components/shell/nav-items";
import { hasRequiredRole, type RoleName } from "@/configs/routePolicy";
import type { Dictionary } from "@/utils/getDictionary";

export interface EnterpriseNavItem extends NavItem {
  minRole?: RoleName;
  group?: string;
}

export function buildEnterpriseNavItems(
  plane: "creator" | "operations",
  dict: Dictionary,
  localePrefix = "",
  role?: string | null,
): NavItem[] {
  const p = localePrefix ? (localePrefix.startsWith("/") ? localePrefix : `/${localePrefix}`) : "";

  if (plane === "operations") {
    const controlBase = p ? `${p}/apps/control` : "/control";
    return [
      {
        id: "control",
        label: dict.navigation.controlPlane,
        icon: HUD_NAV_ICON_PATHS.control,
        target: { kind: "route", href: controlBase },
      },
      {
        id: "vpn",
        label: dict.navigation.vpn,
        icon: HUD_NAV_ICON_PATHS.vpn,
        target: { kind: "route", href: `${controlBase}?tab=vpn` },
      },
      {
        id: "syslog",
        label: dict.navigation.syslog,
        icon: HUD_NAV_ICON_PATHS.syslog,
        target: { kind: "route", href: `${controlBase}?tab=syslog` },
      },
      {
        id: "snmp",
        label: dict.navigation.snmp,
        icon: HUD_NAV_ICON_PATHS.snmp,
        target: { kind: "route", href: `${controlBase}?tab=snmp` },
      },
      {
        id: "storage",
        label: dict.navigation.storage,
        icon: HUD_NAV_ICON_PATHS.storage,
        target: { kind: "route", href: `${controlBase}?tab=storage` },
      },
      {
        id: "radius",
        label: dict.navigation.radius,
        icon: HUD_NAV_ICON_PATHS.radius,
        target: { kind: "route", href: `${controlBase}?tab=radius` },
      },
      {
        id: "dashboard",
        label: dict.navigation.missionControl,
        icon: HUD_NAV_ICON_PATHS.dashboard,
        target: { kind: "route", href: `${p}/mission-control` },
      },
    ];
  }

  const candidates: EnterpriseNavItem[] = [
    {
      id: "dashboard",
      label: dict.navigation.missionControl,
      icon: HUD_NAV_ICON_PATHS.dashboard,
      target: { kind: "section", href: `${p}/mission-control`, anchor: "cc-top" },
    },
    {
      id: "analytics",
      label: dict.navigation.analytics,
      icon: HUD_NAV_ICON_PATHS.intelligence,
      target: { kind: "route", href: p ? `${p}/dashboards/analytics` : "/mission-control" },
    },
    {
      id: "crm",
      label: dict.navigation.crm,
      icon: HUD_NAV_ICON_PATHS.crew,
      target: { kind: "route", href: p ? `${p}/dashboards/crm` : "/addons?model=crm.lead" },
    },
    {
      id: "logistics",
      label: dict.navigation.logistics,
      icon: HUD_NAV_ICON_PATHS.storage,
      target: { kind: "route", href: p ? `${p}/dashboards/logistics` : "/addons?model=stock.move" },
    },
    {
      id: "story-studio",
      label: dict.navigation.storyStudio,
      icon: HUD_NAV_ICON_PATHS.storyStudio,
      target: { kind: "module", href: `${p}/mission-control`, moduleId: "story-forge" },
    },
    {
      id: "episodes",
      label: dict.navigation.episodes,
      icon: HUD_NAV_ICON_PATHS.episodes,
      target: { kind: "section", href: `${p}/mission-control`, anchor: "cc-workspace" },
    },
    {
      id: "poster-forge",
      label: dict.navigation.posterForge,
      icon: HUD_NAV_ICON_PATHS.posterForge,
      target: { kind: "module", href: `${p}/mission-control`, moduleId: "poster-lab" },
    },
    {
      id: "collections",
      label: dict.navigation.collections,
      icon: HUD_NAV_ICON_PATHS.collections,
      target: { kind: "section", href: `${p}/mission-control`, anchor: "cc-collections" },
    },
    {
      id: "research",
      label: dict.navigation.research,
      icon: HUD_NAV_ICON_PATHS.research,
      target: { kind: "section", href: `${p}/mission-control`, anchor: "cc-studios" },
    },
    {
      id: "crew",
      label: dict.navigation.crew,
      icon: HUD_NAV_ICON_PATHS.crew,
      target: { kind: "section", href: `${p}/mission-control`, anchor: "cc-crew" },
    },
    {
      id: "mission-log",
      label: dict.navigation.missionLog,
      icon: HUD_NAV_ICON_PATHS.missionLog,
      target: { kind: "section", href: `${p}/mission-control`, anchor: "cc-log" },
    },
    {
      id: "intelligence",
      label: dict.navigation.intelligence,
      icon: HUD_NAV_ICON_PATHS.intelligence,
      target: { kind: "route", href: p ? `${p}/apps/chat` : "/intelligence" },
    },
    {
      id: "observatory",
      label: dict.navigation.observatory,
      icon: HUD_NAV_ICON_PATHS.dashboard,
      target: { kind: "route", href: p ? `${p}/apps/observatory` : "/mtime" },
    },
    {
      id: "academy",
      label: dict.navigation.academy,
      icon: HUD_NAV_ICON_PATHS.research,
      target: { kind: "route", href: p ? `${p}/apps/academy` : "/codex" },
    },
    {
      id: "kanban",
      label: dict.navigation.kanban,
      icon: HUD_NAV_ICON_PATHS.episodes,
      target: { kind: "route", href: p ? `${p}/apps/kanban` : "/addons?model=cab.request" },
    },
    {
      id: "invoice",
      label: dict.navigation.invoice,
      icon: HUD_NAV_ICON_PATHS.collections,
      target: { kind: "route", href: p ? `${p}/apps/invoice` : "/addons?model=account.move" },
    },
    {
      id: "automation",
      label: dict.navigation.automation,
      icon: HUD_NAV_ICON_PATHS.control,
      target: { kind: "route", href: p ? `${p}/apps/automation` : "/addons?model=khidra.rule" },
    },
    {
      id: "base.addons",
      label: dict.navigation.addons,
      icon: HUD_NAV_ICON_PATHS.settings,
      target: { kind: "route", href: p ? `${p}/apps/addons` : "/addons" },
    },
    {
      id: "id-lab",
      label: dict.navigation.idLab,
      icon: HUD_NAV_ICON_PATHS.idLab,
      target: { kind: "route", href: `${p}/id-lab` },
    },
    {
      id: "skin-lab",
      label: dict.navigation.skinLab,
      icon: HUD_NAV_ICON_PATHS.skinLab,
      target: { kind: "route", href: `${p}/skin-lab` },
    },
    {
      id: "archive",
      label: dict.navigation.archive,
      icon: HUD_NAV_ICON_PATHS.archive,
      target: { kind: "route", href: `${p}/dock` },
    },
    {
      id: "memory",
      label: dict.navigation.memory,
      icon: HUD_NAV_ICON_PATHS.missionLog,
      target: { kind: "route", href: `${p}/memory` },
    },
    {
      id: "users",
      label: dict.navigation.users,
      icon: HUD_NAV_ICON_PATHS.crew,
      target: { kind: "route", href: p ? `${p}/apps/user/list` : "/addons?model=auth.user" },
      minRole: "admin",
    },
    {
      id: "roles",
      label: dict.navigation.roles,
      icon: HUD_NAV_ICON_PATHS.settings,
      target: { kind: "route", href: p ? `${p}/apps/roles` : "/addons?model=res.groups" },
      minRole: "admin",
    },
    {
      id: "permissions",
      label: dict.navigation.permissions,
      icon: HUD_NAV_ICON_PATHS.control,
      target: {
        kind: "route",
        href: p ? `${p}/apps/permissions` : "/addons?model=ir.model.access",
      },
      minRole: "admin",
    },
    {
      id: "settings",
      label: dict.navigation.shadowSignIn,
      icon: HUD_NAV_ICON_PATHS.settings,
      target: { kind: "route", href: `${p}/shadow` },
    },
  ];

  return candidates.filter(
    (item) => !item.minRole || hasRequiredRole(role ?? "admin", item.minRole),
  );
}
