/**
 * PresetLibrary - Factory presets for progressive house
 * Provides curated presets optimized for progressive house production
 * @module audio/synthesizer/presets/PresetLibrary
 */

import type { SynthesizerPreset, SynthesizerVoiceConfig } from '../../../types/synthesizer.types';

/**
 * Generate factory presets for progressive house
 */
export function generateFactoryPresets(): SynthesizerPreset[] {
  const presets: SynthesizerPreset[] = [];

  // Pluck Lead
  const pluckLead: SynthesizerPreset = {
    id: 'factory_pluck_lead',
    name: 'Pluck Lead',
    category: 'Leads',
    description: 'Bright, punchy pluck lead for melodies',
    config: createPluckLeadConfig(),
    tags: ['lead', 'pluck', 'bright', 'melody'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  presets.push(pluckLead);

  // Supersaw Pad
  const supersawPad: SynthesizerPreset = {
    id: 'factory_supersaw_pad',
    name: 'Supersaw Pad',
    category: 'Pads',
    description: 'Rich, layered pad with unison',
    config: createSupersawPadConfig(),
    tags: ['pad', 'supersaw', 'unison', 'wide'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  presets.push(supersawPad);

  // Bass
  const bass: SynthesizerPreset = {
    id: 'factory_bass',
    name: 'Progressive Bass',
    category: 'Bass',
    description: 'Deep, punchy bass for progressive house',
    config: createBassConfig(),
    tags: ['bass', 'deep', 'punchy'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  presets.push(bass);

  // Arp Pattern
  const arp: SynthesizerPreset = {
    id: 'factory_arp',
    name: 'Arp Pattern',
    category: 'Arps',
    description: 'Classic arpeggiator pattern',
    config: createArpConfig(),
    tags: ['arp', 'pattern', 'sequence'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  presets.push(arp);

  return presets;
}

/**
 * Create pluck lead configuration
 */
function createPluckLeadConfig(): SynthesizerVoiceConfig {
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
      {
        enabled: true,
        waveform: 'square',
        octave: 0,
        semitone: 7,
        detune: 5,
        gain: 0.3,
        pulseWidth: 0.5,
        phase: 0,
        sync: false,
        ringMod: false,
      },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
    ],
    filter: {
      enabled: true,
      mode: 'lowpass',
      cutoff: 8000,
      resonance: 0.3,
      drive: 0,
      keytracking: 0.5,
      envelopeAmount: 0.5,
      lfoAmount: 0,
    },
    ampEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0,
      release: 0.3,
      curve: 'exponential',
      velocitySensitivity: 0.5,
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0,
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
      reverb: { enabled: true, decay: 2, wet: 0.2, dry: 0.8, preDelay: 0.02, roomSize: 0.5, damping: 0.5 },
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

/**
 * Create supersaw pad configuration
 */
function createSupersawPadConfig(): SynthesizerVoiceConfig {
  return {
    oscillators: [
      {
        enabled: true,
        waveform: 'sawtooth',
        octave: 0,
        semitone: 0,
        detune: -5,
        gain: 0.4,
        pulseWidth: 0.5,
        phase: 0,
        sync: false,
        ringMod: false,
      },
      {
        enabled: true,
        waveform: 'sawtooth',
        octave: 0,
        semitone: 0,
        detune: 5,
        gain: 0.4,
        pulseWidth: 0.5,
        phase: 0,
        sync: false,
        ringMod: false,
      },
      {
        enabled: true,
        waveform: 'sawtooth',
        octave: -1,
        semitone: 0,
        detune: 0,
        gain: 0.2,
        pulseWidth: 0.5,
        phase: 0,
        sync: false,
        ringMod: false,
      },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
    ],
    filter: {
      enabled: true,
      mode: 'lowpass',
      cutoff: 4000,
      resonance: 0.2,
      drive: 0,
      keytracking: 0.3,
      envelopeAmount: 0.3,
      lfoAmount: 0.2,
    },
    ampEnvelope: {
      attack: 0.5,
      decay: 0.3,
      sustain: 0.8,
      release: 1.5,
      curve: 'exponential',
      velocitySensitivity: 0.3,
    },
    filterEnvelope: {
      attack: 0.3,
      decay: 0.5,
      sustain: 0.6,
      release: 1.0,
      curve: 'exponential',
      velocitySensitivity: 0.2,
    },
    lfos: [
      { enabled: true, waveform: 'sine', rate: 0.5, tempoSync: false, syncDivision: '1/4', depth: 0.2, delay: 0, fadeIn: 1, phase: 0 },
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
    ],
    effects: {
      delay: { enabled: true, time: 0.5, tempoSync: true, syncDivision: '1/4', feedback: 0.4, wet: 0.3, dry: 0.7, pingPong: true, stereoWidth: 1 },
      reverb: { enabled: true, decay: 3, wet: 0.4, dry: 0.6, preDelay: 0.05, roomSize: 0.7, damping: 0.4 },
      chorus: { enabled: true, rate: 0.8, depth: 0.4, delay: 0.015, feedback: 0.3, wet: 0.4, dry: 0.6, stereoWidth: 1 },
      phaser: { enabled: false, rate: 0.5, depth: 0.5, stages: 4, feedback: 0.2, wet: 0.3, dry: 0.7 },
      distortion: { enabled: false, amount: 0.2, drive: 0.3, tone: 0.5, wet: 0.2, dry: 0.8, algorithm: 'soft' },
    },
    modulation: [],
    unison: { enabled: true, voices: 4, detune: 15, spread: 0.8, blend: 0.6 },
    arpeggiator: { enabled: false, pattern: 'up', rate: 4, tempoSync: true, syncDivision: '1/16', octaves: 1, gate: 0.7, swing: 0 },
    portamento: 0.1,
    voiceMode: 'poly',
    masterTuning: 0,
    pitchBendRange: 2,
  };
}

/**
 * Create bass configuration
 */
function createBassConfig(): SynthesizerVoiceConfig {
  return {
    oscillators: [
      {
        enabled: true,
        waveform: 'sawtooth',
        octave: -1,
        semitone: 0,
        detune: 0,
        gain: 0.6,
        pulseWidth: 0.5,
        phase: 0,
        sync: false,
        ringMod: false,
      },
      {
        enabled: true,
        waveform: 'square',
        octave: -1,
        semitone: 0,
        detune: 0,
        gain: 0.4,
        pulseWidth: 0.3,
        phase: 0,
        sync: false,
        ringMod: false,
      },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
      { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
    ],
    filter: {
      enabled: true,
      mode: 'lowpass',
      cutoff: 2000,
      resonance: 0.5,
      drive: 0.2,
      keytracking: 0.7,
      envelopeAmount: 0.6,
      lfoAmount: 0,
    },
    ampEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.8,
      release: 0.2,
      curve: 'exponential',
      velocitySensitivity: 0.4,
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.3,
      release: 0.3,
      curve: 'exponential',
      velocitySensitivity: 0.5,
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
      distortion: { enabled: true, amount: 0.3, drive: 0.4, tone: 0.3, wet: 0.3, dry: 0.7, algorithm: 'hard' },
    },
    modulation: [],
    unison: { enabled: false, voices: 2, detune: 5, spread: 0.3, blend: 0.5 },
    arpeggiator: { enabled: false, pattern: 'up', rate: 4, tempoSync: true, syncDivision: '1/16', octaves: 1, gate: 0.7, swing: 0 },
    portamento: 0,
    voiceMode: 'mono',
    masterTuning: 0,
    pitchBendRange: 2,
  };
}

/**
 * Create arp configuration
 */
function createArpConfig(): SynthesizerVoiceConfig {
  return {
    oscillators: [
      {
        enabled: true,
        waveform: 'square',
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
      cutoff: 6000,
      resonance: 0.3,
      drive: 0,
      keytracking: 0.5,
      envelopeAmount: 0.4,
      lfoAmount: 0,
    },
    ampEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0,
      release: 0.2,
      curve: 'exponential',
      velocitySensitivity: 0.5,
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.15,
      sustain: 0,
      release: 0.2,
      curve: 'exponential',
      velocitySensitivity: 0.3,
    },
    lfos: [
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
      { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
    ],
    effects: {
      delay: { enabled: true, time: 0.25, tempoSync: true, syncDivision: '1/8', feedback: 0.3, wet: 0.25, dry: 0.75, pingPong: true, stereoWidth: 1 },
      reverb: { enabled: true, decay: 1.5, wet: 0.15, dry: 0.85, preDelay: 0.02, roomSize: 0.5, damping: 0.5 },
      chorus: { enabled: false, rate: 1, depth: 0.3, delay: 0.01, feedback: 0.2, wet: 0.3, dry: 0.7, stereoWidth: 0.8 },
      phaser: { enabled: false, rate: 0.5, depth: 0.5, stages: 4, feedback: 0.2, wet: 0.3, dry: 0.7 },
      distortion: { enabled: false, amount: 0.2, drive: 0.3, tone: 0.5, wet: 0.2, dry: 0.8, algorithm: 'soft' },
    },
    modulation: [],
    unison: { enabled: false, voices: 2, detune: 5, spread: 0.3, blend: 0.5 },
    arpeggiator: { enabled: true, pattern: 'up', rate: 8, tempoSync: true, syncDivision: '1/16', octaves: 2, gate: 0.7, swing: 0.1 },
    portamento: 0,
    voiceMode: 'poly',
    masterTuning: 0,
    pitchBendRange: 2,
  };
}

