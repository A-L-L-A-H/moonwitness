export const LAB_INSPECT_VIEWS = [
  "inspector",
  "snapshot",
  "rir",
  "text",
  "agent",
  "voice",
  "history",
  "diff",
  "evidence",
  "profile",
] as const;
export const LAB_DETAIL_LEVELS = ["compact", "standard", "expanded"] as const;
export const LAB_VISUAL_THEMES = ["dark", "light"] as const;

export type InspectView = (typeof LAB_INSPECT_VIEWS)[number];
export type LabDetailLevel = (typeof LAB_DETAIL_LEVELS)[number];
export type VisualTheme = (typeof LAB_VISUAL_THEMES)[number];

export interface LabPresentationState {
  scenarioId: string;
  theme: VisualTheme;
  detail: LabDetailLevel;
  inspect: InspectView;
}

export function parseLabPresentationState(args: {
  url: string | URL;
  scenarioIds: readonly string[];
  fallbackTheme?: VisualTheme;
}): LabPresentationState {
  if (args.scenarioIds.length === 0) throw new Error("CRAYON Lab requires at least one scenario identity.");
  const url = typeof args.url === "string" ? new URL(args.url, "https://crayon.invalid") : new URL(args.url.toString());
  const scenario = url.searchParams.get("scenario");
  const theme = url.searchParams.get("theme");
  const detail = url.searchParams.get("detail");
  const inspect = url.searchParams.get("inspect");

  return Object.freeze({
    scenarioId: scenario && args.scenarioIds.includes(scenario) ? scenario : args.scenarioIds[0],
    theme: isMember(theme, LAB_VISUAL_THEMES) ? theme : args.fallbackTheme ?? "dark",
    detail: isMember(detail, LAB_DETAIL_LEVELS) ? detail : "standard",
    inspect: isMember(inspect, LAB_INSPECT_VIEWS) ? inspect : "inspector",
  });
}

export function withLabPresentationState(urlInput: string | URL, state: LabPresentationState): URL {
  const url = typeof urlInput === "string" ? new URL(urlInput, "https://crayon.invalid") : new URL(urlInput.toString());
  url.searchParams.set("scenario", state.scenarioId);
  url.searchParams.set("theme", state.theme);
  url.searchParams.set("detail", state.detail);
  url.searchParams.set("inspect", state.inspect);
  return url;
}

function isMember<T extends string>(value: string | null, values: readonly T[]): value is T {
  return value !== null && values.includes(value as T);
}
