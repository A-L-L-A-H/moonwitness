// Moonwitness Skin Layer -- Public API & Unified Resolver Pipeline
// Coordinates: DNA -> Theme Mode -> Skin Preset -> Semantic/Component Tokens -> CSS Variables
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  canonicalTokensToCssVariables,
  resolveCanonicalTokens,
  type CanonicalDensity,
  type CanonicalResolvedTokens,
  type CanonicalThemeMode,
} from "../dna/canonical";
import type { SkinName } from "./compositions";
import {
  badgeSkinCompositions,
  cardSkinCompositions,
  eventCardVariants,
  inputSkinCompositions,
  kanbanColumnVariants,
  moduleCardVariants,
} from "./compositions";
import type { SkinPreset } from "./presets";
import { applyPreset, getPreset, listPresets, skinPresets } from "./presets";
import {
  isValidDnaId,
  useOptionalDnaWorld,
  type MasterDnaId,
} from "./dna-worlds";
import { buttonVariants as skinButtonVariants } from "./variants";

export type { SkinName } from "./compositions";
export type { SkinPreset } from "./presets";

export type ThemeMode = "dark" | "light" | "system";

const SKIN_STORAGE_KEY = "mw-skin";
const DNA_STORAGE_KEY = "mw-dna";
const THEME_STORAGE_KEY = "mw-theme";
const DENSITY_STORAGE_KEY = "mw-density";
const VALID_SKINS: readonly SkinName[] = [
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

function runWithViewTransition(update: () => void): void {
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

export interface SkinContextValue {
  /** Whether an explicit ancestor SkinProvider exists in the React tree */
  isProvided?: boolean;
  /** Whether an ancestor SkinProvider explicitly overrode dnaId */
  hasExplicitDna?: boolean;
  skin: SkinName;
  dnaId: MasterDnaId;
  mode: ThemeMode;
  resolvedMode: CanonicalThemeMode;
  density: CanonicalDensity;
  preset: SkinPreset;
  tokens: CanonicalResolvedTokens;
  cssVariables: Readonly<Record<`--${string}`, string>>;
  setSkin: (skin: SkinName) => void;
  setDna: (dnaId: MasterDnaId) => void;
  setMode: (mode: ThemeMode) => void;
  setDensity: (density: CanonicalDensity) => void;
  getClasses: (component: string, overrides?: Record<string, unknown>) => string;
  effects: string;
}

const initialResolvedTokens = resolveCanonicalTokens({
  dnaId: "05-riot-anarchy",
  skin: "default",
  mode: "dark",
  density: "comfortable",
});

const defaultSkinContext: SkinContextValue = {
  isProvided: false,
  skin: "default",
  dnaId: "05-riot-anarchy",
  mode: "system",
  resolvedMode: "dark",
  density: "comfortable",
  preset: skinPresets.default,
  tokens: initialResolvedTokens,
  cssVariables: canonicalTokensToCssVariables(initialResolvedTokens),
  setSkin: () => { },
  setDna: () => { },
  setMode: () => { },
  setDensity: () => { },
  getClasses: () => "",
  effects: "",
};

export const SkinContext = createContext<SkinContextValue>(defaultSkinContext);

export function isValidSkin(value: string): value is SkinName {
  return (VALID_SKINS as readonly string[]).includes(value);
}

export function skinBaseClasses(skin: SkinName): Record<string, string> {
  const safeSkin: SkinName = isValidSkin(skin) ? skin : "default";
  const applied = applyPreset(safeSkin);
  const preset = getPreset(safeSkin);
  const skinKey = safeSkin === "default" ? null : safeSkin;
  return {
    button: [
      `skin-${safeSkin}`,
      skinButtonVariants({ variant: applied.variant as never, skin: applied.skin }),
      preset.effects,
    ]
      .filter(Boolean)
      .join(" "),
    card: [
      `skin-${safeSkin}`,
      skinKey ? cardSkinCompositions[skinKey] : "bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)]",
    ]
      .filter(Boolean)
      .join(" "),
    input: [
      `skin-${safeSkin}`,
      skinKey ? inputSkinCompositions[skinKey] : "border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)]",
    ]
      .filter(Boolean)
      .join(" "),
    badge: [
      `skin-${safeSkin}`,
      skinKey ? badgeSkinCompositions[skinKey] : "bg-[var(--primary)] text-[var(--primary-foreground)]",
    ]
      .filter(Boolean)
      .join(" "),
    eventCard: eventCardVariants({ skin: safeSkin, density: applied.density }),
    kanbanColumn: kanbanColumnVariants({ skin: safeSkin, compact: applied.compact }),
    moduleCard: moduleCardVariants({
      skin: safeSkin,
      size: applied.moduleSize,
      elevated: applied.elevated,
    }),
    hudPanel: `skin-${applied.hudSkin} hud-layer`,
    scenePanel: `skin-${applied.sceneSkin} scene-layer`,
    atlasStage: `skin-${applied.atlasSkin} atlas-layer`,
  };
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

function readStoredSkin(fallback: SkinName): SkinName {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
    if (stored && isValidSkin(stored)) return stored;
  } catch {
    /* ignore storage failures */
  }
  return fallback;
}

function readStoredDna(fallback: MasterDnaId): MasterDnaId {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(DNA_STORAGE_KEY);
    if (stored && isValidDnaId(stored)) return stored;
  } catch {
    /* ignore storage failures */
  }
  return fallback;
}

function readStoredDensity(fallback: CanonicalDensity): CanonicalDensity {
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

function writeStyleVariables(elementId: string, selector: string, vars: Readonly<Record<`--${string}`, string>>): void {
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

export interface SkinProviderProps {
  defaultSkin?: SkinName;
  defaultDna?: MasterDnaId;
  defaultTheme?: ThemeMode;
  defaultDensity?: CanonicalDensity;
  /** "document" writes to documentElement, "local" isolates CSS vars to a subtree wrapper, "auto" picks local when nested */
  scope?: "auto" | "document" | "local";
  /** Persist skin/theme selections in localStorage when acting as root provider (default: true) */
  persist?: boolean;
  children: ReactNode;
  onSkinChange?: (skin: SkinName) => void;
  onDnaChange?: (dnaId: MasterDnaId) => void;
  onThemeChange?: (mode: ThemeMode) => void;
}

export function SkinProvider({
  defaultSkin = "default",
  defaultDna,
  defaultTheme = "system",
  defaultDensity = "comfortable",
  scope = "auto",
  persist = true,
  children,
  onSkinChange,
  onDnaChange,
  onThemeChange,
}: SkinProviderProps) {
  const parentSkin = useContext(SkinContext);
  const parentDnaWorld = useOptionalDnaWorld();
  const isNested = Boolean(parentSkin.isProvided || parentDnaWorld);
  const resolvedScope: "document" | "local" =
    scope === "auto" ? (isNested ? "local" : "document") : scope;

  const initialSafeSkin: SkinName = isValidSkin(defaultSkin) ? defaultSkin : "default";
  const initialSafeDna: MasterDnaId =
    defaultDna && isValidDnaId(defaultDna)
      ? defaultDna
      : parentDnaWorld
        ? parentDnaWorld.id
        : parentSkin.isProvided
          ? parentSkin.dnaId
          : "05-riot-anarchy";

  const [skin, setSkinState] = useState<SkinName>(initialSafeSkin);
  const [dnaId, setDnaState] = useState<MasterDnaId>(initialSafeDna);
  const [mode, setModeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedMode, setResolvedMode] = useState<CanonicalThemeMode>(() =>
    defaultTheme === "light" ? "light" : "dark",
  );
  const [density, setDensityState] = useState<CanonicalDensity>(defaultDensity);

  // Sync controlled/inherited default props when changed by caller (e.g. interactive controls)
  useEffect(() => {
    setSkinState(isValidSkin(defaultSkin) ? defaultSkin : "default");
  }, [defaultSkin]);

  useEffect(() => {
    if (defaultDna && isValidDnaId(defaultDna)) {
      setDnaState(defaultDna);
    } else if (parentDnaWorld) {
      setDnaState(parentDnaWorld.id);
    }
  }, [defaultDna, parentDnaWorld]);

  // Post-hydration storage + OS color-scheme synchronization (only on document scope)
  useEffect(() => {
    if (resolvedScope !== "document" || !persist) {
      setResolvedMode(resolveThemeMode(mode));
      return;
    }
    const storedSkin = readStoredSkin(initialSafeSkin);
    if (storedSkin !== initialSafeSkin) {
      setSkinState(storedSkin);
    }
    if (!defaultDna && !parentDnaWorld) {
      const storedDna = readStoredDna(initialSafeDna);
      if (storedDna !== initialSafeDna) {
        setDnaState(storedDna);
      }
    }
    const storedDensity = readStoredDensity(defaultDensity);
    if (storedDensity !== defaultDensity) {
      setDensityState(storedDensity);
    }
    const storedMode = getStoredThemeMode();
    if (storedMode !== defaultTheme) {
      setModeState(storedMode);
      setResolvedMode(resolveThemeMode(storedMode));
    } else {
      setResolvedMode(resolveThemeMode(defaultTheme));
    }
    // Run once on mount for client hydration consistency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // OS prefers-color-scheme live listener when mode === "system"
  useEffect(() => {
    setResolvedMode(resolveThemeMode(mode));
    if (mode !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      const nextResolved = mq.matches ? "light" : "dark";
      setResolvedMode(nextResolved);
      if (resolvedScope === "document" && typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", nextResolved);
      }
    };
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    }
    if (typeof mq.addListener === "function") {
      mq.addListener(handleChange);
      return () => mq.removeListener(handleChange);
    }
    return undefined;
  }, [mode, resolvedScope]);

  const tokens = useMemo(
    () => resolveCanonicalTokens({ dnaId, skin, mode: resolvedMode, density }),
    [dnaId, skin, resolvedMode, density],
  );
  const cssVariables = useMemo(() => canonicalTokensToCssVariables(tokens), [tokens]);

  // Keep documentElement attributes and CSS variables synchronized when acting as root provider
  useEffect(() => {
    if (resolvedScope !== "document" || typeof document === "undefined") return;
    document.documentElement.setAttribute("data-skin", skin);
    document.documentElement.setAttribute("data-dna", dnaId);
    document.documentElement.setAttribute("data-theme", resolvedMode);
    document.documentElement.setAttribute("data-density", density);
    writeStyleVariables("mw-skin-engine-variables", ":root", cssVariables);
  }, [resolvedScope, skin, dnaId, resolvedMode, density, cssVariables]);

  const setSkin = useCallback(
    (nextSkin: SkinName) => {
      const valid = isValidSkin(nextSkin) ? nextSkin : "default";
      runWithViewTransition(() => {
        setSkinState(valid);
      });
      if (resolvedScope === "document" && persist && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SKIN_STORAGE_KEY, valid);
        } catch {
          /* ignore storage failures */
        }
      }
      onSkinChange?.(valid);
    },
    [resolvedScope, persist, onSkinChange],
  );

  const setDna = useCallback(
    (nextDna: MasterDnaId) => {
      const valid: MasterDnaId = isValidDnaId(nextDna) ? nextDna : "02-lunar-chronicles";
      runWithViewTransition(() => {
        setDnaState(valid);
      });
      if (resolvedScope === "document" && persist && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(DNA_STORAGE_KEY, valid);
        } catch {
          /* ignore storage failures */
        }
      }
      onDnaChange?.(valid);
    },
    [resolvedScope, persist, onDnaChange],
  );

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      const safeMode: ThemeMode =
        nextMode === "dark" || nextMode === "light" || nextMode === "system" ? nextMode : "system";
      runWithViewTransition(() => {
        setModeState(safeMode);
        setResolvedMode(resolveThemeMode(safeMode));
        if (resolvedScope === "document") {
          applyThemeMode(safeMode, persist);
        }
      });
      onThemeChange?.(safeMode);
    },
    [resolvedScope, persist, onThemeChange],
  );

  const setDensity = useCallback(
    (nextDensity: CanonicalDensity) => {
      setDensityState(nextDensity);
      if (resolvedScope === "document" && persist && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(DENSITY_STORAGE_KEY, nextDensity);
        } catch {
          /* ignore storage failures */
        }
      }
    },
    [resolvedScope, persist],
  );

  const preset = getPreset(skin);
  const getClasses = useCallback(
    (component: string, overrides?: Record<string, unknown>): string => {
      const baseClasses = skinBaseClasses(skin);
      let className = baseClasses[component] || "";
      if (overrides) {
        const overrideEntries = Object.entries(overrides).filter(([, v]) => Boolean(v));
        if (overrideEntries.length > 0) {
          className = [className, ...overrideEntries.map(([k, v]) => `${k}-${String(v)}`)]
            .filter(Boolean)
            .join(" ");
        }
      }
      return className;
    },
    [skin],
  );

  const value = useMemo<SkinContextValue>(
    () => ({
      isProvided: true,
      hasExplicitDna: Boolean(defaultDna && isValidDnaId(defaultDna)),
      skin,
      dnaId,
      mode,
      resolvedMode,
      density,
      preset,
      tokens,
      cssVariables,
      setSkin,
      setDna,
      setMode,
      setDensity,
      getClasses,
      effects: preset.effects,
    }),
    [
      defaultDna,
      skin,
      dnaId,
      mode,
      resolvedMode,
      density,
      preset,
      tokens,
      cssVariables,
      setSkin,
      setDna,
      setMode,
      setDensity,
      getClasses,
    ],
  );

  if (resolvedScope === "local") {
    return React.createElement(
      SkinContext.Provider,
      { value },
      React.createElement(
        "div",
        {
          "data-skin": skin,
          "data-dna": dnaId,
          "data-theme": resolvedMode,
          "data-density": density,
          style: {
            ...(cssVariables as CSSProperties),
            display: "contents",
          },
        },
        children,
      ),
    );
  }

  return React.createElement(SkinContext.Provider, { value }, children);
}

