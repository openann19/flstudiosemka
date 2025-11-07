/**
 * Tests for DynamicEQProcessor
 * @module tests/effects/DynamicEQProcessor
 */

import { DynamicEQProcessor, DynamicMode } from '../../src/effects/DynamicEQProcessor';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { AudioContextError } from '../../src/utils/errors';

describe('DynamicEQProcessor', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
  });

  describe('initialization', () => {
    it('should create processor', () => {
      const config = {
        bandId: 'test-band',
        mode: DynamicMode.Compressor,
        threshold: -20,
        ratio: 4,
        attack: 0.01,
        release: 0.1,
        gain: 0,
        enabled: true,
      };

      const processor = new DynamicEQProcessor(mockAudioContext, config);

      expect(processor).toBeDefined();
      expect(processor.inputNode).toBeDefined();
      expect(processor.outputNode).toBeDefined();
    });

    it('should throw error for invalid audioContext', () => {
      const config = {
        bandId: 'test-band',
        mode: DynamicMode.Compressor,
        threshold: -20,
        ratio: 4,
        attack: 0.01,
        release: 0.1,
        gain: 0,
        enabled: true,
      };

      expect(() => {
        // @ts-expect-error: Testing invalid audioContext
        new DynamicEQProcessor(null, config);
      }).toThrow(AudioContextError);
    });
  });

  describe('configuration', () => {
    it('should set mode', () => {
      const config = {
        bandId: 'test-band',
        mode: DynamicMode.Compressor,
        threshold: -20,
        ratio: 4,
        attack: 0.01,
        release: 0.1,
        gain: 0,
        enabled: true,
      };
      const processor = new DynamicEQProcessor(mockAudioContext, config);

      expect(() => {
        processor.setMode(DynamicMode.Expander);
      }).not.toThrow();
    });

    it('should get config', () => {
      const config = {
        bandId: 'test-band',
        mode: DynamicMode.Compressor,
        threshold: -20,
        ratio: 4,
        attack: 0.01,
        release: 0.1,
        gain: 0,
        enabled: true,
      };
      const processor = new DynamicEQProcessor(mockAudioContext, config);
      const retrieved = processor.getConfig();

      expect(retrieved).toBeDefined();
      expect(retrieved.bandId).toBe('test-band');
    });
  });
});

