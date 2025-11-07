/**
 * Effect Preset Type Definitions
 * Type definitions for effect presets and templates
 * @module types/preset.types
 */

import type { EffectType } from './synthesizer.types';

/**
 * Effect preset
 */
export interface EffectPreset {
  id: string;
  name: string;
  effectType: EffectType;
  parameters: Record<string, number>;
  category?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Effect chain preset (multiple effects)
 */
export interface EffectChainPreset {
  id: string;
  name: string;
  effects: Array<{
    effectType: EffectType;
    position: number;
    enabled: boolean;
    parameters: Record<string, number>;
  }>;
  category?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Preset category
 */
export interface PresetCategory {
  id: string;
  name: string;
  icon?: string;
  presets: EffectPreset[];
}

