/**
 * MIDICCSource - MIDI CC as modulation source
 * Maps MIDI CC values to modulation
 * @module audio/synthesizer/modulation/MIDICCSource
 */

import { ModulationSource } from './ModulationSource';
import type { ModulationSource as ModulationSourceType } from '../../../types/synthesizer.types';

/**
 * MIDI CC source configuration
 */
export interface MIDICCSourceConfig {
  ccNumber: number; // MIDI CC number (0-127)
  minValue: number; // Minimum modulation value (-1 to 1)
  maxValue: number; // Maximum modulation value (-1 to 1)
  curve: 'linear' | 'exponential' | 'logarithmic'; // Response curve
}

/**
 * MIDI CC modulation source
 */
export class MIDICCSource extends ModulationSource {
  private config: MIDICCSourceConfig;
  private currentValue: number = 0;

  /**
   * Create a new MIDI CC source
   */
  constructor(config: Partial<MIDICCSourceConfig>) {
    super();
    this.config = {
      ccNumber: 1,
      minValue: -1,
      maxValue: 1,
      curve: 'linear',
      ...config,
    };
  }

  /**
   * Get source type
   */
  getSourceType(): ModulationSourceType {
    return 'modwheel' as ModulationSourceType; // Use modwheel as closest match
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<MIDICCSourceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Process MIDI CC message
   * @param ccNumber - MIDI CC number
   * @param value - MIDI CC value (0-127)
   */
  processCC(ccNumber: number, value: number): void {
    if (ccNumber === this.config.ccNumber) {
      const normalized = value / 127; // 0 to 1

      // Apply curve
      let curved: number;
      switch (this.config.curve) {
        case 'exponential':
          curved = normalized * normalized;
          break;
        case 'logarithmic':
          curved = Math.sqrt(normalized);
          break;
        default:
          curved = normalized;
      }

      // Map to min/max range
      this.currentValue = this.config.minValue + curved * (this.config.maxValue - this.config.minValue);
    }
  }

  /**
   * Get current modulation value
   */
  getValue(): number {
    return Math.max(-1, Math.min(1, this.currentValue));
  }

  /**
   * Reset value
   */
  reset(): void {
    this.currentValue = 0;
  }
}

