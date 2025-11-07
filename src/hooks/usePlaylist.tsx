/**
 * usePlaylist - Playlist and timeline management hook
 * Strict TypeScript implementation with comprehensive error handling
 * Composes modular hooks for arrangements, snap/quantization, and clip operations
 */

import { useState, useCallback } from 'react';
import type { Arrangement, Clip, SnapSetting, ToolType } from '../types/FLStudio.types';
import { useArrangements } from './useArrangements';
import { useSnapQuantization } from './useSnapQuantization';
import { useClipOperations } from './useClipOperations';

const TRACK_COLOR_PALETTE = ['#FF9933', '#FF5E57', '#00C5FF', '#8C5AFF', '#FFD166', '#6DD400', '#F6A6FF', '#4CD964'];

interface UsePlaylistProps {
  beatsPerBar: number;
  stepsPerBeat: number;
  basePixelsPerBeat: number;
  timelineUtils: unknown;
}

// Parameter names in function types are for documentation only
 
interface UsePlaylistReturn {
  arrangements: Arrangement[];
  currentArrangementId: string | null;
  selectedTool: ToolType;
  snapSetting: SnapSetting;
  zoomLevel: number;
  clipCounter: number;
  pointerState: {
    isPointerDown: boolean;
    originBeat: number;
    currentBeat: number;
    trackId: string | null;
    clipId: string | null;
    lastPaintBeat: number | null;
  };
  setCurrentArrangementId: (id: string | null) => void;
  setSelectedTool: (tool: ToolType) => void;
  setSnapSetting: (setting: SnapSetting) => void;
  adjustZoom: (delta: number) => void;
  addClipToTrack: (trackId: string, clipData: Partial<Clip>) => Clip | null;
  removeClip: (clipId: string) => boolean;
  duplicateClip: (clipId: string, offsetBeats: number) => Clip | null;
  updateClipTiming: (clipId: string, updates: { start?: number; length?: number }) => Clip | null;
  generateClipId: () => string;
  initializeDefaultArrangement: () => void;
  getCurrentArrangement: () => Arrangement | null;
}
 

export function usePlaylist({
  beatsPerBar,
  stepsPerBeat,
  basePixelsPerBeat: _basePixelsPerBeat, // Reserved for future use
  timelineUtils,
}: UsePlaylistProps): UsePlaylistReturn {
  void _basePixelsPerBeat; // Mark as intentionally unused

  // Modular hooks
  const {
    arrangements,
    currentArrangementId,
    setCurrentArrangementId,
    getCurrentArrangement,
    calculateTotalBeats,
    setArrangements,
  } = useArrangements({ beatsPerBar, timelineUtils });

  const { snapSetting, setSnapSetting, getSnapInterval, quantizeBeat } = useSnapQuantization({
    beatsPerBar,
    stepsPerBeat,
  });

  // Clamp beat to arrangement bounds
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

  const {
    clipCounter,
    generateClipId,
    addClipToTrack,
    removeClip,
    duplicateClip,
    updateClipTiming,
  } = useClipOperations({
    getCurrentArrangement,
    setArrangements,
    clampBeatToArrangement,
    quantizeBeat,
    getSnapInterval,
    calculateTotalBeats,
    stepsPerBeat,
  });

  // Local state
  const [selectedTool, setSelectedTool] = useState<ToolType>('draw');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pointerState] = useState({
    isPointerDown: false,
    originBeat: 0,
    currentBeat: 0,
    trackId: null as string | null,
    clipId: null as string | null,
    lastPaintBeat: null as number | null,
  });

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
  }, [arrangements.length, generateClipId, setArrangements, setCurrentArrangementId]);

  /**
   * Adjust zoom
   */
  const adjustZoom = useCallback((delta: number) => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(0.4, Math.min(4, prev + delta));
      return Math.abs(newZoom - prev) < 0.001 ? prev : newZoom;
    });
  }, []);

  return {
    arrangements,
    currentArrangementId,
    selectedTool,
    snapSetting,
    zoomLevel,
    clipCounter,
    pointerState,
    setCurrentArrangementId,
    setSelectedTool,
    setSnapSetting,
    adjustZoom,
    addClipToTrack,
    removeClip,
    duplicateClip,
    updateClipTiming,
    generateClipId,
    initializeDefaultArrangement,
    getCurrentArrangement,
  };
}
