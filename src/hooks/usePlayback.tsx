/**
 * usePlayback - Playback and transport controls hook
 * Strict TypeScript implementation with comprehensive error handling
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Track } from '../types/FLStudio.types';

interface UsePlaybackProps {
  audioContext: AudioContext | null;
  tracks: Track[];
  bpm: number;
  beatsPerStep: number;
  playCurrentStep: (currentStep: number) => void;
  getTrackMixer: (trackId: number) => unknown | null;
  busManager: unknown | null;
}

type PlaybackMode = 'pattern' | 'song';

interface UsePlaybackReturn {
  isPlaying: boolean;
  currentStep: number;
  songPositionBeats: number;
  playbackMode: PlaybackMode;
  togglePlay: () => Promise<void>;
  stop: () => void;
  restartPlayback: () => void;
  adjustBPM: (delta: number) => void;
  sanitizeBpm: (value: number) => number;
  syncExternalTempo: (bpm: number) => void;
  togglePlaybackMode: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  seekToPosition: (beats: number) => void;
}

export function usePlayback({
  audioContext,
  bpm,
  beatsPerStep,
  playCurrentStep,
}: UsePlaybackProps): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [songPositionBeats, setSongPositionBeats] = useState<number>(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('pattern');

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bpmRef = useRef<number>(bpm);
  const currentStepRef = useRef<number>(0);
  const nextStepTimeRef = useRef<number>(0);
  const lookaheadRef = useRef<number>(0.1); // 100ms lookahead
  const MAX_ITERATIONS_PER_FRAME = 10; // Limit iterations to prevent blocking main thread
  const activeTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  /**
   * Lookahead scheduler for precise timing
   */
  const scheduleNextSteps = useCallback(() => {
    if (!audioContext || audioContext.state !== 'running') {
      return;
    }

    const currentTime = audioContext.currentTime;
    const stepTime = 60 / bpmRef.current / 4;
    let iterations = 0;

    // Schedule steps within lookahead window
    // Limit iterations per frame to prevent blocking main thread
    while (nextStepTimeRef.current < currentTime + lookaheadRef.current && iterations < MAX_ITERATIONS_PER_FRAME) {
      iterations += 1;
      const scheduleTime = nextStepTimeRef.current;
      const step = currentStepRef.current;

      // Schedule the step to play at the precise time
      if (scheduleTime >= currentTime - 0.01) {
        // Use setTimeout for immediate steps, or schedule in audio context time
        const delay = Math.max(0, (scheduleTime - currentTime) * 1000);
        if (delay < 50) {
          // Immediate or very soon: play directly
          playCurrentStep(step);
        } else {
          // Schedule for later - track timeout for cleanup
          const timeoutId = setTimeout(() => {
            activeTimeoutsRef.current.delete(timeoutId);
            if (audioContext && audioContext.state === 'running') {
              playCurrentStep(step);
            }
          }, delay);
          activeTimeoutsRef.current.add(timeoutId);
        }
      }

      // Advance to next step
      const next = (step + 1) % 16;
      currentStepRef.current = next;
      setCurrentStep(next);
      setSongPositionBeats((prev) => prev + beatsPerStep);
      nextStepTimeRef.current += stepTime;
    }

    // If we hit the iteration limit, schedule continuation on next frame
    // This prevents blocking while still maintaining timing accuracy
    if (iterations >= MAX_ITERATIONS_PER_FRAME && nextStepTimeRef.current < currentTime + lookaheadRef.current) {
      // Will continue on next animation frame
    }

    // Continue scheduling
    animationFrameRef.current = requestAnimationFrame(scheduleNextSteps);
  }, [audioContext, beatsPerStep, playCurrentStep]);

  /**
   * Start playback with lookahead scheduler
   */
  const startPlayback = useCallback(() => {
    if (!audioContext) {
      return;
    }

    // Initialize scheduler
    const currentTime = audioContext.currentTime;
    nextStepTimeRef.current = currentTime;
    
    // Don't reset position if already playing (allows seamless restart)
    if (!isPlaying) {
      currentStepRef.current = 0;
      setCurrentStep(0);
      setSongPositionBeats(0);
    }

    // Start lookahead scheduler
    scheduleNextSteps();

    // Fallback: Keep interval for state updates (less precise but ensures UI updates)
    // Note: The lookahead scheduler handles actual playback timing
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
    // Use a faster update interval for smoother UI (every 50ms instead of step time)
    intervalIdRef.current = setInterval(() => {
      // This interval is mainly for UI updates, actual playback is scheduled by lookahead
      // We sync with the lookahead scheduler's state
      setCurrentStep(currentStepRef.current);
      // songPositionBeats is updated by the lookahead scheduler
    }, 50); // 50ms for smooth UI updates
  }, [audioContext, beatsPerStep, scheduleNextSteps, isPlaying]);

  /**
   * Stop playback
   */
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Clear all active timeouts to prevent memory leaks
    activeTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    activeTimeoutsRef.current.clear();
  }, []);

  /**
   * Toggle play
   */
  const togglePlay = useCallback(async (): Promise<void> => {
    if (!audioContext) {
      return;
    }

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
    } catch {
      // Silent error handling
    }

    if (isPlaying) {
      setIsPlaying(false);
      stopPlayback();
      // Reset to start position when pausing
      setCurrentStep(0);
      currentStepRef.current = 0;
      setSongPositionBeats(0);
    } else {
      setIsPlaying(true);
      startPlayback();
    }
  }, [audioContext, isPlaying, startPlayback, stopPlayback]);

  /**
   * Stop
   */
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    currentStepRef.current = 0;
    setSongPositionBeats(0);
    stopPlayback();
  }, [stopPlayback]);

  /**
   * Restart playback
   */
  const restartPlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  /**
   * Sanitize BPM value
   */
  const sanitizeBpm = useCallback((value: number): number => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return Math.max(60, Math.min(200, bpmRef.current || 140));
    }
    return Math.max(60, Math.min(200, numeric));
  }, []);

  /**
   * Adjust BPM
   */
  const adjustBPM = useCallback((delta: number) => {
    const newBpm = sanitizeBpm((bpmRef.current || 140) + delta);
    bpmRef.current = newBpm;
    if (isPlaying) {
      restartPlayback();
    }
  }, [isPlaying, restartPlayback, sanitizeBpm]);

  /**
   * Sync external tempo
   */
  const syncExternalTempo = useCallback((newBpm: number) => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { vocalStudio?: { updateTempo?: (bpm: number) => void } };
      if (win.vocalStudio && typeof win.vocalStudio.updateTempo === 'function') {
        win.vocalStudio.updateTempo(newBpm);
      }
    }
  }, []);

  /**
   * Toggle playback mode (pattern/song)
   */
  const togglePlaybackMode = useCallback(() => {
    setPlaybackMode((prev) => (prev === 'pattern' ? 'song' : 'pattern'));
  }, []);

  /**
   * Set playback mode
   */
  const setPlaybackModeValue = useCallback((mode: PlaybackMode): void => {
    setPlaybackMode(mode);
  }, []);

  /**
   * Seek to position in beats
   */
  const seekToPosition = useCallback(
    (beats: number): void => {
      const clampedBeats = Math.max(0, beats);
      setSongPositionBeats(clampedBeats);
      // Update current step based on position (assuming 16 steps per pattern)
      const step = Math.floor((clampedBeats % (16 * beatsPerStep)) / beatsPerStep);
      setCurrentStep(step);
      currentStepRef.current = step;
    },
    [beatsPerStep]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return {
    isPlaying,
    currentStep,
    songPositionBeats,
    playbackMode,
    togglePlay,
    stop,
    restartPlayback,
    adjustBPM,
    sanitizeBpm,
    syncExternalTempo,
    togglePlaybackMode,
    setPlaybackMode: setPlaybackModeValue,
    seekToPosition,
  };
}

