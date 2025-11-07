/**
 * useArrangements - Arrangement state management hook
 * Handles arrangement creation, selection, and timeline calculations
 */

import { useState, useCallback } from 'react';
import type { Arrangement } from '../types/FLStudio.types';

interface UseArrangementsProps {
  beatsPerBar: number;
  timelineUtils: unknown;
}

interface UseArrangementsReturn {
  arrangements: Arrangement[];
  currentArrangementId: string | null;
  setCurrentArrangementId: (id: string | null) => void;
  getCurrentArrangement: () => Arrangement | null;
  calculateTotalBeats: (arrangement: Arrangement) => number;
  setArrangements: React.Dispatch<React.SetStateAction<Arrangement[]>>;
}

// Parameter names in function types are for documentation only
/* eslint-disable no-unused-vars */
type BarsToBeatsFunction = (bars: number, beatsPerBar: number) => number;
/* eslint-enable no-unused-vars */

/**
 * Hook for managing arrangements state
 */
export function useArrangements({
  beatsPerBar,
  timelineUtils,
}: UseArrangementsProps): UseArrangementsReturn {
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [currentArrangementId, setCurrentArrangementId] = useState<string | null>(null);

  /**
   * Calculate total beats for an arrangement
   */
  const calculateTotalBeats = useCallback(
    (arrangement: Arrangement): number => {
      if (
        timelineUtils &&
        typeof timelineUtils === 'object' &&
        'barsToBeats' in timelineUtils &&
        typeof (timelineUtils as { barsToBeats: BarsToBeatsFunction }).barsToBeats === 'function'
      ) {
        return (timelineUtils as { barsToBeats: BarsToBeatsFunction }).barsToBeats(
          arrangement.lengthBars,
          beatsPerBar
        );
      }

      return arrangement.lengthBars * beatsPerBar;
    },
    [timelineUtils, beatsPerBar]
  );

  /**
   * Get current arrangement
   */
  const getCurrentArrangement = useCallback((): Arrangement | null => {
    return arrangements.find((arr) => arr.id === currentArrangementId) || null;
  }, [arrangements, currentArrangementId]);

  return {
    arrangements,
    currentArrangementId,
    setCurrentArrangementId,
    getCurrentArrangement,
    calculateTotalBeats,
    setArrangements,
  };
}

