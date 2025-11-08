/**
 * DynamicEQProcessor - Frequency-specific dynamic processing
 * Implements PRO Q 4 spectral dynamics: compression/expansion per band
 * @module effects/DynamicEQProcessor
 */

import {
  AudioContextError,
  InvalidParameterError,
} from '../utils/errors';

/**
 * Dynamic processing mode
 */
export enum DynamicMode {
  Off = 'off',
  Compressor = 'compressor',
  Expander = 'expander',
}

/**
 * Dynamic EQ band configuration
 */
export interface DynamicBandConfig {
  bandId: string;
  mode: DynamicMode;
  threshold: number; // dB
  ratio: number; // Compression/expansion ratio
  attack: number; // seconds
  release: number; // seconds
  gain: number; // Makeup gain in dB
  enabled: boolean;
}

/**
 * Frequency-specific dynamic processor
 */
export class DynamicEQProcessor {
  private audioContext: AudioContext;

  private analyser: AnalyserNode;

  private compressor: DynamicsCompressorNode;

  private expander: DynamicsCompressorNode;

  private attackGain: GainNode;

  private releaseGain: GainNode;

  private makeupGain: GainNode;

  private config: DynamicBandConfig;

  public readonly inputNode: GainNode;

  public readonly outputNode: GainNode;

  /**
   * Create a new dynamic EQ processor
   * @param audioContext - Web Audio API AudioContext
   * @param config - Dynamic band configuration
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext, config: DynamicBandConfig) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.config = { ...config };

    // Validate configuration
    this.validateConfig(config);

    // Create analyser for frequency analysis
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Create compressor and expander nodes
    this.compressor = audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = config.threshold;
    this.compressor.ratio.value = config.mode === DynamicMode.Compressor ? config.ratio : 1;
    this.compressor.attack.value = config.attack;
    this.compressor.release.value = config.release;
    this.compressor.knee.value = 2.5;

    this.expander = audioContext.createDynamicsCompressor();
    this.expander.threshold.value = config.threshold;
    this.expander.ratio.value = config.mode === DynamicMode.Expander ? 1 / config.ratio : 1;
    this.expander.attack.value = config.attack;
    this.expander.release.value = config.release;
    this.expander.knee.value = 2.5;

    // Create attack/release envelope followers
    this.attackGain = audioContext.createGain();
    this.releaseGain = audioContext.createGain();

    // Create makeup gain
    this.makeupGain = audioContext.createGain();
    this.makeupGain.gain.value = this.dbToLinear(config.gain);

    // Input/output nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = this.makeupGain;

    // Connect based on mode
    this.updateRouting();

    // Apply initial settings
    this.setEnabled(config.enabled);
  }

  /**
   * Validate configuration
   * @param config - Configuration to validate
   * @throws InvalidParameterError if invalid
   */
  private validateConfig(config: DynamicBandConfig): void {
    // Validate threshold (-60dB to 0dB)
    if (typeof config.threshold !== 'number' || Number.isNaN(config.threshold)) {
      throw new InvalidParameterError('threshold', config.threshold, 'number');
    }
    if (config.threshold < -60 || config.threshold > 0) {
      throw new InvalidParameterError(
        'threshold',
        config.threshold,
        'number between -60 and 0',
        { min: -60, max: 0 }
      );
    }

    // Validate ratio (1.0 to 20.0)
    if (typeof config.ratio !== 'number' || Number.isNaN(config.ratio)) {
      throw new InvalidParameterError('ratio', config.ratio, 'number');
    }
    if (config.ratio < 1 || config.ratio > 20) {
      throw new InvalidParameterError(
        'ratio',
        config.ratio,
        'number between 1 and 20',
        { min: 1, max: 20 }
      );
    }

    // Validate attack (0.0001 to 1.0 seconds)
    if (typeof config.attack !== 'number' || Number.isNaN(config.attack)) {
      throw new InvalidParameterError('attack', config.attack, 'number');
    }
    if (config.attack < 0.0001 || config.attack > 1.0) {
      throw new InvalidParameterError(
        'attack',
        config.attack,
        'number between 0.0001 and 1.0',
        { min: 0.0001, max: 1.0 }
      );
    }

    // Validate release (0.01 to 5.0 seconds)
    if (typeof config.release !== 'number' || Number.isNaN(config.release)) {
      throw new InvalidParameterError('release', config.release, 'number');
    }
    if (config.release < 0.01 || config.release > 5.0) {
      throw new InvalidParameterError(
        'release',
        config.release,
        'number between 0.01 and 5.0',
        { min: 0.01, max: 5.0 }
      );
    }

    // Validate gain (-60dB to +60dB)
    if (typeof config.gain !== 'number' || Number.isNaN(config.gain)) {
      throw new InvalidParameterError('gain', config.gain, 'number');
    }
    if (config.gain < -60 || config.gain > 60) {
      throw new InvalidParameterError(
        'gain',
        config.gain,
        'number between -60 and 60',
        { min: -60, max: 60 }
      );
    }
  }

