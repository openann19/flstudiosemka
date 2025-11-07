/**
 * Tests for EffectRegistry
 * @module tests/services/EffectRegistry
 */

import { effectRegistry } from '../../src/services/EffectRegistry';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { AudioContextError } from '../../src/utils/errors';

describe('EffectRegistry', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
    jest.clearAllMocks();
  });

  describe('effect registration', () => {
    it('should have default effects registered', () => {
      const effects = effectRegistry.getAllEffects();

      expect(effects.length).toBeGreaterThan(0);
      expect(effects.some((e) => e.type === 'reverb')).toBe(true);
      expect(effects.some((e) => e.type === 'delay')).toBe(true);
    });

    it('should get effect metadata by type', () => {
      const metadata = effectRegistry.getEffectMetadata('reverb');

      expect(metadata).not.toBeUndefined();
      expect(metadata?.type).toBe('reverb');
    });

    it('should return undefined for non-existent effect type', () => {
      const metadata = effectRegistry.getEffectMetadata('non-existent' as any);

      expect(metadata).toBeUndefined();
    });
  });

  describe('effect creation', () => {
    it('should create reverb effect', () => {
      const effect = effectRegistry.createEffect(mockAudioContext, 'reverb', {});

      expect(effect).not.toBeNull();
      expect(effect.inputNode).toBeDefined();
      expect(effect.outputNode).toBeDefined();
    });

    it('should create delay effect', () => {
      const effect = effectRegistry.createEffect(mockAudioContext, 'delay', {});

      expect(effect).not.toBeNull();
    });

    it('should create distortion effect', () => {
      const effect = effectRegistry.createEffect(mockAudioContext, 'distortion', {});

      expect(effect).not.toBeNull();
    });

    it('should create chorus effect', () => {
      const effect = effectRegistry.createEffect(mockAudioContext, 'chorus', {});

      expect(effect).not.toBeNull();
    });

    it('should create phaser effect', () => {
      const effect = effectRegistry.createEffect(mockAudioContext, 'phaser', {});

      expect(effect).not.toBeNull();
    });

    it('should throw AudioContextError for null audioContext', () => {
      expect(() => {
        effectRegistry.createEffect(null as any, 'reverb', {});
      }).toThrow(AudioContextError);
    });

    it('should apply parameters when creating effect', () => {
      const parameters = { decay: 3.0, wet: 0.5 };
      const effect = effectRegistry.createEffect(mockAudioContext, 'reverb', parameters);

      expect(effect).not.toBeNull();
    });
  });

  describe('default parameters', () => {
    it('should get default parameters for reverb', () => {
      const params = effectRegistry.getDefaultParameters('reverb');

      expect(params).toBeDefined();
      expect(params.decay).toBeDefined();
      expect(params.wet).toBeDefined();
      expect(params.dry).toBeDefined();
    });

    it('should get default parameters for delay', () => {
      const params = effectRegistry.getDefaultParameters('delay');

      expect(params).toBeDefined();
      expect(params.time).toBeDefined();
      expect(params.feedback).toBeDefined();
    });

    it('should get default parameters for all effect types', () => {
      const types: Array<'reverb' | 'delay' | 'distortion' | 'chorus' | 'phaser'> = [
        'reverb',
        'delay',
        'distortion',
        'chorus',
        'phaser',
      ];

      types.forEach((type) => {
        const params = effectRegistry.getDefaultParameters(type);
        expect(params).toBeDefined();
        expect(Object.keys(params).length).toBeGreaterThan(0);
      });
    });
  });

  describe('effect parameters', () => {
    it('should get parameter definitions for reverb', () => {
      const params = effectRegistry.getParameters('reverb');

      expect(params).toBeDefined();
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBeGreaterThan(0);
    });

    it('should get parameter definitions for delay', () => {
      const params = effectRegistry.getParameters('delay');

      expect(params).toBeDefined();
      expect(Array.isArray(params)).toBe(true);
    });

    it('should return empty array for non-existent effect type', () => {
      const params = effectRegistry.getParameters('non-existent' as any);

      expect(params).toEqual([]);
    });
  });

  describe('effect categories', () => {
    it('should get effects by category', () => {
      const timeEffects = effectRegistry.getEffectsByCategory('time');

      expect(Array.isArray(timeEffects)).toBe(true);
      // Delay should be in time category
      expect(timeEffects.some((e) => e.type === 'delay')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const effects = effectRegistry.getEffectsByCategory('non-existent' as any);

      expect(effects).toEqual([]);
    });
  });

  describe('effect search', () => {
    it('should search effects by name', () => {
      const results = effectRegistry.searchEffects('reverb');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((e) => e.type === 'reverb')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = effectRegistry.searchEffects('nonexistenteffect');

      expect(results).toEqual([]);
    });
  });
});

