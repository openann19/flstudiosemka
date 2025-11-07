/**
 * EffectSlotService - Manages effect slots per track
 * Handles effect slot creation, management, reordering, and serialization
 * @module services/EffectSlotService
 */

import type {
  Effect,
  EffectChainState,
  EffectSlot,
  EffectSlotOperationResult,
  SerializedEffectChain,
} from '../types/effectSlot.types';
import { ValidationUtils } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Maximum number of effect slots per track (FL Studio standard)
 */
const MAX_EFFECT_SLOTS = 10;

/**
 * Service for managing effect slots per track
 */
export class EffectSlotService {
  private chains: Map<number, EffectChainState> = new Map();

  /**
   * Initialize effect chain for a track
   * @param trackId - Track identifier
   * @returns EffectChainState
   */
  initializeChain(trackId: number): EffectChainState {
    ValidationUtils.validateNumber(trackId, 'trackId');

    if (this.chains.has(trackId)) {
      return this.chains.get(trackId)!;
    }

    const slots: EffectSlot[] = Array.from({ length: MAX_EFFECT_SLOTS }, (_, index) => ({
      id: `track-${trackId}-slot-${index}`,
      position: index,
      effectType: null,
      effectInstance: null,
      enabled: false,
      parameters: {},
      bypass: false,
    }));

    const chain: EffectChainState = {
      trackId,
      slots,
      bypass: false,
    };

    this.chains.set(trackId, chain);
    return chain;
  }

  /**
   * Get effect chain for a track
   * @param trackId - Track identifier
   * @returns EffectChainState or null
   */
  getChain(trackId: number): EffectChainState | null {
    ValidationUtils.validateNumber(trackId, 'trackId');
    return this.chains.get(trackId) || null;
  }

  /**
   * Get effect slot at position
   * @param trackId - Track identifier
   * @param position - Slot position (0-9)
   * @returns EffectSlot or null
   */
  getSlot(trackId: number, position: number): EffectSlot | null {
    ValidationUtils.validateNumber(trackId, 'trackId');
    ValidationUtils.validateNumber(position, 'position');

    if (position < 0 || position >= MAX_EFFECT_SLOTS) {
      return null;
    }

    const chain = this.getChain(trackId);
    if (!chain) {
      return null;
    }

    return chain.slots[position] || null;
  }

