/**
 * EffectRegistry - Registry of available effects
 * Provides factory functions and metadata for all effects
 * @module services/EffectRegistry
 */

import type { EffectMetadata, EffectParameter, EffectCategory } from '../types/effect.types';
import type { Effect } from '../types/effectSlot.types';
import type { EffectType } from '../types/synthesizer.types';
import { ReverbEffect } from '../audio/synthesizer/effects/ReverbEffect';
import { DelayEffect } from '../audio/synthesizer/effects/DelayEffect';
import { DistortionEffect } from '../audio/synthesizer/effects/DistortionEffect';
import { ChorusEffect } from '../audio/synthesizer/effects/ChorusEffect';
import { PhaserEffect } from '../audio/synthesizer/effects/PhaserEffect';
import { Bitcrusher } from '../audio/synthesizer/effects/Bitcrusher';
import { AnalogChorus } from '../audio/synthesizer/effects/AnalogChorus';
import { ConvolutionReverb } from '../audio/synthesizer/effects/ConvolutionReverb';
import { BBDDelay } from '../audio/synthesizer/effects/BBDDelay';
import { TapeDelay } from '../audio/synthesizer/effects/TapeDelay';
import { AudioContextError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Default parameters for each effect type
 */
const DEFAULT_PARAMETERS: Record<EffectType, Record<string, number>> = {
  reverb: {
    enabled: 1,
    decay: 2.0,
    wet: 0.3,
    dry: 0.7,
    damping: 0.5,
    roomSize: 0.5,
    preDelay: 0.02,
  },
  delay: {
    enabled: 1,
    time: 0.25,
    feedback: 0.3,
    wet: 0.2,
    dry: 0.8,
    tempoSync: 1,
    syncDivision: 4, // 1/8
    pingPong: 0,
    stereoWidth: 1.0,
  },
  distortion: {
    enabled: 1,
    amount: 0.2,
    drive: 0.3,
    tone: 0.5,
    wet: 0.2,
    dry: 0.8,
    algorithm: 0, // 'soft'
  },
  chorus: {
    enabled: 1,
    rate: 1.0,
    depth: 0.3,
    delay: 0.01,
    feedback: 0.2,
    wet: 0.3,
    dry: 0.7,
    stereoWidth: 0.8,
  },
  phaser: {
    enabled: 1,
    rate: 0.5,
    depth: 0.5,
    stages: 4,
    feedback: 0.2,
    wet: 0.3,
    dry: 0.7,
  },
  bitcrusher: {
    enabled: 1,
    bitDepth: 8,
    sampleRateReduction: 1,
    wet: 0.5,
    dry: 0.5,
  },
  analogChorus: {
    enabled: 1,
    rate: 1.0,
    depth: 0.3,
    delay: 0.01,
    feedback: 0.2,
    wet: 0.3,
    dry: 0.7,
    stereoWidth: 0.8,
    bbdStages: 512,
    noiseLevel: 0.01,
  },
  convolutionReverb: {
    enabled: 1,
    decay: 2.0,
    wet: 0.3,
    dry: 0.7,
    damping: 0.5,
    roomSize: 0.5,
    preDelay: 0.02,
    irLength: 44100,
  },
  bbdDelay: {
    enabled: 1,
    time: 0.25,
    feedback: 0.3,
    wet: 0.2,
    dry: 0.8,
    stages: 512,
    clockRate: 10000,
    noiseLevel: 0.01,
  },
  tapeDelay: {
    enabled: 1,
    time: 0.25,
    feedback: 0.3,
    wet: 0.2,
    dry: 0.8,
    wowFlutter: 0.1,
    saturation: 0.3,
    tapeSpeed: 1.0,
  },
};

/**
 * Effect parameter definitions
 */
const EFFECT_PARAMETERS: Record<EffectType, EffectParameter[]> = {
  reverb: [
    { name: 'decay', label: 'Decay', type: 'number', min: 0.1, max: 10, step: 0.1, defaultValue: 2.0, unit: 's' },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
    { name: 'damping', label: 'Damping', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { name: 'roomSize', label: 'Room Size', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { name: 'preDelay', label: 'Pre-Delay', type: 'number', min: 0, max: 0.1, step: 0.001, defaultValue: 0.02, unit: 's' },
  ],
  delay: [
    { name: 'time', label: 'Time', type: 'number', min: 0, max: 2, step: 0.01, defaultValue: 0.25, unit: 's' },
    { name: 'feedback', label: 'Feedback', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
    { name: 'stereoWidth', label: 'Stereo Width', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 1.0 },
  ],
  distortion: [
    { name: 'amount', label: 'Amount', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'drive', label: 'Drive', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'tone', label: 'Tone', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
  ],
  chorus: [
    { name: 'rate', label: 'Rate', type: 'number', min: 0.1, max: 10, step: 0.1, defaultValue: 1.0, unit: 'Hz' },
    { name: 'depth', label: 'Depth', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'delay', label: 'Delay', type: 'number', min: 0, max: 0.05, step: 0.001, defaultValue: 0.01, unit: 's' },
    { name: 'feedback', label: 'Feedback', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
    { name: 'stereoWidth', label: 'Stereo Width', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
  ],
  phaser: [
    { name: 'rate', label: 'Rate', type: 'number', min: 0.1, max: 10, step: 0.1, defaultValue: 0.5, unit: 'Hz' },
    { name: 'depth', label: 'Depth', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { name: 'stages', label: 'Stages', type: 'number', min: 2, max: 12, step: 1, defaultValue: 4 },
    { name: 'feedback', label: 'Feedback', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
  ],
  bitcrusher: [
    { name: 'bitDepth', label: 'Bit Depth', type: 'number', min: 1, max: 16, step: 1, defaultValue: 8, unit: 'bits' },
    { name: 'sampleRateReduction', label: 'Sample Rate', type: 'number', min: 0.0625, max: 1, step: 0.0625, defaultValue: 1 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  ],
  analogChorus: [
    { name: 'rate', label: 'Rate', type: 'number', min: 0.1, max: 10, step: 0.1, defaultValue: 1.0, unit: 'Hz' },
    { name: 'depth', label: 'Depth', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'delay', label: 'Delay', type: 'number', min: 0, max: 0.05, step: 0.001, defaultValue: 0.01, unit: 's' },
    { name: 'feedback', label: 'Feedback', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
    { name: 'stereoWidth', label: 'Stereo Width', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
    { name: 'bbdStages', label: 'BBD Stages', type: 'number', min: 64, max: 2048, step: 64, defaultValue: 512 },
    { name: 'noiseLevel', label: 'Noise', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.01 },
  ],
  convolutionReverb: [
    { name: 'decay', label: 'Decay', type: 'number', min: 0.1, max: 10, step: 0.1, defaultValue: 2.0, unit: 's' },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
    { name: 'damping', label: 'Damping', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { name: 'roomSize', label: 'Room Size', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { name: 'preDelay', label: 'Pre-Delay', type: 'number', min: 0, max: 0.1, step: 0.001, defaultValue: 0.02, unit: 's' },
  ],
  bbdDelay: [
    { name: 'time', label: 'Time', type: 'number', min: 0, max: 2, step: 0.01, defaultValue: 0.25, unit: 's' },
    { name: 'feedback', label: 'Feedback', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
    { name: 'stages', label: 'Stages', type: 'number', min: 64, max: 2048, step: 64, defaultValue: 512 },
    { name: 'clockRate', label: 'Clock Rate', type: 'number', min: 1000, max: 50000, step: 100, defaultValue: 10000, unit: 'Hz' },
    { name: 'noiseLevel', label: 'Noise', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.01 },
  ],
  tapeDelay: [
    { name: 'time', label: 'Time', type: 'number', min: 0, max: 2, step: 0.01, defaultValue: 0.25, unit: 's' },
    { name: 'feedback', label: 'Feedback', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'wet', label: 'Wet', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
    { name: 'dry', label: 'Dry', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
    { name: 'wowFlutter', label: 'Wow/Flutter', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.1 },
    { name: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    { name: 'tapeSpeed', label: 'Tape Speed', type: 'number', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 },
  ],
};

/**
 * Effect metadata
 */
const EFFECT_METADATA: Record<EffectType, Omit<EffectMetadata, 'factory'>> = {
  reverb: {
    type: 'reverb',
    name: 'Reverb',
    description: 'Convolution reverb for spatial depth',
    category: 'spatial',
    icon: '🌊',
    parameters: EFFECT_PARAMETERS.reverb,
  },
  delay: {
    type: 'delay',
    name: 'Delay',
    description: 'Stereo delay with ping-pong and tempo sync',
    category: 'time',
    icon: '⏱️',
    parameters: EFFECT_PARAMETERS.delay,
  },
  distortion: {
    type: 'distortion',
    name: 'Distortion',
    description: 'Distortion and saturation with multiple algorithms',
    category: 'distortion',
    icon: '🔊',
    parameters: EFFECT_PARAMETERS.distortion,
  },
  chorus: {
    type: 'chorus',
    name: 'Chorus',
    description: 'Stereo chorus for width and movement',
    category: 'modulation',
    icon: '🎵',
    parameters: EFFECT_PARAMETERS.chorus,
  },
  phaser: {
    type: 'phaser',
    name: 'Phaser',
    description: 'Multi-stage phaser for sweeping effects',
    category: 'modulation',
    icon: '🌀',
    parameters: EFFECT_PARAMETERS.phaser,
  },
  bitcrusher: {
    type: 'bitcrusher',
    name: 'Bitcrusher',
    description: 'Digital distortion with bit depth and sample rate reduction',
    category: 'distortion',
    icon: '💥',
    parameters: EFFECT_PARAMETERS.bitcrusher,
  },
  analogChorus: {
    type: 'analogChorus',
    name: 'Analog Chorus',
    description: 'BBD-based analog-modeled chorus with vintage character',
    category: 'modulation',
    icon: '🎛️',
    parameters: EFFECT_PARAMETERS.analogChorus,
  },
  convolutionReverb: {
    type: 'convolutionReverb',
    name: 'Convolution Reverb',
    description: 'High-quality reverb using impulse response convolution',
    category: 'spatial',
    icon: '🏛️',
    parameters: EFFECT_PARAMETERS.convolutionReverb,
  },
  bbdDelay: {
    type: 'bbdDelay',
    name: 'BBD Delay',
    description: 'Analog-modeled bucket brigade device delay',
    category: 'time',
    icon: '⏳',
    parameters: EFFECT_PARAMETERS.bbdDelay,
  },
  tapeDelay: {
    type: 'tapeDelay',
    name: 'Tape Delay',
    description: 'Vintage tape delay with wow/flutter and saturation',
    category: 'time',
    icon: '📼',
    parameters: EFFECT_PARAMETERS.tapeDelay,
  },
};

/**
 * Convert parameters to effect-specific format
 */
function convertParameters(effectType: EffectType, params: Record<string, number>): unknown {
  const defaults = DEFAULT_PARAMETERS[effectType];
  const converted = { ...defaults, ...params };
  const enabled = converted.enabled ?? 1;

  switch (effectType) {
    case 'reverb':
      return {
        enabled: enabled > 0.5,
        decay: converted.decay ?? 2.0,
        wet: converted.wet ?? 0.3,
        dry: converted.dry ?? 0.7,
        damping: converted.damping ?? 0.5,
        roomSize: converted.roomSize ?? 0.5,
        preDelay: converted.preDelay ?? 0.02,
      };
    case 'delay':
      return {
        enabled: enabled > 0.5,
        time: converted.time ?? 0.25,
        feedback: converted.feedback ?? 0.3,
        wet: converted.wet ?? 0.2,
        dry: converted.dry ?? 0.8,
        tempoSync: (converted.tempoSync ?? 1) > 0.5,
        syncDivision: converted.syncDivision === 1 ? '1/1' : converted.syncDivision === 2 ? '1/2' : converted.syncDivision === 4 ? '1/4' : converted.syncDivision === 8 ? '1/8' : '1/16',
        pingPong: (converted.pingPong ?? 0) > 0.5,
        stereoWidth: converted.stereoWidth ?? 1.0,
      };
    case 'distortion':
      return {
        enabled: enabled > 0.5,
        amount: converted.amount ?? 0.2,
        drive: converted.drive ?? 0.3,
        tone: converted.tone ?? 0.5,
        wet: converted.wet ?? 0.2,
        dry: converted.dry ?? 0.8,
        algorithm: (converted.algorithm ?? 0) < 0.25 ? 'soft' : (converted.algorithm ?? 0) < 0.5 ? 'hard' : (converted.algorithm ?? 0) < 0.75 ? 'tube' : 'tape',
      };
    case 'chorus':
      return {
        enabled: enabled > 0.5,
        rate: converted.rate ?? 1.0,
        depth: converted.depth ?? 0.3,
        delay: converted.delay ?? 0.01,
        feedback: converted.feedback ?? 0.2,
        wet: converted.wet ?? 0.3,
        dry: converted.dry ?? 0.7,
        stereoWidth: converted.stereoWidth ?? 0.8,
      };
    case 'phaser':
      return {
        enabled: enabled > 0.5,
        rate: converted.rate ?? 0.5,
        depth: converted.depth ?? 0.5,
        stages: Math.round(converted.stages ?? 4),
        feedback: converted.feedback ?? 0.2,
        wet: converted.wet ?? 0.3,
        dry: converted.dry ?? 0.7,
      };
    case 'bitcrusher':
      return {
        enabled: enabled > 0.5,
        bitDepth: Math.round(converted.bitDepth ?? 8),
        sampleRateReduction: converted.sampleRateReduction ?? 1,
        wet: converted.wet ?? 0.5,
        dry: converted.dry ?? 0.5,
      };
    case 'analogChorus':
      return {
        enabled: enabled > 0.5,
        rate: converted.rate ?? 1.0,
        depth: converted.depth ?? 0.3,
        delay: converted.delay ?? 0.01,
        feedback: converted.feedback ?? 0.2,
        wet: converted.wet ?? 0.3,
        dry: converted.dry ?? 0.7,
        stereoWidth: converted.stereoWidth ?? 0.8,
        bbdStages: Math.round(converted.bbdStages ?? 512),
        noiseLevel: converted.noiseLevel ?? 0.01,
      };
    case 'convolutionReverb':
      return {
        enabled: enabled > 0.5,
        decay: converted.decay ?? 2.0,
        wet: converted.wet ?? 0.3,
        dry: converted.dry ?? 0.7,
        damping: converted.damping ?? 0.5,
        roomSize: converted.roomSize ?? 0.5,
        preDelay: converted.preDelay ?? 0.02,
        impulseResponse: null,
        irLength: Math.round(converted.irLength ?? 44100),
      };
    case 'bbdDelay':
      return {
        enabled: enabled > 0.5,
        time: converted.time ?? 0.25,
        feedback: converted.feedback ?? 0.3,
        wet: converted.wet ?? 0.2,
        dry: converted.dry ?? 0.8,
        stages: Math.round(converted.stages ?? 512),
        clockRate: converted.clockRate ?? 10000,
        noiseLevel: converted.noiseLevel ?? 0.01,
      };
    case 'tapeDelay':
      return {
        enabled: enabled > 0.5,
        time: converted.time ?? 0.25,
        feedback: converted.feedback ?? 0.3,
        wet: converted.wet ?? 0.2,
        dry: converted.dry ?? 0.8,
        wowFlutter: converted.wowFlutter ?? 0.1,
        saturation: converted.saturation ?? 0.3,
        tapeSpeed: converted.tapeSpeed ?? 1.0,
      };
    default:
      return converted;
  }
}

/**
 * Effect factory functions
 */
function createReverbEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const effectParams = convertParameters('reverb', params || {}) as {
    enabled: boolean;
    decay: number;
    wet: number;
    dry: number;
    damping: number;
    roomSize: number;
    preDelay: number;
  };
  const effect = new ReverbEffect(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'reverb',
  };
}

function createDelayEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const converted = convertParameters('delay', params || {}) as {
    enabled: boolean;
    time: number;
    feedback: number;
    wet: number;
    dry: number;
    tempoSync: boolean;
    syncDivision: string;
    pingPong: boolean;
    stereoWidth: number;
  };
  const effectParams = {
    ...converted,
    syncDivision: converted.syncDivision as '1/1' | '1/2' | '1/4' | '1/8' | '1/16',
  };
  const effect = new DelayEffect(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'delay',
  };
}

function createDistortionEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const converted = convertParameters('distortion', params || {}) as {
    enabled: boolean;
    amount: number;
    drive: number;
    tone: number;
    wet: number;
    dry: number;
    algorithm: string;
  };
  const effectParams = {
    ...converted,
    algorithm: converted.algorithm as 'soft' | 'hard' | 'tube' | 'tape',
  };
  const effect = new DistortionEffect(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'distortion',
  };
}

function createChorusEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const effectParams = convertParameters('chorus', params || {}) as {
    enabled: boolean;
    rate: number;
    depth: number;
    delay: number;
    feedback: number;
    wet: number;
    dry: number;
    stereoWidth: number;
  };
  const effect = new ChorusEffect(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'chorus',
  };
}

function createPhaserEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const effectParams = convertParameters('phaser', params || {}) as {
    enabled: boolean;
    rate: number;
    depth: number;
    stages: number;
    feedback: number;
    wet: number;
    dry: number;
  };
  const effect = new PhaserEffect(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'phaser',
  };
}

function createBitcrusherEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const effectParams = convertParameters('bitcrusher', params || {}) as {
    enabled: boolean;
    bitDepth: number;
    sampleRateReduction: number;
    wet: number;
    dry: number;
  };
  const effect = new Bitcrusher(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'bitcrusher',
  };
}

function createAnalogChorusEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const effectParams = convertParameters('analogChorus', params || {}) as {
    enabled: boolean;
    rate: number;
    depth: number;
    delay: number;
    feedback: number;
    wet: number;
    dry: number;
    stereoWidth: number;
    bbdStages: number;
    noiseLevel: number;
  };
  const effect = new AnalogChorus(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'analogChorus',
  };
}

function createConvolutionReverbEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const effectParams = convertParameters('convolutionReverb', params || {}) as {
    enabled: boolean;
    decay: number;
    wet: number;
    dry: number;
    damping: number;
    roomSize: number;
    preDelay: number;
    impulseResponse: Float32Array | null;
    irLength: number;
  };
  const effect = new ConvolutionReverb(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'convolutionReverb',
  };
}

function createBBDDelayEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const converted = convertParameters('bbdDelay', params || {}) as {
    enabled: boolean;
    time: number;
    feedback: number;
    wet: number;
    dry: number;
    stages: number;
    clockRate: number;
    noiseLevel: number;
  };
  const effectParams = {
    enabled: converted.enabled,
    time: converted.time,
    tempoSync: false,
    syncDivision: '1/4' as const,
    feedback: converted.feedback,
    wet: converted.wet,
    dry: converted.dry,
    pingPong: false,
    stereoWidth: 1.0,
    stages: converted.stages,
    clockRate: converted.clockRate,
    noiseLevel: converted.noiseLevel,
  };
  const effect = new BBDDelay(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'bbdDelay',
  };
}

function createTapeDelayEffect(audioContext: AudioContext, params?: Record<string, number>): Effect {
  const converted = convertParameters('tapeDelay', params || {}) as {
    enabled: boolean;
    time: number;
    feedback: number;
    wet: number;
    dry: number;
    wowFlutter: number;
    saturation: number;
    tapeSpeed: number;
  };
  const effectParams = {
    enabled: converted.enabled,
    time: converted.time,
    tempoSync: false,
    syncDivision: '1/4' as const,
    feedback: converted.feedback,
    wet: converted.wet,
    dry: converted.dry,
    pingPong: false,
    stereoWidth: 1.0,
    wowFlutter: converted.wowFlutter,
    saturation: converted.saturation,
    tapeSpeed: converted.tapeSpeed,
  };
  const effect = new TapeDelay(audioContext, effectParams);
  return {
    inputNode: effect.getInputNode(),
    outputNode: effect.getOutputNode(),
    cleanup: () => effect.dispose(),
    getEffectType: () => 'tapeDelay',
  };
}

/**
 * Effect factory map
 */
const EFFECT_FACTORIES: Record<EffectType, (audioContext: AudioContext, params?: Record<string, number>) => Effect> = {
  reverb: createReverbEffect,
  delay: createDelayEffect,
  distortion: createDistortionEffect,
  chorus: createChorusEffect,
  phaser: createPhaserEffect,
  bitcrusher: createBitcrusherEffect,
  analogChorus: createAnalogChorusEffect,
  convolutionReverb: createConvolutionReverbEffect,
  bbdDelay: createBBDDelayEffect,
  tapeDelay: createTapeDelayEffect,
};

/**
 * Service for managing effect registry
 */
export class EffectRegistry {
  private metadata: Map<EffectType, EffectMetadata> = new Map();

  /**
   * Initialize registry
   */
  constructor() {
    this.initialize();
  }

  /**
   * Initialize registry with all effects
   */
  private initialize(): void {
    Object.entries(EFFECT_METADATA).forEach(([type, metadata]) => {
      const effectType = type as EffectType;
      const factory = EFFECT_FACTORIES[effectType];

      this.metadata.set(effectType, {
        ...metadata,
        factory,
      });
    });
  }

  /**
   * Get all registered effects
   * @returns Array of effect metadata
   */
  getAllEffects(): EffectMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get effect metadata by type
   * @param effectType - Effect type
   * @returns Effect metadata or null
   */
  getEffectMetadata(effectType: EffectType): EffectMetadata | null {
    return this.metadata.get(effectType) || null;
  }

  /**
   * Get effects by category
   * @param category - Effect category
   * @returns Array of effect metadata
   */
  getEffectsByCategory(category: EffectCategory): EffectMetadata[] {
    return Array.from(this.metadata.values()).filter((meta) => meta.category === category);
  }

  /**
   * Get effect categories
   * @returns Array of unique categories
   */
  getCategories(): EffectCategory[] {
    const categories = new Set<EffectCategory>();
    this.metadata.forEach((meta) => {
      categories.add(meta.category);
    });
    return Array.from(categories);
  }

  /**
   * Create effect instance
   * @param audioContext - Web Audio API AudioContext
   * @param effectType - Effect type
   * @param params - Effect parameters
   * @returns Effect instance
   * @throws AudioContextError if audioContext is invalid
   */
  createEffect(
    audioContext: AudioContext,
    effectType: EffectType,
    params?: Record<string, number>
  ): Effect {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    const metadata = this.metadata.get(effectType);
    if (!metadata) {
      throw new Error(`Effect type '${effectType}' not found in registry`);
    }

    try {
      const effect = metadata.factory(audioContext, params);
      return effect;
    } catch (error) {
      logger.error('EffectRegistry: Error creating effect', { error, effectType });
      throw new Error(`Failed to create effect '${effectType}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default parameters for effect type
   * @param effectType - Effect type
   * @returns Default parameters
   */
  getDefaultParameters(effectType: EffectType): Record<string, number> {
    return { ...DEFAULT_PARAMETERS[effectType] };
  }

  /**
   * Get parameter definitions for effect type
   * @param effectType - Effect type
   * @returns Parameter definitions
   */
  getParameters(effectType: EffectType): EffectParameter[] {
    return [...EFFECT_PARAMETERS[effectType]];
  }

  /**
   * Search effects by name or description
   * @param query - Search query
   * @returns Array of matching effect metadata
   */
  searchEffects(query: string): EffectMetadata[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.metadata.values()).filter(
      (meta) =>
        meta.name.toLowerCase().includes(lowerQuery) ||
        meta.description.toLowerCase().includes(lowerQuery) ||
        meta.category.toLowerCase().includes(lowerQuery)
    );
  }
}

/**
 * Singleton instance
 */
export const effectRegistry = new EffectRegistry();

