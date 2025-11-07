/**
 * Effect Type Definitions
 * Type definitions for effect registry and metadata
 * @module types/effect.types
 */

import type { EffectType } from './synthesizer.types';
import type { Effect } from './effectSlot.types';

/**
 * Effect parameter definition
 */
export interface EffectParameter {
  name: string;
  label: string;
  type: 'number' | 'boolean' | 'enum';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number | boolean | string;
  unit?: string;
  enumValues?: string[];
}

/**
 * Effect metadata
 */
export interface EffectMetadata {
  type: EffectType;
  name: string;
  description: string;
  category: EffectCategory;
  icon: string;
  parameters: EffectParameter[];
  factory: (audioContext: AudioContext, params?: Record<string, number>) => Effect;
}

/**
 * Effect categories
 */
export type EffectCategory =
  | 'time'
  | 'modulation'
  | 'distortion'
  | 'filter'
  | 'dynamics'
  | 'spatial'
  | 'utility';

/**
 * Effect registry entry
 */
export interface EffectRegistryEntry {
  metadata: EffectMetadata;
  createInstance: (audioContext: AudioContext, params?: Record<string, number>) => Effect;
}

