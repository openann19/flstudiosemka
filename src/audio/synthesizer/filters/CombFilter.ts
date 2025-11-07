/**
 * CombFilter - Comb filter implementation
 * Creates comb filtering effects with delay lines
 * @module audio/synthesizer/filters/CombFilter
 */

import { FilterModule } from './FilterModule';
import type { FilterConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';

/**
 * Comb filter configuration
 */
export interface CombFilterConfig extends FilterConfig {
  delayTime: number; // Delay time in seconds
  feedback: number; // Feedback amount (-1 to 1)
  damping: number; // High-frequency damping (0 to 1)
}

/**
 * Comb filter implementation
 */
export class CombFilter extends FilterModule {
  private delayBuffer: Float32Array;
  private delayIndex: number = 0;
  private sampleRate: number;
  private delayTime: number = 0.01;
  private feedback: number = 0.5;
  private damping: number = 0.5;
  private delaySamples: number = 0;
  private filterState: number = 0;

  /**
   * Create a new comb filter
   */
  constructor(
    audioContext: AudioContext,
    config: CombFilterConfig,
    destinationType: ModulationDestination
  ) {
    super(audioContext, config, destinationType);
    this.sampleRate = audioContext.sampleRate;
    this.delayTime = config.delayTime ?? 0.01;
    this.feedback = config.feedback ?? 0.5;
    this.damping = config.damping ?? 0.5;
    this.delaySamples = Math.floor(this.delayTime * this.sampleRate);
    this.delayBuffer = new Float32Array(Math.max(1, this.delaySamples));
    this.updateFilter();
  }

  /**
   * Update filter configuration
   */
  override updateConfig(config: Partial<CombFilterConfig>): void {
    super.updateConfig(config);
    if (config.delayTime !== undefined) {
      this.delayTime = config.delayTime;
      this.delaySamples = Math.floor(this.delayTime * this.sampleRate);
      this.delayBuffer = new Float32Array(Math.max(1, this.delaySamples));
    }
    if (config.feedback !== undefined) {
      this.feedback = config.feedback;
    }
    if (config.damping !== undefined) {
      this.damping = config.damping;
    }
    this.updateFilter();
  }

  /**
   * Update filter parameters
   */
  protected override updateFilter(): void {
    // Comb filter doesn't use standard cutoff/resonance
  }

  /**
   * Process audio sample through comb filter
   * @param input - Input sample
   * @returns Filtered sample
   */
  processSample(input: number): number {
    // Read from delay buffer
    const delayed = this.delayBuffer[this.delayIndex] ?? 0;

    // Apply damping (low-pass filter on feedback)
    this.filterState = this.filterState * (1 - this.damping) + delayed * this.damping;

    // Output is input plus delayed signal
    const output = input + this.filterState * this.feedback;

    // Write to delay buffer
    this.delayBuffer[this.delayIndex] = output;

    // Advance delay index
    this.delayIndex = (this.delayIndex + 1) % this.delayBuffer.length;

    return output;
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.delayBuffer.fill(0);
    this.delayIndex = 0;
    this.filterState = 0;
  }
}

