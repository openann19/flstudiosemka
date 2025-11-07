/**
 * ModulationRouter - Routes modulation sources to destinations
 * Central routing system for all modulation connections
 * @module audio/synthesizer/modulation/ModulationRouter
 */

import type {
  ModulationSlot,
  ModulationSource,
  ModulationDestination,
} from '../../../types/synthesizer.types';
import { ModulationSource as BaseModulationSource } from './ModulationSource';
import { ModulationTarget as BaseModulationTarget } from './ModulationTarget';
import { logger } from '../../../utils/logger';

/**
 * Modulation router for connecting sources to targets
 */
export class ModulationRouter {
  private slots: ModulationSlot[] = [];
  private sources: Map<ModulationSource, BaseModulationSource> = new Map();
  private targets: Map<ModulationDestination, BaseModulationTarget> = new Map();
  private readonly maxSlots: number = 16;

  /**
   * Create a new modulation router
   */
  constructor() {
    this.initializeSlots();
  }

  /**
   * Initialize modulation slots
   */
  private initializeSlots(): void {
    for (let i = 0; i < this.maxSlots; i += 1) {
      this.slots.push({
        enabled: false,
        source: 'lfo1',
        destination: 'osc1Pitch',
        depth: 0,
        bipolar: true,
      });
    }
  }

  /**
   * Register a modulation source
   */
  registerSource(sourceType: ModulationSource, source: BaseModulationSource): void {
    this.sources.set(sourceType, source);
  }

  /**
   * Register a modulation target
   */
  registerTarget(destinationType: ModulationDestination, target: BaseModulationTarget): void {
    this.targets.set(destinationType, target);
  }

  /**
   * Unregister a modulation source
   */
  unregisterSource(sourceType: ModulationSource): void {
    this.sources.delete(sourceType);
  }

  /**
   * Unregister a modulation target
   */
  unregisterTarget(destinationType: ModulationDestination): void {
    this.targets.delete(destinationType);
  }

  /**
   * Set modulation slot configuration
   */
  setSlot(index: number, slot: ModulationSlot): void {
    if (index < 0 || index >= this.maxSlots) {
      logger.warn('ModulationRouter: Invalid slot index', { index, maxSlots: this.maxSlots });
      return;
    }
    this.slots[index] = { ...slot };
  }

  /**
   * Get modulation slot configuration
   */
  getSlot(index: number): ModulationSlot | undefined {
    if (index < 0 || index >= this.maxSlots) {
      return undefined;
    }
    const slot = this.slots[index];
    if (!slot) {
      return undefined;
    }
    return { ...slot };
  }

  /**
   * Get all modulation slots
   */
  getAllSlots(): ModulationSlot[] {
    return this.slots.map((slot) => ({ ...slot }));
  }

  /**
   * Process all active modulation routings
   * Should be called every audio frame
   */
  process(): void {
    for (const slot of this.slots) {
      if (!slot.enabled) {
        continue;
      }

      const source = this.sources.get(slot.source);
      const target = this.targets.get(slot.destination);

      if (!source || !target) {
        continue;
      }

      if (!source.isActive()) {
        continue;
      }

      const sourceValue = source.getValue();
      const depth = slot.bipolar ? slot.depth : Math.abs(slot.depth);
      const modulationValue = sourceValue * depth;

      target.applyModulation(modulationValue, depth);
    }
  }

  /**
   * Clear all modulation slots
   */
  clearAllSlots(): void {
    this.slots.forEach((slot) => {
      slot.enabled = false;
      slot.depth = 0;
    });
  }

  /**
   * Get active slot count
   */
  getActiveSlotCount(): number {
    return this.slots.filter((slot) => slot.enabled).length;
  }
}

