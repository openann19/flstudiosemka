/**
 * useEffectSlots - React hook for effect slot management
 * Provides state and operations for managing effect slots per track
 * @module hooks/useEffectSlots
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { EffectSlot, EffectChainState } from '../types/effectSlot.types';
import type { EffectType } from '../types/synthesizer.types';
import { effectSlotService } from '../services/EffectSlotService';
import { effectRegistry } from '../services/EffectRegistry';
import { logger } from '../utils/logger';

/**
 * Hook return type
 */
export interface UseEffectSlotsReturn {
  chain: EffectChainState | null;
  slots: EffectSlot[];
  isLoading: boolean;
  error: string | null;
  addEffect: (position: number, effectType: EffectType, parameters?: Record<string, number>) => Promise<boolean>;
  removeEffect: (position: number) => boolean;
  setEffectEnabled: (position: number, enabled: boolean) => boolean;
  updateEffectParameters: (position: number, parameters: Record<string, number>) => boolean;
  reorderEffect: (fromPosition: number, toPosition: number) => boolean;
  setChainBypass: (bypass: boolean) => void;
  refresh: () => void;
}

/**
 * React hook for managing effect slots
 * @param trackId - Track identifier
 * @param audioContext - Web Audio API AudioContext (optional, for creating effects)
 * @returns Effect slot management functions and state
 */
export function useEffectSlots(trackId: number, audioContext: AudioContext | null = null): UseEffectSlotsReturn {
  const [chain, setChain] = useState<EffectChainState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(audioContext);

  // Update audio context ref
  useEffect(() => {
    audioContextRef.current = audioContext;
  }, [audioContext]);

  /**
   * Refresh chain state
   */
  const refresh = useCallback(() => {
    try {
      const currentChain = effectSlotService.getChain(trackId);
      if (!currentChain) {
        effectSlotService.initializeChain(trackId);
        setChain(effectSlotService.getChain(trackId));
      } else {
        setChain({ ...currentChain });
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh effect chain';
      setError(errorMessage);
      logger.error('useEffectSlots: Error refreshing chain', { error: err, trackId });
    }
  }, [trackId]);

  // Initialize chain on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Add effect to slot
   */
  const addEffect = useCallback(
    async (position: number, effectType: EffectType, parameters?: Record<string, number>): Promise<boolean> => {
      if (!audioContextRef.current) {
        setError('AudioContext not available');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get default parameters if not provided
        const defaultParams = effectRegistry.getDefaultParameters(effectType);
        const mergedParams = { ...defaultParams, ...(parameters || {}) };

        // Create effect instance
        const effectInstance = effectRegistry.createEffect(audioContextRef.current, effectType, mergedParams);

        // Add to slot
        const result = effectSlotService.addEffect(trackId, position, effectInstance, mergedParams);

        if (result.success) {
          refresh();
          return true;
        }
        setError(result.error || 'Failed to add effect');
        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add effect';
        setError(errorMessage);
        logger.error('useEffectSlots: Error adding effect', { error: err, trackId, position, effectType });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [trackId, refresh]
  );

  /**
   * Remove effect from slot
   */
  const removeEffect = useCallback(
    (position: number): boolean => {
      setError(null);

      try {
        const result = effectSlotService.removeEffect(trackId, position);

        if (result.success) {
          refresh();
          return true;
        }
        setError(result.error || 'Failed to remove effect');
        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove effect';
        setError(errorMessage);
        logger.error('useEffectSlots: Error removing effect', { error: err, trackId, position });
        return false;
      }
    },
    [trackId, refresh]
  );

  /**
   * Enable/disable effect
   */
  const setEffectEnabled = useCallback(
    (position: number, enabled: boolean): boolean => {
      setError(null);

      try {
        const result = effectSlotService.setEffectEnabled(trackId, position, enabled);

        if (result.success) {
          refresh();
          return true;
        }
        setError(result.error || 'Failed to set effect enabled state');
        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set effect enabled';
        setError(errorMessage);
        logger.error('useEffectSlots: Error setting effect enabled', { error: err, trackId, position });
        return false;
      }
    },
    [trackId, refresh]
  );

  /**
   * Update effect parameters
   */
  const updateEffectParameters = useCallback(
    (position: number, parameters: Record<string, number>): boolean => {
      setError(null);

      try {
        const result = effectSlotService.updateEffectParameters(trackId, position, parameters);

        if (result.success) {
          refresh();
          return true;
        }
        setError(result.error || 'Failed to update effect parameters');
        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update effect parameters';
        setError(errorMessage);
        logger.error('useEffectSlots: Error updating effect parameters', { error: err, trackId, position });
        return false;
      }
    },
    [trackId, refresh]
  );

  /**
   * Reorder effect
   */
  const reorderEffect = useCallback(
    (fromPosition: number, toPosition: number): boolean => {
      setError(null);

      try {
        const result = effectSlotService.reorderEffect(trackId, fromPosition, toPosition);

        if (result.success) {
          refresh();
          return true;
        }
        setError(result.error || 'Failed to reorder effect');
        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reorder effect';
        setError(errorMessage);
        logger.error('useEffectSlots: Error reordering effect', { error: err, trackId, fromPosition, toPosition });
        return false;
      }
    },
    [trackId, refresh]
  );

  /**
   * Set chain bypass
   */
  const setChainBypass = useCallback(
    (bypass: boolean): void => {
      try {
        effectSlotService.setChainBypass(trackId, bypass);
        refresh();
      } catch (err) {
        logger.error('useEffectSlots: Error setting chain bypass', { error: err, trackId });
      }
    },
    [trackId, refresh]
  );

  return {
    chain,
    slots: chain?.slots || [],
    isLoading,
    error,
    addEffect,
    removeEffect,
    setEffectEnabled,
    updateEffectParameters,
    reorderEffect,
    setChainBypass,
    refresh,
  };
}

