/**
 * MultimodeFilter - Multimode filter implementation
 * Supports lowpass, highpass, bandpass, notch, and allpass
 * @module audio/synthesizer/filters/MultimodeFilter
 */

import { FilterModule } from './FilterModule';
import type { FilterConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Multimode filter implementation
 */
export class MultimodeFilter extends FilterModule {
  /**
   * Create a new multimode filter
   */
  constructor(
    audioContext: AudioContext,
    config: FilterConfig,
    destinationType: ModulationDestination
  ) {
    super(audioContext, config, destinationType);
    this.createFilterNode();
  }

  /**
   * Create filter node
   */
  private createFilterNode(): void {
    try {
      this.filterNode = this.audioContext.createBiquadFilter();
      this.updateFilter();
    } catch (error) {
      logger.error('MultimodeFilter: Error creating filter node', { error });
    }
  }

  /**
   * Update filter configuration
   */
  override updateConfig(config: Partial<FilterConfig>): void {
    super.updateConfig(config);
    if (!this.filterNode) {
      this.createFilterNode();
    }
  }

  /**
   * Set keytracking (filter follows keyboard)
   */
  setKeytracking(note: number): void {
    if (!this.config.keytracking || !this.filterNode) {
      return;
    }

    // Convert MIDI note to frequency
    const noteFreq = 440 * Math.pow(2, (note - 69) / 12);
    const trackingAmount = this.config.keytracking * (noteFreq - 440);
    const newCutoff = this.baseCutoff + trackingAmount;

    try {
      this.filterNode.frequency.setValueAtTime(
        Math.max(20, Math.min(20000, newCutoff)),
        this.audioContext.currentTime
      );
    } catch (error) {
      logger.error('MultimodeFilter: Error setting keytracking', { error });
    }
  }
}