  /**
   * Update audio routing based on mode
   */
  private updateRouting(): void {
    // Disconnect all
    try {
      this.inputNode.disconnect();
      this.compressor.disconnect();
      this.expander.disconnect();
      this.attackGain.disconnect();
      this.releaseGain.disconnect();
    } catch {
      // Ignore disconnection errors
    }

    // Connect input to analyser (for monitoring)
    this.inputNode.connect(this.analyser);

    // Route based on mode
    switch (this.config.mode) {
      case DynamicMode.Off:
        // Direct pass-through
        this.inputNode.connect(this.makeupGain);
        break;

      case DynamicMode.Compressor:
        // Input -> Compressor -> Makeup Gain
        this.inputNode.connect(this.compressor);
        this.compressor.connect(this.makeupGain);
        break;

      case DynamicMode.Expander:
        // Input -> Expander -> Makeup Gain
        this.inputNode.connect(this.expander);
        this.expander.connect(this.makeupGain);
        break;

      default:
        this.inputNode.connect(this.makeupGain);
    }
  }

  /**
   * Convert dB to linear gain
   * @param db - Decibels
   * @returns Linear gain value
   */
  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Get current configuration
   * @returns Current dynamic configuration
   */
  getConfig(): DynamicBandConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param updates - Partial configuration updates
   * @throws InvalidParameterError if updates are invalid
   */
  updateConfig(updates: Partial<DynamicBandConfig>): void {
    const newConfig = { ...this.config, ...updates };
    this.validateConfig(newConfig);
    this.config = newConfig;

    // Update compressor/expander parameters
    this.compressor.threshold.value = this.config.threshold;
    this.compressor.ratio.value = this.config.mode === DynamicMode.Compressor ? this.config.ratio : 1;
    this.compressor.attack.value = this.config.attack;
    this.compressor.release.value = this.config.release;

    this.expander.threshold.value = this.config.threshold;
    this.expander.ratio.value = this.config.mode === DynamicMode.Expander ? 1 / this.config.ratio : 1;
    this.expander.attack.value = this.config.attack;
    this.expander.release.value = this.config.release;

    // Update makeup gain
    this.makeupGain.gain.value = this.dbToLinear(this.config.gain);

    // Update routing if mode changed
    if (updates.mode !== undefined) {
      this.updateRouting();
    }

    // Update enabled state
    if (updates.enabled !== undefined) {
      this.setEnabled(updates.enabled);
    }
  }

  /**
   * Set dynamic mode
   * @param mode - Dynamic mode
   * @throws InvalidParameterError if mode is invalid
   */
  setMode(mode: DynamicMode): void {
    if (!Object.values(DynamicMode).includes(mode)) {
      throw new InvalidParameterError(
        'mode',
        mode,
        `one of: ${Object.values(DynamicMode).join(', ')}`
      );
    }
    this.config.mode = mode;
    this.updateRouting();
  }