/** React hook synchronized with active document/SkinProvider theme mode + OS preference listener */
export function useThemeMode(): {
  mode: ThemeMode;
  resolved: CanonicalThemeMode;
  setMode: (mode: ThemeMode) => void;
} {
  const ctx = useContext(SkinContext);
  const [standaloneMode, setStandaloneMode] = useState<ThemeMode>("system");
  const [standaloneResolved, setStandaloneResolved] = useState<CanonicalThemeMode>("dark");

  useEffect(() => {
    if (ctx.isProvided) return;
    const initial = getStoredThemeMode();
    setStandaloneMode(initial);
    setStandaloneResolved(applyThemeMode(initial, false));
  }, [ctx.isProvided]);

  useEffect(() => {
    if (ctx.isProvided) return;
    setStandaloneResolved(resolveThemeMode(standaloneMode));
    if (
      standaloneMode !== "system" ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      const next = mq.matches ? "light" : "dark";
      setStandaloneResolved(next);
      applyThemeMode("system", false);
    };
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    }
    if (typeof mq.addListener === "function") {
      mq.addListener(handleChange);
      return () => mq.removeListener(handleChange);
    }
    return undefined;
  }, [ctx.isProvided, standaloneMode]);

  const setStandalone = useCallback((next: ThemeMode) => {
    setStandaloneMode(next);
    setStandaloneResolved(applyThemeMode(next, true));
  }, []);

  if (ctx.isProvided) {
    return {
      mode: ctx.mode,
      resolved: ctx.resolvedMode,
      setMode: ctx.setMode,
    };
  }

  return { mode: standaloneMode, resolved: standaloneResolved, setMode: setStandalone };
}

