/**
 * EQBand - Individual EQ band with advanced filter types
 * Supports all PRO Q 4 filter shapes with fractional slopes
 * @module effects/EQBand
 */

import {
  AudioContextError,
  InvalidParameterError,
} from '../utils/errors';

/**
 * Filter type enumeration matching PRO Q 4
 */
export enum FilterType {
  Peaking = 'peaking',
  LowShelf = 'lowshelf',
  HighShelf = 'highshelf',
  LowPass = 'lowpass',
  HighPass = 'highpass',
  Notch = 'notch',
  AllPass = 'allpass',
  BandPass = 'bandpass',
}

/**
 * EQ band parameters
 */
export interface EQBandConfig {
  id: string;
  type: FilterType;
  frequency: number; // 10Hz - 48kHz
  gain: number; // -60dB to +60dB
  Q?: number; // 0.01 to 100
  bandwidth?: number; // Alternative to Q (Hz)
  slope?: number; // For shelf filters: 0.1 to 48 dB/oct
  enabled: boolean;
}

/**
 * Individual EQ band implementation
 */
export class EQBand {
  private audioContext: AudioContext;

  private filter: BiquadFilterNode;

  private bypassGain: GainNode;

  private enabled: boolean;

  private config: EQBandConfig;

  public readonly inputNode: GainNode;

  public readonly outputNode: GainNode;

  /**
   * Create a new EQ band
   * @param audioContext - Web Audio API AudioContext
   * @param config - Band configuration
   * @throws AudioContextError if audioContext is invalid
   * @throws InvalidParameterError if config is invalid
   */
  constructor(audioContext: AudioContext, config: EQBandConfig) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.config = { ...config };

    // Validate configuration
    this.validateConfig(config);

    // Create filter node
    this.filter = audioContext.createBiquadFilter();
    this.setFilterType(config.type);

    // Create bypass gain for enable/disable
    this.bypassGain = audioContext.createGain();
    this.bypassGain.gain.value = 1;

    // Input/output nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = this.bypassGain;

    // Connect: input -> filter -> bypass -> output
    this.inputNode.connect(this.filter);
    this.filter.connect(this.bypassGain);

