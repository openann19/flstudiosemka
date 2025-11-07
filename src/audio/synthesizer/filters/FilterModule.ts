/**
 * FilterModule - Base filter module
 * Provides common interface for all filter types
 * @module audio/synthesizer/filters/FilterModule
 */

import type { FilterConfig } from '../../../types/synthesizer.types';
import { ModulationTarget } from '../modulation/ModulationTarget';
import type { ModulationDestination } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Base filter module class
 */
export abstract class FilterModule extends ModulationTarget {
  protected audioContext: AudioContext;
  protected filterNode: BiquadFilterNode | null = null;
  protected config: FilterConfig;
  protected destinationType: ModulationDestination;
  protected driveNode: WaveShaperNode | null = null;
  protected baseCutoff: number = 20000;

  /**
   * Create a new filter module
   */
  constructor(
    audioContext: AudioContext,
    config: FilterConfig,
    destinationType: ModulationDestination
  ) {
    super();
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('FilterModule: Invalid AudioContext');
    }
    this.audioContext = audioContext;
    this.config = { ...config };
    this.destinationType = destinationType;
    this.baseCutoff = this.config.cutoff;
  }

  /**
   * Update filter configuration
   */
  updateConfig(config: Partial<FilterConfig>): void {
    this.config = { ...this.config, ...config };
    this.baseCutoff = this.config.cutoff;
    this.updateFilter();
  }

  /**
   * Update filter node parameters
   */
  protected updateFilter(): void {
    if (!this.filterNode) {
      return;
    }

    try {
      const now = this.audioContext.currentTime;

      // Apply modulation to cutoff
      const modulatedCutoff = this.calculateModulatedCutoff();
      this.filterNode.frequency.setValueAtTime(modulatedCutoff, now);
      this.filterNode.Q.setValueAtTime(this.config.resonance, now);
      this.filterNode.type = this.config.mode as BiquadFilterType;
    } catch (error) {
      logger.error('FilterModule: Error updating filter', { error });
    }
  }

  /**
   * Calculate modulated cutoff frequency
   */
  protected calculateModulatedCutoff(): number {
    let cutoff = this.baseCutoff;

    // Apply envelope modulation
    cutoff += this.config.envelopeAmount * this.currentValue * 10000;

    // Apply LFO modulation
    cutoff += this.config.lfoAmount * this.currentValue * 5000;

    // Clamp to valid range
    return Math.max(20, Math.min(20000, cutoff));
  }

  /**
   * Apply modulation to filter
   */
  applyModulation(value: number, depth: number): void {
    this.currentValue = value * depth;
    this.updateFilter();
  }

  /**
   * Get destination type
   */
  getDestinationType(): ModulationDestination {
    return this.destinationType;
  }

  /**
   * Create drive/saturation node
   */
  protected createDriveNode(): WaveShaperNode {
    if (this.driveNode) {
      return this.driveNode;
    }

    const drive = this.config.drive;
    const samples = 44100;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2) / samples - 1;
      const k = drive * 50;
      curve[i] = ((3 + k) * x * 20) / (1 + k * Math.abs(x));
    }

    this.driveNode = this.audioContext.createWaveShaper();
    this.driveNode.curve = curve;
    this.driveNode.oversample = '4x';

    return this.driveNode;
  }

  /**
   * Get filter node for audio routing
   */
  getFilterNode(): BiquadFilterNode | null {
    return this.filterNode;
  }

  /**
   * Get drive node
   */
  getDriveNode(): WaveShaperNode | null {
    if (this.config.drive > 0) {
      return this.createDriveNode();
    }
    return null;
  }

  /**
   * Get configuration
   */
  getConfig(): FilterConfig {
    return { ...this.config };
  }
}

