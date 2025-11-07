/**
 * usePlaylist utilities - Helper functions for playlist operations
 * Extracted to reduce complexity of main hook
 */

import type { Arrangement, Clip, ArrangementTrack } from '../types/FLStudio.types';

const TRACK_COLOR_PALETTE = ['#FF9933', '#FF5E57', '#00C5FF', '#8C5AFF', '#FFD166', '#6DD400', '#F6A6FF', '#4CD964'];

/**
 * Generate default tracks for initial arrangement
 */
export function createDefaultTracks(generateClipId: () => string): ArrangementTrack[] {
  return [
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
}

/**
 * Create default arrangement
 */
export function createDefaultArrangement(generateClipId: () => string): Arrangement {
  const defaultTracks = createDefaultTracks(generateClipId);
  return {
    id: 'arrangement-1',
    name: 'Arrangement 1',
    lengthBars: 8,
    tracks: defaultTracks,
    markers: [],
  };
}

/**
 * Sort clips by start time, then by ID
 */
export function sortClips(clips: Clip[]): Clip[] {
  return [...clips].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}

/**
 * Update clips in a specific track within an arrangement
 */
export function updateTrackClips(
  arrangements: Arrangement[],
  arrangementId: string,
  trackId: string,
  updateFn: (clips: Clip[]) => Clip[]
): Arrangement[] {
  return arrangements.map((arr) => {
    if (arr.id === arrangementId) {
      return {
        ...arr,
        tracks: arr.tracks.map((t) => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: updateFn(t.clips),
            };
          }
          return t;
        }),
      };
    }
    return arr;
  });
}

/**
 * Find clip by ID across all tracks in an arrangement
 */
export function findClipInArrangement(
  arrangement: Arrangement,
  clipId: string
): { track: { clips: Clip[]; id: string }; clip: Clip; index: number } | null {
  for (const track of arrangement.tracks) {
    const index = track.clips.findIndex((clip) => clip.id === clipId);
    if (index !== -1) {
      const clip = track.clips[index];
      if (clip !== undefined) {
        return { track, clip, index };
      }
    }
  }
  return null;
}

