/**
 * Audio-related type definitions for FL Studio Web DAW
 */

import type { FilterType, WaveformType } from './FLStudio.types';

/**
 * Oscillator configuration
 */
export interface OscillatorConfig {
  type: OscillatorType | WaveformType;
  frequency: number;
  detune: number;
  gain: number;
}

/**
 * ADSR envelope configuration
 */
export interface EnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/**
 * LFO (Low Frequency Oscillator) configuration
 */
export interface LFOConfig {
  enabled: boolean;
  frequency: number;
  depth: number;
  target: 'frequency' | 'gain' | 'filter';
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  enabled: boolean;
  type: FilterType;
  frequency: number;
  Q: number;
}

/**
 * FM (Frequency Modulation) configuration
 */
export interface FMConfig {
  enabled: boolean;
  ratio: number;
  depth: number;
}

/**
 * Synthesizer voice settings
 */
export interface VoiceSettings {
  oscillators: OscillatorConfig[];
  envelope: EnvelopeConfig;
  lfo?: LFOConfig;
  filter?: FilterConfig;
  fm?: FMConfig;
}

/**
 * Active synthesizer voice
 */
export interface ActiveVoice {
  voiceId: string;
  oscillatorNodes: OscillatorNode[];
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
  lfoNode?: OscillatorNode;
  envelopeNode?: GainNode;
  startTime: number;
  note: number;
  velocity: number;
}

/**
 * Effect parameter types
 */
export interface ReverbParams {
  enabled: boolean;
  wet: number;
  decay: number;
}

export interface DelayParams {
  enabled: boolean;
  wet: number;
  time: number;
  feedback: number;
}

export interface DistortionParams {
  enabled: boolean;
  amount: number;
}

export interface FilterParams {
  enabled: boolean;
  frequency: number;
  type: FilterType;
}

/**
 * Effect chain configuration
 */
export interface EffectChainConfig {
  reverb?: ReverbParams;
  delay?: DelayParams;
  distortion?: DistortionParams;
  filter?: FilterParams;
  eq?: {
    enabled: boolean;
    low: number;
    mid: number;
    high: number;
  };
  compressor?: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

/**
 * Audio buffer metadata
 */
export interface AudioBufferMetadata {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
}

/**
 * Recording options
 */
export interface RecordingOptions {
  sampleRate?: number;
  numberOfChannels?: number;
  bitDepth?: 16 | 24 | 32;
}

/**
 * Export options
 */
export interface AudioExportOptions {
  format: 'wav' | 'mp3' | 'ogg';
  bitDepth?: 16 | 24 | 32;
  sampleRate?: number;
}

