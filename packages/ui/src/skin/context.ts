"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  canonicalTokensToCssVariables,
  resolveCanonicalTokens,
  type CanonicalDensity,
  type CanonicalResolvedTokens,
  type CanonicalThemeMode,
} from "../dna/canonical";
import type { SkinName } from "./compositions";
import { isValidDnaId, useOptionalDnaWorld, type MasterDnaId } from "./dna-worlds";
import { getPreset, skinPresets, type SkinPreset } from "./presets";
import { skinBaseClasses } from "./classes";
import {
  applyThemeMode,
  DENSITY_STORAGE_KEY,
  DNA_STORAGE_KEY,
  getStoredThemeMode,
  isValidSkin,
  readStoredDensity,
  readStoredDna,
  readStoredSkin,
  resolveThemeMode,
  runWithViewTransition,
  SKIN_STORAGE_KEY,
  type ThemeMode,
  writeStyleVariables,
} from "./constants";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  useIsomorphicLayoutEffect(() => {
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