export function useSkin(): SkinContextValue {
  return useContext(SkinContext);
}

export function withSkin<P extends { className?: string; skin?: SkinName }>(
  Component: React.ComponentType<P>,
  componentName: string,
): React.FC<P> {
  return function WithSkinComponent(props: P) {
    const { getClasses, skin: contextSkin } = useSkin();
    const effectiveSkin = props.skin && isValidSkin(props.skin) ? props.skin : contextSkin;
    const skinClasses = skinBaseClasses(effectiveSkin)[componentName] || getClasses(componentName);
    const mergedClassName = [skinClasses, props.className].filter(Boolean).join(" ");
    return React.createElement(Component, {
      ...props,
      className: mergedClassName,
      "data-skin": effectiveSkin,
    });
  };
}

const SEMANTIC_TAG_FOR_SKINNED: Record<string, keyof React.JSX.IntrinsicElements> = {
  button: "button",
  input: "input",
  badge: "span",
  card: "div",
  eventCard: "article",
  kanbanColumn: "section",
  moduleCard: "article",
};

export type SkinnedComponentProps = React.AllHTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
};

/**
 * Create a semantic HTML skin component (e.g. `button` for `'button'`, `input` for `'input'`)
 * carrying real skin recipe classes, `data-skin` attribute, and canonical CSS variables.
 */
