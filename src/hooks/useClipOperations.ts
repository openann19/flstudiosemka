/**
 * useClipOperations - Clip CRUD operations hook
 * Handles adding, removing, updating, and duplicating clips
 */

import { useState, useRef, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Arrangement, Clip } from '../types/FLStudio.types';
import { updateTrackClips, findClipInArrangement } from './usePlaylist.utils';

// Parameter names in function types are for documentation only
/* eslint-disable no-unused-vars */
interface UseClipOperationsProps {
  getCurrentArrangement: () => Arrangement | null;
  setArrangements: Dispatch<SetStateAction<Arrangement[]>>;
  clampBeatToArrangement: (beat: number) => number;
  quantizeBeat: (beat: number, mode?: 'nearest' | 'floor' | 'ceil') => number;
  getSnapInterval: () => number;
  calculateTotalBeats: (arrangement: Arrangement) => number;
  stepsPerBeat: number;
}

interface UseClipOperationsReturn {
  clipCounter: number;
  generateClipId: () => string;
  addClipToTrack: (trackId: string, clipData: Partial<Clip>) => Clip | null;
  removeClip: (clipId: string) => boolean;
  duplicateClip: (clipId: string, offsetBeats: number) => Clip | null;
  updateClipTiming: (clipId: string, updates: { start?: number; length?: number }) => Clip | null;
}
/* eslint-enable no-unused-vars */

/**
 * Hook for managing clip operations
 */
export function useClipOperations({
  getCurrentArrangement,
  setArrangements,
  clampBeatToArrangement,
  quantizeBeat,
  getSnapInterval,
  calculateTotalBeats,
  stepsPerBeat,
}: UseClipOperationsProps): UseClipOperationsReturn {
  const [clipCounter, setClipCounter] = useState<number>(0);
  const clipCounterRef = useRef<number>(0);

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
   * Find clip by ID
   */
  const findClipById = useCallback(
    (clipId: string): { track: { clips: Clip[]; id: string }; clip: Clip; index: number } | null => {
      const arrangement = getCurrentArrangement();
      if (!arrangement) {
        return null;
      }
      return findClipInArrangement(arrangement, clipId);
    },
    [getCurrentArrangement]
  );

  /**
   * Add clip to track
   */
  const addClipToTrack = useCallback(
    (trackId: string, clipData: Partial<Clip>): Clip | null => {
      const arrangement = getCurrentArrangement();
      if (!arrangement) {
        return null;
      }

      const track = arrangement.tracks.find((t) => t.id === trackId);
      if (!track) {
        return null;
      }

      const clip: Clip = {
        id: clipData.id || generateClipId(),
        type: clipData.type || 'pattern',
        start: clampBeatToArrangement(quantizeBeat(clipData.start || 0, 'floor')),
        length: Math.max(clipData.length || 1, getSnapInterval() || 1 / stepsPerBeat),
        name: clipData.name || 'Pattern Clip',
        ...clipData,
      };

      const totalBeats = calculateTotalBeats(arrangement);
      clip.length = Math.min(clip.length, totalBeats - clip.start);

      setArrangements((prev) =>
        updateTrackClips(prev, arrangement.id, trackId, (clips) => [...clips, clip])
      );

      return clip;
    },
    [
      getCurrentArrangement,
      generateClipId,
      clampBeatToArrangement,
      quantizeBeat,
      getSnapInterval,
      stepsPerBeat,
      calculateTotalBeats,
      setArrangements,
    ]
  );

  /**
   * Remove clip
   */
  const removeClip = useCallback(
    (clipId: string): boolean => {
      const result = findClipById(clipId);
      if (!result) {
        return false;
      }

      const arrangement = getCurrentArrangement();
      if (!arrangement) {
        return false;
      }

      setArrangements((prev) =>
        updateTrackClips(prev, arrangement.id, result.track.id, (clips) =>
          clips.filter((c) => c.id !== clipId)
        )
      );

      return true;
    },
    [findClipById, getCurrentArrangement, setArrangements]
  );

  /**
   * Update clip timing
   */
  const updateClipTiming = useCallback(
    (clipId: string, updates: { start?: number; length?: number }): Clip | null => {
      const result = findClipById(clipId);
      if (!result) {
        return null;
      }

      const arrangement = getCurrentArrangement();
      if (!arrangement) {
        return null;
      }

      const updatedClip: Clip = { ...result.clip };

      if (updates.start !== undefined) {
        updatedClip.start = clampBeatToArrangement(updates.start);
      }
      if (updates.length !== undefined) {
        updatedClip.length = Math.max(updates.length, getSnapInterval() || 1 / stepsPerBeat);
      }

      const totalBeats = calculateTotalBeats(arrangement);
      updatedClip.length = Math.min(updatedClip.length, totalBeats - updatedClip.start);

      setArrangements((prev) =>
        updateTrackClips(prev, arrangement.id, result.track.id, (clips) =>
          clips.map((c) => (c.id === clipId ? updatedClip : c))
        )
      );

      return updatedClip;
    },
    [
      findClipById,
      getCurrentArrangement,
      clampBeatToArrangement,
      getSnapInterval,
      stepsPerBeat,
      calculateTotalBeats,
      setArrangements,
    ]
  );

  /**
   * Duplicate clip
   */
  const duplicateClip = useCallback(
    (clipId: string, offsetBeats: number): Clip | null => {
      const result = findClipById(clipId);
      if (!result) {
        return null;
      }

      const clone: Clip = {
        ...result.clip,
        id: generateClipId(),
        start: clampBeatToArrangement(result.clip.start + offsetBeats),
      };

      const arrangement = getCurrentArrangement();
      if (!arrangement) {
        return null;
      }

      const totalBeats = calculateTotalBeats(arrangement);
      clone.length = Math.min(clone.length, totalBeats - clone.start);

      setArrangements((prev) =>
        updateTrackClips(prev, arrangement.id, result.track.id, (clips) => [...clips, clone])
      );

      return clone;
    },
    [
      findClipById,
      generateClipId,
      clampBeatToArrangement,
      getCurrentArrangement,
      calculateTotalBeats,
      setArrangements,
    ]
  );

  return {
    clipCounter,
    generateClipId,
    addClipToTrack,
    removeClip,
    duplicateClip,
    updateClipTiming,
  };
}