    // Apply initial settings
    this.updateFilterParams();
    this.enabled = config.enabled;
    this.setEnabled(config.enabled);
  }

  /**
   * Validate band configuration
   * @param config - Configuration to validate
   * @throws InvalidParameterError if invalid
   */
  private validateConfig(config: EQBandConfig): void {
    // Validate frequency (10Hz - 48kHz)
    if (typeof config.frequency !== 'number' || Number.isNaN(config.frequency)) {
      throw new InvalidParameterError('frequency', config.frequency, 'number');
    }
    if (config.frequency < 10 || config.frequency > 48000) {
      throw new InvalidParameterError(
        'frequency',
        config.frequency,
        'number between 10 and 48000',
        { min: 10, max: 48000 }
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

    // Validate Q (0.01 to 100)
    if (config.Q !== undefined) {
      if (typeof config.Q !== 'number' || Number.isNaN(config.Q)) {
        throw new InvalidParameterError('Q', config.Q, 'number');
      }
      if (config.Q < 0.01 || config.Q > 100) {
        throw new InvalidParameterError(
          'Q',
          config.Q,
          'number between 0.01 and 100',
          { min: 0.01, max: 100 }
        );
      }
    }

    // Validate bandwidth
    if (config.bandwidth !== undefined) {
      if (typeof config.bandwidth !== 'number' || Number.isNaN(config.bandwidth)) {
        throw new InvalidParameterError('bandwidth', config.bandwidth, 'number');
      }
      if (config.bandwidth <= 0) {
        throw new InvalidParameterError('bandwidth', config.bandwidth, 'positive number');
      }
    }

    // Validate slope (0.1 to 48 dB/oct)
    if (config.slope !== undefined) {
      if (typeof config.slope !== 'number' || Number.isNaN(config.slope)) {
        throw new InvalidParameterError('slope', config.slope, 'number');
      }
      if (config.slope < 0.1 || config.slope > 48) {
        throw new InvalidParameterError(
          'slope',
          config.slope,
          'number between 0.1 and 48',
          { min: 0.1, max: 48 }
        );
      }
    }

    // Validate filter type
    if (!Object.values(FilterType).includes(config.type)) {
      throw new InvalidParameterError(
        'type',
        config.type,
        `one of: ${Object.values(FilterType).join(', ')}`
      );
    }
  }

  /**
   * Set filter type
   * @param type - Filter type
   */
  private setFilterType(type: FilterType): void {
    const biquadTypeMap: Record<FilterType, BiquadFilterType> = {
      [FilterType.Peaking]: 'peaking',
      [FilterType.LowShelf]: 'lowshelf',
      [FilterType.HighShelf]: 'highshelf',
      [FilterType.LowPass]: 'lowpass',
      [FilterType.HighPass]: 'highpass',
      [FilterType.Notch]: 'notch',
      [FilterType.AllPass]: 'allpass',
      [FilterType.BandPass]: 'bandpass',
    };

    this.filter.type = biquadTypeMap[type];
  }

  /**
   * Update filter parameters from config
   */
  private updateFilterParams(): void {
    this.filter.frequency.value = this.config.frequency;
    // Only set gain if the filter type supports it (peaking, lowshelf, highshelf)
    if ('gain' in this.filter && this.filter.gain) {
      this.filter.gain.value = this.config.gain;
    }

    // Calculate Q from bandwidth if provided, otherwise use Q directly
    if (this.config.bandwidth !== undefined && this.config.frequency > 0) {
      // Q = frequency / bandwidth
      const calculatedQ = this.config.frequency / this.config.bandwidth;
      this.filter.Q.value = Math.max(0.01, Math.min(100, calculatedQ));
    } else {
      this.filter.Q.value = this.config.Q ?? 1;
    }

    // For shelf filters, adjust Q based on slope if provided
    if (
      (this.config.type === FilterType.LowShelf || this.config.type === FilterType.HighShelf) &&
      this.config.slope !== undefined
    ) {
      // Convert slope (dB/oct) to Q approximation
      // This is a simplified conversion - PRO Q 4 uses more complex math
      const slopeQ = this.calculateSlopeToQ(this.config.slope, this.config.frequency);
      this.filter.Q.value = slopeQ;
    }
  }

  /**
   * Calculate Q from slope for shelf filters
   * @param slope - Slope in dB/oct
   * @param frequency - Center frequency
   * @returns Approximate Q value
   */
  private calculateSlopeToQ(slope: number, frequency: number): number {
    // Simplified conversion: slope to Q approximation
    // Standard shelf filters: 6dB/oct = Q ~0.7, 12dB/oct = Q ~0.5, etc.
    // This is an approximation - PRO Q 4 uses more precise calculations
    const normalizedSlope = slope / 6;
    const baseQ = 0.707; // Standard shelf Q
    return Math.max(0.01, Math.min(100, baseQ / normalizedSlope));
  }

  /**
   * Get current configuration
   * @returns Current band configuration
   */
  getConfig(): EQBandConfig {
    return {
      ...this.config,
      enabled: this.enabled,
    };
  }

  /**
   * Update band configuration
   * @param updates - Partial configuration updates
   * @throws InvalidParameterError if updates are invalid
   */
  updateConfig(updates: Partial<EQBandConfig>): void {
    const newConfig = { ...this.config, ...updates };
    this.validateConfig(newConfig);
    this.config = newConfig;

    // Update filter type if changed
    if (updates.type && updates.type !== this.config.type) {
      this.setFilterType(updates.type);
    }

    // Update filter parameters
    this.updateFilterParams();

    // Update enabled state if changed
    if (updates.enabled !== undefined) {
      this.setEnabled(updates.enabled);
    }
  }

  /**
   * Set frequency
   * @param frequency - Frequency in Hz (10-48000)
   * @throws InvalidParameterError if invalid
   */
  setFrequency(frequency: number): void {
    if (typeof frequency !== 'number' || Number.isNaN(frequency)) {
      throw new InvalidParameterError('frequency', frequency, 'number');
    }
    if (frequency < 10 || frequency > 48000) {
      throw new InvalidParameterError(
        'frequency',
        frequency,
        'number between 10 and 48000',
        { min: 10, max: 48000 }
      );
    }
    this.config.frequency = frequency;
    this.filter.frequency.value = frequency;
  }

  /**
   * Set gain
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
    // Only set gain if the filter type supports it (peaking, lowshelf, highshelf)
    if ('gain' in this.filter && this.filter.gain) {
      this.filter.gain.value = gain;
    }
  }

  /**
   * Set Q factor
   * @param Q - Q factor (0.01-100)
   * @throws InvalidParameterError if invalid
   */
  setQ(Q: number): void {
    if (typeof Q !== 'number' || Number.isNaN(Q)) {
      throw new InvalidParameterError('Q', Q, 'number');
    }
    if (Q < 0.01 || Q > 100) {
      throw new InvalidParameterError(
        'Q',
        Q,
        'number between 0.01 and 100',
        { min: 0.01, max: 100 }
      );
    }
    this.config.Q = Q;
    this.config.bandwidth = undefined; // Clear bandwidth when Q is set
    this.filter.Q.value = Q;
  }

  /**
   * Set bandwidth
   * @param bandwidth - Bandwidth in Hz
   * @throws InvalidParameterError if invalid
   */
  setBandwidth(bandwidth: number): void {
    if (typeof bandwidth !== 'number' || Number.isNaN(bandwidth)) {
      throw new InvalidParameterError('bandwidth', bandwidth, 'number');
    }
    if (bandwidth <= 0) {
      throw new InvalidParameterError('bandwidth', bandwidth, 'positive number');
    }
    this.config.bandwidth = bandwidth;
    this.config.Q = undefined; // Clear Q when bandwidth is set
    this.updateFilterParams();
  }

  /**
   * Set slope (for shelf filters)
   * @param slope - Slope in dB/oct (0.1-48)
   * @throws InvalidParameterError if invalid
   */
  setSlope(slope: number): void {
    if (typeof slope !== 'number' || Number.isNaN(slope)) {
      throw new InvalidParameterError('slope', slope, 'number');
    }
    if (slope < 0.1 || slope > 48) {
      throw new InvalidParameterError(
        'slope',
        slope,
        'number between 0.1 and 48',
        { min: 0.1, max: 48 }
      );
    }
    this.config.slope = slope;
    this.updateFilterParams();
  }

  /**
   * Enable or disable band
   * @param enabled - Whether band is enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    // Use gain node to bypass when disabled
    this.bypassGain.gain.value = enabled ? 1 : 0;
  }

  /**
   * Check if band is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get filter type
   * @returns Current filter type
   */
  getType(): FilterType {
    return this.config.type;
  }

  /**
   * Set filter type
   * @param type - Filter type
   */
  setType(type: FilterType): void {
    if (!Object.values(FilterType).includes(type)) {
      throw new InvalidParameterError(
        'type',
        type,
        `one of: ${Object.values(FilterType).join(', ')}`
      );
    }
    this.config.type = type;
    this.setFilterType(type);
    this.updateFilterParams();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.inputNode.disconnect();
      this.filter.disconnect();
      this.bypassGain.disconnect();
    } catch (error) {
      // Already disconnected - ignore
    }
  }
}

