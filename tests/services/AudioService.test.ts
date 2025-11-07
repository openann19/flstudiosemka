/**
 * Tests for AudioService
 * @module tests/services/AudioService
 */

import { AudioService } from '../../src/services/AudioService';
import { MasterEffects } from '../../src/types/FLStudio.types';
import { createMockAudioContext } from '../factories/audio-context-factory';

describe('AudioService', () => {
  let mockAudioContext: AudioContext;
  let audioService: AudioService;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
    audioService = new AudioService(mockAudioContext);
  });

  describe('initialization', () => {
    it('should create AudioService with audioContext', () => {
      expect(audioService).toBeDefined();
    });

    it('should throw error when audioContext is null', () => {
      expect(() => {
        // @ts-expect-error: Testing null audioContext
        new AudioService(null);
      }).toThrow('AudioService: AudioContext is required');
    });
  });

  describe('sound playback', () => {
    it('should play sound', () => {
      const trackMixer = null;
      const masterEffects: MasterEffects | null = null;

      expect(() => {
        audioService.playSound('drum', 'kick', 1, trackMixer, masterEffects);
      }).not.toThrow();
    });

    it('should get frequency for sound', () => {
      const frequency = audioService.getFrequencyForSound('drum', 'kick');
      expect(typeof frequency).toBe('number');
      expect(frequency).toBeGreaterThan(0);
    });
  });

  describe('bus manager', () => {
    it('should set bus manager', () => {
      const busManager = {};
      expect(() => {
        audioService.setBusManager(busManager);
      }).not.toThrow();
    });
  });

  describe('synthesizer', () => {
    it('should create synthesizer engine', () => {
      const config = audioService['createDefaultSynthesizerConfig']();

      expect(() => {
        audioService.createSynthesizerEngine(1, config);
      }).not.toThrow();
    });

    it('should get synthesizer engine', () => {
      const config = audioService['createDefaultSynthesizerConfig']();

      audioService.createSynthesizerEngine(1, config);
      const engine = audioService.getSynthesizerEngine(1);
      expect(engine).toBeDefined();
    });
  });
});

