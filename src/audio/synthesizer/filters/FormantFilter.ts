/**
 * FormantFilter - Formant filter for vocal-like sounds
 * Creates formant peaks for vowel-like filtering
 * @module audio/synthesizer/filters/FormantFilter
 */

import { FilterModule } from './FilterModule';
import type { FilterConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';

/**
 * Formant configuration
 */
export interface FormantConfig {
  frequency: number; // Formant frequency in Hz
  bandwidth: number; // Formant bandwidth in Hz
  gain: number; // Formant gain (0 to 1)
}

/**
 * Formant filter configuration
 */
export interface FormantFilterConfig extends FilterConfig {
  formants: FormantConfig[]; // Array of formants (typically 3-5)
}

/**
 * Formant filter implementation
 */
export class FormantFilter extends FilterModule {
  private formants: FormantConfig[] = [];
  private sampleRate: number;
  private bandpassFilters: Array<{
    state: { x1: number; x2: number; y1: number; y2: number };
    coefficients: { b0: number; b1: number; b2: number; a1: number; a2: number };
  }> = [];

  /**
   * Create a new formant filter
   */
  constructor(
    audioContext: AudioContext,
    config: FormantFilterConfig,
    destinationType: ModulationDestination
  ) {
    super(audioContext, config, destinationType);
    this.sampleRate = audioContext.sampleRate;
    this.formants = config.formants ?? [];
    this.initializeFormants();
    this.updateFilter();
  }

  /**
   * Initialize formant filters
   */
  private initializeFormants(): void {
    this.bandpassFilters = this.formants.map((formant) => {
      const w0 = (2 * Math.PI * formant.frequency) / this.sampleRate;
      const bandwidth = formant.bandwidth;
      const Q = formant.frequency / bandwidth;
      const alpha = Math.sin(w0) / (2 * Q);

      const a0 = 1 + alpha;
      const b0 = alpha;
      const b1 = 0;
      const b2 = -alpha;
      const a1 = -2 * Math.cos(w0);
      const a2 = 1 - alpha;

      return {
        state: { x1: 0, x2: 0, y1: 0, y2: 0 },
        coefficients: {
          b0: b0 / a0,
          b1: b1 / a0,
          b2: b2 / a0,
          a1: a1 / a0,
          a2: a2 / a0,
        },
      };
    });
  }

  /**
   * Update filter configuration
   */
  override updateConfig(config: Partial<FormantFilterConfig>): void {
    super.updateConfig(config);
    if (config.formants) {
      this.formants = config.formants;
      this.initializeFormants();
    }
    this.updateFilter();
  }

  /**
   * Update filter parameters
   */
  protected override updateFilter(): void {
    // Recalculate formant coefficients if needed
    this.initializeFormants();
  }

  /**
   * Process audio sample through formant filter
   * @param input - Input sample
   * @returns Filtered sample
   */
  processSample(input: number): number {
    let output = 0;

    // Process through each formant
    for (let i = 0; i < this.bandpassFilters.length; i += 1) {
      const filter = this.bandpassFilters[i];
      const formant = this.formants[i];
      if (!filter || !formant) {
        continue;
      }

      const { coefficients, state } = filter;

      // Bandpass filter difference equation
      const y =
        coefficients.b0 * input +
        coefficients.b1 * state.x1 +
        coefficients.b2 * state.x2 -
        coefficients.a1 * state.y1 -
        coefficients.a2 * state.y2;

      // Update state
      state.x2 = state.x1;
      state.x1 = input;
      state.y2 = state.y1;
      state.y1 = y;

      // Add to output with formant gain
      output += y * formant.gain;
    }

    return Math.max(-1, Math.min(1, output));
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.bandpassFilters.forEach((filter) => {
      filter.state = { x1: 0, x2: 0, y1: 0, y2: 0 };
    });
  }

  /**
   * Set vowel formants (preset configurations)
   */
  setVowel(vowel: 'a' | 'e' | 'i' | 'o' | 'u'): void {
    const vowelFormants: Record<string, FormantConfig[]> = {
      a: [
        { frequency: 730, bandwidth: 100, gain: 1.0 },
        { frequency: 1090, bandwidth: 100, gain: 0.8 },
        { frequency: 2440, bandwidth: 100, gain: 0.6 },
      ],
      e: [
        { frequency: 270, bandwidth: 100, gain: 1.0 },
        { frequency: 2290, bandwidth: 100, gain: 0.8 },
        { frequency: 3010, bandwidth: 100, gain: 0.6 },
      ],
      i: [
        { frequency: 390, bandwidth: 100, gain: 1.0 },
        { frequency: 1990, bandwidth: 100, gain: 0.8 },
        { frequency: 2550, bandwidth: 100, gain: 0.6 },
      ],
      o: [
        { frequency: 570, bandwidth: 100, gain: 1.0 },
        { frequency: 840, bandwidth: 100, gain: 0.8 },
        { frequency: 2410, bandwidth: 100, gain: 0.6 },
      ],
      u: [
        { frequency: 440, bandwidth: 100, gain: 1.0 },
        { frequency: 1020, bandwidth: 100, gain: 0.8 },
        { frequency: 2240, bandwidth: 100, gain: 0.6 },
      ],
    };

    this.formants = vowelFormants[vowel] ?? this.formants;
    this.initializeFormants();
  }
}

