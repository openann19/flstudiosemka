/**
 * MoogLadderFilter - Moog ladder filter model
 * Analog-modeled 4-pole lowpass filter with saturation
 * @module audio/synthesizer/filters/MoogLadderFilter
 */

import { FilterModule } from './FilterModule';
import type { FilterConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';

/**
 * Moog ladder filter state
 */
interface MoogLadderState {
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  delay1: number;
  delay2: number;
  delay3: number;
  delay4: number;
}

/**
 * Moog ladder filter implementation
 */
export class MoogLadderFilter extends FilterModule {
  private state: MoogLadderState;
  private sampleRate: number;
  private resonance: number = 0;
  private cutoff: number = 20000;
  private drive: number = 0;

  /**
   * Create a new Moog ladder filter
   */
  constructor(
    audioContext: AudioContext,
    config: FilterConfig,
    destinationType: ModulationDestination
  ) {
    super(audioContext, config, destinationType);
    this.sampleRate = audioContext.sampleRate;
    this.state = {
      stage1: 0,
      stage2: 0,
      stage3: 0,
      stage4: 0,
      delay1: 0,
      delay2: 0,
      delay3: 0,
      delay4: 0,
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
    this.drive = this.config.drive;
  }

  /**
   * Process audio sample through Moog ladder filter
   * @param input - Input sample
   * @returns Filtered sample
   */
  processSample(input: number): number {
    const g = Math.tan((Math.PI * this.cutoff) / this.sampleRate);
    const k = this.resonance * 4;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const a4 = g * a3;

    // Input with drive/saturation
    let x = input * (1 + this.drive * 2);
    x = Math.tanh(x); // Soft saturation

    // Feedback
    const feedback = this.state.stage4 * k;

    // Stage 1
    const stage1Input = (x - feedback) * a1;
    this.state.stage1 = stage1Input + this.state.delay1;
    this.state.delay1 = stage1Input + this.state.stage1 * g;

    // Stage 2
    const stage2Input = this.state.stage1 * a2;
    this.state.stage2 = stage2Input + this.state.delay2;
    this.state.delay2 = stage2Input + this.state.stage2 * g;

    // Stage 3
    const stage3Input = this.state.stage2 * a3;
    this.state.stage3 = stage3Input + this.state.delay3;
    this.state.delay3 = stage3Input + this.state.stage3 * g;

    // Stage 4
    const stage4Input = this.state.stage3 * a4;
    this.state.stage4 = stage4Input + this.state.delay4;
    this.state.delay4 = stage4Input + this.state.stage4 * g;

    // Self-oscillation at high resonance
    if (this.resonance > 0.95) {
      this.state.stage4 = Math.max(-1, Math.min(1, this.state.stage4));
    }

    return this.state.stage4;
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.state = {
      stage1: 0,
      stage2: 0,
      stage3: 0,
      stage4: 0,
      delay1: 0,
      delay2: 0,
      delay3: 0,
      delay4: 0,
    };
  }
}

