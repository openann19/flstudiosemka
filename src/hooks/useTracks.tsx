/**
 * useTracks - Track management hook
 * Strict TypeScript implementation with comprehensive error handling
 */

import { useState, useCallback } from 'react';
import type { Track, TrackType } from '../types/FLStudio.types';

interface UseTracksReturn {
  tracks: Track[];
  addTrack: (name: string, type: TrackType) => void;
  deleteTrack: (trackId: number) => void;
  toggleStep: (trackId: number, stepIndex: number) => void;
  toggleMute: (trackId: number) => void;
  toggleSolo: (trackId: number) => void;
  duplicateTrack: (trackId: number) => void;
  clearPattern: (trackId: number) => void;
  generateAIPattern: (trackId: number) => void;
  updateTrackName: (trackId: number, name: string) => void;
  getTrackColor: (type: TrackType, id: number) => string;
}

export function useTracks(initialTracks: Track[] = []): UseTracksReturn {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);

  /**
   * Get track color
   */
  const getTrackColor = useCallback((type: TrackType, id: number): string => {
    const colors: Record<TrackType, string[]> = {
      drum: ['#FF6B6B', '#E84C3D', '#FF9F43', '#F5A623'],
      synth: ['#4A90E2', '#5DADE2', '#BB8FCE', '#AF7AC5'],
      sample: ['#48C9B0', '#16A085', '#1ABC9C', '#0B5345'],
      effect: ['#48C9B0', '#16A085', '#1ABC9C', '#0B5345'],
      plugin: ['#48C9B0', '#16A085', '#1ABC9C', '#0B5345'],
    };
    const colorArray = colors[type] || colors.drum;
    const color = colorArray[id % colorArray.length];
    return color ?? '#FF9933';
  }, []);

  /**
   * Add track
   */
  const addTrack = useCallback(
    (name: string, type: TrackType) => {
      setTracks((prev) => {
        const newId = prev.length;
        const newTrack: Track = {
          id: newId,
          name,
          type,
          steps: Array(16).fill(false),
          muted: false,
          solo: false,
          color: getTrackColor(type, newId),
        };

        // Add basic patterns based on type
        if (type === 'drum') {
          const nameLower = name.toLowerCase();
          if (nameLower.includes('kick')) {
            newTrack.steps[0] = true;
            newTrack.steps[8] = true;
          } else if (nameLower.includes('snare')) {
            newTrack.steps[4] = true;
            newTrack.steps[12] = true;
          } else if (nameLower.includes('hi-hat') || nameLower.includes('hat')) {
            newTrack.steps[0] = true;
            newTrack.steps[4] = true;
            newTrack.steps[8] = true;
            newTrack.steps[12] = true;
          } else {
            newTrack.steps[0] = true;
            newTrack.steps[8] = true;
          }
        } else if (type === 'synth') {
          const nameLower = name.toLowerCase();
          if (nameLower.includes('bass')) {
            newTrack.steps[0] = true;
            newTrack.steps[6] = true;
            newTrack.steps[8] = true;
            newTrack.steps[14] = true;
          } else if (nameLower.includes('lead')) {
            newTrack.steps[0] = true;
            newTrack.steps[2] = true;
            newTrack.steps[4] = true;
            newTrack.steps[6] = true;
          } else {
            newTrack.steps[0] = true;
            newTrack.steps[8] = true;
          }
        }

        return [...prev, newTrack];
      });
    },
    [getTrackColor]
  );

  /**
   * Delete track
   */
  const deleteTrack = useCallback(
    (trackId: number) => {
      if (tracks.length <= 1) {
        return;
      }

      setTracks((prev) => {
        const newTracks = prev.filter((t) => t.id !== trackId);
        return newTracks.map((t, i) => ({ ...t, id: i }));
      });
    },
    [tracks.length]
  );

  /**
   * Toggle step
   */
  const toggleStep = useCallback((trackId: number, stepIndex: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          const newSteps = [...track.steps];
          newSteps[stepIndex] = !newSteps[stepIndex];
          return { ...track, steps: newSteps };
        }
        return track;
      })
    );
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback((trackId: number) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, muted: !track.muted } : track))
    );
  }, []);

  /**
   * Toggle solo
   */
  const toggleSolo = useCallback((trackId: number) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, solo: !track.solo } : track))
    );
  }, []);

  /**
   * Duplicate track
   */
  const duplicateTrack = useCallback((trackId: number) => {
    setTracks((prev) => {
      const original = prev.find((t) => t.id === trackId);
      if (!original) {
        return prev;
      }

      const duplicate: Track = {
        ...original,
        id: prev.length,
        name: `${original.name} (Copy)`,
      };

      return [...prev, duplicate];
    });
  }, []);

  /**
   * Clear pattern
   */
  const clearPattern = useCallback((trackId: number) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId ? { ...track, steps: Array(16).fill(false) } : track
      )
    );
  }, []);

  /**
   * Generate AI pattern
   */
  const generateAIPattern = useCallback((trackId: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) {
          return track;
        }

        const pattern = Array(16).fill(false);
        const nameLower = track.name.toLowerCase();

        if (track.type === 'drum') {
          if (nameLower.includes('kick')) {
            pattern[0] = true;
            pattern[8] = true;
            if (Math.random() > 0.7) pattern[12] = true;
          } else if (nameLower.includes('snare')) {
            pattern[4] = true;
            pattern[12] = true;
          } else if (nameLower.includes('hi-hat')) {
            for (let i = 0; i < 16; i += 1) {
              pattern[i] = Math.random() > 0.3;
            }
            pattern[0] = true;
            pattern[8] = true;
          } else {
            pattern[4] = true;
            pattern[12] = true;
            if (Math.random() > 0.5) pattern[6] = true;
          }
        } else if (track.type === 'synth') {
          if (nameLower.includes('bass')) {
            const bassNotes = [0, 4, 7, 12];
            let noteIndex = 0;
            for (let i = 0; i < 16; i += 4) {
              pattern[i] = true;
              noteIndex = (noteIndex + 1) % bassNotes.length;
            }
          } else if (nameLower.includes('lead')) {
            for (let i = 0; i < 16; i += 2) {
              pattern[i] = Math.random() > 0.3;
            }
          } else if (nameLower.includes('pad')) {
            pattern[0] = true;
            if (Math.random() > 0.7) pattern[8] = true;
          } else {
            for (let i = 0; i < 16; i += 1) {
              pattern[i] = Math.random() > 0.7;
            }
          }
        } else {
          for (let i = 0; i < 16; i += 1) {
            pattern[i] = Math.random() > 0.6;
          }
          pattern[0] = true;
        }

        return { ...track, steps: pattern };
      })
    );
  }, []);

  /**
   * Update track name
   */
  const updateTrackName = useCallback((trackId: number, name: string) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, name } : track))
    );
  }, []);

  return {
    tracks,
    addTrack,
    deleteTrack,
    toggleStep,
    toggleMute,
    toggleSolo,
    duplicateTrack,
    clearPattern,
    generateAIPattern,
    updateTrackName,
    getTrackColor,
  };
}

