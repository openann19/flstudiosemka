/**
 * EnvelopeFollower - Envelope follower for sidechain-style modulation
 * Tracks the amplitude envelope of an audio signal
 * @module audio/synthesizer/modulation/EnvelopeFollower
 */

import { ModulationSource } from './ModulationSource';
import type { ModulationSource as ModulationSourceType } from '../../../types/synthesizer.types';

/**
 * Envelope follower configuration
 */
export interface EnvelopeFollowerConfig {
  attack: number; // Attack time in seconds
  release: number; // Release time in seconds
  sensitivity: number; // Sensitivity (0 to 1)
}

/**
 * Envelope follower modulation source
 */
export class EnvelopeFollower extends ModulationSource {
  private config: EnvelopeFollowerConfig;
  private sampleRate: number;
  private envelope: number = 0;
  private attackCoeff: number = 0;
  private releaseCoeff: number = 0;

  /**
   * Create a new envelope follower
   */
  constructor(sampleRate: number, config: Partial<EnvelopeFollowerConfig>) {
    super();
    this.sampleRate = sampleRate;
    this.config = {
      attack: 0.01,
      release: 0.1,
      sensitivity: 1.0,
      ...config,
    };
    this.updateCoefficients();
  }

  /**
   * Update attack and release coefficients
   */
  private updateCoefficients(): void {
    this.attackCoeff = Math.exp(-1 / (this.config.attack * this.sampleRate));
    this.releaseCoeff = Math.exp(-1 / (this.config.release * this.sampleRate));
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<EnvelopeFollowerConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateCoefficients();
  }

  /**
   * Process audio sample and update envelope
   * @param input - Input audio sample
   */
  process(input: number): void {
    const inputLevel = Math.abs(input) * this.config.sensitivity;

    if (inputLevel > this.envelope) {
      // Attack
      this.envelope = inputLevel + (this.envelope - inputLevel) * this.attackCoeff;
    } else {
      // Release
      this.envelope = inputLevel + (this.envelope - inputLevel) * this.releaseCoeff;
    }
  }

  /**
   * Get current modulation value
   */
  getValue(): number {
    return this.generate();
  }

  /**
   * Generate modulation value
   */
  generate(): number {
    return Math.max(-1, Math.min(1, this.envelope * 2 - 1));
  }

  /**
   * Reset envelope
   */
  reset(): void {
    this.envelope = 0;
  }

  /**
   * Get source type
   */
  getSourceType(): ModulationSourceType {
    return 'env1' as ModulationSourceType;
  }

  /**
   * Get current envelope value
   */
  getEnvelope(): number {
    return this.envelope;
  }
}

