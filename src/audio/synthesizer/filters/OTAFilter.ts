/**
 * OTAFilter - Operational Transconductance Amplifier filter model
 * Analog-modeled OTA-based filter
 * @module audio/synthesizer/filters/OTAFilter
 */

import { FilterModule } from './FilterModule';
import type { FilterConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';

/**
 * OTA filter state
 */
interface OTAFilterState {
  integrator1: number;
  integrator2: number;
  delay1: number;
  delay2: number;
}

/**
 * OTA filter implementation
 */
export class OTAFilter extends FilterModule {
  private state: OTAFilterState;
  private sampleRate: number;
  private resonance: number = 0;
  private cutoff: number = 20000;

  /**
   * Create a new OTA filter
   */
  constructor(
    audioContext: AudioContext,
    config: FilterConfig,
    destinationType: ModulationDestination
  ) {
    super(audioContext, config, destinationType);
    this.sampleRate = audioContext.sampleRate;
    this.state = {
      integrator1: 0,
      integrator2: 0,
      delay1: 0,
      delay2: 0,
    };
    this.updateFilter();
  }

  /**
   * Update filter configuration
   */
  override updateConfig(config: Partial<FilterConfig>): void {
    super.updateConfig(config);
    this.updateFilter();
  }

  /**
   * Update filter parameters
   */
  protected override updateFilter(): void {
    this.cutoff = this.calculateModulatedCutoff();
    this.resonance = this.config.resonance;
  }

  /**
   * Process audio sample through OTA filter
   * @param input - Input sample
   * @returns Filtered sample
   */
  processSample(input: number): number {
    const g = (Math.PI * this.cutoff) / this.sampleRate;
    const k = this.resonance * 2;

    // OTA integrator equations
    const v1 = input - k * this.state.integrator2;
    const v2 = this.state.integrator1;

    // Integrators
    this.state.integrator1 = this.state.delay1 + g * v1;
    this.state.integrator2 = this.state.delay2 + g * v2;

    // Update delays
    this.state.delay1 = this.state.integrator1;
    this.state.delay2 = this.state.integrator2;

    // Output based on filter mode
    switch (this.config.mode) {
      case 'lowpass':
        return this.state.integrator2;
      case 'highpass':
        return v1;
      case 'bandpass':
        return this.state.integrator1;
      default:
        return this.state.integrator2;
    }
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.state = {
      integrator1: 0,
      integrator2: 0,
      delay1: 0,
      delay2: 0,
    };
  }
}

