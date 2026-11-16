// Moonwitness Skin Layer -- Public API
'use client';

import React, { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import type { SkinName } from './compositions';
import type { SkinPreset } from './presets';
import { skinPresets, getPreset, applyPreset } from './presets';

export type { SkinName } from './compositions';
export type { SkinPreset } from './presets';

export interface SkinContextValue {
  skin: SkinName;
  preset: SkinPreset;
  setSkin: (skin: SkinName) => void;
  getClasses: (component: string, overrides?: Record<string, unknown>) => string;
  effects: string;
}

const defaultSkinContext: SkinContextValue = {
  skin: 'default', preset: skinPresets.default, setSkin: () => {},
  getClasses: () => '', effects: '',
};

export const SkinContext = createContext<SkinContextValue>(defaultSkinContext);

export function skinBaseClasses(skin: SkinName): Record<string, string> {
  const applied = applyPreset(skin);
  return {
    button: (applied.variant || '') + ' ' + (applied.skin || '') + ' ' + (applied.size || ''),
    card: (applied.cardVariant || '') + ' ' + (applied.skin || ''),
    input: applied.inputSkin || '',
    badge: (applied.badgeVariant || '') + ' ' + (applied.badgeSkin || ''),
    eventCard: 'skin-' + (applied.skin || '') + ' density-' + (applied.density || ''),
    kanbanColumn: 'skin-' + (applied.skin || '') + ' ' + (applied.compact ? 'compact' : ''),
    moduleCard: 'skin-' + (applied.skin || '') + ' ' + 'size-' + (applied.moduleSize || '') + ' ' + (applied.elevated ? 'elevated' : ''),
    hudPanel: 'skin-' + (applied.hudSkin || '') + ' hud-layer',
    scenePanel: 'skin-' + (applied.sceneSkin || '') + ' scene-layer',
    atlasStage: 'skin-' + (applied.atlasSkin || '') + ' atlas-layer',
  };
}

export interface SkinProviderProps {
  defaultSkin?: SkinName;
  children: ReactNode;
  onSkinChange?: (skin: SkinName) => void;
}

export function SkinProvider({ defaultSkin = 'default', children, onSkinChange }: SkinProviderProps) {
  const [skin, setSkinState] = React.useState<SkinName>(() => {
    if (typeof window === 'undefined') return defaultSkin;
    try {
      const stored = window.localStorage.getItem('mw-skin');
      if (stored && isValidSkin(stored)) return stored as SkinName;
    } catch { /* ignore */ }
    return defaultSkin;
  });
  const preset = getPreset(skin);
  const setSkin = useCallback((newSkin: SkinName) => {
    setSkinState(newSkin);
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('mw-skin', newSkin); } catch { /* ignore */ }
    }
    onSkinChange?.(newSkin);
  }, [onSkinChange]);
  const getClasses = useCallback((component: string, overrides?: Record<string, unknown>): string => {
    const baseClasses = skinBaseClasses(skin);
    let className = baseClasses[component] || '';
    if (overrides) {
      const overrideEntries = Object.entries(overrides).filter(([, v]) => v);
      if (overrideEntries.length > 0) className += ' ' + overrideEntries.map(([k, v]) => k + '-' + v).join(' ');
    }
    return className;
  }, [skin]);
  const effects = preset.effects;
  const value = useMemo(() => ({ skin, preset, setSkin, getClasses, effects }), [skin, preset, setSkin, getClasses, effects]);
  return React.createElement(SkinContext.Provider, { value }, children);
}

/* ── Theme (dark/light) ─────────────────────────────────────────── */

export type ThemeMode = 'dark' | 'light' | 'system';

const THEME_KEY = 'mw-theme';

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  } catch { /* ignore */ }
  return 'system';
}

export function resolveThemeMode(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return mode;
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const resolved = resolveThemeMode(mode);
  document.documentElement.setAttribute('data-theme', resolved);
  try { window.localStorage.setItem(THEME_KEY, mode); } catch { /* ignore */ }
}

export function useThemeMode(): {
  mode: ThemeMode;
  resolved: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
} {
  const [mode, setModeState] = React.useState<ThemeMode>(getStoredThemeMode);

  React.useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    applyThemeMode(next);
  }, []);

  const resolved = resolveThemeMode(mode);

  return { mode, resolved, setMode };
}

function isValidSkin(value: string): boolean {
  return ['default', 'riot', 'editorial', 'technical', 'archive', 'transmission'].includes(value);
}

export { isValidSkin };

export function useSkin(): SkinContextValue {
  const context = useContext(SkinContext);
  if (!context) throw new Error('useSkin must be used within a SkinProvider');
  return context;
}

export function withSkin<P extends { className?: string; skin?: SkinName }>(Component: React.ComponentType<P>, componentName: string): React.FC<P> {
  return function WithSkinComponent(props: P) {
    const { getClasses, skin: contextSkin } = useSkin();
    const effectiveSkin = props.skin || contextSkin;
    const baseClassName = getClasses(componentName, {});
    const mergedClassName = [baseClassName, props.className].filter(Boolean).join(' ');
    const skinProps = effectiveSkin !== 'default' ? { skin: effectiveSkin } : {};
    return React.createElement(Component, { ...props, className: mergedClassName, ...skinProps });
  };
}

