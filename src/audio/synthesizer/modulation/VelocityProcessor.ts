/**
 * VelocityProcessor - Velocity curves and scaling
 * Processes MIDI velocity with various curves
 * @module audio/synthesizer/modulation/VelocityProcessor
 */

/**
 * Velocity curve type
 */
export type VelocityCurve = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'custom';

/**
 * Velocity processor configuration
 */
export interface VelocityProcessorConfig {
  curve: VelocityCurve;
  sensitivity: number; // 0 to 1, velocity sensitivity
  offset: number; // -1 to 1, velocity offset
  customCurve?: (velocity: number) => number; // Custom curve function
}

/**
 * Velocity processor
 */
export class VelocityProcessor {
  private config: VelocityProcessorConfig;

  /**
   * Create a new velocity processor
   */
  constructor(config: Partial<VelocityProcessorConfig>) {
    this.config = {
      curve: 'linear',
      sensitivity: 1.0,
      offset: 0,
      ...config,
    };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<VelocityProcessorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Process velocity value
   * @param velocity - MIDI velocity (0-127)
   * @returns Processed velocity value (0 to 1)
   */
  process(velocity: number): number {
    const normalized = Math.max(0, Math.min(127, velocity)) / 127;

    // Apply curve
    let curved: number;
    switch (this.config.curve) {
      case 'exponential': {
        curved = normalized * normalized;
        break;
      }
      case 'logarithmic': {
        curved = Math.sqrt(normalized);
        break;
      }
      case 's-curve': {
        // S-curve: smooth transition
        curved = normalized < 0.5
          ? 2 * normalized * normalized
          : 1 - 2 * (1 - normalized) * (1 - normalized);
        break;
      }
      case 'custom': {
        if (this.config.customCurve) {
          curved = this.config.customCurve(normalized);
        } else {
          curved = normalized;
        }
        break;
      }
      default:
        curved = normalized;
    }

    // Apply sensitivity and offset
    const processed = curved * this.config.sensitivity + this.config.offset;

    return Math.max(0, Math.min(1, processed));
  }

  /**
   * Get configuration
   */
  getConfig(): VelocityProcessorConfig {
    return { ...this.config };
  }
}