  /**
   * Add effect to slot
   * @param trackId - Track identifier
   * @param position - Slot position (0-9)
   * @param effect - Effect instance
   * @param parameters - Effect parameters
   * @returns EffectSlotOperationResult
   */
  addEffect(
    trackId: number,
    position: number,
    effect: Effect,
    parameters: Record<string, number> = {}
  ): EffectSlotOperationResult {
    try {
      ValidationUtils.validateNumber(trackId, 'trackId');
      ValidationUtils.validateNumber(position, 'position');

      if (position < 0 || position >= MAX_EFFECT_SLOTS) {
        return {
          success: false,
          error: `Position must be between 0 and ${MAX_EFFECT_SLOTS - 1}`,
        };
      }

      if (!effect || !effect.inputNode || !effect.outputNode) {
        return {
          success: false,
          error: 'Invalid effect instance',
        };
      }

      const chain = this.initializeChain(trackId);
      const slot = chain.slots[position];

      if (!slot) {
        return {
          success: false,
          error: 'Invalid slot position',
        };
      }

      if (slot.effectInstance) {
        // Cleanup existing effect
        if (slot.effectInstance.cleanup) {
          try {
            slot.effectInstance.cleanup();
          } catch (error) {
            logger.error('EffectSlotService: Error cleaning up existing effect', { error });
          }
        }
      }

      // Determine effect type
      let effectType: string | null = null;
      if (effect.getEffectType) {
        effectType = effect.getEffectType();
      }

      // Update slot
      slot.effectType = effectType as typeof slot.effectType;
      slot.effectInstance = effect;
      slot.enabled = true;
      slot.parameters = { ...parameters };
      slot.bypass = false;

      return {
        success: true,
        slot: { ...slot },
      };
    } catch (error) {
      logger.error('EffectSlotService: Error adding effect', { error, trackId, position });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove effect from slot
   * @param trackId - Track identifier
   * @param position - Slot position (0-9)
   * @returns EffectSlotOperationResult
   */
  removeEffect(trackId: number, position: number): EffectSlotOperationResult {
    try {
      ValidationUtils.validateNumber(trackId, 'trackId');
      ValidationUtils.validateNumber(position, 'position');

      if (position < 0 || position >= MAX_EFFECT_SLOTS) {
        return {
          success: false,
          error: `Position must be between 0 and ${MAX_EFFECT_SLOTS - 1}`,
        };
      }

      const chain = this.getChain(trackId);
      if (!chain) {
        return {
          success: false,
          error: 'Effect chain not found for track',
        };
      }

      const slot = chain.slots[position];

      if (!slot.effectInstance) {
        return {
          success: false,
          error: 'No effect in slot',
        };
      }

      // Cleanup effect
      if (slot.effectInstance.disconnect) {
        try {
          slot.effectInstance.disconnect();
        } catch (error) {
          logger.error('EffectSlotService: Error disconnecting effect', { error });
        }
      }
      if (slot.effectInstance.cleanup) {
        try {
          slot.effectInstance.cleanup();
        } catch (error) {
          logger.error('EffectSlotService: Error cleaning up effect', { error });
        }
      }

      // Reset slot
      slot.effectType = null;
      slot.effectInstance = null;
      slot.enabled = false;
      slot.parameters = {};
      slot.bypass = false;

      return {
        success: true,
        slot: { ...slot },
      };
    } catch (error) {
      logger.error('EffectSlotService: Error removing effect', { error, trackId, position });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enable/disable effect in slot
   * @param trackId - Track identifier
   * @param position - Slot position (0-9)
   * @param enabled - Enable state
   * @returns EffectSlotOperationResult
   */
  setEffectEnabled(trackId: number, position: number, enabled: boolean): EffectSlotOperationResult {
    try {
      ValidationUtils.validateNumber(trackId, 'trackId');
      ValidationUtils.validateNumber(position, 'position');

      if (position < 0 || position >= MAX_EFFECT_SLOTS) {
        return {
          success: false,
          error: `Position must be between 0 and ${MAX_EFFECT_SLOTS - 1}`,
        };
      }

      const chain = this.getChain(trackId);
      if (!chain) {
        return {
          success: false,
          error: 'Effect chain not found for track',
        };
      }

      const slot = chain.slots[position];
      if (!slot.effectInstance) {
        return {
          success: false,
          error: 'No effect in slot',
        };
      }

      slot.enabled = enabled;

      if (slot.effectInstance && 'setEnabled' in slot.effectInstance) {
        (slot.effectInstance as { setEnabled: (enabled: boolean) => void }).setEnabled(enabled);
      }

      return {
        success: true,
        slot: { ...slot },
      };
    } catch (error) {
      logger.error('EffectSlotService: Error setting effect enabled', { error, trackId, position });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update effect parameters
   * @param trackId - Track identifier
   * @param position - Slot position (0-9)
   * @param parameters - Parameters to update
   * @returns EffectSlotOperationResult
   */
  updateEffectParameters(
    trackId: number,
    position: number,
    parameters: Record<string, number>
  ): EffectSlotOperationResult {
    try {
      ValidationUtils.validateNumber(trackId, 'trackId');
      ValidationUtils.validateNumber(position, 'position');

      if (position < 0 || position >= MAX_EFFECT_SLOTS) {
        return {
          success: false,
          error: `Position must be between 0 and ${MAX_EFFECT_SLOTS - 1}`,
        };
      }

      const chain = this.getChain(trackId);
      if (!chain) {
        return {
          success: false,
          error: 'Effect chain not found for track',
        };
      }

      const slot = chain.slots[position];
      if (!slot.effectInstance) {
        return {
          success: false,
          error: 'No effect in slot',
        };
      }

      // Update parameters
      slot.parameters = { ...slot.parameters, ...parameters };

      // Update effect instance if it supports parameter updates
      if (slot.effectInstance.updateParams) {
        slot.effectInstance.updateParams(parameters);
      }

      return {
        success: true,
        slot: { ...slot },
      };
    } catch (error) {
      logger.error('EffectSlotService: Error updating effect parameters', { error, trackId, position });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reorder effects - move effect from one position to another
   * @param trackId - Track identifier
   * @param fromPosition - Source position
   * @param toPosition - Destination position
   * @returns EffectSlotOperationResult
   */
  reorderEffect(trackId: number, fromPosition: number, toPosition: number): EffectSlotOperationResult {
    try {
      ValidationUtils.validateNumber(trackId, 'trackId');
      ValidationUtils.validateNumber(fromPosition, 'fromPosition');
      ValidationUtils.validateNumber(toPosition, 'toPosition');

      if (fromPosition < 0 || fromPosition >= MAX_EFFECT_SLOTS) {
        return {
          success: false,
          error: `From position must be between 0 and ${MAX_EFFECT_SLOTS - 1}`,
        };
      }

      if (toPosition < 0 || toPosition >= MAX_EFFECT_SLOTS) {
        return {
          success: false,
          error: `To position must be between 0 and ${MAX_EFFECT_SLOTS - 1}`,
        };
      }

      if (fromPosition === toPosition) {
        return {
          success: true,
        };
      }

      const chain = this.getChain(trackId);
      if (!chain) {
        return {
          success: false,
          error: 'Effect chain not found for track',
        };
      }

      const fromSlot = chain.slots[fromPosition];
      const toSlot = chain.slots[toPosition];

      // Swap effects
      const temp = { ...toSlot };
      chain.slots[toPosition] = { ...fromSlot, position: toPosition };
      chain.slots[fromPosition] = { ...temp, position: fromPosition };

      return {
        success: true,
        slot: chain.slots[toPosition],
      };
    } catch (error) {
      logger.error('EffectSlotService: Error reordering effect', { error, trackId, fromPosition, toPosition });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set bypass state for entire chain
   * @param trackId - Track identifier
   * @param bypass - Bypass state
   */
  setChainBypass(trackId: number, bypass: boolean): void {
    ValidationUtils.validateNumber(trackId, 'trackId');
    const chain = this.getChain(trackId);
    if (chain) {
      chain.bypass = bypass;
    }
  }

  /**
   * Serialize effect chain for project save
   * @param trackId - Track identifier
   * @returns Serialized chain data
   */
  serializeChain(trackId: number): SerializedEffectChain | null {
    ValidationUtils.validateNumber(trackId, 'trackId');
    const chain = this.getChain(trackId);
    if (!chain) {
      return null;
    }

    return {
      trackId: chain.trackId,
      bypass: chain.bypass,
      slots: chain.slots.map((slot) => ({
        position: slot.position,
        effectType: slot.effectType,
        enabled: slot.enabled,
        parameters: slot.parameters,
        bypass: slot.bypass,
      })),
    };
  }

  /**
   * Deserialize effect chain from project load
   * Note: Effect instances must be recreated using EffectRegistry
   * @param trackId - Track identifier
   * @param data - Serialized chain data
   */
  deserializeChain(trackId: number, data: unknown): void {
    ValidationUtils.validateNumber(trackId, 'trackId');

    if (!data || typeof data !== 'object') {
      return;
    }

    const chainData = data as {
      trackId?: number;
      bypass?: boolean;
      slots?: Array<{
        position?: number;
        effectType?: string | null;
        enabled?: boolean;
        parameters?: Record<string, number>;
        bypass?: boolean;
      }>;
    };

    const chain = this.initializeChain(trackId);
    chain.bypass = chainData.bypass ?? false;

    if (chainData.slots) {
      chainData.slots.forEach((slotData) => {
        if (slotData.position !== undefined && slotData.position >= 0 && slotData.position < MAX_EFFECT_SLOTS) {
          const slot = chain.slots[slotData.position];
          slot.effectType = (slotData.effectType as typeof slot.effectType) || null;
          slot.enabled = slotData.enabled ?? false;
          slot.parameters = slotData.parameters || {};
          slot.bypass = slotData.bypass ?? false;
          // Note: effectInstance will be created when effects are loaded
        }
      });
    }
  }

  /**
   * Clear all effects for a track
   * @param trackId - Track identifier
   */
  clearChain(trackId: number): void {
    ValidationUtils.validateNumber(trackId, 'trackId');
    const chain = this.getChain(trackId);
    if (chain) {
      chain.slots.forEach((slot) => {
        if (slot.effectInstance && slot.effectInstance.cleanup) {
          try {
            slot.effectInstance.cleanup();
          } catch (error) {
            logger.error('EffectSlotService: Error cleaning up effect during clear', { error });
          }
        }
        slot.effectType = null;
        slot.effectInstance = null;
        slot.enabled = false;
        slot.parameters = {};
        slot.bypass = false;
      });
      chain.bypass = false;
    }
  }

  /**
   * Remove chain for a track
   * @param trackId - Track identifier
   */
  removeChain(trackId: number): void {
    ValidationUtils.validateNumber(trackId, 'trackId');
    this.clearChain(trackId);
    this.chains.delete(trackId);
  }
}

/**
 * Singleton instance
 */
export const effectSlotService = new EffectSlotService();

