/**
 * useDrumKits - Hook to initialize and manage drum samplepacks
 * Loads 909 Techno Pack and registers with InstrumentManager
 * @module hooks/useDrumKits
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SamplePackBank } from '../audio/drums/SamplePackBank';
import type { InstrumentManager } from '../audio/InstrumentManager';

/**
 * Return type for useDrumKits hook
 */
export interface UseDrumKitsReturn {
  samplePackBank: SamplePackBank | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  initialize: () => Promise<void>;
}

/**
 * Hook to manage drum samplepacks
 * @param audioContext - Web Audio API AudioContext
 * @param instrumentManager - Optional InstrumentManager instance
 * @returns Drum kits state and methods
 */
export function useDrumKits(
  audioContext: AudioContext | null,
  instrumentManager?: InstrumentManager | null
): UseDrumKitsReturn {
  const [samplePackBank, setSamplePackBank] = useState<SamplePackBank | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const initializationRef = useRef<boolean>(false);

  /**
   * Initialize sample pack bank
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (!audioContext || initializationRef.current) {
      return;
    }

    if (isLoading || isInitialized) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create sample pack bank
      const bank = new SamplePackBank(audioContext);
      
      // Initialize and load all samples
      await bank.initialize();

      // Register samples with InstrumentManager if provided
      if (instrumentManager) {
        const categories = bank.getCategories();
        
        for (const category of categories) {
          const samples = bank.getSamplesByCategory(category);
          
          // Create instrument config for this category
          const instrumentSamples: Record<string, AudioBuffer> = {};
          
          samples.forEach((soundItem) => {
            const buffer = bank.getSample(soundItem.name, category);
            if (buffer) {
              // Use note name based on sample type
              const noteName = getNoteNameForSample(soundItem.name, category);
              instrumentSamples[noteName] = buffer;
            }
          });

          if (Object.keys(instrumentSamples).length > 0) {
            try {
              await instrumentManager.registerInstrument(
                `909 ${category}`,
                {
                  samples: instrumentSamples,
                  defaultVelocity: 1.0,
                  loop: false,
                }
              );
            } catch (err) {
               
              console.error(`[DEBUG] useDrumKits: Failed to register instrument for ${category}`, err);
            }
          }
        }
      }

      setSamplePackBank(bank);
      setIsInitialized(true);
      initializationRef.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
       
      console.error('[DEBUG] useDrumKits: Failed to initialize', error);
    } finally {
      setIsLoading(false);
    }
  }, [audioContext, instrumentManager, isLoading, isInitialized]);

  /**
   * Auto-initialize when audio context is available
   */
  useEffect(() => {
    if (audioContext && !initializationRef.current && !isLoading && !isInitialized) {
      initialize().catch((err) => {
         
        console.error('[DEBUG] useDrumKits: Auto-initialization failed', err);
      });
    }
  }, [audioContext, initialize, isLoading, isInitialized]);

  return {
    samplePackBank,
    isInitialized,
    isLoading,
    error,
    initialize,
  };
}

/**
 * Get note name for sample based on name and category
 */
function getNoteNameForSample(name: string, category: string): string {
  // Map common drum names to MIDI note names
  const nameLower = name.toLowerCase();
  
  // Kicks typically map to C2-C3
  if (category === 'Kicks') {
    if (nameLower.includes('deep') || nameLower.includes('sub')) {
      return 'C2';
    }
    if (nameLower.includes('punchy') || nameLower.includes('hard')) {
      return 'C#2';
    }
    return 'C2';
  }

  // Snares typically map to D2-D3
  if (category === 'Snares') {
    if (nameLower.includes('tight') || nameLower.includes('short')) {
      return 'D#2';
    }
    if (nameLower.includes('fat') || nameLower.includes('long')) {
      return 'D2';
    }
    return 'D2';
  }

  // Hi-hats typically map to F#2-G#2
  if (category === 'HiHats') {
    if (nameLower.includes('open')) {
      return 'F#2';
    }
    if (nameLower.includes('closed')) {
      return 'G2';
    }
    return 'G2';
  }

  // Crashes typically map to C#3-D#3
  if (category === 'Crashes') {
    return 'C#3';
  }

  // Rides typically map to E3-F#3
  if (category === 'Rides') {
    return 'E3';
  }

  // Rimshots typically map to D#2
  if (category === 'Rimshots') {
    return 'D#2';
  }

  // Claps typically map to E2
  if (category === 'Claps') {
    return 'E2';
  }

  // Default to C3
  return 'C3';
}

