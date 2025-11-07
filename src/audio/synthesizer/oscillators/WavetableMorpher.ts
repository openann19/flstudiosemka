/**
 * WavetableMorpher - Wavetable morphing and interpolation
 * Smoothly morphs between wavetables and interpolates positions
 * @module audio/synthesizer/oscillators/WavetableMorpher
 */

/**
 * Wavetable morphing configuration
 */
export interface WavetableMorphConfig {
  position: number; // 0 to 1, position in wavetable
  morphAmount: number; // 0 to 1, amount of morphing
  interpolation: 'linear' | 'cubic' | 'sinc'; // Interpolation method
}

/**
 * Wavetable morpher
 */
export class WavetableMorpher {
  private wavetables: Float32Array[] = [];
  private config: WavetableMorphConfig;
  private phase: number = 0;
  private sampleRate: number;
  private frequency: number = 440;
  private phaseIncrement: number = 0;

  /**
   * Create a new wavetable morpher
   * @param sampleRate - Audio sample rate
   * @param config - Morphing configuration
   */
  constructor(sampleRate: number, config: WavetableMorphConfig) {
    this.sampleRate = sampleRate;
    this.config = { ...config };
    this.updatePhaseIncrement();
  }

  /**
   * Add a wavetable
   */
  addWavetable(wavetable: Float32Array): void {
    this.wavetables.push(wavetable);
  }

  /**
   * Set wavetables
   */
  setWavetables(wavetables: Float32Array[]): void {
    this.wavetables = wavetables;
  }

  /**
   * Set frequency
   */
  setFrequency(frequency: number): void {
    this.frequency = Math.max(20, Math.min(20000, frequency));
    this.updatePhaseIncrement();
  }

  /**
   * Set morph configuration
   */
  setConfig(config: Partial<WavetableMorphConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update phase increment
   */
  private updatePhaseIncrement(): void {
    this.phaseIncrement = this.frequency / this.sampleRate;
  }

  /**
   * Interpolate between wavetable values
   */
  private interpolateWavetable(
    wavetable: Float32Array,
    index: number,
    method: 'linear' | 'cubic' | 'sinc'
  ): number {
    const tableSize = wavetable.length;
    const normalizedIndex = index % tableSize;

    switch (method) {
      case 'linear': {
        const lowerIndex = Math.floor(normalizedIndex);
        const upperIndex = (lowerIndex + 1) % tableSize;
        const fraction = normalizedIndex - lowerIndex;
        return (
          (wavetable[lowerIndex] ?? 0) * (1 - fraction) + (wavetable[upperIndex] ?? 0) * fraction
        );
      }
      case 'cubic': {
        const i = Math.floor(normalizedIndex);
        const t = normalizedIndex - i;
        const i0 = (i - 1 + tableSize) % tableSize;
        const i1 = i % tableSize;
        const i2 = (i + 1) % tableSize;
        const i3 = (i + 2) % tableSize;

        const p0 = wavetable[i0] ?? 0;
        const p1 = wavetable[i1] ?? 0;
        const p2 = wavetable[i2] ?? 0;
        const p3 = wavetable[i3] ?? 0;

        // Cubic interpolation
        const t2 = t * t;
        const t3 = t2 * t;
        return (
          (2 * t3 - 3 * t2 + 1) * p1 +
          (t3 - 2 * t2 + t) * (p2 - p0) * 0.5 +
          (-2 * t3 + 3 * t2) * p2 +
          (t3 - t2) * (p3 - p1) * 0.5
        );
      }
      case 'sinc': {
        // Sinc interpolation (simplified)
        const lowerIndex = Math.floor(normalizedIndex);
        const upperIndex = (lowerIndex + 1) % tableSize;
        const fraction = normalizedIndex - lowerIndex;
        return (
          (wavetable[lowerIndex] ?? 0) * (1 - fraction) + (wavetable[upperIndex] ?? 0) * fraction
        );
      }
      default:
        return wavetable[Math.floor(normalizedIndex)] ?? 0;
    }
  }

  /**
   * Morph between wavetables
   */
  private morphWavetables(phase: number): number {
    if (this.wavetables.length === 0) {
      return 0;
    }

    if (this.wavetables.length === 1) {
      const wavetable = this.wavetables[0];
      if (!wavetable) {
        return 0;
      }
      return this.interpolateWavetable(
        wavetable,
        phase * wavetable.length,
        this.config.interpolation
      );
    }

    // Calculate position in wavetable array
    const position = this.config.position * (this.wavetables.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(lowerIndex + 1, this.wavetables.length - 1);
    const fraction = position - lowerIndex;

    // Get values from both wavetables
    const lowerWavetable = this.wavetables[lowerIndex];
    const upperWavetable = this.wavetables[upperIndex];

    if (!lowerWavetable || !upperWavetable) {
      return 0;
    }

    const lowerValue = this.interpolateWavetable(
      lowerWavetable,
      phase * lowerWavetable.length,
      this.config.interpolation
    );
    const upperValue = this.interpolateWavetable(
      upperWavetable,
      phase * upperWavetable.length,
      this.config.interpolation
    );

    // Morph between wavetables
    const morphAmount = this.config.morphAmount;
    return lowerValue * (1 - fraction) * (1 - morphAmount) + upperValue * fraction * morphAmount;
  }

  /**
   * Generate next sample
   * @returns Next sample value (-1 to 1)
   */
  generate(): number {
    const normalizedPhase = this.phase % 1;
    const value = this.morphWavetables(normalizedPhase);

    // Advance phase
    this.phase += this.phaseIncrement;
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
    }

    return Math.max(-1, Math.min(1, value));
  }

  /**
   * Reset phase
   */
  reset(): void {
    this.phase = 0;
  }
}

