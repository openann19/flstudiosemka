/**
 * ModulationSmoother - Modulation lag/smoothing
 * Applies portamento-like smoothing to modulation signals
 * @module audio/synthesizer/modulation/ModulationSmoother
 */

/**
 * Modulation smoother
 */
export class ModulationSmoother {
  private currentValue: number = 0;
  private targetValue: number = 0;
  private sampleRate: number;
  private lagTime: number = 0; // Lag time in seconds
  private coefficient: number = 0;

  /**
   * Create a new modulation smoother
   * @param sampleRate - Audio sample rate
   * @param lagTime - Lag time in seconds
   */
  constructor(sampleRate: number, lagTime: number = 0.01) {
    this.sampleRate = sampleRate;
    this.setLagTime(lagTime);
  }

  /**
   * Set lag time
   */
  setLagTime(lagTime: number): void {
    this.lagTime = Math.max(0, lagTime);
    if (this.lagTime > 0) {
      this.coefficient = Math.exp(-1 / (this.lagTime * this.sampleRate));
    } else {
      this.coefficient = 0; // No smoothing
    }
  }

  /**
   * Process modulation value with smoothing
   * @param input - Input modulation value
   * @returns Smoothed output value
   */
  process(input: number): number {
    this.targetValue = input;

    if (this.lagTime > 0) {
      // Exponential smoothing
      this.currentValue = this.targetValue + (this.currentValue - this.targetValue) * this.coefficient;
    } else {
      // No smoothing
      this.currentValue = this.targetValue;
    }

    return this.currentValue;
  }

  /**
   * Get current smoothed value
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Reset smoother
   */
  reset(): void {
    this.currentValue = 0;
    this.targetValue = 0;
  }
}

