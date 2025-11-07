/**
 * OscillatorModule - Base oscillator module
 * Provides oscillator functionality with multiple waveforms
 * @module audio/synthesizer/oscillators/OscillatorModule
 */

import type { OscillatorConfig } from '../../../types/synthesizer.types';
import { generateWavetable } from './WaveformGenerator';
import { ModulationTarget } from '../modulation/ModulationTarget';
import type { ModulationDestination } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';
import { Oversampler } from './Oversampler';
import { BandLimitedOscillator } from './BandLimitedOscillator';

/**
 * Convert MIDI note to frequency
 */
function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Convert cents to frequency multiplier
 */
function centsToMultiplier(cents: number): number {
  return Math.pow(2, cents / 1200);
}

/**
 * Oscillator module implementation
 */
export class OscillatorModule extends ModulationTarget {
  private audioContext: AudioContext;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode;
  private config: OscillatorConfig;
  private destinationType: ModulationDestination;
  private baseFrequency: number = 440;
  private wavetable: Float32Array | null = null;
  private oversampler: Oversampler | null = null;
  private bandLimitedOscillator: BandLimitedOscillator | null = null;

  /**
   * Create a new oscillator module
   */
  constructor(
    audioContext: AudioContext,
    config: OscillatorConfig,
    destinationType: ModulationDestination
  ) {
    super();
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('OscillatorModule: Invalid AudioContext');
    }
    this.audioContext = audioContext;
    this.config = {
      oversampling: 1,
      usePolyBLEP: false,
      useBandLimited: false,
      ...config,
    };
    this.destinationType = destinationType;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = this.config.gain;

    // Initialize oversampler if needed
    if (this.config.oversampling && this.config.oversampling > 1) {
      this.oversampler = new Oversampler(
        audioContext.sampleRate,
        this.config.oversampling,
        128
      );
    }

    // Initialize band-limited oscillator if needed
    if (this.config.useBandLimited || this.config.usePolyBLEP) {
      this.bandLimitedOscillator = new BandLimitedOscillator(audioContext.sampleRate);
      this.bandLimitedOscillator.setFrequency(this.baseFrequency);
    }

