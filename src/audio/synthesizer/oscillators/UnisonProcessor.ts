/**
 * UnisonProcessor - Voice stacking and detuning
 * Creates multiple detuned voices for rich, layered sounds
 * @module audio/synthesizer/oscillators/UnisonProcessor
 */

import type { UnisonConfig } from '../../../types/synthesizer.types';

/**
 * Unison processor for voice stacking
 */
export class UnisonProcessor {
  private config: UnisonConfig;
  private detuneValues: number[] = [];

  /**
   * Create a new unison processor
   */
  constructor(config: UnisonConfig) {
    this.config = { ...config };
    this.generateDetuneValues();
  }

  /**
   * Update unison configuration
   */
  updateConfig(config: Partial<UnisonConfig>): void {
    this.config = { ...this.config, ...config };
    this.generateDetuneValues();
  }

  /**
   * Generate detune values for each voice
   */
  private generateDetuneValues(): void {
    if (!this.config.enabled || this.config.voices < 2) {
      this.detuneValues = [0];
      return;
    }

    const voices = Math.max(2, Math.min(8, this.config.voices));
    this.detuneValues = [];

    // Generate symmetric detune values
    const center = voices % 2 === 0 ? voices / 2 - 0.5 : Math.floor(voices / 2);
    const detuneRange = this.config.detune;

    for (let i = 0; i < voices; i += 1) {
      const offset = (i - center) / center;
      const detune = offset * detuneRange;
      this.detuneValues.push(detune);
    }
  }

  /**
   * Get detune value for voice index
   */
  getDetuneForVoice(index: number): number {
    if (!this.config.enabled || this.detuneValues.length === 0) {
      return 0;
    }
    const clampedIndex = Math.max(0, Math.min(this.detuneValues.length - 1, index));
    return this.detuneValues[clampedIndex] ?? 0;
  }

  /**
   * Get pan value for voice index (for stereo spread)
   */
  getPanForVoice(index: number): number {
    if (!this.config.enabled || this.config.voices < 2) {
      return 0;
    }

    const voices = Math.max(2, Math.min(8, this.config.voices));
    const center = voices % 2 === 0 ? voices / 2 - 0.5 : Math.floor(voices / 2);
    const offset = (index - center) / center;
    return offset * this.config.spread;
  }

  /**
   * Get gain for voice index (for blending)
   */
  getGainForVoice(_index: number): number {
    if (!this.config.enabled) {
      return 1;
    }

    const voices = Math.max(2, Math.min(8, this.config.voices));
    const baseGain = 1 / Math.sqrt(voices); // Normalize for multiple voices
    return baseGain * (1 + this.config.blend * 0.5);
  }

  /**
   * Get number of voices
   */
  getVoiceCount(): number {
    if (!this.config.enabled) {
      return 1;
    }
    return Math.max(2, Math.min(8, this.config.voices));
  }

  /**
   * Get configuration
   */
  getConfig(): UnisonConfig {
    return { ...this.config };
  }
}

