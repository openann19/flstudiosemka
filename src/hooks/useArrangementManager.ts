/**
 * useArrangementManager - Arrangement state management hook
 * Handles arrangement state, calculations, and initialization
 * @module hooks/useArrangementManager
 */

import { useState, useCallback, useRef } from 'react';
import type { Arrangement } from '../types/FLStudio.types';

interface UseArrangementManagerProps {
  beatsPerBar: number;
  timelineUtils: unknown;
}

interface UseArrangementManagerReturn {
  arrangements: Arrangement[];
  currentArrangementId: string | null;
  clipCounter: number;
  setArrangements: React.Dispatch<React.SetStateAction<Arrangement[]>>;
  setCurrentArrangementId: (id: string | null) => void;
  getCurrentArrangement: () => Arrangement | null;
  calculateTotalBeats: (arrangement: Arrangement) => number;
  clampBeatToArrangement: (beat: number) => number;
  generateClipId: () => string;
  initializeDefaultArrangement: () => void;
}

// Parameter names in function types are for documentation only
 
type BarsToBeatsFunction = (bars: number, beatsPerBar: number) => number;
 

const TRACK_COLOR_PALETTE = ['#FF9933', '#FF5E57', '#00C5FF', '#8C5AFF', '#FFD166', '#6DD400', '#F6A6FF', '#4CD964'];

/**
 * Hook for managing arrangements
 */
export function useArrangementManager({
  beatsPerBar,
  timelineUtils,
}: UseArrangementManagerProps): UseArrangementManagerReturn {
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [currentArrangementId, setCurrentArrangementId] = useState<string | null>(null);
  const [clipCounter, setClipCounter] = useState<number>(0);
  const clipCounterRef = useRef<number>(0);

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
   * Generate clip ID
   */
  const generateClipId = useCallback((): string => {
    clipCounterRef.current += 1;
    const newId = `clip-${clipCounterRef.current}`;
    setClipCounter(clipCounterRef.current);
    return newId;
  }, []);

  /**
   * Get current arrangement
   */
  const getCurrentArrangement = useCallback((): Arrangement | null => {
    return arrangements.find((arr) => arr.id === currentArrangementId) || null;
  }, [arrangements, currentArrangementId]);

  /**
   * Clamp beat to arrangement bounds
   */
  const clampBeatToArrangement = useCallback(
    (beat: number): number => {
      const arrangement = getCurrentArrangement();
      if (!arrangement) {
        return beat;
      }

      const totalBeats = calculateTotalBeats(arrangement);
      return Math.max(0, Math.min(beat, totalBeats));
    },
    [getCurrentArrangement, calculateTotalBeats]
  );

  /**
   * Initialize default arrangement
   */
  const initializeDefaultArrangement = useCallback(() => {
    if (arrangements.length > 0) {
      return;
    }

    const defaultTracks = [
      {
        id: 'track-1',
        name: 'Drums',
        mode: 'Pattern Track',
        mixerChannel: 'Drums',
        color: TRACK_COLOR_PALETTE[0] ?? '#FF9933',
        clips: [
          { id: generateClipId(), type: 'pattern' as const, patternId: 1, start: 0, length: 4, name: 'Pattern 1' },
          { id: generateClipId(), type: 'pattern' as const, patternId: 1, start: 4, length: 4, name: 'Pattern 1' },
        ],
      },
      {
        id: 'track-2',
        name: 'Bass Synth',
        mode: 'Instrument Track',
        mixerChannel: 'Bass',
        color: TRACK_COLOR_PALETTE[3] ?? '#8C5AFF',
        clips: [{ id: generateClipId(), type: 'pattern' as const, patternId: 2, start: 0, length: 8, name: 'Bass Groove' }],
      },
      {
        id: 'track-3',
        name: 'Pad Atmosphere',
        mode: 'Audio Track',
        mixerChannel: 'Pads',
        color: TRACK_COLOR_PALETTE[2] ?? '#00C5FF',
        clips: [{ id: generateClipId(), type: 'audio' as const, audioId: 'pad_loop', start: 0, length: 8, name: 'Pad Atmosphere' }],
      },
      {
        id: 'track-4',
        name: 'Filter Sweep',
        mode: 'Automation Track',
        mixerChannel: 'Master',
        color: TRACK_COLOR_PALETTE[6] ?? '#F6A6FF',
        clips: [{ id: generateClipId(), type: 'automation' as const, automationTarget: 'filterCutoff', start: 4, length: 4, name: 'Filter Sweep' }],
      },
    ];

    const defaultArrangement: Arrangement = {
      id: 'arrangement-1',
      name: 'Arrangement 1',
      lengthBars: 8,
      tracks: defaultTracks,
      markers: [],
    };

    setArrangements([defaultArrangement]);
    setCurrentArrangementId(defaultArrangement.id);
    setClipCounter(defaultTracks.reduce((acc, track) => acc + track.clips.length, 0));
  }, [arrangements.length, generateClipId]);

  return {
    arrangements,
    currentArrangementId,
    clipCounter,
    setArrangements,
    setCurrentArrangementId,
    getCurrentArrangement,
    calculateTotalBeats,
    clampBeatToArrangement,
    generateClipId,
    initializeDefaultArrangement,
  };
}

