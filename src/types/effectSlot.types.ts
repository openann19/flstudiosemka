/**
 * Effect Slot Type Definitions
 * Type definitions for mixer effect slots and chains
 * @module types/effectSlot.types
 */

import type { EffectType } from './synthesizer.types';

/**
 * Effect slot in the mixer chain
 */
export interface EffectSlot {
  id: string;
  position: number; // 0-9 (10 slots per track)
  effectType: EffectType | null;
  effectInstance: Effect | null;
  enabled: boolean;
  parameters: Record<string, number>;
  bypass: boolean;
}

/**
 * Effect interface for audio routing
 */
export interface Effect {
  inputNode: AudioNode;
  outputNode: AudioNode;
  cleanup?: () => void;
  disconnect?: () => void;
  getEffectType?: () => EffectType;
  updateParams?: (params: Record<string, number>) => void;
}

/**
 * Effect slot state for UI
 */
export interface EffectSlotState {
  slot: EffectSlot;
  isLoading: boolean;
  error: string | null;
}

/**
 * Effect chain state for a track
 */
export interface EffectChainState {
  trackId: number;
  slots: EffectSlot[];
  bypass: boolean;
}

/**
 * Serialized effect slot (used when persisting chains)
 */
export interface SerializedEffectSlot {
  position: number;
  effectType: EffectType | null;
  enabled: boolean;
  parameters: Record<string, number>;
  bypass: boolean;
}

/**
 * Serialized effect chain representation
 */
export interface SerializedEffectChain {
  trackId: number;
  bypass: boolean;
  slots: SerializedEffectSlot[];
}

/**
 * Effect drag and drop data
 */
export interface EffectDragData {
  type: 'effect-library' | 'effect-slot';
  effectType: EffectType;
  sourceTrackId?: number;
  sourceSlotIndex?: number;
  parameters?: Record<string, number>;
  slotId?: string;
}

/**
 * Effect slot operation result
 */
export interface EffectSlotOperationResult {
  success: boolean;
  error?: string;
  slot?: EffectSlot;
}

