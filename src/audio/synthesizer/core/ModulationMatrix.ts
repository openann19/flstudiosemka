/**
 * ModulationMatrix - Central modulation routing system
 * Manages all modulation connections between sources and destinations
 * @module audio/synthesizer/core/ModulationMatrix
 */

import { ModulationRouter } from '../modulation/ModulationRouter';
import type { ModulationSlot } from '../../../types/synthesizer.types';

/**
 * Modulation matrix for the synthesizer
 * Provides high-level interface for modulation routing
 */
export class ModulationMatrix {
  private router: ModulationRouter;

  /**
   * Create a new modulation matrix
   */
  constructor() {
    this.router = new ModulationRouter();
  }

  /**
   * Get the underlying router
   */
  getRouter(): ModulationRouter {
    return this.router;
  }

  /**
   * Process all modulation routings
   * Call this every audio frame
   */
  process(): void {
    this.router.process();
  }

  /**
   * Get all modulation slots
   */
  getSlots(): ModulationSlot[] {
    return this.router.getAllSlots();
  }

  /**
   * Set a modulation slot
   */
  setSlot(index: number, slot: ModulationSlot): void {
    this.router.setSlot(index, slot);
  }

  /**
   * Get a modulation slot
   */
  getSlot(index: number): ModulationSlot | undefined {
    return this.router.getSlot(index);
  }

  /**
   * Clear all modulation slots
   */
  clearAll(): void {
    this.router.clearAllSlots();
  }

  /**
   * Get active slot count
   */
  getActiveSlotCount(): number {
    return this.router.getActiveSlotCount();
  }
}

