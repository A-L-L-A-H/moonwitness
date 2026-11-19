"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import type {
  CanonicalDensity as SkinDensity,
  MasterDnaId as DnaWorldId,
  SkinName as SkinPresetKey,
  ThemeMode as SkinMode,
} from "@moonwitness/ui";
import themeConfig, { type ContentWidthMode, type LayoutMode } from "@/configs/themeConfig";
import { useObjectCookie } from "@core/hooks/useObjectCookie";

export interface Settings {
  mode: SkinMode;
  skin: SkinPresetKey;
  dnaId: DnaWorldId;
  density: SkinDensity;
  layout: LayoutMode;
  contentWidth: ContentWidthMode;
  navbarContentWidth: ContentWidthMode;
  footerContentWidth: ContentWidthMode;
  primaryColor?: string;
}

export interface UpdateSettingsOptions {
  updateCookie?: boolean;
}

export interface SettingsContextProps {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>, options?: UpdateSettingsOptions) => void;
  isSettingsChanged: boolean;
  resetSettings: () => void;
  updatePageSettings: (settings: Partial<Settings>) => () => void;
}

const DEFAULT_SETTINGS: Settings = {
  mode: themeConfig.mode,
  skin: themeConfig.skin,
  dnaId: "01-imperium-lumen",
  density: "comfortable",
  layout: themeConfig.layout,
  contentWidth: themeConfig.contentWidth,
  navbarContentWidth: themeConfig.navbarContentWidth,
  footerContentWidth: themeConfig.footerContentWidth,
};

export const SettingsContext = createContext<SettingsContextProps>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  isSettingsChanged: false,
  resetSettings: () => {},
  updatePageSettings: () => () => {},
});

const SettingsMountedContext = createContext(false);

export function SettingsProvider({
  children,
  settingsCookie,
  mode,
}: {
  children: ReactNode;
  settingsCookie?: Partial<Settings> | null;
  mode?: SkinMode;
}) {
  const alreadyMounted = useContext(SettingsMountedContext);
  const initialSettings: Settings = useMemo(
    () => ({
      ...DEFAULT_SETTINGS,
      ...(mode ? { mode } : {}),
      ...(settingsCookie ?? {}),
    }),
    [mode, settingsCookie],
  );

  const [settingsState, setSettingsCookie] = useObjectCookie<Settings>(
    themeConfig.settingsCookieName,
    initialSettings,
  );

  const settingsRef = useRef(settingsState);
  settingsRef.current = settingsState;

  const updateSettings = useCallback(
    (next: Partial<Settings>, options?: UpdateSettingsOptions) => {
      const { updateCookie = true } = options ?? {};
      setSettingsCookie((prev) => ({ ...prev, ...next }), { updateCookie });
    },
    [setSettingsCookie],
  );

  const updatePageSettings = useCallback(
    (pageSettings: Partial<Settings>): (() => void) => {
      const prevSnapshot = settingsRef.current;
      const restorePatch: Partial<Settings> = {};
      for (const key of Object.keys(pageSettings) as Array<keyof Settings>) {
        (restorePatch as Record<string, unknown>)[key] = prevSnapshot[key];
      }
      updateSettings(pageSettings, { updateCookie: false });
      return () => updateSettings(restorePatch, { updateCookie: false });
    },
    [updateSettings],
  );

  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_SETTINGS);
  }, [updateSettings]);

  const isSettingsChanged = useMemo(
    () => JSON.stringify(DEFAULT_SETTINGS) !== JSON.stringify(settingsState),
    [settingsState],
  );

  if (alreadyMounted && settingsCookie === undefined && mode === undefined) {
    return <>{children}</>;
  }

  return (
    <SettingsMountedContext.Provider value={true}>
      <SettingsContext.Provider
        value={{
          settings: settingsState,
          updateSettings,
          isSettingsChanged,
          resetSettings,
          updatePageSettings,
        }}
      >
        {children}
      </SettingsContext.Provider>
    </SettingsMountedContext.Provider>
  );
}
