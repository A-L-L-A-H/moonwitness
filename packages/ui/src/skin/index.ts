// Moonwitness Skin Layer -- Public API
import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
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

export interface SkinProviderProps {
  defaultSkin?: SkinName;
  children: ReactNode;
  onSkinChange?: (skin: SkinName) => void;
}

export function SkinProvider({ defaultSkin = 'default', children, onSkinChange }: SkinProviderProps) {
  const [skin, setSkinState] = React.useState<SkinName>(defaultSkin);
  const preset = getPreset(skin);
  const setSkin = useCallback((newSkin: SkinName) => { setSkinState(newSkin); onSkinChange?.(newSkin); }, [onSkinChange]);
  const getClasses = useCallback((component: string, overrides?: Record<string, unknown>): string => {
    const applied = applyPreset(skin);
    const baseClasses: Record<string, string> = {
      button: (applied.variant || '') + ' ' + (applied.skin || '') + ' ' + (applied.size || ''),
      card: (applied.cardVariant || '') + ' ' + (applied.skin || ''),
      input: applied.inputSkin || '',
      badge: (applied.badgeVariant || '') + ' ' + (applied.badgeSkin || ''),
      eventCard: 'skin-' + (applied.skin || '') + ' density-' + (applied.density || ''),
      kanbanColumn: 'skin-' + (applied.skin || '') + ' ' + (applied.compact ? 'compact' : ''),
      moduleCard: 'skin-' + (applied.skin || '') + ' size-' + (applied.moduleSize || '') + ' ' + (applied.elevated ? 'elevated' : ''),
    };
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

export function useSkin(): SkinContextValue {
  const context = useContext(SkinContext);
  if (!context) throw new Error('useSkin must be used within a SkinProvider');
  return context;
}

export function withSkin<T extends React.ComponentType<any>>(Component: T, componentName: string): React.FC<React.ComponentProps<T> & { skin?: SkinName }> {
  return function WithSkinComponent(props: React.ComponentProps<T> & { skin?: SkinName }) {
    const { getClasses, setSkin, skin: contextSkin } = useSkin();
    const effectiveSkin = props.skin || contextSkin;
    const baseClassName = getClasses(componentName, {});
    const mergedClassName = [baseClassName, props.className].filter(Boolean).join(' ');
    const skinProps = effectiveSkin !== 'default' ? { skin: effectiveSkin } : {};
    return React.createElement(Component, { ...props, className: mergedClassName, ...skinProps });
  };
}

export function createSkinComponent(componentName: string, skinName: SkinName): React.FC<any> {
  return function SkinnedComponent(props: any) {
    const { getClasses, skin: contextSkin } = useSkin();
    const applied = applyPreset(skinName);
    const baseClasses: Record<string, string> = {
      button: (applied.variant || '') + ' ' + (applied.skin || '') + ' ' + (applied.size || ''),
      card: (applied.cardVariant || '') + ' ' + (applied.skin || ''),
      input: applied.inputSkin || '',
      badge: (applied.badgeVariant || '') + ' ' + (applied.badgeSkin || ''),
      eventCard: 'skin-' + (applied.skin || '') + ' density-' + (applied.density || ''),
      kanbanColumn: 'skin-' + (applied.skin || '') + ' ' + (applied.compact ? 'compact' : ''),
      moduleCard: 'skin-' + (applied.skin || '') + ' size-' + (applied.moduleSize || '') + ' ' + (applied.elevated ? 'elevated' : ''),
    };
    const className = [baseClasses[componentName] || '', props.className].filter(Boolean).join(' ');
    return React.createElement(props.as || 'div', { ...props, className, skin: skinName });
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

export function skinCn(baseVariants: Record<string, any>, skin: SkinName, componentOverrides?: Record<string, any>): string {
  const applied = applyPreset(skin);
  const merged = { ...baseVariants, ...applied, ...componentOverrides };
  return Object.entries(merged).filter(([, v]) => v !== undefined && v !== false && v !== '').map(([k, v]) => k + '-' + v).join(' ');
}

export { skinPresets, getPreset, applyPreset, listPresets } from './presets';
export { composeEffects, effectPresets, halftone, grain, cmykSlip, duotone, tape, sticker, brushUnderline } from './effects';
export { eventCardVariants, kanbanColumnVariants, moduleCardVariants, buttonSkinCompositions, inputSkinCompositions, badgeSkinCompositions, cardSkinCompositions } from './compositions';