export function createSkinComponent(componentName: string, skinName: SkinName) {
  const safeSkin: SkinName = isValidSkin(skinName) ? skinName : "default";
  const defaultTag = SEMANTIC_TAG_FOR_SKINNED[componentName] ?? "div";
  const resolved = resolveCanonicalTokens({ skin: safeSkin });
  const vars = canonicalTokensToCssVariables(resolved);

  const SkinnedComponent = React.forwardRef<HTMLElement, SkinnedComponentProps>(
    function SkinnedComponent({ as, className, style, children, ...rest }, ref) {
      const Tag = as || defaultTag;
      const baseClasses = skinBaseClasses(safeSkin);
      const mergedClass = [baseClasses[componentName] || "", className].filter(Boolean).join(" ");
      const defaultProps: Record<string, unknown> = {};
      if (Tag === "button" && !("type" in rest)) {
        defaultProps["type"] = "button";
      }
      if (Tag === "input" && !("type" in rest)) {
        defaultProps["type"] = "text";
      }

      return React.createElement(
        Tag,
        {
          ...defaultProps,
          ...rest,
          ref,
          className: mergedClass,
          style: { ...(vars as CSSProperties), ...style },
          "data-skin": safeSkin,
        },
        Tag === "input" ? undefined : children,
      );
    },
  );

  SkinnedComponent.displayName = `Skinned(${safeSkin}:${componentName})`;
  return SkinnedComponent;
}

