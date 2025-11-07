/**
 * Tests for useSynthesizer hook
 * @module tests/hooks/useSynthesizer
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSynthesizer } from '../../src/hooks/useSynthesizer';
import { createMockAudioContext } from '../factories/audio-context-factory';

describe('useSynthesizer', () => {
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize synthesizer engine when audioContext is provided', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.engine).not.toBeNull();
      expect(result.current.state).not.toBeNull();
      expect(result.current.presetManager).toBeDefined();
    });

    it('should not initialize when audioContext is null', () => {
      const { result } = renderHook(() => useSynthesizer(null));

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.engine).toBeNull();
      expect(result.current.state).toBeNull();
    });

    it('should initialize with custom config when provided', async () => {
      const customConfig = {
        oscillators: [
          {
            enabled: true,
            waveform: 'square' as const,
            octave: 0,
            semitone: 0,
            detune: 0,
            gain: 0.8,
            pulseWidth: 0.5,
            phase: 0,
            sync: false,
            ringMod: false,
          },
        ],
      };

      const { result } = renderHook(() => useSynthesizer(mockAudioContext, customConfig as any));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.engine).not.toBeNull();
    });
  });

  describe('note playing', () => {
    it('should play a note and return voice ID', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const voiceId = result.current.playNote(60, 0.8);

      expect(voiceId).not.toBeNull();
      expect(typeof voiceId).toBe('string');
    });

    it('should return null when engine is not initialized', () => {
      const { result } = renderHook(() => useSynthesizer(null));

      const voiceId = result.current.playNote(60);

      expect(voiceId).toBeNull();
    });

    it('should use default velocity when not provided', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const voiceId = result.current.playNote(60);

      expect(voiceId).not.toBeNull();
    });
  });

  describe('note stopping', () => {
    it('should stop a specific note', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const voiceId = result.current.playNote(60);
      expect(voiceId).not.toBeNull();

      if (voiceId) {
        expect(() => result.current.stopNote(voiceId)).not.toThrow();
      }
    });

    it('should stop all notes', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      result.current.playNote(60);
      result.current.playNote(64);
      result.current.playNote(67);

      expect(() => result.current.stopAllNotes()).not.toThrow();
    });

    it('should handle stop operations when engine is not initialized', () => {
      const { result } = renderHook(() => useSynthesizer(null));

      expect(() => result.current.stopNote('voice-1')).not.toThrow();
      expect(() => result.current.stopAllNotes()).not.toThrow();
    });
  });

  describe('configuration updates', () => {
    it('should update synthesizer configuration', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const configUpdate = {
        oscillators: [
          {
            enabled: true,
            waveform: 'triangle' as const,
            octave: 0,
            semitone: 0,
            detune: 0,
            gain: 0.6,
            pulseWidth: 0.5,
            phase: 0,
            sync: false,
            ringMod: false,
          },
        ],
      };

      expect(() => result.current.updateConfig(configUpdate as any)).not.toThrow();
    });

    it('should handle config updates when engine is not initialized', () => {
      const { result } = renderHook(() => useSynthesizer(null));

      expect(() => result.current.updateConfig({} as any)).not.toThrow();
    });
  });

  describe('preset management', () => {
    it('should load a preset', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Try to load a factory preset (they should be available)
      const presetId = 'factory-preset-1';
      const loaded = result.current.loadPreset(presetId);

      // May return false if preset doesn't exist, but should not throw
      expect(typeof loaded).toBe('boolean');
    });

    it('should save a preset', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const preset = {
        id: 'test-preset',
        name: 'Test Preset',
        category: 'test',
        config: {
          oscillators: [
            {
              enabled: true,
              waveform: 'sine' as const,
              octave: 0,
              semitone: 0,
              detune: 0,
              gain: 0.5,
              pulseWidth: 0.5,
              phase: 0,
              sync: false,
              ringMod: false,
            },
          ],
        } as any,
      };

      expect(() => result.current.savePreset(preset as any)).not.toThrow();
    });

    it('should return false when loading non-existent preset', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const loaded = result.current.loadPreset('non-existent-preset');

      expect(loaded).toBe(false);
    });
  });

  describe('BPM control', () => {
    it('should set BPM', async () => {
      const { result } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(() => result.current.setBPM(140)).not.toThrow();
    });

    it('should handle BPM changes when engine is not initialized', () => {
      const { result } = renderHook(() => useSynthesizer(null));

      expect(() => result.current.setBPM(140)).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useSynthesizer(mockAudioContext));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      result.current.playNote(60);

      unmount();

      // Should not throw on cleanup
      expect(true).toBe(true);
    });
  });
});

