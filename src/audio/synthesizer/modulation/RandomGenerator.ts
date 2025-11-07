/**
 * RandomGenerator - Random modulation sources
 * Provides S&H, smooth random, and stepped random
 * @module audio/synthesizer/modulation/RandomGenerator
 */

import { ModulationSource } from './ModulationSource';
import type { ModulationSource as ModulationSourceType } from '../../../types/synthesizer.types';

/**
 * Random generator type
 */
export type RandomType = 'samplehold' | 'smooth' | 'stepped';

/**
 * Random generator configuration
 */
export interface RandomGeneratorConfig {
  type: RandomType;
  rate: number; // Rate in Hz (for S&H and stepped)
  smoothness: number; // Smoothness (0 to 1, for smooth random)
}

/**
 * Random generator modulation source
 */
export class RandomGenerator extends ModulationSource {
  private config: RandomGeneratorConfig;
  private sampleRate: number;
  private currentValue: number = 0;
  private targetValue: number = 0;
  private phase: number = 0;
  private phaseIncrement: number = 0;

  /**
   * Create a new random generator
   */
  constructor(sampleRate: number, config: Partial<RandomGeneratorConfig>) {
    super();
    this.sampleRate = sampleRate;
    this.config = {
      type: 'samplehold',
      rate: 1,
      smoothness: 0.5,
      ...config,
    };
    this.updatePhaseIncrement();
    this.generateNewValue();
  }

  /**
   * Update phase increment
   */
  private updatePhaseIncrement(): void {
    this.phaseIncrement = this.config.rate / this.sampleRate;
  }

  /**
   * Generate new random value
   */
  private generateNewValue(): void {
    this.targetValue = Math.random() * 2 - 1;
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<RandomGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    this.updatePhaseIncrement();
  }

  /**
   * Get current modulation value
   */
  getValue(): number {
    return this.generate();
  }

  /**
   * Generate modulation value
   */
  generate(): number {
    switch (this.config.type) {
      case 'samplehold': {
        // Sample and hold: new random value at rate
        this.phase += this.phaseIncrement;
        if (this.phase >= 1) {
          this.phase -= 1;
          this.currentValue = this.targetValue;
          this.generateNewValue();
        }
        return this.currentValue;
      }
      case 'smooth': {
        // Smooth random: interpolate between random values
        this.phase += this.phaseIncrement;
        if (this.phase >= 1) {
          this.phase -= 1;
          this.currentValue = this.targetValue;
          this.generateNewValue();
        }
        // Interpolate
        const smoothness = this.config.smoothness;
        const t = this.phase;
        return this.currentValue * (1 - t * smoothness) + this.targetValue * (t * smoothness);
      }
      case 'stepped': {
        // Stepped random: new value at rate, no interpolation
        this.phase += this.phaseIncrement;
        if (this.phase >= 1) {
          this.phase -= 1;
          this.currentValue = this.targetValue;
          this.generateNewValue();
        }
        return this.currentValue;
      }
      default:
        return this.currentValue;
    }
  }

  /**
   * Get source type
   */
  getSourceType(): ModulationSourceType {
    return 'lfo1' as ModulationSourceType; // Use LFO as closest match
  }

  /**
   * Reset generator
   */
  reset(): void {
    this.phase = 0;
    this.generateNewValue();
    this.currentValue = this.targetValue;
  }
}

