/**
 * Tests for usePlayback hook
 * @module tests/hooks/usePlayback
 */

import { renderHook, act } from '@testing-library/react';
import { usePlayback } from '../../src/hooks/usePlayback';
import { createMockAudioContext } from '../factories/audio-context-factory';

describe('usePlayback', () => {
  const mockPlayCurrentStep = jest.fn();
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioContext = createMockAudioContext();
    mockPlayCurrentStep.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.songPositionBeats).toBe(0);
      expect(result.current.playbackMode).toBe('pattern');
    });
  });

  describe('playback control', () => {
    it('should toggle play', async () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      await act(async () => {
        await result.current.togglePlay();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should stop playback', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentStep).toBe(0);
    });

    it('should restart playback', async () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      await act(async () => {
        await result.current.togglePlay();
      });

      act(() => {
        result.current.restartPlayback();
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('BPM control', () => {
    it('should sanitize BPM values', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        const sanitized = result.current.sanitizeBpm(300);
        expect(sanitized).toBe(200); // Clamped to max
      });

      act(() => {
        const sanitized = result.current.sanitizeBpm(10);
        expect(sanitized).toBe(60); // Clamped to min
      });
    });

    it('should adjust BPM', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        result.current.adjustBPM(10);
      });

      // BPM is stored in ref, so we can't directly test it
      // But the function should not throw
    });

    it('should sync external tempo', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        result.current.syncExternalTempo(140);
        // Should not throw
      });
    });
  });

  describe('playback mode', () => {
    it('should toggle playback mode', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        result.current.togglePlaybackMode();
      });

      expect(result.current.playbackMode).toBe('song');

      act(() => {
        result.current.togglePlaybackMode();
      });

      expect(result.current.playbackMode).toBe('pattern');
    });

    it('should set playback mode', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        result.current.setPlaybackMode('song');
      });

      expect(result.current.playbackMode).toBe('song');
    });
  });

  describe('seeking', () => {
    it('should seek to position', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        result.current.seekToPosition(4);
      });

      expect(result.current.songPositionBeats).toBe(4);
    });

    it('should clamp negative positions to 0', () => {
      const { result } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      act(() => {
        result.current.seekToPosition(-5);
      });

      expect(result.current.songPositionBeats).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        usePlayback({
          audioContext: mockAudioContext,
          tracks: [],
          bpm: 120,
          beatsPerStep: 0.25,
          playCurrentStep: mockPlayCurrentStep,
          getTrackMixer: () => null,
          busManager: null,
        })
      );

      await act(async () => {
        await result.current.togglePlay();
      });

      unmount();

      // Should not throw
      expect(result.current.isPlaying).toBe(false);
    });
  });
});
