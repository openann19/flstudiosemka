/**
 * useMixer - Mixer functionality hook
 * Strict TypeScript implementation with comprehensive error handling
 */

import { useState, useCallback, useRef } from 'react';
import type { MasterEffects } from '../types/FLStudio.types';

interface UseMixerReturn {
  masterEffects: MasterEffects;
  trackMixers: Map<number, unknown>;
  updateMasterEffect: (effectType: keyof MasterEffects, settings: Partial<MasterEffects[keyof MasterEffects]>) => void;
  getTrackMixer: (trackId: number) => unknown | null;
  initializeTrackMixer: (trackId: number, audioContext: AudioContext) => void;
}

export function useMixer(): UseMixerReturn {
  const [masterEffects, setMasterEffects] = useState<MasterEffects>({
    reverb: { enabled: false, wet: 0.3, decay: 2.0 },
    delay: { enabled: false, wet: 0.2, time: 0.25, feedback: 0.3 },
    distortion: { enabled: false, amount: 0.5 },
    filter: { enabled: false, frequency: 1000, type: 'lowpass' },
  });

  const trackMixersRef = useRef<Map<number, unknown>>(new Map());

  /**
   * Update master effect
   */
  const updateMasterEffect = useCallback(
    (effectType: keyof MasterEffects, settings: Partial<MasterEffects[keyof MasterEffects]>) => {
      setMasterEffects((prev) => ({
        ...prev,
        [effectType]: {
          ...prev[effectType],
          ...settings,
        },
      }));
    },
    []
  );

  /**
   * Get track mixer
   */
  const getTrackMixer = useCallback((trackId: number): unknown | null => {
    return trackMixersRef.current.get(trackId) || null;
  }, []);

  /**
   * Initialize track mixer
   */
  const initializeTrackMixer = useCallback((trackId: number, audioContext: AudioContext) => {
    if (trackMixersRef.current.has(trackId)) {
      return;
    }

    if (typeof window !== 'undefined' && (window as { TrackMixer?: new (ctx: AudioContext, id: number) => unknown }).TrackMixer) {
      const TrackMixer = (window as { TrackMixer: new (ctx: AudioContext, id: number) => unknown }).TrackMixer;
      const mixer = new TrackMixer(audioContext, trackId);
      trackMixersRef.current.set(trackId, mixer);
    }
  }, []);

  return {
    masterEffects,
    trackMixers: trackMixersRef.current,
    updateMasterEffect,
    getTrackMixer,
    initializeTrackMixer,
  };
}

