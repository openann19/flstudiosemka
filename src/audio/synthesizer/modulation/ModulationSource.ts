/**
 * ModulationSource - Base class for modulation sources
 * Provides common interface for all modulation sources
 * @module audio/synthesizer/modulation/ModulationSource
 */

import type { ModulationSource as ModulationSourceType } from '../../../types/synthesizer.types';

/**
 * Base modulation source interface
 */
export interface IModulationSource {
  getValue(): number;
  getSourceType(): ModulationSourceType;
  isActive(): boolean;
}

/**
 * Base class for modulation sources
 */
export abstract class ModulationSource implements IModulationSource {
  protected value: number = 0;
  protected active: boolean = false;

  /**
   * Get current modulation value (-1 to 1)
   */
  abstract getValue(): number;

  /**
   * Get source type identifier
   */
  abstract getSourceType(): ModulationSourceType;

  /**
   * Check if source is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Set active state
   */
  setActive(active: boolean): void {
    this.active = active;
  }
}

