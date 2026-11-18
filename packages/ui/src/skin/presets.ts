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
  readonly hudPanel: { skin: SkinName };
  readonly scenePanel: { skin: SkinName };
  readonly atlasStage: { skin: SkinName };
  readonly effects: string;
}

export const defaultPreset: SkinPreset = {
  name: 'default', label: 'Moonwitness', description: 'Core identity',
  button: { variant: 'default', skin: 'default' }, card: { variant: 'default', skin: 'default' },
  input: { skin: 'default' }, badge: { variant: 'default', skin: 'default' },
  eventCard: { skin: 'default', density: 'comfortable' }, kanbanColumn: { skin: 'default', compact: false },
  moduleCard: { skin: 'default', size: 'md', elevated: true },
  hudPanel: { skin: 'default' }, scenePanel: { skin: 'default' }, atlasStage: { skin: 'default' }, effects: '',
};

export const riotPreset: SkinPreset = {
  name: 'riot', label: 'Riot', description: 'Punk grunge',
  button: { variant: 'riot', skin: 'riot', size: 'default' }, card: { variant: 'default', skin: 'riot' },
  input: { skin: 'riot' }, badge: { variant: 'default', skin: 'riot' },
  eventCard: { skin: 'riot', density: 'comfortable' }, kanbanColumn: { skin: 'riot', compact: false },
  moduleCard: { skin: 'riot', size: 'md', elevated: true },
  hudPanel: { skin: 'riot' }, scenePanel: { skin: 'riot' }, atlasStage: { skin: 'riot' }, effects: 'halftone grain cmyk-slip',
};

export const editorialPreset: SkinPreset = {
  name: 'editorial', label: 'Editorial', description: 'Magazine style',
  button: { variant: 'editorial', skin: 'editorial', size: 'lg' }, card: { variant: 'outline', skin: 'editorial' },
  input: { skin: 'editorial' }, badge: { variant: 'outline', skin: 'editorial' },
  eventCard: { skin: 'editorial', density: 'spacious' }, kanbanColumn: { skin: 'editorial', compact: false },
  moduleCard: { skin: 'editorial', size: 'lg', elevated: false },
  hudPanel: { skin: 'editorial' }, scenePanel: { skin: 'editorial' }, atlasStage: { skin: 'editorial' }, effects: 'duotone brush-underline',
};

export const technicalPreset: SkinPreset = {
  name: 'technical', label: 'Technical', description: 'Spec sheet',
  button: { variant: 'technical', skin: 'technical', size: 'sm' }, card: { variant: 'default', skin: 'technical' },
  input: { skin: 'technical' }, badge: { variant: 'default', skin: 'technical' },
  eventCard: { skin: 'technical', density: 'compact' }, kanbanColumn: { skin: 'technical', compact: true },
  moduleCard: { skin: 'technical', size: 'md', elevated: true },
  hudPanel: { skin: 'technical' }, scenePanel: { skin: 'technical' }, atlasStage: { skin: 'technical' }, effects: '',
};

export const archivePreset: SkinPreset = {
  name: 'archive', label: 'Archive', description: 'Paper archive',
  button: { variant: 'archive', skin: 'archive', size: 'default' }, card: { variant: 'default', skin: 'archive' },
  input: { skin: 'archive' }, badge: { variant: 'default', skin: 'archive' },
  eventCard: { skin: 'archive', density: 'comfortable' }, kanbanColumn: { skin: 'archive', compact: false },
  moduleCard: { skin: 'archive', size: 'lg', elevated: true },
  hudPanel: { skin: 'archive' }, scenePanel: { skin: 'archive' }, atlasStage: { skin: 'archive' }, effects: 'grain brush-underline sticker',
};

export const transmissionPreset: SkinPreset = {
  name: 'transmission', label: 'Transmission', description: 'Signal broadcast',
  button: { variant: 'transmission', skin: 'transmission', size: 'default' }, card: { variant: 'default', skin: 'transmission' },
  input: { skin: 'transmission' }, badge: { variant: 'default', skin: 'transmission' },
  eventCard: { skin: 'transmission', density: 'comfortable' }, kanbanColumn: { skin: 'transmission', compact: false },
  moduleCard: { skin: 'transmission', size: 'md', elevated: true },
  hudPanel: { skin: 'transmission' }, scenePanel: { skin: 'transmission' }, atlasStage: { skin: 'transmission' }, effects: 'halftone grain scanlines',
};

