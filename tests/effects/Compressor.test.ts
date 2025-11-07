/**
 * Tests for Compressor
 * @module tests/effects/Compressor
 */

import { Compressor } from '../../src/effects/Compressor';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { AudioContextError, InvalidParameterError } from '../../src/utils/errors';

describe('Compressor', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
  });

  describe('initialization', () => {
    it('should create compressor', () => {
      const compressor = new Compressor(mockAudioContext);

      expect(compressor.inputNode).toBeDefined();
      expect(compressor.outputNode).toBeDefined();
    });

    it('should throw AudioContextError for invalid context', () => {
      expect(() => {
        new Compressor(null as unknown as AudioContext);
      }).toThrow(AudioContextError);
    });
  });

  describe('configuration', () => {
    it('should set threshold', () => {
      const compressor = new Compressor(mockAudioContext);

      compressor.setThreshold(-12);
      const settings = compressor.getSettings();

      expect(settings.threshold).toBe(-12);
    });

    it('should throw error for invalid threshold', () => {
      const compressor = new Compressor(mockAudioContext);

      expect(() => {
        compressor.setThreshold(-100);
      }).toThrow(InvalidParameterError);
    });

    it('should set ratio', () => {
      const compressor = new Compressor(mockAudioContext);

      compressor.setRatio(4);
      const settings = compressor.getSettings();

      expect(settings.ratio).toBe(4);
    });

    it('should get settings', () => {
      const compressor = new Compressor(mockAudioContext);

      const settings = compressor.getSettings();

      expect(settings.threshold).toBeDefined();
      expect(settings.ratio).toBeDefined();
      expect(settings.attack).toBeDefined();
      expect(settings.release).toBeDefined();
    });
  });
});
