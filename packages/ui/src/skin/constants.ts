import { flushSync } from "react-dom";
import type { CanonicalDensity, CanonicalThemeMode } from "../dna/canonical";
import type { SkinName } from "./compositions";
import { isValidDnaId, type MasterDnaId } from "./dna-worlds";
import { applyPreset } from "./presets";

export type ThemeMode = "dark" | "light" | "system";

export const SKIN_STORAGE_KEY = "mw-skin";
export const DNA_STORAGE_KEY = "mw-dna";
export const THEME_STORAGE_KEY = "mw-theme";
export const DENSITY_STORAGE_KEY = "mw-density";
export const VALID_SKINS: readonly SkinName[] = [
  "default",
  "riot",
  "editorial",
  "technical",
  "archive",
  "transmission",
  "sanctuary",
  "brutalist",
  "noir",
  "kinetic",
];


export function runWithViewTransition(update: () => void): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    update();
    return;
  }
  const prefersReduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!prefersReduced && typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => {
      flushSync(update);
    });
    return;
  }
  update();
}

export function isValidSkin(value: string): value is SkinName {
  return (VALID_SKINS as readonly string[]).includes(value);
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") return stored;
  } catch {
    /* ignore storage failures */
  }
  return "system";
}

export function resolveThemeMode(mode: ThemeMode): CanonicalThemeMode {
  if (mode === "system") {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return "dark";
    }
    try {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } catch {
      return "dark";
    }
  }
  return mode;
}

export function applyThemeMode(mode: ThemeMode, persist = true): CanonicalThemeMode {
  const resolved = resolveThemeMode(mode);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
  }
  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignore storage failures */
    }
  }
  return resolved;
}

export function readStoredSkin(fallback: SkinName): SkinName {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
    if (stored && isValidSkin(stored)) return stored;
  } catch {
    /* ignore storage failures */
  }
  return fallback;
}

export function readStoredDna(fallback: MasterDnaId): MasterDnaId {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(DNA_STORAGE_KEY);
    if (stored && isValidDnaId(stored)) return stored;
  } catch {
    /* ignore storage failures */
  }
  return fallback;
}

export function readStoredDensity(fallback: CanonicalDensity): CanonicalDensity {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(DENSITY_STORAGE_KEY);
    if (stored === "compact" || stored === "comfortable" || stored === "spacious") {
      return stored;
    }
  } catch {
    /* ignore storage failures */
  }
  return fallback;
}

export function writeStyleVariables(elementId: string, selector: string, vars: Readonly<Record<`--${string}`, string>>): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(elementId) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = elementId;
    document.head.appendChild(el);
  }
  const declarations = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  el.textContent = `${selector} {\n${declarations}\n}`;
}

export function skinCn(
  baseVariants: Record<string, unknown>,
  skin: SkinName,
  componentOverrides?: Record<string, unknown>,
): string {
  const applied = applyPreset(isValidSkin(skin) ? skin : "default");
  const merged = { ...baseVariants, ...applied, ...componentOverrides };
  return Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== false && v !== "")
    .map(([k, v]) => `${k}-${String(v)}`)
    .join(" ");
}