    // Generate wavetable if needed
    if (this.config.waveform === 'wavetable') {
      this.wavetable = generateWavetable(
        'sine',
        256,
        this.config.useBandLimited ?? false
      );
    }
  }

  /**
   * Update oscillator configuration
   */
  updateConfig(config: Partial<OscillatorConfig>): void {
    this.config = { ...this.config, ...config };

    // Update oversampler if factor changed
    if (config.oversampling !== undefined) {
      if (config.oversampling > 1) {
        if (!this.oversampler) {
          this.oversampler = new Oversampler(
            this.audioContext.sampleRate,
            config.oversampling,
            128
          );
        } else {
          this.oversampler.setFactor(config.oversampling);
        }
      } else {
        this.oversampler = null;
      }
    }

    // Update band-limited oscillator
    if (config.useBandLimited !== undefined || config.usePolyBLEP !== undefined) {
      if (this.config.useBandLimited || this.config.usePolyBLEP) {
        if (!this.bandLimitedOscillator) {
          this.bandLimitedOscillator = new BandLimitedOscillator(
            this.audioContext.sampleRate
          );
          this.bandLimitedOscillator.setFrequency(this.baseFrequency);
        }
      }
    }

    if (this.oscillator) {
      // Update oscillator properties
      if (config.waveform && config.waveform !== 'wavetable') {
        this.oscillator.type = config.waveform as OscillatorType;
      }
      if (config.gain !== undefined) {
        this.gainNode.gain.value = config.gain;
      }
    }

    // Regenerate wavetable if needed
    if (config.waveform === 'wavetable') {
      this.wavetable = generateWavetable(
        'sine',
        256,
        this.config.useBandLimited ?? false
      );
    }
  }

  /**
   * Set base frequency
   */
  setFrequency(frequency: number): void {
    this.baseFrequency = frequency;

    // Update band-limited oscillator if active
    if (this.bandLimitedOscillator) {
      const octaveMultiplier = Math.pow(2, this.config.octave);
      const semitoneMultiplier = Math.pow(2, this.config.semitone / 12);
      const detuneMultiplier = centsToMultiplier(this.config.detune);
      const baseFreq = frequency * octaveMultiplier * semitoneMultiplier * detuneMultiplier;
      this.bandLimitedOscillator.setFrequency(baseFreq);
    }

    // Apply octave and semitone
    const octaveMultiplier = Math.pow(2, this.config.octave);
    const semitoneMultiplier = Math.pow(2, this.config.semitone / 12);
    const detuneMultiplier = centsToMultiplier(this.config.detune);

    let finalFrequency = frequency * octaveMultiplier * semitoneMultiplier * detuneMultiplier;

    // Apply modulation
    finalFrequency *= centsToMultiplier(this.currentValue * 100);

    if (this.oscillator) {
      this.oscillator.frequency.value = finalFrequency;
    }
  }

  /**
   * Set MIDI note
   */
  setNote(note: number): void {
    const frequency = midiNoteToFrequency(note);
    this.setFrequency(frequency);
  }

  /**
   * Apply modulation to oscillator
   */
  applyModulation(value: number, depth: number): void {
    this.currentValue = value * depth;

    if (this.oscillator) {
      const modulationMultiplier = centsToMultiplier(this.currentValue * 100);
      const octaveMultiplier = Math.pow(2, this.config.octave);
      const semitoneMultiplier = Math.pow(2, this.config.semitone / 12);
      const detuneMultiplier = centsToMultiplier(this.config.detune);

      const finalFrequency =
        this.baseFrequency *
        octaveMultiplier *
        semitoneMultiplier *
        detuneMultiplier *
        modulationMultiplier;

      this.oscillator.frequency.value = finalFrequency;
    }
  }

  /**
   * Get destination type
   */
  getDestinationType(): ModulationDestination {
    return this.destinationType;
  }

  /**
   * Start oscillator
   */
  start(time?: number): void {
    if (this.oscillator) {
      return; // Already started
    }

    const startTime = time ?? this.audioContext.currentTime;

    try {
      this.oscillator = this.audioContext.createOscillator();

      if (this.config.waveform === 'wavetable' && this.wavetable) {
        // Use periodic wave for wavetable
        const periodicWave = this.audioContext.createPeriodicWave(
          this.wavetable,
          new Float32Array(this.wavetable.length)
        );
        this.oscillator.setPeriodicWave(periodicWave);
      } else if (this.config.waveform !== 'noise') {
        this.oscillator.type = this.config.waveform as OscillatorType;
      }

      // Set initial frequency
      const octaveMultiplier = Math.pow(2, this.config.octave);
      const semitoneMultiplier = Math.pow(2, this.config.semitone / 12);
      const detuneMultiplier = centsToMultiplier(this.config.detune);
      const initialFrequency =
        this.baseFrequency * octaveMultiplier * semitoneMultiplier * detuneMultiplier;

      this.oscillator.frequency.value = initialFrequency;

      // Set phase offset
      if (this.config.phase > 0) {
        this.oscillator.frequency.setValueAtTime(
          initialFrequency,
          startTime - this.config.phase / initialFrequency
        );
      }

      this.oscillator.connect(this.gainNode);
      this.oscillator.start(startTime);
    } catch (error) {
      logger.error('OscillatorModule: Error starting oscillator', { error });
    }
  }

  /**
   * Stop oscillator
   */
  stop(time?: number): void {
    if (!this.oscillator) {
      return;
    }

    const stopTime = time ?? this.audioContext.currentTime;

    try {
      this.oscillator.stop(stopTime);
      this.oscillator.disconnect();
      this.oscillator = null;
    } catch (error) {
      logger.error('OscillatorModule: Error stopping oscillator', { error });
      this.oscillator = null;
    }
  }

  /**
   * Get gain node for audio routing
   */
  getGainNode(): GainNode {
    return this.gainNode;
  }

  /**
   * Get oscillator node
   */
  getOscillator(): OscillatorNode | null {
    return this.oscillator;
  }

  /**
   * Get configuration
   */
  getConfig(): OscillatorConfig {
    return { ...this.config };
  }
}