export const sanctuaryPreset: SkinPreset = {
  name: 'sanctuary', label: 'Sanctuary', description: 'Astrolabe sacred symmetry',
  button: { variant: 'sanctuary', skin: 'sanctuary', size: 'default' }, card: { variant: 'outline', skin: 'sanctuary' },
  input: { skin: 'sanctuary' }, badge: { variant: 'outline', skin: 'sanctuary' },
  eventCard: { skin: 'sanctuary', density: 'spacious' }, kanbanColumn: { skin: 'sanctuary', compact: false },
  moduleCard: { skin: 'sanctuary', size: 'lg', elevated: false },
  hudPanel: { skin: 'sanctuary' }, scenePanel: { skin: 'sanctuary' }, atlasStage: { skin: 'sanctuary' }, effects: 'duotone',
};

export const brutalistPreset: SkinPreset = {
  name: 'brutalist', label: 'Brutalist', description: 'Raw concrete slab',
  button: { variant: 'brutalist', skin: 'brutalist', size: 'default' }, card: { variant: 'default', skin: 'brutalist' },
  input: { skin: 'brutalist' }, badge: { variant: 'default', skin: 'brutalist' },
  eventCard: { skin: 'brutalist', density: 'compact' }, kanbanColumn: { skin: 'brutalist', compact: true },
  moduleCard: { skin: 'brutalist', size: 'md', elevated: true },
  hudPanel: { skin: 'brutalist' }, scenePanel: { skin: 'brutalist' }, atlasStage: { skin: 'brutalist' }, effects: '',
};

export const noirPreset: SkinPreset = {
  name: 'noir', label: 'Noir', description: 'Silver gelatin darkroom',
  button: { variant: 'noir', skin: 'noir', size: 'default' }, card: { variant: 'default', skin: 'noir' },
  input: { skin: 'noir' }, badge: { variant: 'default', skin: 'noir' },
  eventCard: { skin: 'noir', density: 'comfortable' }, kanbanColumn: { skin: 'noir', compact: false },
  moduleCard: { skin: 'noir', size: 'md', elevated: true },
  hudPanel: { skin: 'noir' }, scenePanel: { skin: 'noir' }, atlasStage: { skin: 'noir' }, effects: 'grain',
};

export const kineticPreset: SkinPreset = {
  name: 'kinetic', label: 'Kinetic', description: 'Isometric vector arcade',
  button: { variant: 'kinetic', skin: 'kinetic', size: 'default' }, card: { variant: 'default', skin: 'kinetic' },
  input: { skin: 'kinetic' }, badge: { variant: 'default', skin: 'kinetic' },
  eventCard: { skin: 'kinetic', density: 'comfortable' }, kanbanColumn: { skin: 'kinetic', compact: false },
  moduleCard: { skin: 'kinetic', size: 'md', elevated: true },
  hudPanel: { skin: 'kinetic' }, scenePanel: { skin: 'kinetic' }, atlasStage: { skin: 'kinetic' }, effects: 'cmyk-slip',
};

export const skinPresets: Record<SkinName, SkinPreset> = {
  default: defaultPreset, riot: riotPreset, editorial: editorialPreset,
  technical: technicalPreset, archive: archivePreset, transmission: transmissionPreset,
  sanctuary: sanctuaryPreset, brutalist: brutalistPreset, noir: noirPreset, kinetic: kineticPreset,
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
    hudSkin: preset.hudPanel.skin, sceneSkin: preset.scenePanel.skin, atlasSkin: preset.atlasStage.skin,
  };
}

/**
 * Compatibility mapping from absorbed `engines/moonframe` 15-skin IDs to
 * canonical `@moonwitness/ui` `SkinName` tokens (`ADR-009` P3-1 engine curation).
 */
export const MOONFRAME_SKIN_ALIAS_MAP = {
  moonpunk: "riot",
  moonriot: "riot",
  moonzine: "editorial",
  moonhalftone: "archive",
  moonglitch: "technical",
  moonsmash: "kinetic",
  moonink: "editorial",
  mooncrash: "brutalist",
  moonpanel: "noir",
  moonscrawl: "archive",
  moonraw: "brutalist",
  moonchrome: "technical",
  classic: "default",
  moonquest: "sanctuary",
  moonledger: "transmission",
} as const satisfies Record<string, SkinName>;

export type MoonframeLegacySkinId = keyof typeof MOONFRAME_SKIN_ALIAS_MAP;

export function resolveMoonframeSkinAlias(id: string): SkinName {
  if (id in MOONFRAME_SKIN_ALIAS_MAP) {
    return MOONFRAME_SKIN_ALIAS_MAP[id as MoonframeLegacySkinId];
  }
  return id in skinPresets ? (id as SkinName) : "default";
}