export function createSkinComponent(componentName: string, skinName: SkinName): React.FC<React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }> {
  return function SkinnedComponent(props: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
    const { as, ...rest } = props;
    const baseClasses = skinBaseClasses(skinName);
    const className = [baseClasses[componentName] || '', rest.className].filter(Boolean).join(' ');
    return React.createElement(as || 'div', { ...rest, className, 'data-skin': skinName });
  };
}

export const Skinned = {
  Button: createSkinComponent('button', 'default'),
  RiotButton: createSkinComponent('button', 'riot'),
  EditorialButton: createSkinComponent('button', 'editorial'),
  TechnicalButton: createSkinComponent('button', 'technical'),
  ArchiveButton: createSkinComponent('button', 'archive'),
  TransmissionButton: createSkinComponent('button', 'transmission'),
  Card: createSkinComponent('card', 'default'),
  RiotCard: createSkinComponent('card', 'riot'),
  EditorialCard: createSkinComponent('card', 'editorial'),
  TechnicalCard: createSkinComponent('card', 'technical'),
  ArchiveCard: createSkinComponent('card', 'archive'),
  TransmissionCard: createSkinComponent('card', 'transmission'),
  Input: createSkinComponent('input', 'default'),
  RiotInput: createSkinComponent('input', 'riot'),
  EditorialInput: createSkinComponent('input', 'editorial'),
  TechnicalInput: createSkinComponent('input', 'technical'),
  ArchiveInput: createSkinComponent('input', 'archive'),
  TransmissionInput: createSkinComponent('input', 'transmission'),
  Badge: createSkinComponent('badge', 'default'),
  RiotBadge: createSkinComponent('badge', 'riot'),
  EditorialBadge: createSkinComponent('badge', 'editorial'),
  TechnicalBadge: createSkinComponent('badge', 'technical'),
  ArchiveBadge: createSkinComponent('badge', 'archive'),
  TransmissionBadge: createSkinComponent('badge', 'transmission'),
  EventCard: createSkinComponent('eventCard', 'default'),
  RiotEventCard: createSkinComponent('eventCard', 'riot'),
  EditorialEventCard: createSkinComponent('eventCard', 'editorial'),
  TechnicalEventCard: createSkinComponent('eventCard', 'technical'),
  ArchiveEventCard: createSkinComponent('eventCard', 'archive'),
  TransmissionEventCard: createSkinComponent('eventCard', 'transmission'),
  KanbanColumn: createSkinComponent('kanbanColumn', 'default'),
  RiotKanbanColumn: createSkinComponent('kanbanColumn', 'riot'),
  EditorialKanbanColumn: createSkinComponent('kanbanColumn', 'editorial'),
  TechnicalKanbanColumn: createSkinComponent('kanbanColumn', 'technical'),
  ArchiveKanbanColumn: createSkinComponent('kanbanColumn', 'archive'),
  TransmissionKanbanColumn: createSkinComponent('kanbanColumn', 'transmission'),
  ModuleCard: createSkinComponent('moduleCard', 'default'),
  RiotModuleCard: createSkinComponent('moduleCard', 'riot'),
  EditorialModuleCard: createSkinComponent('moduleCard', 'editorial'),
  TechnicalModuleCard: createSkinComponent('moduleCard', 'technical'),
  ArchiveModuleCard: createSkinComponent('moduleCard', 'archive'),
  TransmissionModuleCard: createSkinComponent('moduleCard', 'transmission'),
};

export function skinCn(baseVariants: Record<string, unknown>, skin: SkinName, componentOverrides?: Record<string, unknown>): string {
  const applied = applyPreset(skin);
  const merged = { ...baseVariants, ...applied, ...componentOverrides };
  return Object.entries(merged).filter(([, v]) => v !== undefined && v !== false && v !== '').map(([k, v]) => k + '-' + v).join(' ');
}

export { skinPresets, getPreset, applyPreset, listPresets } from './presets';
export { composeEffects, effectPresets, halftone, grain, cmykSlip, duotone, tape, sticker, brushUnderline } from './effects';
export { eventCardVariants, kanbanColumnVariants, moduleCardVariants, buttonSkinCompositions, inputSkinCompositions, badgeSkinCompositions, cardSkinCompositions } from './compositions';
export {
  DnaButton,
  DnaChamber,
  DnaPortalArch,
  DnaBadge,
  type DnaButtonProps,
  type DnaChamberProps,
  type DnaPortalArchProps,
  type DnaBadgeProps,
} from './imperium';
export {
  SacredCornerBrackets,
  OctagramMandalaIcon,
  SearchLensIcon,
  CrescentStarIcon,
  DiamondStarOrnament,
} from './imperium-icons';
export {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  getDnaWorld,
  listDnaWorlds,
  dnaWorldCssVariables,
  useDnaWorld,
  SkinScope,
  SkinRoot,
  type MasterDnaId,
  type DnaWorldPalette,
  type MasterDnaWorldSpec,
  type SkinScopeProps,
  type SkinRootProps,
} from './dna-worlds';
