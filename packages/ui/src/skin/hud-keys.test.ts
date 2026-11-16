// Moonwitness Skin — HUD/Scene/Atlas layer keys (Living Story Console)
import { describe, expect, it } from 'vitest';
import { skinBaseClasses } from './index';
import { getPreset, listPresets, skinPresets } from './presets';

describe('HUD/Scene/Atlas skin keys (Living Story Console)', () => {
  it('every preset defines hudPanel, scenePanel, atlasStage', () => {
    for (const skinName of listPresets()) {
      const preset = getPreset(skinName);
      expect(preset.hudPanel.skin).toBe(skinName);
      expect(preset.scenePanel.skin).toBe(skinName);
      expect(preset.atlasStage.skin).toBe(skinName);
    }
  });

  it('default preset keeps new layers effect-free', () => {
    expect(skinPresets.default.hudPanel.skin).toBe('default');
  });
});

describe('skinBaseClasses', () => {
  it('maps all 10 component keys for every skin', () => {
    for (const skin of listPresets()) {
      const classes = skinBaseClasses(skin);
      for (const key of [
        'button', 'card', 'input', 'badge', 'eventCard', 'kanbanColumn', 'moduleCard',
        'hudPanel', 'scenePanel', 'atlasStage',
      ]) {
        expect(classes[key], `${skin}.${key}`).toBeDefined();
      }
    }
  });

  it('emits skin-<name> classes for new layer keys', () => {
    expect(skinBaseClasses('riot').hudPanel).toContain('skin-riot');
    expect(skinBaseClasses('editorial').scenePanel).toContain('skin-editorial');
    expect(skinBaseClasses('transmission').atlasStage).toContain('skin-transmission');
  });

  it('default skin emits non-empty layer classes', () => {
    expect(skinBaseClasses('default').hudPanel).toContain('skin-default');
  });
});
