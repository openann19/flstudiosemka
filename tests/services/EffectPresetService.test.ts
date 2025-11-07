/**
 * Tests for EffectPresetService
 * @module tests/services/EffectPresetService
 */

import { effectPresetService } from '../../src/services/EffectPresetService';
import type { EffectPreset, EffectChainPreset } from '../../src/types/preset.types';

describe('EffectPresetService', () => {
  beforeEach(() => {
    // Clear presets before each test
    const presets = effectPresetService.getAllPresets();
    presets.forEach((preset) => {
      effectPresetService.deletePreset(preset.id);
    });
  });

  describe('preset management', () => {
    it('should save preset', () => {
      const preset: EffectPreset = {
        id: 'test-preset',
        name: 'Test Preset',
        effectType: 'reverb',
        parameters: { decay: 2.0, wet: 0.5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => {
        effectPresetService.savePreset(preset);
      }).not.toThrow();
    });

    it('should load preset', () => {
      const preset: EffectPreset = {
        id: 'test-preset',
        name: 'Test Preset',
        effectType: 'reverb',
        parameters: { decay: 2.0, wet: 0.5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      effectPresetService.savePreset(preset);
      const loaded = effectPresetService.loadPreset('test-preset');

      expect(loaded).toEqual(preset);
    });

    it('should get presets for effect type', () => {
      const preset: EffectPreset = {
        id: 'test-preset',
        name: 'Test Preset',
        effectType: 'reverb',
        parameters: { decay: 2.0, wet: 0.5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      effectPresetService.savePreset(preset);
      const presets = effectPresetService.getPresetsForEffect('reverb');

      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some((p) => p.id === 'test-preset')).toBe(true);
    });

    it('should delete preset', () => {
      const preset: EffectPreset = {
        id: 'test-preset',
        name: 'Test Preset',
        effectType: 'reverb',
        parameters: { decay: 2.0, wet: 0.5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      effectPresetService.savePreset(preset);
      effectPresetService.deletePreset('test-preset');

      const loaded = effectPresetService.loadPreset('test-preset');
      expect(loaded).toBeNull();
    });
  });

  describe('chain preset management', () => {
    it('should save chain preset', () => {
      const chainPreset: EffectChainPreset = {
        id: 'test-chain',
        name: 'Test Chain',
        effects: [
          { effectType: 'reverb', position: 0, enabled: true, parameters: { decay: 2.0 } },
          { effectType: 'delay', position: 1, enabled: true, parameters: { time: 0.5 } },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => {
        effectPresetService.saveChainPreset(chainPreset);
      }).not.toThrow();
    });

    it('should load chain preset', () => {
      const chainPreset: EffectChainPreset = {
        id: 'test-chain',
        name: 'Test Chain',
        effects: [
          { effectType: 'reverb', position: 0, enabled: true, parameters: { decay: 2.0 } },
          { effectType: 'delay', position: 1, enabled: true, parameters: { time: 0.5 } },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      effectPresetService.saveChainPreset(chainPreset);
      const loaded = effectPresetService.loadChainPreset('test-chain');

      expect(loaded).toEqual(chainPreset);
    });
  });
});

