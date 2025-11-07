/**
 * Synthesizer Type Definitions
 * Comprehensive types for modular synthesizer system
 * @module types/synthesizer.types
 */

/**
 * Oscillator waveform types
 */
export type OscillatorWaveform =
  | 'sine'
  | 'triangle'
  | 'sawtooth'
  | 'square'
  | 'pulse'
  | 'noise'
  | 'wavetable';

/**
 * Filter mode types
 */
export type FilterMode = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass';

/**
 * Envelope curve types
 */
export type EnvelopeCurve = 'linear' | 'exponential' | 'logarithmic';

/**
 * LFO waveform types
 */
export type LFOWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'random' | 'samplehold';

/**
 * Voice mode types
 */
export type VoiceMode = 'mono' | 'poly' | 'legato';

/**
 * Arpeggiator pattern types
 */
export type ArpPattern = 'up' | 'down' | 'updown' | 'random' | 'custom';

/**
 * Modulation source types
 */
export type ModulationSource =
  | 'lfo1'
  | 'lfo2'
  | 'lfo3'
  | 'env1'
  | 'env2'
  | 'velocity'
  | 'aftertouch'
  | 'modwheel'
  | 'keytracking'
  | 'pitchbend';

/**
 * Modulation destination types
 */
export type ModulationDestination =
  | 'osc1Pitch'
  | 'osc2Pitch'
  | 'osc3Pitch'
  | 'osc4Pitch'
  | 'osc1Gain'
  | 'osc2Gain'
  | 'osc3Gain'
  | 'osc4Gain'
  | 'filterCutoff'
  | 'filterResonance'
  | 'ampGain'
  | 'pan'
  | 'delayTime'
  | 'delayFeedback'
  | 'reverbDecay'
  | 'chorusRate';

/**
 * Effect types
 */
export type EffectType =
  | 'delay'
  | 'reverb'
  | 'chorus'
  | 'phaser'
  | 'distortion'
  | 'bitcrusher'
  | 'analogChorus'
  | 'convolutionReverb'
  | 'bbdDelay'
  | 'tapeDelay';

/**
 * Tempo sync divisions
 */
export type TempoSync = '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32' | '1/64' | '2/1' | '4/1';

/**
 * Oversampling factor
 */
export type OversamplingFactor = 1 | 2 | 4 | 8;

/**
 * Oscillator configuration
 */
export interface OscillatorConfig {
  enabled: boolean;
  waveform: OscillatorWaveform;
  octave: number; // -3 to +3
  semitone: number; // -12 to +12
  detune: number; // -50 to +50 cents
  gain: number; // 0 to 1
  pulseWidth: number; // 0 to 1 (for pulse waveform)
  phase: number; // 0 to 1
  sync: boolean; // Hard sync
  ringMod: boolean; // Ring modulation
  wavetableIndex?: number; // For wavetable synthesis
  oversampling?: OversamplingFactor; // Oversampling factor (1, 2, 4, 8)
  usePolyBLEP?: boolean; // Enable PolyBLEP anti-aliasing
  useBandLimited?: boolean; // Enable band-limited waveform generation
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  enabled: boolean;
  mode: FilterMode;
  cutoff: number; // 20 to 20000 Hz
  resonance: number; // 0 to 1
  drive: number; // 0 to 1 (saturation)
  keytracking: number; // -1 to 1
  envelopeAmount: number; // -1 to 1
  lfoAmount: number; // -1 to 1
}

/**
 * ADSR envelope parameters
 */
export interface ADSREnvelopeParams {
  attack: number; // 0 to 10 seconds
  decay: number; // 0 to 10 seconds
  sustain: number; // 0 to 1
  release: number; // 0 to 10 seconds
  curve: EnvelopeCurve;
  velocitySensitivity: number; // 0 to 1
}

/**
 * Multi-stage envelope point
 */
export interface EnvelopePoint {
  time: number; // 0 to 10 seconds
  value: number; // 0 to 1
  curve: EnvelopeCurve;
}

/**
 * LFO configuration
 */
export interface LFOConfig {
  enabled: boolean;
  waveform: LFOWaveform;
  rate: number; // 0.01 to 100 Hz
  tempoSync: boolean;
  syncDivision: TempoSync;
  depth: number; // 0 to 1
  delay: number; // 0 to 10 seconds
  fadeIn: number; // 0 to 10 seconds
  phase: number; // 0 to 1
}

/**
 * Delay effect parameters
 */
