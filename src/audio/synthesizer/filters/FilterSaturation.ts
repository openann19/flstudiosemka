/**
 * FilterSaturation - Filter drive algorithms
 * Implements various saturation types for filter drive
 * @module audio/synthesizer/filters/FilterSaturation
 */

/**
 * Saturation algorithm type
 */
export type SaturationAlgorithm = 'soft' | 'hard' | 'tube' | 'tape';

/**
 * Filter saturation processor
 */
export class FilterSaturation {
  /**
   * Apply saturation to sample
   * @param input - Input sample
   * @param drive - Drive amount (0 to 1)
   * @param algorithm - Saturation algorithm
   * @returns Saturated sample
   */
  static process(
    input: number,
    drive: number,
    algorithm: SaturationAlgorithm = 'soft'
  ): number {
    const driven = input * (1 + drive * 3); // Amplify based on drive

    switch (algorithm) {
      case 'soft': {
        // Soft clipping (tanh)
        return Math.tanh(driven);
      }
      case 'hard': {
        // Hard clipping
        return Math.max(-1, Math.min(1, driven));
      }
      case 'tube': {
        // Tube saturation (asymmetric)
        if (driven > 0) {
          return Math.tanh(driven * 0.7);
        }
        return Math.tanh(driven * 1.3);
      }
      case 'tape': {
        // Tape saturation (smooth with hysteresis)
        const abs = Math.abs(driven);
        if (abs < 0.5) {
          return driven;
        }
        const sign = driven >= 0 ? 1 : -1;
        const saturated = sign * (0.5 + (abs - 0.5) * 0.5);
        return Math.max(-1, Math.min(1, saturated));
      }
      default:
        return Math.tanh(driven);
    }
  }

  /**
   * Create waveshaper curve for saturation
   * @param drive - Drive amount (0 to 1)
   * @param algorithm - Saturation algorithm
   * @param samples - Number of curve samples
   * @returns Waveshaper curve
   */
  static createCurve(
    drive: number,
    algorithm: SaturationAlgorithm = 'soft',
    samples: number = 44100
  ): Float32Array {
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2) / samples - 1;
      const driven = x * (1 + drive * 3);
      curve[i] = this.process(driven, 0, algorithm);
    }

    return curve;
  }
}

