/**
 * Canonical stroke-path catalogue for the tactical HUD navigation rail & sidebar.
 * All paths target a `viewBox="0 0 24 24"` grid so route configurations do not
 * duplicate raw `"M..."` strings inside app codebases.
 */

const SHIELD_HEX_PATH = "M12 3 L20 7 L20 17 L12 21 L4 17 L4 7 Z M8 10 L16 10 M8 14 L16 14";

const LAYERED_STACK_PATH = "M4 7 L12 3 L20 7 L12 11 Z M4 12 L12 16 L20 12 M4 17 L12 21 L20 17";

export const HUD_NAV_ICON_PATHS = {
  control: "M4 6 L20 6 M4 12 L20 12 M4 18 L20 18 M8 4 L8 8 M16 10 L16 14 M11 16 L11 20",
  vpn: SHIELD_HEX_PATH,
  syslog: "M4 5 L20 5 L20 19 L4 19 Z M8 9 L16 9 M8 13 L16 13 M8 17 L12 17",
  snmp: "M4 5 L20 5 L20 19 L4 19 Z M8 9 L16 9 M8 13 L16 13",
  storage: LAYERED_STACK_PATH,
  radius: SHIELD_HEX_PATH,
  dashboard: "M4 11 L12 4 L20 11 M6 10 L6 20 L18 20 L18 10",
  storyStudio: "M4 20 L6 14 L16 4 L20 8 L10 18 Z M14 6 L18 10",
  episodes: "M4 5 L20 5 L20 19 L4 19 Z M8 9 L16 9 M8 13 L13 13",
  posterForge:
    "M4 5 L20 5 L20 19 L4 19 Z M4 15 L9 10 L14 15 L17 12 L20 15 M9 8.5 A0.5 0.5 0 1 0 9 8.5",
  collections: LAYERED_STACK_PATH,
  research: "M10 3 L14 3 M11 3 L11 9 L5 19 Q4 21 7 21 L17 21 Q20 21 19 19 L13 9 L13 3 M8 15 L16 15",
  crew: "M9 11 A3.5 3.5 0 1 0 9 4 A3.5 3.5 0 1 0 9 11 M2 20 Q2 15 9 15 Q16 15 16 20 M17 11 A3 3 0 1 0 17 5 M18 20 Q18 16 22 16",
  missionLog: "M5 4 L19 4 L19 20 L5 20 Z M8 8 L16 8 M8 12 L16 12 M8 16 L13 16",
  intelligence: "M12 3 L14 9 L21 12 L14 15 L12 21 L10 15 L3 12 L10 9 Z M12 9 L12 15",
  idLab:
    "M12 11 A4 4 0 1 0 12 3 A4 4 0 1 0 12 11 M4 21 Q4 15 12 15 Q20 15 20 21 M17 4 L18 2 L19 4 L21 5 L19 6 L18 8 L17 6 L15 5 Z",
  skinLab: "M12 3 L21 7.5 L12 12 L3 7.5 Z M3 12 L12 16.5 L21 12 M3 16.5 L12 21 L21 16.5",
  archive: "M4 8 L12 4 L20 8 L20 16 L12 20 L4 16 Z M4 8 L12 12 L20 8 M12 12 L12 20",
  settings:
    "M12 8 A4 4 0 1 0 12 16 A4 4 0 1 0 12 8 M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M19 5 L17 7 M7 17 L5 19",
} as const;

export type HudNavIconPathKey = keyof typeof HUD_NAV_ICON_PATHS;
