/**
 * EffectPresetService - Preset management for effects
 * Handles saving, loading, and managing effect presets
 * @module services/EffectPresetService
 */

import type { EffectPreset, EffectChainPreset } from '../types/preset.types';
import { logger } from '../utils/logger';

/**
 * Service for managing effect presets
 */
export class EffectPresetService {
  private presets: Map<string, EffectPreset> = new Map();
  private chainPresets: Map<string, EffectChainPreset> = new Map();

  /**
   * Save effect preset
   * @param preset - Preset to save
   */
  savePreset(preset: EffectPreset): void {
    this.presets.set(preset.id, { ...preset, updatedAt: new Date().toISOString() });
    this.saveToStorage();
  }

  /**
   * Load effect preset
   * @param presetId - Preset ID
   * @returns Preset or null
   */
  loadPreset(presetId: string): EffectPreset | null {
    return this.presets.get(presetId) || null;
  }

  /**
   * Get all presets
   * @returns Array of all presets
   */
  getAllPresets(): EffectPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get all presets for effect type
   * @param effectType - Effect type
   * @returns Array of presets
   */
  getPresetsForEffect(effectType: string): EffectPreset[] {
    return Array.from(this.presets.values()).filter((preset) => preset.effectType === effectType);
  }

  /**
   * Delete preset
   * @param presetId - Preset ID
   */
  deletePreset(presetId: string): void {
    this.presets.delete(presetId);
    this.saveToStorage();
  }

  /**
   * Save effect chain preset
   * @param preset - Chain preset to save
   */
  saveChainPreset(preset: EffectChainPreset): void {
    this.chainPresets.set(preset.id, { ...preset, updatedAt: new Date().toISOString() });
    this.saveToStorage();
  }

  /**
   * Load effect chain preset
   * @param presetId - Preset ID
   * @returns Chain preset or null
   */
  loadChainPreset(presetId: string): EffectChainPreset | null {
    return this.chainPresets.get(presetId) || null;
  }

  /**
   * Get all chain presets
   * @returns Array of chain presets
   */
  getAllChainPresets(): EffectChainPreset[] {
    return Array.from(this.chainPresets.values());
  }

  /**
   * Delete chain preset
   * @param presetId - Preset ID
   */
  deleteChainPreset(presetId: string): void {
    this.chainPresets.delete(presetId);
    this.saveToStorage();
  }

  /**
   * Save presets to localStorage
   * @private
   */
  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const presetsData = Array.from(this.presets.values());
        const chainPresetsData = Array.from(this.chainPresets.values());
        window.localStorage.setItem('fl-effect-presets', JSON.stringify(presetsData));
        window.localStorage.setItem('fl-effect-chain-presets', JSON.stringify(chainPresetsData));
      }
    } catch (error) {
      logger.error('EffectPresetService: Error saving to storage', { error });
    }
  }

  /**
   * Load presets from localStorage
   */
  loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const presetsData = window.localStorage.getItem('fl-effect-presets');
        const chainPresetsData = window.localStorage.getItem('fl-effect-chain-presets');

        if (presetsData) {
          const presets = JSON.parse(presetsData) as EffectPreset[];
          presets.forEach((preset) => {
            this.presets.set(preset.id, preset);
          });
        }

        if (chainPresetsData) {
          const chainPresets = JSON.parse(chainPresetsData) as EffectChainPreset[];
          chainPresets.forEach((preset) => {
            this.chainPresets.set(preset.id, preset);
          });
        }
      }
    } catch (error) {
      logger.error('EffectPresetService: Error loading from storage', { error });
    }
  }

  /**
   * Generate preset ID
   * @returns Unique preset ID
   */
  generatePresetId(): string {
    return `preset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Singleton instance
 */
export const effectPresetService = new EffectPresetService();

// Load presets on initialization
if (typeof window !== 'undefined') {
  effectPresetService.loadFromStorage();
}

