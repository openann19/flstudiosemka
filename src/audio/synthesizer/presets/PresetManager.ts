/**
 * PresetManager - Preset storage and management
 * Handles save, load, export, and import of synthesizer presets
 * @module audio/synthesizer/presets/PresetManager
 */

import type { SynthesizerPreset } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Preset manager for synthesizer presets
 */
export class PresetManager {
  private presets: Map<string, SynthesizerPreset> = new Map();
  private storageKey: string = 'synthesizer_presets';

  /**
   * Create a new preset manager
   */
  constructor() {
    this.loadFromStorage();
  }

  /**
   * Save a preset
   */
  savePreset(preset: SynthesizerPreset): void {
    try {
      preset.updatedAt = Date.now();
      if (!preset.createdAt) {
        preset.createdAt = Date.now();
      }
      this.presets.set(preset.id, { ...preset });
      this.saveToStorage();
    } catch (error) {
      logger.error('PresetManager: Error saving preset', { error, preset });
      throw error;
    }
  }

  /**
   * Load a preset by ID
   */
  loadPreset(id: string): SynthesizerPreset | undefined {
    const preset = this.presets.get(id);
    return preset ? { ...preset } : undefined;
  }

  /**
   * Delete a preset
   */
  deletePreset(id: string): boolean {
    const deleted = this.presets.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Get all presets
   */
  getAllPresets(): SynthesizerPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: string): SynthesizerPreset[] {
    return Array.from(this.presets.values()).filter((preset) => preset.category === category);
  }

  /**
   * Export preset to JSON
   */
  exportPreset(id: string): string | null {
    const preset = this.presets.get(id);
    if (!preset) {
      return null;
    }
    try {
      return JSON.stringify(preset, null, 2);
    } catch (error) {
      logger.error('PresetManager: Error exporting preset', { error, id });
      return null;
    }
  }

  /**
   * Import preset from JSON
   */
  importPreset(json: string): SynthesizerPreset | null {
    try {
      const preset = JSON.parse(json) as SynthesizerPreset;
      if (!preset.id || !preset.name || !preset.config) {
        throw new Error('Invalid preset format');
      }
      this.savePreset(preset);
      return { ...preset };
    } catch (error) {
      logger.error('PresetManager: Error importing preset', { error });
      return null;
    }
  }

  /**
   * Export all presets
   */
  exportAllPresets(): string {
    try {
      const presets = Array.from(this.presets.values());
      return JSON.stringify(presets, null, 2);
    } catch (error) {
      logger.error('PresetManager: Error exporting all presets', { error });
      return '[]';
    }
  }

  /**
   * Import all presets
   */
  importAllPresets(json: string): number {
    try {
      const presets = JSON.parse(json) as SynthesizerPreset[];
      let imported = 0;
      for (const preset of presets) {
        if (preset.id && preset.name && preset.config) {
          this.savePreset(preset);
          imported += 1;
        }
      }
      return imported;
    } catch (error) {
      logger.error('PresetManager: Error importing presets', { error });
      return 0;
    }
  }

  /**
   * Save presets to localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const json = this.exportAllPresets();
        window.localStorage.setItem(this.storageKey, json);
      }
    } catch (error) {
      logger.error('PresetManager: Error saving to storage', { error });
    }
  }

  /**
   * Load presets from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const json = window.localStorage.getItem(this.storageKey);
        if (json) {
          this.importAllPresets(json);
        }
      }
    } catch (error) {
      logger.error('PresetManager: Error loading from storage', { error });
    }
  }
}

