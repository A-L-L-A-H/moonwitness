// Moonwitness Skin Layer -- Named Presets
import type { SkinName } from './compositions';

export interface SkinPreset {
  readonly name: SkinName;
  readonly label: string;
  readonly description: string;
  readonly button: { variant: string; skin: SkinName; size?: string };
  readonly card: { variant: string; skin: SkinName };
  readonly input: { skin: SkinName };
  readonly badge: { variant: string; skin: SkinName };
  readonly eventCard: { skin: SkinName; density: 'compact' | 'comfortable' | 'spacious' };
  readonly kanbanColumn: { skin: SkinName; compact: boolean };
  readonly moduleCard: { skin: SkinName; size: 'sm' | 'md' | 'lg' | 'xl'; elevated: boolean };
  readonly effects: string;
}

export const defaultPreset: SkinPreset = {
  name: 'default', label: 'Moonwitness', description: 'Core identity',
  button: { variant: 'default', skin: 'default' }, card: { variant: 'default', skin: 'default' },
  input: { skin: 'default' }, badge: { variant: 'default', skin: 'default' },
  eventCard: { skin: 'default', density: 'comfortable' }, kanbanColumn: { skin: 'default', compact: false },
  moduleCard: { skin: 'default', size: 'md', elevated: true }, effects: '',
};

export const riotPreset: SkinPreset = {
  name: 'riot', label: 'Riot', description: 'Punk grunge',
  button: { variant: 'riot', skin: 'riot', size: 'default' }, card: { variant: 'default', skin: 'riot' },
  input: { skin: 'riot' }, badge: { variant: 'default', skin: 'riot' },
  eventCard: { skin: 'riot', density: 'comfortable' }, kanbanColumn: { skin: 'riot', compact: false },
  moduleCard: { skin: 'riot', size: 'md', elevated: true }, effects: 'halftone grain cmyk-slip',
};

export const editorialPreset: SkinPreset = {
  name: 'editorial', label: 'Editorial', description: 'Magazine style',
  button: { variant: 'editorial', skin: 'editorial', size: 'lg' }, card: { variant: 'outline', skin: 'editorial' },
  input: { skin: 'editorial' }, badge: { variant: 'outline', skin: 'editorial' },
  eventCard: { skin: 'editorial', density: 'spacious' }, kanbanColumn: { skin: 'editorial', compact: false },
  moduleCard: { skin: 'editorial', size: 'lg', elevated: false }, effects: 'duotone brush-underline',
};

export const technicalPreset: SkinPreset = {
  name: 'technical', label: 'Technical', description: 'Spec sheet',
  button: { variant: 'technical', skin: 'technical', size: 'sm' }, card: { variant: 'default', skin: 'technical' },
  input: { skin: 'technical' }, badge: { variant: 'default', skin: 'technical' },
  eventCard: { skin: 'technical', density: 'compact' }, kanbanColumn: { skin: 'technical', compact: true },
  moduleCard: { skin: 'technical', size: 'md', elevated: true }, effects: '',
};

export const archivePreset: SkinPreset = {
  name: 'archive', label: 'Archive', description: 'Paper archive',
  button: { variant: 'archive', skin: 'archive', size: 'default' }, card: { variant: 'default', skin: 'archive' },
  input: { skin: 'archive' }, badge: { variant: 'default', skin: 'archive' },
  eventCard: { skin: 'archive', density: 'comfortable' }, kanbanColumn: { skin: 'archive', compact: false },
  moduleCard: { skin: 'archive', size: 'lg', elevated: true }, effects: 'grain brush-underline sticker',
};

export const transmissionPreset: SkinPreset = {
  name: 'transmission', label: 'Transmission', description: 'Signal broadcast',
  button: { variant: 'transmission', skin: 'transmission', size: 'default' }, card: { variant: 'default', skin: 'transmission' },
  input: { skin: 'transmission' }, badge: { variant: 'default', skin: 'transmission' },
  eventCard: { skin: 'transmission', density: 'comfortable' }, kanbanColumn: { skin: 'transmission', compact: false },
  moduleCard: { skin: 'transmission', size: 'md', elevated: true }, effects: 'halftone grain scanlines',
};

export const skinPresets: Record<SkinName, SkinPreset> = {
  default: defaultPreset, riot: riotPreset, editorial: editorialPreset,
  technical: technicalPreset, archive: archivePreset, transmission: transmissionPreset,
};

export function getPreset(name: SkinName): SkinPreset { return skinPresets[name]; }
export function listPresets(): SkinName[] { return Object.keys(skinPresets) as SkinName[]; }

export function applyPreset(name: SkinName) {
  const preset = getPreset(name);
  return {
    variant: preset.button.variant, skin: preset.button.skin, size: preset.button.size,
    cardVariant: preset.card.variant, inputSkin: preset.input.skin, badgeVariant: preset.badge.variant,
    badgeSkin: preset.badge.skin,
    density: preset.eventCard.density,
    compact: preset.kanbanColumn.compact,
    moduleSize: preset.moduleCard.size, elevated: preset.moduleCard.elevated,
  };
}
