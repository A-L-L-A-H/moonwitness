// Moonwitness Skin — Unit tests for skin presets
import { describe, it, expect } from 'vitest';
import { skinPresets, getPreset, listPresets, applyPreset } from './presets';

describe('Skin Presets', () => {
  describe('listPresets', () => {
    it('returns all 6 skin names', () => {
      const skins = listPresets();
      expect(skins).toEqual(['default', 'riot', 'editorial', 'technical', 'archive', 'transmission']);
    });
  });

  describe('getPreset', () => {
    it('returns valid preset for each skin', () => {
      for (const skinName of listPresets()) {
        const preset = getPreset(skinName);
        expect(preset.name).toBe(skinName);
        expect(preset.label).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.button).toBeDefined();
        expect(preset.card).toBeDefined();
        expect(preset.input).toBeDefined();
        expect(preset.badge).toBeDefined();
        expect(preset.eventCard).toBeDefined();
        expect(preset.kanbanColumn).toBeDefined();
        expect(preset.moduleCard).toBeDefined();
      }
    });
  });

  describe('skinPresets record', () => {
    it('has correct structure for default skin', () => {
      const preset = skinPresets.default;
      expect(preset.name).toBe('default');
      expect(preset.label).toBe('Moonwitness');
      expect(preset.button.variant).toBe('default');
      expect(preset.button.skin).toBe('default');
      expect(preset.effects).toBe('');
    });

    it('has correct structure for riot skin', () => {
      const preset = skinPresets.riot;
      expect(preset.name).toBe('riot');
      expect(preset.label).toBe('Riot');
      expect(preset.effects).toContain('halftone');
      expect(preset.effects).toContain('grain');
      expect(preset.effects).toContain('cmyk-slip');
    });

    it('has correct structure for editorial skin', () => {
      const preset = skinPresets.editorial;
      expect(preset.name).toBe('editorial');
      expect(preset.label).toBe('Editorial');
      expect(preset.button.size).toBe('lg');
      expect(preset.card.variant).toBe('outline');
      expect(preset.effects).toContain('duotone');
      expect(preset.effects).toContain('brush-underline');
    });

    it('has correct structure for technical skin', () => {
      const preset = skinPresets.technical;
      expect(preset.name).toBe('technical');
      expect(preset.label).toBe('Technical');
      expect(preset.button.size).toBe('sm');
      expect(preset.eventCard.density).toBe('compact');
      expect(preset.kanbanColumn.compact).toBe(true);
    });
  });

  describe('applyPreset', () => {
    it('returns resolved class props for each skin', () => {
      for (const skinName of listPresets()) {
        const applied = applyPreset(skinName);
        expect(applied.variant).toBeDefined();
        expect(applied.skin).toBe(skinName);
        expect(applied.cardVariant).toBeDefined();
        expect(applied.inputSkin).toBe(skinName);
        expect(applied.badgeVariant).toBeDefined();
        expect(applied.density).toBeDefined();
        expect(typeof applied.compact).toBe('boolean');
        expect(applied.moduleSize).toBeDefined();
        expect(typeof applied.elevated).toBe('boolean');
      }
    });
  });
});
