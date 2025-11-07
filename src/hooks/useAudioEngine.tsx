/**
 * useAudioEngine - Audio context management hook
 * Strict TypeScript implementation with comprehensive error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioUnlockState } from '../types/FLStudio.types';

interface UseAudioEngineReturn {
  audioContext: AudioContext | null;
  audioUnlockState: AudioUnlockState;
  audioWorkletNode: AudioWorkletNode | null;
  initAudio: () => Promise<AudioContext | null>;
  waitForAudioUnlock: () => Promise<AudioContext | null>;
  onAudioUnlock: (callback: (context: AudioContext) => void, options?: { invokeImmediately?: boolean }) => () => void;
  adoptAudioContext: (context: AudioContext) => Promise<AudioContext>;
  loadAudioWorkletProcessor: () => Promise<void>;
  playNoteAudioWorklet: (frequency: number, velocity?: number) => number | null;
  stopNoteAudioWorklet: (voiceId: number) => void;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioUnlockState, setAudioUnlockState] = useState<AudioUnlockState>('pending');
  const [audioWorkletNode, setAudioWorkletNode] = useState<AudioWorkletNode | null>(null);

  const audioUnlockCallbacksRef = useRef<Set<(context: AudioContext) => void>>(new Set());
  const audioUnlockPromiseRef = useRef<Promise<AudioContext | null> | null>(null);
  const resolveAudioUnlockRef = useRef<((context: AudioContext) => void) | null>(null);
  const audioUnlockHandlerRef = useRef<(() => void) | null>(null);
  const audioUnlockEventsRef = useRef<readonly string[]>(['pointerdown', 'touchstart', 'mousedown', 'keydown']);

  /**
   * Setup audio unlock handling
   */
  const setupAudioUnlockHandling = useCallback(() => {
    if (audioUnlockState !== 'pending') {
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      setAudioUnlockState('resolved');
      audioUnlockPromiseRef.current = Promise.resolve(null);
      resolveAudioUnlockRef.current = null;
      return;
    }

    if (!audioUnlockPromiseRef.current) {
      audioUnlockPromiseRef.current = new Promise<AudioContext | null>((resolve) => {
        resolveAudioUnlockRef.current = resolve;
      });
    }

    if (audioUnlockHandlerRef.current) {
      return;
    }

    audioUnlockHandlerRef.current = () => {
      attemptAudioUnlock().catch(() => {
        // Silent error handling
      });
    };

    audioUnlockEventsRef.current.forEach((eventName) => {
      document.addEventListener(eventName, audioUnlockHandlerRef.current!, true);
    });
  }, [audioUnlockState]);

  /**
   * Cleanup audio unlock handling
   */
  const cleanupAudioUnlockHandling = useCallback(() => {
    if (typeof document === 'undefined' || !audioUnlockHandlerRef.current) {
      return;
    }

    audioUnlockEventsRef.current.forEach((eventName) => {
      document.removeEventListener(eventName, audioUnlockHandlerRef.current!, true);
    });
    audioUnlockHandlerRef.current = null;
  }, []);

  /**
   * Attempt audio unlock
   */
  const attemptAudioUnlock = useCallback(async (): Promise<AudioContext | null> => {
    if (audioUnlockState === 'resolved') {
      return audioContext;
    }

    if (audioUnlockState === 'unlocking') {
      return waitForAudioUnlock();
    }

    if (typeof window === 'undefined') {
      setAudioUnlockState('resolved');
      return null;
    }

    if (!audioUnlockPromiseRef.current) {
      audioUnlockPromiseRef.current = new Promise<AudioContext | null>((resolve) => {
        resolveAudioUnlockRef.current = resolve;
      });
    }

    setAudioUnlockState('unlocking');

    try {
      let context = audioContext;
      const sharedContext =
        typeof window !== 'undefined' &&
        (window as unknown as { vocalStudio?: { getSharedContext?: () => AudioContext | null } }).vocalStudio &&
        typeof (window as unknown as { vocalStudio: { getSharedContext?: () => AudioContext | null } }).vocalStudio.getSharedContext === 'function'
          ? (window as unknown as { vocalStudio: { getSharedContext: () => AudioContext | null } }).vocalStudio.getSharedContext()
          : null;

      if ((!context || context.state === 'closed') && sharedContext) {
        context = await adoptAudioContext(sharedContext);
      }

      if (!context || context.state === 'closed') {
        const AudioCtx = (window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          throw new Error('Web Audio API not supported');
        }
        // Optimize for low latency: use 'interactive' latencyHint for minimal delay
        // This typically results in ~5-10ms latency vs ~15-30ms for 'balanced'
        try {
          context = new AudioCtx({
            latencyHint: 'interactive',
            sampleRate: 44100, // Standard sample rate, avoid higher rates for better compatibility
          } as AudioContextOptions);
        } catch {
          // Fallback for browsers that don't support options
          context = new AudioCtx();
        }
      }

      if (context?.state === 'suspended') {
        await context.resume();
      }

      setAudioContext(context);
      finalizeAudioUnlock(context);
      return context;
    } catch (error) {
      setAudioUnlockState('pending');
      throw error;
    }
  }, [audioContext, audioUnlockState]);

  /**
   * Finalize audio unlock
   */
  const finalizeAudioUnlock = useCallback((context: AudioContext) => {
    setAudioUnlockState('resolved');
    cleanupAudioUnlockHandling();

    if (resolveAudioUnlockRef.current) {
      resolveAudioUnlockRef.current(context);
      resolveAudioUnlockRef.current = null;
    }

    audioUnlockPromiseRef.current = Promise.resolve(context);

    if (audioUnlockCallbacksRef.current && audioUnlockCallbacksRef.current.size) {
      audioUnlockCallbacksRef.current.forEach((cb) => {
        try {
          cb(context);
        } catch {
          // Silent error handling
        }
      });
      audioUnlockCallbacksRef.current.clear();
    }

    if (context && typeof window !== 'undefined' && (window as unknown as { vocalStudio?: unknown }).vocalStudio) {
      const vocalStudio = (window as unknown as { vocalStudio?: { getSharedContext?: () => AudioContext | null; attachAudioContext?: (ctx: AudioContext) => void } }).vocalStudio;
      if (vocalStudio) {
        const shared =
          typeof vocalStudio.getSharedContext === 'function' ? vocalStudio.getSharedContext() : null;
        if (typeof vocalStudio.attachAudioContext === 'function' && shared !== context) {
          vocalStudio.attachAudioContext(context);
        }
      }
    }
  }, [cleanupAudioUnlockHandling]);

  /**
   * Wait for audio unlock
   */
  const waitForAudioUnlock = useCallback(async (): Promise<AudioContext | null> => {
    if (audioUnlockState === 'resolved') {
      return audioContext;
    }

    setupAudioUnlockHandling();

    // Note: State check removed as TypeScript correctly identifies that
    // audioUnlockState cannot be 'resolved' at this point after the check above

    if (!audioUnlockPromiseRef.current) {
      audioUnlockPromiseRef.current = new Promise<AudioContext | null>((resolve) => {
        resolveAudioUnlockRef.current = resolve;
      });
    }

    return audioUnlockPromiseRef.current;
  }, [audioContext, audioUnlockState, setupAudioUnlockHandling]);

  /**
   * Initialize audio
   */
  const initAudio = useCallback(async (): Promise<AudioContext | null> => {
    if (audioContext && audioContext.state !== 'closed') {
      try {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      } catch {
        // Silent error handling
      }
      return audioContext;
    }

    setupAudioUnlockHandling();

    if (audioUnlockState === 'resolved') {
      return audioContext;
    }

    try {
      return await attemptAudioUnlock();
    } catch {
      return null;
    }
  }, [audioContext, audioUnlockState, setupAudioUnlockHandling, attemptAudioUnlock]);

  /**
   * Adopt audio context
   */
  const adoptAudioContext = useCallback(async (context: AudioContext): Promise<AudioContext> => {
    if (!context || typeof context.resume !== 'function') {
      throw new Error('useAudioEngine: Invalid audio context supplied');
    }

    if (audioContext === context && audioContext?.state !== 'closed') {
      try {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      } catch {
        // Silent error handling
      }
      return audioContext;
    }

    setAudioContext(context);
    try {
      if (context.state === 'suspended') {
        await context.resume();
      }
    } catch {
      // Silent error handling
    }
    return context;
  }, [audioContext]);

  /**
   * On audio unlock callback
   */
  const onAudioUnlock = useCallback(
    (callback: (context: AudioContext) => void, options: { invokeImmediately?: boolean } = {}): (() => void) => {
      if (typeof callback !== 'function') {
        return () => {};
      }

      const { invokeImmediately = true } = options;

      setupAudioUnlockHandling();

      if (audioUnlockState === 'resolved' && invokeImmediately && audioContext) {
        try {
          callback(audioContext);
        } catch {
          // Silent error handling
        }
        return () => {};
      }

      audioUnlockCallbacksRef.current.add(callback);

      return () => {
        audioUnlockCallbacksRef.current.delete(callback);
      };
    },
    [audioContext, audioUnlockState, setupAudioUnlockHandling]
  );

  /**
   * Load AudioWorklet processor
   */
  const loadAudioWorkletProcessor = useCallback(async (): Promise<void> => {
    if (!audioContext || !audioContext.audioWorklet) {
      return;
    }

    try {
      let processorPath = 'apps/desktop/audio-worklets/simple-synth-processor.js';

      if (typeof window !== 'undefined' && (window as { electronAPI?: unknown }).electronAPI) {
        processorPath = './apps/desktop/audio-worklets/simple-synth-processor.js';
      }

      await audioContext.audioWorklet.addModule(processorPath);

      const workletNode = new AudioWorkletNode(audioContext, 'simple-synth-processor');
      setAudioWorkletNode(workletNode);
    } catch {
      // Silent error handling - fallback to regular synthesizer
    }
  }, [audioContext]);

  /**
   * Play note using AudioWorklet
   */
  const playNoteAudioWorklet = useCallback((frequency: number, velocity = 1.0): number | null => {
    if (!audioWorkletNode) {
      return null;
    }

    const voiceId = Date.now();

    audioWorkletNode.port.postMessage({
      type: 'note-on',
      data: {
        frequency,
        velocity,
        voiceId,
      },
    });

    return voiceId;
  }, [audioWorkletNode]);

  /**
   * Stop note using AudioWorklet
   */
  const stopNoteAudioWorklet = useCallback((voiceId: number): void => {
    if (!audioWorkletNode) {
      return;
    }

    audioWorkletNode.port.postMessage({
      type: 'note-off',
      data: { voiceId },
    });
  }, [audioWorkletNode]);

  /**
   * Setup audio unlock on mount
   */
  useEffect(() => {
    setupAudioUnlockHandling();

    return () => {
      cleanupAudioUnlockHandling();
    };
  }, [setupAudioUnlockHandling, cleanupAudioUnlockHandling]);

  return {
    audioContext,
    audioUnlockState,
    audioWorkletNode,
    initAudio,
    waitForAudioUnlock,
    onAudioUnlock,
    adoptAudioContext,
    loadAudioWorkletProcessor,
    playNoteAudioWorklet,
    stopNoteAudioWorklet,
  };
}

