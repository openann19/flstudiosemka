/**
 * Tests for EQBand
 * @module tests/effects/EQBand
 */

import { EQBand, FilterType } from '../../src/effects/EQBand';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { AudioContextError } from '../../src/utils/errors';

describe('EQBand', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
  });

  describe('initialization', () => {
    it('should create EQ band', () => {
      const config = {
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      };

      const band = new EQBand(mockAudioContext, config);

      expect(band).toBeDefined();
      expect(band.inputNode).toBeDefined();
      expect(band.outputNode).toBeDefined();
    });

    it('should throw error for invalid audioContext', () => {
      const config = {
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      };

      expect(() => {
        // @ts-expect-error: Testing invalid audioContext
        new EQBand(null, config);
      }).toThrow(AudioContextError);
    });
  });

  describe('configuration', () => {
    it('should set frequency', () => {
      const config = {
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      };
      const band = new EQBand(mockAudioContext, config);

      expect(() => {
        band.setFrequency(2000);
      }).not.toThrow();
    });

    it('should set gain', () => {
      const config = {
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      };
      const band = new EQBand(mockAudioContext, config);

      expect(() => {
        band.setGain(6);
      }).not.toThrow();
    });

    it('should get config', () => {
      const config = {
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      };
      const band = new EQBand(mockAudioContext, config);
      const retrieved = band.getConfig();

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe('test-band');
    });
  });
});