export const Skinned = {
  Button: createSkinComponent("button", "default"),
  RiotButton: createSkinComponent("button", "riot"),
  EditorialButton: createSkinComponent("button", "editorial"),
  TechnicalButton: createSkinComponent("button", "technical"),
  ArchiveButton: createSkinComponent("button", "archive"),
  TransmissionButton: createSkinComponent("button", "transmission"),
  SanctuaryButton: createSkinComponent("button", "sanctuary"),
  BrutalistButton: createSkinComponent("button", "brutalist"),
  NoirButton: createSkinComponent("button", "noir"),
  KineticButton: createSkinComponent("button", "kinetic"),
  Card: createSkinComponent("card", "default"),
  RiotCard: createSkinComponent("card", "riot"),
  EditorialCard: createSkinComponent("card", "editorial"),
  TechnicalCard: createSkinComponent("card", "technical"),
  ArchiveCard: createSkinComponent("card", "archive"),
  TransmissionCard: createSkinComponent("card", "transmission"),
  SanctuaryCard: createSkinComponent("card", "sanctuary"),
  BrutalistCard: createSkinComponent("card", "brutalist"),
  NoirCard: createSkinComponent("card", "noir"),
  KineticCard: createSkinComponent("card", "kinetic"),
  Input: createSkinComponent("input", "default"),
  RiotInput: createSkinComponent("input", "riot"),
  EditorialInput: createSkinComponent("input", "editorial"),
  TechnicalInput: createSkinComponent("input", "technical"),
  ArchiveInput: createSkinComponent("input", "archive"),
  TransmissionInput: createSkinComponent("input", "transmission"),
  SanctuaryInput: createSkinComponent("input", "sanctuary"),
  BrutalistInput: createSkinComponent("input", "brutalist"),
  NoirInput: createSkinComponent("input", "noir"),
  KineticInput: createSkinComponent("input", "kinetic"),
  Badge: createSkinComponent("badge", "default"),
  RiotBadge: createSkinComponent("badge", "riot"),
  EditorialBadge: createSkinComponent("badge", "editorial"),
  TechnicalBadge: createSkinComponent("badge", "technical"),
  ArchiveBadge: createSkinComponent("badge", "archive"),
  TransmissionBadge: createSkinComponent("badge", "transmission"),
  SanctuaryBadge: createSkinComponent("badge", "sanctuary"),
  BrutalistBadge: createSkinComponent("badge", "brutalist"),
  NoirBadge: createSkinComponent("badge", "noir"),
  KineticBadge: createSkinComponent("badge", "kinetic"),
  EventCard: createSkinComponent("eventCard", "default"),
  RiotEventCard: createSkinComponent("eventCard", "riot"),
  EditorialEventCard: createSkinComponent("eventCard", "editorial"),
  TechnicalEventCard: createSkinComponent("eventCard", "technical"),
  ArchiveEventCard: createSkinComponent("eventCard", "archive"),
  TransmissionEventCard: createSkinComponent("eventCard", "transmission"),
  SanctuaryEventCard: createSkinComponent("eventCard", "sanctuary"),
  BrutalistEventCard: createSkinComponent("eventCard", "brutalist"),
  NoirEventCard: createSkinComponent("eventCard", "noir"),
  KineticEventCard: createSkinComponent("eventCard", "kinetic"),
  KanbanColumn: createSkinComponent("kanbanColumn", "default"),
  RiotKanbanColumn: createSkinComponent("kanbanColumn", "riot"),
  EditorialKanbanColumn: createSkinComponent("kanbanColumn", "editorial"),
  TechnicalKanbanColumn: createSkinComponent("kanbanColumn", "technical"),
  ArchiveKanbanColumn: createSkinComponent("kanbanColumn", "archive"),
  TransmissionKanbanColumn: createSkinComponent("kanbanColumn", "transmission"),
  SanctuaryKanbanColumn: createSkinComponent("kanbanColumn", "sanctuary"),
  BrutalistKanbanColumn: createSkinComponent("kanbanColumn", "brutalist"),
  NoirKanbanColumn: createSkinComponent("kanbanColumn", "noir"),
  KineticKanbanColumn: createSkinComponent("kanbanColumn", "kinetic"),
  ModuleCard: createSkinComponent("moduleCard", "default"),
  RiotModuleCard: createSkinComponent("moduleCard", "riot"),
  EditorialModuleCard: createSkinComponent("moduleCard", "editorial"),
  TechnicalModuleCard: createSkinComponent("moduleCard", "technical"),
  ArchiveModuleCard: createSkinComponent("moduleCard", "archive"),
  TransmissionModuleCard: createSkinComponent("moduleCard", "transmission"),
  SanctuaryModuleCard: createSkinComponent("moduleCard", "sanctuary"),
  BrutalistModuleCard: createSkinComponent("moduleCard", "brutalist"),
  NoirModuleCard: createSkinComponent("moduleCard", "noir"),
  KineticModuleCard: createSkinComponent("moduleCard", "kinetic"),
};

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

