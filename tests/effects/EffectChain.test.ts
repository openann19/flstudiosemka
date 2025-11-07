/**
 * Tests for EffectChain
 * @module tests/effects/EffectChain
 */

import { EffectChain, type Effect } from '../../src/effects/EffectChain';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { AudioContextError, InvalidParameterError } from '../../src/utils/errors';

describe('EffectChain', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
  });

  describe('initialization', () => {
    it('should create effect chain', () => {
      const chain = new EffectChain(mockAudioContext);

      expect(chain.getInput()).toBeDefined();
      expect(chain.getOutput()).toBeDefined();
    });

    it('should throw AudioContextError for invalid context', () => {
      expect(() => {
        new EffectChain(null as unknown as AudioContext);
      }).toThrow(AudioContextError);
    });
  });

  describe('effect management', () => {
    it('should add effect to chain', () => {
      const chain = new EffectChain(mockAudioContext);
      const mockEffect: Effect = {
        inputNode: mockAudioContext.createGain(),
        outputNode: mockAudioContext.createGain(),
      };

      chain.addEffect(mockEffect);

      expect(chain.getEffectCount()).toBe(1);
    });

    it('should remove effect from chain', () => {
      const chain = new EffectChain(mockAudioContext);
      const mockEffect: Effect = {
        inputNode: mockAudioContext.createGain(),
        outputNode: mockAudioContext.createGain(),
      };

      chain.addEffect(mockEffect);
      chain.removeEffect(0);

      expect(chain.getEffectCount()).toBe(0);
    });

    it('should throw error for invalid position', () => {
      const chain = new EffectChain(mockAudioContext);
      const mockEffect: Effect = {
        inputNode: mockAudioContext.createGain(),
        outputNode: mockAudioContext.createGain(),
      };

      expect(() => {
        chain.addEffect(mockEffect, 10);
      }).toThrow(InvalidParameterError);
    });
  });

  describe('bypass', () => {
    it('should set bypass', () => {
      const chain = new EffectChain(mockAudioContext);

      chain.setBypass(true);

      expect(chain.isBypassed()).toBe(true);
    });
  });
});
