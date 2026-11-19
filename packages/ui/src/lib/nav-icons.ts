import { HUD_NAV_ICON_PATHS, type HudNavIconPathKey } from "../icons/nav-paths";

const NAV_ICON_ALIASES: Readonly<Record<string, HudNavIconPathKey>> = {
  control: "control",
  vpn: "vpn",
  syslog: "syslog",
  snmp: "snmp",
  probes: "snmp",
  storage: "storage",
  radius: "radius",
  dashboard: "dashboard",
  "story-studio": "storyStudio",
  episodes: "episodes",
  "poster-forge": "posterForge",
  collections: "collections",
  research: "research",
  crew: "crew",
  "mission-log": "missionLog",
  intelligence: "intelligence",
  ai: "intelligence",
  "id-lab": "idLab",
  "skin-lab": "skinLab",
  archive: "archive",
  timeline: "archive",
  settings: "settings",
  shadow: "settings",
  scripture: "missionLog",
  canon: "missionLog",
  i18n: "episodes",
  mtime: "research",
  memory: "storage",
  addons: "collections",
  dot: "collections",
};

/** Resolves a symbolic addon menu icon key (or a raw stroke path) to a stroke path. */
export function resolveNavIconPath(icon?: string): string {
  const raw = typeof icon === "string" ? icon.trim() : "";
  if (raw.startsWith("M")) return raw;
  return HUD_NAV_ICON_PATHS[NAV_ICON_ALIASES[raw] ?? "collections"];
}
