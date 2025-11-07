/**
 * ModulationCurves - Modulation curve functions
 * Applies various curves to modulation signals
 * @module audio/synthesizer/modulation/ModulationCurves
 */

/**
 * Modulation curve type
 */
export type ModulationCurveType = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'custom';

/**
 * Modulation curve functions
 */
export class ModulationCurves {
  /**
   * Apply curve to modulation value
   * @param value - Input value (-1 to 1)
   * @param curve - Curve type
   * @param customCurve - Custom curve function (optional)
   * @returns Curved value (-1 to 1)
   */
  static apply(
    value: number,
    curve: ModulationCurveType = 'linear',
    customCurve?: (x: number) => number
  ): number {
    const normalized = Math.max(-1, Math.min(1, value));
    const positive = normalized >= 0;
    const abs = Math.abs(normalized);

    let curved: number;

    switch (curve) {
      case 'linear':
        curved = normalized;
        break;
      case 'exponential': {
        // Exponential: x^2
        curved = abs * abs;
        break;
      }
      case 'logarithmic': {
        // Logarithmic: sqrt(x)
        curved = Math.sqrt(abs);
        break;
      }
      case 's-curve': {
        // S-curve: smooth transition
        if (abs < 0.5) {
          curved = 2 * abs * abs;
        } else {
          curved = 1 - 2 * (1 - abs) * (1 - abs);
        }
        break;
      }
      case 'custom': {
        if (customCurve) {
          curved = customCurve(normalized);
        } else {
          curved = normalized;
        }
        break;
      }
      default:
        curved = normalized;
    }

    // Restore sign
    return positive ? curved : -curved;
  }

  /**
   * Create custom curve from points
   * @param points - Array of [x, y] points (0-1 range)
   * @returns Custom curve function
   */
  static createCustomCurve(points: Array<[number, number]>): (x: number) => number {
    // Sort points by x
    const sorted = [...points].sort((a, b) => a[0] - b[0]);

    return (x: number): number => {
      const clamped = Math.max(0, Math.min(1, x));

      // Find surrounding points
      for (let i = 0; i < sorted.length - 1; i += 1) {
        const [x1, y1] = sorted[i] ?? [0, 0];
        const [x2, y2] = sorted[i + 1] ?? [0, 0];

        if (clamped >= x1 && clamped <= x2) {
          // Linear interpolation
          const t = (clamped - x1) / (x2 - x1);
          return y1 + t * (y2 - y1);
        }
      }

      // Clamp to first or last point
      if (clamped <= (sorted[0]?.[0] ?? 0)) {
        return sorted[0]?.[1] ?? 0;
      }
      return sorted[sorted.length - 1]?.[1] ?? 1;
    };
  }
}

