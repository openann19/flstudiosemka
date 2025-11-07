/**
 * PhaseDistortion - Phase distortion synthesis
 * Distorts the phase of a waveform to create new timbres
 * @module audio/synthesizer/oscillators/PhaseDistortion
 */

import type { OscillatorWaveform } from '../../../types/synthesizer.types';
import { generateWaveform } from './WaveformGenerator';

/**
 * Phase distortion curve type
 */
export type PhaseDistortionCurve = 'linear' | 'exponential' | 'sine' | 'custom';

/**
 * Phase distortion configuration
 */
export interface PhaseDistortionConfig {
  amount: number; // 0 to 1, amount of distortion
  curve: PhaseDistortionCurve;
  customCurve?: (phase: number) => number; // Custom distortion function
}

/**
 * Phase distortion synthesizer
 */
export class PhaseDistortion {
  private phase: number = 0;
  private sampleRate: number;
  private frequency: number = 440;
  private phaseIncrement: number = 0;
  private config: PhaseDistortionConfig;

  /**
   * Create a new phase distortion synthesizer
   * @param sampleRate - Audio sample rate
   * @param config - Phase distortion configuration
   */
  constructor(sampleRate: number, config: PhaseDistortionConfig) {
    this.sampleRate = sampleRate;
    this.config = { ...config };
    this.updatePhaseIncrement();
  }

  /**
   * Set frequency
   */
  setFrequency(frequency: number): void {
    this.frequency = Math.max(20, Math.min(20000, frequency));
    this.updatePhaseIncrement();
  }

  /**
   * Set phase distortion configuration
   */
  setConfig(config: Partial<PhaseDistortionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update phase increment
   */
  private updatePhaseIncrement(): void {
    this.phaseIncrement = this.frequency / this.sampleRate;
  }

  /**
   * Apply phase distortion
   */
  private distortPhase(phase: number): number {
    const normalizedPhase = phase % 1;
    const amount = Math.max(0, Math.min(1, this.config.amount));

    if (amount === 0) {
      return normalizedPhase;
    }

    let distortedPhase: number;

    switch (this.config.curve) {
      case 'linear': {
        // Linear distortion: phase * (1 + amount * (1 - phase))
        distortedPhase = normalizedPhase * (1 + amount * (1 - normalizedPhase));
        break;
      }
      case 'exponential': {
        // Exponential distortion
        distortedPhase = Math.pow(normalizedPhase, 1 / (1 + amount));
        break;
      }
      case 'sine': {
        // Sine-based distortion
        distortedPhase = normalizedPhase + amount * Math.sin(normalizedPhase * Math.PI * 2) * 0.1;
        break;
      }
      case 'custom': {
        if (this.config.customCurve) {
          distortedPhase = this.config.customCurve(normalizedPhase);
        } else {
          distortedPhase = normalizedPhase;
        }
        break;
      }
      default:
        distortedPhase = normalizedPhase;
    }

    // Blend between original and distorted
    return normalizedPhase * (1 - amount) + distortedPhase * amount;
  }

  /**
   * Generate next sample
   * @param waveform - Base waveform type
   * @param pulseWidth - Pulse width (for pulse waveform)
   * @returns Next sample value (-1 to 1)
   */
  generate(waveform: OscillatorWaveform, pulseWidth: number = 0.5): number {
    // Distort phase
    const distortedPhase = this.distortPhase(this.phase);

    // Generate waveform with distorted phase
    const value = generateWaveform(distortedPhase, waveform, pulseWidth);

    // Advance phase
    this.phase += this.phaseIncrement;
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
    }

    return value;
  }

  /**
   * Reset phase
   */
  reset(): void {
    this.phase = 0;
  }
}