export { skinPresets, getPreset, applyPreset, listPresets };
export {
  composeEffects,
  effectPresets,
  halftone,
  grain,
  cmykSlip,
  duotone,
  tape,
  sticker,
  brushUnderline,
  scanlines,
  resolveEffectStyle,
} from "./effects";
export {
  eventCardVariants,
  kanbanColumnVariants,
  moduleCardVariants,
  buttonSkinCompositions,
  inputSkinCompositions,
  badgeSkinCompositions,
  cardSkinCompositions,
} from "./compositions";
export {
  IMPERIUM_LUMEN_TOKENS,
  LIVING_LIGHT_PALETTE,
  LIVING_LIGHT_TYPOGRAPHY,
  LIVING_LIGHT_MOTION,
  SACRED_VISUAL_COVENANT,
  DnaButton,
  DnaChamber,
  DnaPortalArch,
  DnaBadge,
  PrimaryAction,
  SecondaryAction,
  SiteNavigation,
  SectionHeading,
  StorySection,
  EditorialFeature,
  IllustrationFrame,
  ResponsiveImage,
  WorldTile,
  WorldExplorer,
  WorldAtlas,
  IllustratedHero,
  MotionReveal,
  type RenderingCapabilityTier,
  type SpringPhysicsPreset,
  type DnaButtonProps,
  type DnaChamberProps,
  type DnaPortalArchProps,
  type DnaBadgeProps,
  type ActionControlProps,
  type SiteNavigationItem,
  type SiteNavigationProps,
  type SectionHeadingProps,
  type StorySectionProps,
  type EditorialFeatureProps,
  type IllustrationFrameProps,
  type ResponsiveImageProps,
  type WorldTileProps,
  type WorldExplorerProps,
  type WorldAtlasItem,
  type WorldAtlasProps,
  type IllustratedHeroProps,
  type MotionRevealProps,
} from "./imperium";
export {
  SacredCornerBrackets,
  OctagramMandalaIcon,
  SearchLensIcon,
  CrescentStarIcon,
  DiamondStarOrnament,
  CrownEmblemIcon,
} from "./imperium-icons";
export {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  isValidDnaId,
  getDnaWorld,
  listDnaWorlds,
  dnaWorldCssVariables,
  useDnaWorld,
  useOptionalDnaWorld,
  SkinScope,
  SkinRoot,
  type MasterDnaId,
  type DnaWorldPalette,
  type MasterDnaWorldSpec,
  type SkinScopeProps,
  type SkinRootProps,
} from "./dna-worlds";
export {
  MOONFRAME_SKIN_ALIAS_MAP,
  resolveMoonframeSkinAlias,
  type MoonframeLegacySkinId,
} from "./presets";
