/**
 * useSynthesizer - React hook for synthesizer control
 * Provides state management and control interface for the synthesizer
 * @module hooks/useSynthesizer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SynthesizerEngine } from '../audio/synthesizer/core/SynthesizerEngine';
import { PresetManager } from '../audio/synthesizer/presets/PresetManager';
import { generateFactoryPresets } from '../audio/synthesizer/presets/PresetLibrary';
import type {
  SynthesizerVoiceConfig,
  SynthesizerState,
  SynthesizerPreset,
} from '../types/synthesizer.types';
import { logger } from '../utils/logger';

/**
 * Synthesizer hook return type
 */
export interface UseSynthesizerReturn {
  engine: SynthesizerEngine | null;
  state: SynthesizerState | null;
  presetManager: PresetManager;
  playNote: (note: number, velocity?: number) => string | null;
  stopNote: (voiceId: string) => void;
  stopAllNotes: () => void;
  updateConfig: (config: Partial<SynthesizerVoiceConfig>) => void;
  loadPreset: (presetId: string) => boolean;
  savePreset: (preset: SynthesizerPreset) => void;
  setBPM: (bpm: number) => void;
  isInitialized: boolean;
}

/**
 * React hook for synthesizer control
 */
export function useSynthesizer(
  audioContext: AudioContext | null,
  initialConfig?: SynthesizerVoiceConfig
): UseSynthesizerReturn {
  const [engine, setEngine] = useState<SynthesizerEngine | null>(null);
  const [state, setState] = useState<SynthesizerState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const presetManagerRef = useRef<PresetManager | null>(null);
  const processIntervalRef = useRef<number | null>(null);
  const previousStateRef = useRef<SynthesizerState | null>(null);

  // Initialize preset manager
  useEffect(() => {
    if (!presetManagerRef.current) {
      presetManagerRef.current = new PresetManager();
      // Load factory presets if not already loaded
      const factoryPresets = generateFactoryPresets();
      factoryPresets.forEach((preset) => {
        try {
          presetManagerRef.current?.savePreset(preset);
        } catch {
          // Preset may already exist
        }
      });
    }
  }, []);

  // Initialize synthesizer engine
  useEffect(() => {
    if (!audioContext || engine) {
      return;
    }

    try {
      const defaultConfig: SynthesizerVoiceConfig = initialConfig ?? createDefaultConfig();
      const synthEngine = new SynthesizerEngine(audioContext, defaultConfig);
      const initialState = synthEngine.getState();
      setEngine(synthEngine);
      setState(initialState);
      previousStateRef.current = initialState;
      setIsInitialized(true);

      // Start processing loop with optimized interval
      // Only update state when values actually change to prevent unnecessary re-renders
      const interval = setInterval(() => {
        synthEngine.process();
        const newState = synthEngine.getState();
        
        // Only update state if it actually changed
        const prevState = previousStateRef.current;
        if (!prevState || hasStateChanged(prevState, newState)) {
          setState(newState);
          previousStateRef.current = newState;
        }
      }, 80); // 80ms = ~12.5fps (sufficient for UI updates, reduces CPU by ~75%)

      processIntervalRef.current = interval as unknown as number;
    } catch (error) {
      logger.error('useSynthesizer: Error initializing engine', { error });
    }

    return () => {
      if (processIntervalRef.current) {
        clearInterval(processIntervalRef.current);
      }
      if (engine) {
        engine.stopAllNotes();
      }
    };
  }, [audioContext, engine, initialConfig]);

  /**
   * Play a note
   */
  const playNote = useCallback(
    (note: number, velocity: number = 1.0): string | null => {
      if (!engine) {
        return null;
      }
      return engine.playNote(note, velocity);
    },
    [engine]
  );

  /**
   * Stop a note
   */
  const stopNote = useCallback(
    (voiceId: string): void => {
      if (!engine) {
        return;
      }
      engine.stopNote(voiceId);
      setState(engine.getState());
    },
    [engine]
  );

  /**
   * Stop all notes
   */
  const stopAllNotes = useCallback((): void => {
    if (!engine) {
      return;
    }
    engine.stopAllNotes();
    setState(engine.getState());
  }, [engine]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback(
    (config: Partial<SynthesizerVoiceConfig>): void => {
      if (!engine) {
        return;
      }
      engine.updateConfig(config);
      setState(engine.getState());
    },
    [engine]
  );

  /**
   * Load preset
   */
  const loadPreset = useCallback(
    (presetId: string): boolean => {
      if (!engine || !presetManagerRef.current) {
        return false;
      }

      const preset = presetManagerRef.current.loadPreset(presetId);
      if (!preset) {
        return false;
      }

      engine.updateConfig(preset.config);
      setState(engine.getState());
      return true;
    },
    [engine]
  );

  /**
   * Save preset
   */
  const savePreset = useCallback(
    (preset: SynthesizerPreset): void => {
      if (!presetManagerRef.current) {
        return;
      }
      presetManagerRef.current.savePreset(preset);
    },
    []
  );

  /**
   * Set BPM
   */
  const setBPM = useCallback(
    (bpm: number): void => {
      if (!engine) {
        return;
      }
      engine.setBPM(bpm);
    },
    [engine]
  );

  return {
    engine,
    state,
    presetManager: presetManagerRef.current ?? new PresetManager(),
    playNote,
    stopNote,
    stopAllNotes,
    updateConfig,
    loadPreset,
    savePreset,
    setBPM,
    isInitialized,
  };
}

/**
 * Check if synthesizer state has changed
 * Only checks key properties that affect UI rendering
 */
function hasStateChanged(prev: SynthesizerState, next: SynthesizerState): boolean {
  // Check if active voices changed
  if (prev.activeVoices.length !== next.activeVoices.length) {
    return true;
  }
  
  // Check if any voice parameters changed significantly
  for (let i = 0; i < Math.max(prev.activeVoices.length, next.activeVoices.length); i += 1) {
    const prevVoice = prev.activeVoices[i];
    const nextVoice = next.activeVoices[i];
    
    if (!prevVoice && nextVoice) return true;
    if (prevVoice && !nextVoice) return true;
    if (prevVoice && nextVoice) {
      // Only check key properties that matter for UI
      if (Math.abs((prevVoice.frequency ?? 0) - (nextVoice.frequency ?? 0)) > 0.1) return true;
      if (Math.abs((prevVoice.velocity ?? 0) - (nextVoice.velocity ?? 0)) > 0.01) return true;
    }
  }
  
  // Check LFO values (these change frequently but don't always need UI updates)
  // Only update if change is significant
  if (prev.lfoValues && next.lfoValues) {
    for (const key of Object.keys(prev.lfoValues) as Array<keyof typeof prev.lfoValues>) {
      if (Math.abs((prev.lfoValues[key] ?? 0) - (next.lfoValues[key] ?? 0)) > 0.05) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Create default synthesizer configuration
 */
function createDefaultConfig(): SynthesizerVoiceConfig {
  return {
    oscillators: [
      {
        enabled: true,
        waveform: 'sawtooth',
        octave: 0,
        semitone: 0,
        detune: 0,
        gain: 0.5,
        pulseWidth: 0.5,
        phase: 0,
        sync: false,
        ringMod: false,
      },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
    ],
    filter: {
      enabled: true,
      mode: 'lowpass',
      cutoff: 20000,
      resonance: 0.3,
      drive: 0,
      keytracking: 0,
      envelopeAmount: 0,
      lfoAmount: 0,
    },
    ampEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
      curve: 'exponential',
      velocitySensitivity: 0.5,
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
      curve: 'exponential',
      velocitySensitivity: 0.3,
    },
    lfos: [
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
    ],
    effects: {
      delay: { enabled: false, time: 0.25, tempoSync: true, syncDivision: '1/8', feedback: 0.3, wet: 0.2, dry: 0.8, pingPong: true, stereoWidth: 1 },
      reverb: { enabled: false, decay: 2, wet: 0.2, dry: 0.8, preDelay: 0.02, roomSize: 0.5, damping: 0.5 },
      chorus: { enabled: false, rate: 1, depth: 0.3, delay: 0.01, feedback: 0.2, wet: 0.3, dry: 0.7, stereoWidth: 0.8 },
      phaser: { enabled: false, rate: 0.5, depth: 0.5, stages: 4, feedback: 0.2, wet: 0.3, dry: 0.7 },
      distortion: { enabled: false, amount: 0.2, drive: 0.3, tone: 0.5, wet: 0.2, dry: 0.8, algorithm: 'soft' },
    },
    modulation: [],
    unison: { enabled: false, voices: 2, detune: 10, spread: 0.5, blend: 0.5 },
    arpeggiator: { enabled: false, pattern: 'up', rate: 4, tempoSync: true, syncDivision: '1/16', octaves: 1, gate: 0.7, swing: 0 },
    portamento: 0,
    voiceMode: 'poly',
    masterTuning: 0,
    pitchBendRange: 2,
  };
}

