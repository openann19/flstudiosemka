/**
 * SallenKeyFilter - Sallen-Key filter model
 * Analog-modeled Sallen-Key topology filter
 * @module audio/synthesizer/filters/SallenKeyFilter
 */

import { FilterModule } from './FilterModule';
import type { FilterConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';

/**
 * Sallen-Key filter state
 */
interface SallenKeyState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/**
 * Sallen-Key filter implementation
 */
export class SallenKeyFilter extends FilterModule {
  private state: SallenKeyState;
  private sampleRate: number;
  private resonance: number = 0;
  private cutoff: number = 20000;

  /**
   * Create a new Sallen-Key filter
   */
  constructor(
    audioContext: AudioContext,
    config: FilterConfig,
    destinationType: ModulationDestination
  ) {
    super(audioContext, config, destinationType);
    this.sampleRate = audioContext.sampleRate;
    this.state = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
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
   * Process audio sample through Sallen-Key filter
   * @param input - Input sample
   * @returns Filtered sample
   */
  processSample(input: number): number {
    const w0 = (2 * Math.PI * this.cutoff) / this.sampleRate;
    const Q = 1 / (2 - this.resonance * 2);
    const alpha = Math.sin(w0) / (2 * Q);

    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;
    const b0 = (1 - Math.cos(w0)) / 2;
    const b1 = 1 - Math.cos(w0);
    const b2 = (1 - Math.cos(w0)) / 2;

    // Sallen-Key difference equation
    const y =
      (b0 / a0) * input +
      (b1 / a0) * this.state.x1 +
      (b2 / a0) * this.state.x2 -
      (a1 / a0) * this.state.y1 -
      (a2 / a0) * this.state.y2;

    // Update state
    this.state.x2 = this.state.x1;
    this.state.x1 = input;
    this.state.y2 = this.state.y1;
    this.state.y1 = y;

    return y;
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.state = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
    };
  }
}

