/**
 * Compressor - Audio dynamics compressor
 * Controls dynamic range with threshold, ratio, attack, and release
 * @module effects/Compressor
 */

import {
  AudioContextError,
  InvalidParameterError,
  ValidationUtils,
} from '../utils/errors';

/**
 * Compressor parameters
 */
export interface CompressorParams {
  threshold?: number;
  ratio?: number;
  attack?: number;
  release?: number;
  knee?: number;
}

/**
 * Compressor settings structure
 */
export interface CompressorSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
}

/**
 * Audio dynamics compressor
 */
export class Compressor {
  private compressor: DynamicsCompressorNode;

  public readonly inputNode: DynamicsCompressorNode;

  public readonly outputNode: DynamicsCompressorNode;

  /**
   * Create a new Compressor instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    // Use DynamicsCompressorNode
    this.compressor = audioContext.createDynamicsCompressor();

    // Default settings
    this.compressor.threshold.value = -24; // dB
    this.compressor.knee.value = 30; // dB
    this.compressor.ratio.value = 12; // :1
    this.compressor.attack.value = 0.003; // seconds
    this.compressor.release.value = 0.25; // seconds

    this.inputNode = this.compressor;
    this.outputNode = this.compressor;
  }

  /**
   * Set threshold
   * @param threshold - Threshold in dB (-60 to 0)
   * @throws InvalidParameterError if threshold is invalid
   */
  setThreshold(threshold: number): void {
    try {
      if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
        throw new InvalidParameterError('threshold', threshold, 'number');
      }
      if (threshold < -60 || threshold > 0) {
        throw new InvalidParameterError('threshold', threshold, 'number between -60 and 0');
      }

      this.compressor.threshold.value = threshold;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set ratio
   * @param ratio - Compression ratio (1-20)
   * @throws InvalidParameterError if ratio is invalid
   */
  setRatio(ratio: number): void {
    try {
      if (typeof ratio !== 'number' || Number.isNaN(ratio)) {
        throw new InvalidParameterError('ratio', ratio, 'number');
      }
      if (ratio < 1 || ratio > 20) {
        throw new InvalidParameterError('ratio', ratio, 'number between 1 and 20');
      }

      this.compressor.ratio.value = ratio;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set attack time
   * @param attack - Attack time in seconds (0.0001-1)
   * @throws InvalidParameterError if attack is invalid
   */
  setAttack(attack: number): void {
    try {
      ValidationUtils.validateTime(attack, 'attack');
      if (attack < 0.0001 || attack > 1) {
        throw new InvalidParameterError('attack', attack, 'number between 0.0001 and 1');
      }

      this.compressor.attack.value = attack;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set release time
   * @param release - Release time in seconds (0.0001-1)
   * @throws InvalidParameterError if release is invalid
   */
  setRelease(release: number): void {
    try {
      ValidationUtils.validateTime(release, 'release');
      if (release < 0.0001 || release > 1) {
        throw new InvalidParameterError('release', release, 'number between 0.0001 and 1');
      }

      this.compressor.release.value = release;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set knee
   * @param knee - Knee width in dB (0-40)
   * @throws InvalidParameterError if knee is invalid
   */
  setKnee(knee: number): void {
    try {
      if (typeof knee !== 'number' || Number.isNaN(knee)) {
        throw new InvalidParameterError('knee', knee, 'number');
      }
      if (knee < 0 || knee > 40) {
        throw new InvalidParameterError('knee', knee, 'number between 0 and 40');
      }

      this.compressor.knee.value = knee;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set all parameters at once
   * @param params - Compressor parameters
   */
  setParams(params: CompressorParams): void {
    if (params.threshold !== undefined) this.setThreshold(params.threshold);
    if (params.ratio !== undefined) this.setRatio(params.ratio);
    if (params.attack !== undefined) this.setAttack(params.attack);
    if (params.release !== undefined) this.setRelease(params.release);
    if (params.knee !== undefined) this.setKnee(params.knee);
  }

  /**
   * Get current settings
   * @returns Current compressor settings
   */
  getSettings(): CompressorSettings {
    return {
      threshold: this.compressor.threshold.value,
      ratio: this.compressor.ratio.value,
      attack: this.compressor.attack.value,
      release: this.compressor.release.value,
      knee: this.compressor.knee.value,
    };
  }

  /**
   * Get reduction value (read-only)
   * @returns Current reduction in dB
   */
  getReduction(): number {
    return this.compressor.reduction;
  }

  /**
   * Reset to default settings
   */
  reset(): void {
    this.setParams({
      threshold: -24,
      ratio: 12,
      attack: 0.003,
      release: 0.25,
      knee: 30,
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.compressor.disconnect();
    } catch {
      // Already disconnected - ignore
    }
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.Compressor = Compressor;
}

