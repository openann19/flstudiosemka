/**
 * StateVariableFilter - State Variable Filter implementation
 * Provides smooth filter sweeps with self-oscillation
 * @module audio/synthesizer/filters/StateVariableFilter
 */

import { FilterModule } from './FilterModule';
import type { FilterConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * State Variable Filter implementation
 * Uses biquad filter with optimized settings for smooth operation
 */
export class StateVariableFilter extends FilterModule {
  /**
   * Create a new state variable filter
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
   * Create filter node with SVF characteristics
   */
  private createFilterNode(): void {
    try {
      this.filterNode = this.audioContext.createBiquadFilter();
      // SVF typically uses bandpass as base, but we'll use the configured mode
      this.updateFilter();
    } catch (error) {
      logger.error('StateVariableFilter: Error creating filter node', { error });
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

    // For SVF, high resonance can cause self-oscillation
    if (this.filterNode && this.config.resonance > 0.9) {
      // Allow self-oscillation at very high resonance
      this.filterNode.Q.value = Math.min(25, this.config.resonance * 25);
    }
  }

  /**
   * Check if filter is self-oscillating
   */
  isSelfOscillating(): boolean {
    return this.config.resonance > 0.95;
  }
}

