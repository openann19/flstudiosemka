/**
 * ModulationTarget - Base class for modulation destinations
 * Provides common interface for all modulation targets
 * @module audio/synthesizer/modulation/ModulationTarget
 */

import type { ModulationDestination } from '../../../types/synthesizer.types';

/**
 * Base modulation target interface
 */
export interface IModulationTarget {
  applyModulation(value: number, depth: number): void;
  getDestinationType(): ModulationDestination;
  getCurrentValue(): number;
}

/**
 * Base class for modulation targets
 */
export abstract class ModulationTarget implements IModulationTarget {
  protected currentValue: number = 0;
  protected baseValue: number = 0;

  /**
   * Apply modulation value to target
   * @param value - Modulation value (-1 to 1)
   * @param depth - Modulation depth (-1 to 1)
   */
  abstract applyModulation(value: number, depth: number): void;

  /**
   * Get destination type identifier
   */
  abstract getDestinationType(): ModulationDestination;

  /**
   * Get current modulated value
   */
  getCurrentValue(): number {
    return this.currentValue;
  }

  /**
   * Set base value (before modulation)
   */
  setBaseValue(value: number): void {
    this.baseValue = value;
  }

  /**
   * Get base value
   */
  getBaseValue(): number {
    return this.baseValue;
  }
}

