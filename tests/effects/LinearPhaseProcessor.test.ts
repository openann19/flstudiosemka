/**
 * Tests for LinearPhaseProcessor
 * @module tests/effects/LinearPhaseProcessor
 */

import { LinearPhaseProcessor } from '../../src/effects/LinearPhaseProcessor';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { AudioContextError, InvalidParameterError } from '../../src/utils/errors';

describe('LinearPhaseProcessor', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
  });

  describe('initialization', () => {
    it('should create processor with default config', () => {
      const processor = new LinearPhaseProcessor(mockAudioContext);

      expect(processor).toBeDefined();
      expect(processor.inputNode).toBeDefined();
      expect(processor.outputNode).toBeDefined();
    });

    it('should create processor with custom config', () => {
      const config = { enabled: true, fftSize: 2048 };
      const processor = new LinearPhaseProcessor(mockAudioContext, config);

      expect(processor).toBeDefined();
    });

    it('should throw error for invalid audioContext', () => {
      expect(() => {
        // @ts-expect-error: Testing invalid audioContext
        new LinearPhaseProcessor(null);
      }).toThrow(AudioContextError);
    });

    it('should throw error for invalid FFT size', () => {
      const config = { enabled: true, fftSize: 1000 }; // Not a power of 2

      expect(() => {
        new LinearPhaseProcessor(mockAudioContext, config);
      }).toThrow(InvalidParameterError);
    });
  });

  describe('configuration', () => {
    it('should set enabled state', () => {
      const processor = new LinearPhaseProcessor(mockAudioContext);

      expect(() => {
        processor.setEnabled(true);
      }).not.toThrow();
    });

    it('should get config', () => {
      const processor = new LinearPhaseProcessor(mockAudioContext);
      const config = processor.getConfig();

      expect(config).toBeDefined();
      expect(config.enabled).toBeDefined();
      expect(config.fftSize).toBeDefined();
    });
  });
});

