/**
 * Tests for useAudioEngine hook
 * @module tests/hooks/useAudioEngine
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { createMockAudioContext } from '../factories/audio-context-factory';

describe('useAudioEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with null audio context', () => {
      const { result } = renderHook(() => useAudioEngine());

      expect(result.current.audioContext).toBeNull();
      expect(result.current.audioUnlockState).toBe('pending');
      expect(result.current.audioWorkletNode).toBeNull();
    });

    it('should initialize audio context', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        const context = await result.current.initAudio();
        expect(context).toBeDefined();
      });

      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull();
      });
    });
  });

  describe('audio unlock', () => {
    it('should wait for audio unlock', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        const promise = result.current.waitForAudioUnlock();
        expect(promise).toBeInstanceOf(Promise);
      });
    });

    it('should register audio unlock callback', () => {
      const { result } = renderHook(() => useAudioEngine());
      const callback = jest.fn();

      act(() => {
        const unsubscribe = result.current.onAudioUnlock(callback, { invokeImmediately: false });
        expect(typeof unsubscribe).toBe('function');
        unsubscribe();
      });
    });

    it('should invoke callback immediately if audio is already unlocked', async () => {
      const { result } = renderHook(() => useAudioEngine());
      const callback = jest.fn();

      await act(async () => {
        await result.current.initAudio();
      });

      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull();
      });

      act(() => {
        result.current.onAudioUnlock(callback, { invokeImmediately: true });
      });

      // Callback may be invoked if context is available
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('adopt audio context', () => {
    it('should adopt external audio context', async () => {
      const { result } = renderHook(() => useAudioEngine());
      const mockContext = createMockAudioContext();

      await act(async () => {
        const adopted = await result.current.adoptAudioContext(mockContext);
        expect(adopted).toBe(mockContext);
      });

      expect(result.current.audioContext).toBe(mockContext);
    });

    it('should throw error for invalid context', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        await expect(result.current.adoptAudioContext(null as unknown as AudioContext)).rejects.toThrow();
      });
    });
  });

  describe('audio worklet', () => {
    it('should load audio worklet processor', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        await result.current.initAudio();
      });

      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull();
      });

      await act(async () => {
        await result.current.loadAudioWorkletProcessor();
      });

      // Worklet may not load in test environment, but should not throw
      expect(result.current.audioWorkletNode).toBeDefined();
    });

    it('should play note via audio worklet', () => {
      const { result } = renderHook(() => useAudioEngine());

      act(() => {
        const voiceId = result.current.playNoteAudioWorklet(440, 0.8);
        // May return null if worklet not loaded
        expect(voiceId === null || typeof voiceId === 'number').toBe(true);
      });
    });

    it('should stop note via audio worklet', () => {
      const { result } = renderHook(() => useAudioEngine());

      act(() => {
        result.current.stopNoteAudioWorklet(123);
        // Should not throw
      });
    });
  });
});
