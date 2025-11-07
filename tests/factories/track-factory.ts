/**
 * Track factory for test data
 * Creates test Track objects with sensible defaults
 * @module tests/factories/track-factory
 */

import type { Track, TrackType, TrackParams } from '../../src/types/FLStudio.types';

/**
 * Default track parameters
 */
const DEFAULT_TRACK_PARAMS: TrackParams = {
  volume: 1.0,
  pan: 0.0,
  amp: {
    a: 0.1,
    d: 0.2,
    s: 0.7,
    r: 0.3,
  },
  filter: {
    cutoff: 1.0,
    resonance: 0.0,
    type: 'lowpass',
  },
  detune: 0.0,
  waveform: 'sawtooth',
  sends: {
    reverb: 0.0,
    delay: 0.0,
  },
};

/**
 * Track factory options
 */
export interface TrackFactoryOptions {
  id?: number;
  name?: string;
  type?: TrackType;
  steps?: boolean[];
  muted?: boolean;
  solo?: boolean;
  color?: string;
  mixerLevel?: number;
  params?: Partial<TrackParams>;
}

/**
 * Create a test track with default values
 * @param options - Override default track properties
 * @returns Track object
 */
export function createTrack(options: TrackFactoryOptions = {}): Track {
  const {
    id = 0,
    name = `Track ${id}`,
    type = 'drum',
    steps = new Array(16).fill(false),
    muted = false,
    solo = false,
    color,
    mixerLevel = 0.75,
    params,
  } = options;

  return {
    id,
    name,
    type,
    steps,
    muted,
    solo,
    color,
    mixerLevel,
    params: { ...DEFAULT_TRACK_PARAMS, ...params },
  };
}

/**
 * Create multiple tracks
 * @param count - Number of tracks to create
 * @param baseOptions - Base options applied to all tracks
 * @returns Array of Track objects
 */
export function createTracks(
  count: number,
  baseOptions: TrackFactoryOptions = {}
): Track[] {
  return Array.from({ length: count }, (_, index) =>
    createTrack({
      ...baseOptions,
      id: baseOptions.id !== undefined ? baseOptions.id + index : index,
      name: baseOptions.name
        ? `${baseOptions.name} ${index + 1}`
        : `Track ${index}`,
    })
  );
}

/**
 * Create a track with a pattern (some steps enabled)
 * @param enabledSteps - Array of step indices to enable
 * @param options - Additional track options
 * @returns Track with pattern
 */
export function createTrackWithPattern(
  enabledSteps: number[],
  options: TrackFactoryOptions = {}
): Track {
  const steps = new Array(16).fill(false);
  enabledSteps.forEach((step) => {
    if (step >= 0 && step < 16) {
      steps[step] = true;
    }
  });
  return createTrack({ ...options, steps });
}