export interface DelayEffectParams {
  enabled: boolean;
  time: number; // 0 to 2 seconds
  tempoSync: boolean;
  syncDivision: TempoSync;
  feedback: number; // 0 to 1
  wet: number; // 0 to 1
  dry: number; // 0 to 1
  pingPong: boolean;
  stereoWidth: number; // 0 to 1
}

/**
 * Reverb effect parameters
 */
export interface ReverbEffectParams {
  enabled: boolean;
  decay: number; // 0 to 10 seconds
  wet: number; // 0 to 1
  dry: number; // 0 to 1
  preDelay: number; // 0 to 0.5 seconds
  roomSize: number; // 0 to 1
  damping: number; // 0 to 1
}

/**
 * Chorus effect parameters
 */
export interface ChorusEffectParams {
  enabled: boolean;
  rate: number; // 0.1 to 10 Hz
  depth: number; // 0 to 1
  delay: number; // 0 to 0.05 seconds
  feedback: number; // -1 to 1
  wet: number; // 0 to 1
  dry: number; // 0 to 1
  stereoWidth: number; // 0 to 1
}

/**
 * Phaser effect parameters
 */
export interface PhaserEffectParams {
  enabled: boolean;
  rate: number; // 0.1 to 10 Hz
  depth: number; // 0 to 1
  stages: number; // 2 to 12
  feedback: number; // -1 to 1
  wet: number; // 0 to 1
  dry: number; // 0 to 1
}

/**
 * Distortion effect parameters
 */
export interface DistortionEffectParams {
  enabled: boolean;
  amount: number; // 0 to 1
  drive: number; // 0 to 1
  tone: number; // 0 to 1 (lowpass filter)
  wet: number; // 0 to 1
  dry: number; // 0 to 1
  algorithm: 'soft' | 'hard' | 'tube' | 'tape';
}

/**
 * Modulation slot configuration
 */
export interface ModulationSlot {
  enabled: boolean;
  source: ModulationSource;
  destination: ModulationDestination;
  depth: number; // -1 to 1
  bipolar: boolean; // If true, depth can be negative
}

/**
 * Unison configuration
 */
export interface UnisonConfig {
  enabled: boolean;
  voices: number; // 2 to 8
  detune: number; // 0 to 50 cents
  spread: number; // 0 to 1 (stereo spread)
  blend: number; // 0 to 1 (mix between voices)
}

/**
 * Arpeggiator configuration
 */
export interface ArpeggiatorConfig {
  enabled: boolean;
  pattern: ArpPattern;
  rate: number; // 0.1 to 10 Hz
  tempoSync: boolean;
  syncDivision: TempoSync;
  octaves: number; // 1 to 4
  gate: number; // 0 to 1 (note length)
  swing: number; // 0 to 1
  customPattern?: number[]; // For custom patterns
}

/**
 * Complete synthesizer voice configuration
 */
export interface SynthesizerVoiceConfig {
  oscillators: [OscillatorConfig, OscillatorConfig, OscillatorConfig, OscillatorConfig];
  filter: FilterConfig;
  ampEnvelope: ADSREnvelopeParams;
  filterEnvelope: ADSREnvelopeParams;
  lfos: [LFOConfig, LFOConfig, LFOConfig];
  effects: {
    delay: DelayEffectParams;
    reverb: ReverbEffectParams;
    chorus: ChorusEffectParams;
    phaser: PhaserEffectParams;
    distortion: DistortionEffectParams;
  };
  modulation: ModulationSlot[];
  unison: UnisonConfig;
  arpeggiator: ArpeggiatorConfig;
  portamento: number; // 0 to 10 seconds
  voiceMode: VoiceMode;
  masterTuning: number; // -100 to +100 cents
  pitchBendRange: number; // 0 to 24 semitones
}

/**
 * Synthesizer preset
 */
export interface SynthesizerPreset {
  id: string;
  name: string;
  category: string;
  description?: string;
  config: SynthesizerVoiceConfig;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Active voice information
 */
export interface ActiveVoice {
  id: string;
  note: number; // MIDI note (0-127)
  frequency: number; // Hz
  velocity: number; // 0 to 1
  startTime: number; // AudioContext time
  nodes: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    filter?: BiquadFilterNode;
    masterGain: GainNode;
  };
}

/**
 * Synthesizer engine state
 */
export interface SynthesizerState {
  config: SynthesizerVoiceConfig;
  activeVoices: Map<string, ActiveVoice>;
  polyphony: number; // 1 to 32
  currentBPM: number;
  isPlaying: boolean;
}