  /**
   * Set threshold
   * @param threshold - Threshold in dB (-60 to 0)
   * @throws InvalidParameterError if invalid
   */
  setThreshold(threshold: number): void {
    if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
      throw new InvalidParameterError('threshold', threshold, 'number');
    }
    if (threshold < -60 || threshold > 0) {
      throw new InvalidParameterError(
        'threshold',
        threshold,
        'number between -60 and 0',
        { min: -60, max: 0 }
      );
    }
    this.config.threshold = threshold;
    this.compressor.threshold.value = threshold;
    this.expander.threshold.value = threshold;
  }

  /**
   * Set ratio
   * @param ratio - Ratio (1.0-20.0)
   * @throws InvalidParameterError if invalid
   */
  setRatio(ratio: number): void {
    if (typeof ratio !== 'number' || Number.isNaN(ratio)) {
      throw new InvalidParameterError('ratio', ratio, 'number');
    }
    if (ratio < 1 || ratio > 20) {
      throw new InvalidParameterError(
        'ratio',
        ratio,
        'number between 1 and 20',
        { min: 1, max: 20 }
      );
    }
    this.config.ratio = ratio;
    this.compressor.ratio.value = this.config.mode === DynamicMode.Compressor ? ratio : 1;
    this.expander.ratio.value = this.config.mode === DynamicMode.Expander ? 1 / ratio : 1;
  }

  /**
   * Set attack time
   * @param attack - Attack in seconds (0.0001-1.0)
   * @throws InvalidParameterError if invalid
   */
  setAttack(attack: number): void {
    if (typeof attack !== 'number' || Number.isNaN(attack)) {
      throw new InvalidParameterError('attack', attack, 'number');
    }
    if (attack < 0.0001 || attack > 1.0) {
      throw new InvalidParameterError(
        'attack',
        attack,
        'number between 0.0001 and 1.0',
        { min: 0.0001, max: 1.0 }
      );
    }
    this.config.attack = attack;
    this.compressor.attack.value = attack;
    this.expander.attack.value = attack;
  }

  /**
   * Set release time
   * @param release - Release in seconds (0.01-5.0)
   * @throws InvalidParameterError if invalid
   */
  setRelease(release: number): void {
    if (typeof release !== 'number' || Number.isNaN(release)) {
      throw new InvalidParameterError('release', release, 'number');
    }
    if (release < 0.01 || release > 5.0) {
      throw new InvalidParameterError(
        'release',
        release,
        'number between 0.01 and 5.0',
        { min: 0.01, max: 5.0 }
      );
    }
    this.config.release = release;
    this.compressor.release.value = release;
    this.expander.release.value = release;
  }

  /**
   * Set makeup gain
   * @param gain - Gain in dB (-60 to +60)
   * @throws InvalidParameterError if invalid
   */
  setGain(gain: number): void {
    if (typeof gain !== 'number' || Number.isNaN(gain)) {
      throw new InvalidParameterError('gain', gain, 'number');
    }
    if (gain < -60 || gain > 60) {
      throw new InvalidParameterError(
        'gain',
        gain,
        'number between -60 and 60',
        { min: -60, max: 60 }
      );
    }
    this.config.gain = gain;
    this.makeupGain.gain.value = this.dbToLinear(gain);
  }

  /**
   * Enable or disable processor
   * @param enabled - Whether processor is enabled
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    // Use gain to bypass when disabled
    this.makeupGain.gain.value = enabled
      ? this.dbToLinear(this.config.gain)
      : this.dbToLinear(0);
  }

  /**
   * Check if processor is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get analyser node for frequency analysis
   * @returns AnalyserNode
   */
  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.inputNode.disconnect();
      this.analyser.disconnect();
      this.compressor.disconnect();
      this.expander.disconnect();
      this.attackGain.disconnect();
      this.releaseGain.disconnect();
      this.makeupGain.disconnect();
    } catch {
      // Already disconnected - ignore
    }
  }
}

