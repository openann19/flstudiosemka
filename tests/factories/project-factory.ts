/**
 * Project factory for test data
 * Creates test ProjectData objects with sensible defaults
 * @module tests/factories/project-factory
 */

import type { ProjectData, Track, Arrangement } from '../../src/types/FLStudio.types';
import { createTrack, type TrackFactoryOptions } from './track-factory';

/**
 * Project factory options
 */
export interface ProjectFactoryOptions {
  name?: string;
  bpm?: number;
  tracks?: Track[];
  currentPattern?: number;
  arrangements?: Arrangement[];
  currentArrangementId?: string | null;
  zoomLevel?: number;
  snapSetting?: 'none' | 'line' | 'beat' | 'bar';
  selectedTool?: 'draw' | 'paint' | 'select' | 'slip' | 'delete' | 'mute' | 'slice';
  clipCounter?: number;
}

/**
 * Create a test project with default values
 * @param options - Override default project properties
 * @returns ProjectData object
 */
export function createProject(options: ProjectFactoryOptions = {}): ProjectData {
  const {
    name = 'Test Project',
    bpm = 120,
    tracks,
    currentPattern = 0,
    arrangements,
    currentArrangementId = null,
    zoomLevel = 1.0,
    snapSetting = 'beat',
    selectedTool = 'draw',
    clipCounter = 0,
  } = options;

  const defaultTracks = tracks ?? [createTrack({ id: 0, name: 'Track 1' })];

  const defaultArrangements: Arrangement[] = arrangements ?? [
    {
      id: 'arrangement-1',
      name: 'Arrangement 1',
      tracks: defaultTracks.map((track) => ({
        id: `track-${track.id}`,
        name: track.name,
        mode: 'normal',
        mixerChannel: `mixer-${track.id}`,
        color: track.color ?? '#FF9933',
        clips: [],
      })),
    },
  ];

  return {
    name,
    bpm,
    tracks: defaultTracks,
    currentPattern,
    savedAt: new Date().toISOString(),
    arrangements: defaultArrangements,
    currentArrangementId: currentArrangementId ?? defaultArrangements[0]?.id ?? null,
    zoomLevel,
    snapSetting,
    selectedTool,
    clipCounter,
    version: '1.0.0',
  };
}

/**
 * Create a project with multiple tracks
 * @param trackCount - Number of tracks to create
 * @param trackOptions - Options for track creation
 * @param projectOptions - Additional project options
 * @returns ProjectData with multiple tracks
 */
export function createProjectWithTracks(
  trackCount: number,
  trackOptions: TrackFactoryOptions = {},
  projectOptions: ProjectFactoryOptions = {}
): ProjectData {
  const tracks = Array.from({ length: trackCount }, (_, index) =>
    createTrack({
      ...trackOptions,
      id: trackOptions.id !== undefined ? trackOptions.id + index : index,
      name: trackOptions.name
        ? `${trackOptions.name} ${index + 1}`
        : `Track ${index + 1}`,
    })
  );

  return createProject({
    ...projectOptions,
    tracks,
  });
}

/**
 * Create a minimal project (for testing edge cases)
 * @returns Minimal ProjectData object
 */
export function createMinimalProject(): ProjectData {
  return {
    name: 'Minimal Project',
    bpm: 120,
    tracks: [],
    currentPattern: 0,
    arrangements: [],
    currentArrangementId: null,
    zoomLevel: 1.0,
    snapSetting: 'beat',
    selectedTool: 'draw',
    clipCounter: 0,
  };
}

