/**
 * Tests for CharacterProcessor
 * @module tests/effects/CharacterProcessor
 */

import { CharacterProcessor, CharacterMode } from '../../src/effects/CharacterProcessor';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { AudioContextError } from '../../src/utils/errors';

describe('CharacterProcessor', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
  });

  describe('initialization', () => {
    it('should create processor with default config', () => {
      const processor = new CharacterProcessor(mockAudioContext);

      expect(processor.inputNode).toBeDefined();
      expect(processor.outputNode).toBeDefined();
    });

    it('should create processor with custom config', () => {
      const processor = new CharacterProcessor(mockAudioContext, {
        mode: CharacterMode.Warm,
        amount: 0.5,
      });

      expect(processor.inputNode).toBeDefined();
      expect(processor.outputNode).toBeDefined();
    });

    it('should throw AudioContextError for invalid context', () => {
      expect(() => {
        new CharacterProcessor(null as unknown as AudioContext);
      }).toThrow(AudioContextError);
    });
  });

  describe('configuration', () => {
    it('should set character mode', () => {
      const processor = new CharacterProcessor(mockAudioContext);

      processor.setMode(CharacterMode.Subtle);
      const config = processor.getConfig();

      expect(config.mode).toBe(CharacterMode.Subtle);
    });

    it('should set amount', () => {
      const processor = new CharacterProcessor(mockAudioContext);

      processor.setAmount(0.75);
      const config = processor.getConfig();

      expect(config.amount).toBe(0.75);
    });

    it('should get configuration', () => {
      const processor = new CharacterProcessor(mockAudioContext, {
        mode: CharacterMode.Warm,
        amount: 0.6,
      });

      const config = processor.getConfig();

      expect(config.mode).toBe(CharacterMode.Warm);
      expect(config.amount).toBe(0.6);
    });
  });
});
