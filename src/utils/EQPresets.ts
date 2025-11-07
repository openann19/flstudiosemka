/**
 * EQPresets - Common EQ configurations
 * Provides preset band configurations for various use cases
 * @module utils/EQPresets
 */

import type { EQBandConfig } from '../effects/EQBand';
import { FilterType } from '../effects/EQBand';

/**
 * Preset EQ configurations
 */
export interface EQPreset {
  name: string;
  description: string;
  bands: EQBandConfig[];
}

/**
 * Collection of EQ presets
 */
export const EQPresets: Record<string, EQPreset> = {
  /**
   * Vocal preset - enhances vocal clarity and presence
   */
  vocal: {
    name: 'Vocal',
    description: 'Enhances vocal clarity and presence',
    bands: [
      {
        id: 'vocal-low-cut',
        type: FilterType.HighPass,
        frequency: 80,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
      {
        id: 'vocal-low',
        type: FilterType.LowShelf,
        frequency: 200,
        gain: 2,
        enabled: true,
      },
      {
        id: 'vocal-presence',
        type: FilterType.Peaking,
        frequency: 3000,
        gain: 3,
        Q: 2,
        enabled: true,
      },
      {
        id: 'vocal-air',
        type: FilterType.HighShelf,
        frequency: 10000,
        gain: 2,
        enabled: true,
      },
    ],
  },

  /**
   * Kick drum preset - enhances punch and low end
   */
  kick: {
    name: 'Kick',
    description: 'Enhances kick drum punch and low end',
    bands: [
      {
        id: 'kick-sub',
        type: FilterType.Peaking,
        frequency: 60,
        gain: 4,
        Q: 1.5,
        enabled: true,
      },
      {
        id: 'kick-body',
        type: FilterType.Peaking,
        frequency: 80,
        gain: 3,
        Q: 2,
        enabled: true,
      },
      {
        id: 'kick-punch',
        type: FilterType.Peaking,
        frequency: 2000,
        gain: 2,
        Q: 3,
        enabled: true,
      },
      {
        id: 'kick-high-cut',
        type: FilterType.LowPass,
        frequency: 8000,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
    ],
  },

  /**
   * Snare preset - enhances snap and body
   */
  snare: {
    name: 'Snare',
    description: 'Enhances snare snap and body',
    bands: [
      {
        id: 'snare-low-cut',
        type: FilterType.HighPass,
        frequency: 150,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
      {
        id: 'snare-body',
        type: FilterType.Peaking,
        frequency: 200,
        gain: 2,
        Q: 2,
        enabled: true,
      },
      {
        id: 'snare-snap',
        type: FilterType.Peaking,
        frequency: 5000,
        gain: 3,
        Q: 3,
        enabled: true,
      },
    ],
  },

  /**
   * Master bus preset - gentle mastering EQ
   */
  master: {
    name: 'Master',
    description: 'Gentle mastering EQ for master bus',
    bands: [
      {
        id: 'master-low-cut',
        type: FilterType.HighPass,
        frequency: 30,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
      {
        id: 'master-low',
        type: FilterType.LowShelf,
        frequency: 100,
        gain: 1,
        enabled: true,
      },
      {
        id: 'master-high',
        type: FilterType.HighShelf,
        frequency: 10000,
        gain: 1,
        enabled: true,
      },
      {
        id: 'master-high-cut',
        type: FilterType.LowPass,
        frequency: 20000,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
    ],
  },

  /**
   * Bass preset - enhances low frequencies
   */
  bass: {
    name: 'Bass',
    description: 'Enhances bass frequencies',
    bands: [
      {
        id: 'bass-sub',
        type: FilterType.Peaking,
        frequency: 50,
        gain: 4,
        Q: 1.5,
        enabled: true,
      },
      {
        id: 'bass-low',
        type: FilterType.LowShelf,
        frequency: 100,
        gain: 3,
        enabled: true,
      },
      {
        id: 'bass-mid',
        type: FilterType.Peaking,
        frequency: 800,
        gain: 2,
        Q: 2,
        enabled: true,
      },
      {
        id: 'bass-high-cut',
        type: FilterType.LowPass,
        frequency: 5000,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
    ],
  },

  /**
   * Guitar preset - enhances guitar presence
   */
  guitar: {
    name: 'Guitar',
    description: 'Enhances guitar presence and clarity',
    bands: [
      {
        id: 'guitar-low-cut',
        type: FilterType.HighPass,
        frequency: 100,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
      {
        id: 'guitar-mid',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 2,
        Q: 2,
        enabled: true,
      },
      {
        id: 'guitar-presence',
        type: FilterType.Peaking,
        frequency: 3000,
        gain: 3,
        Q: 3,
        enabled: true,
      },
      {
        id: 'guitar-high',
        type: FilterType.HighShelf,
        frequency: 8000,
        gain: 1,
        enabled: true,
      },
    ],
  },

  /**
   * Piano preset - enhances piano clarity
   */
  piano: {
    name: 'Piano',
    description: 'Enhances piano clarity and warmth',
    bands: [
      {
        id: 'piano-low-cut',
        type: FilterType.HighPass,
        frequency: 80,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
      {
        id: 'piano-low',
        type: FilterType.LowShelf,
        frequency: 200,
        gain: 1,
        enabled: true,
      },
      {
        id: 'piano-mid',
        type: FilterType.Peaking,
        frequency: 2000,
        gain: 2,
        Q: 2,
        enabled: true,
      },
      {
        id: 'piano-high',
        type: FilterType.HighShelf,
        frequency: 8000,
        gain: 1,
        enabled: true,
      },
    ],
  },

  /**
   * Bright preset - adds brightness and air
   */
  bright: {
    name: 'Bright',
    description: 'Adds brightness and air to the mix',
    bands: [
      {
        id: 'bright-high',
        type: FilterType.HighShelf,
        frequency: 8000,
        gain: 4,
        enabled: true,
      },
      {
        id: 'bright-air',
        type: FilterType.Peaking,
        frequency: 12000,
        gain: 3,
        Q: 2,
        enabled: true,
      },
    ],
  },

  /**
   * Warm preset - adds warmth and body
   */
  warm: {
    name: 'Warm',
    description: 'Adds warmth and body to the mix',
    bands: [
      {
        id: 'warm-low',
        type: FilterType.LowShelf,
        frequency: 200,
        gain: 3,
        enabled: true,
      },
      {
        id: 'warm-mid',
        type: FilterType.Peaking,
        frequency: 500,
        gain: 2,
        Q: 2,
        enabled: true,
      },
      {
        id: 'warm-high-cut',
        type: FilterType.LowPass,
        frequency: 12000,
        gain: 0,
        Q: 0.707,
        enabled: true,
      },
    ],
  },

  /**
   * Flat preset - no EQ (reference)
   */
  flat: {
    name: 'Flat',
    description: 'No EQ applied (flat response)',
    bands: [],
  },
};

/**
 * Get preset by name
 * @param name - Preset name
 * @returns Preset configuration or undefined
 */
export function getPreset(name: string): EQPreset | undefined {
  return EQPresets[name.toLowerCase()];
}

/**
 * Get all preset names
 * @returns Array of preset names
 */
export function getPresetNames(): string[] {
  return Object.keys(EQPresets);
}

/**
 * Apply preset to EQ configuration
 * @param presetName - Preset name
 * @returns Array of band configurations
 */
export function applyPreset(presetName: string): EQBandConfig[] {
  const preset = getPreset(presetName);
  if (!preset) {
    throw new Error(`Preset '${presetName}' not found`);
  }
  return preset.bands.map((band) => ({ ...band }));
}

