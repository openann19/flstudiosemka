/**
 * UserPreferencesService - User preferences management
 * Handles saving and loading user preferences for shortcuts and layouts
 * @module services/UserPreferencesService
 */

import type { ShortcutPreferences } from '../types/shortcuts';
import type { WindowLayout } from '../types/windows';

/**
 * User preferences
 */
export interface UserPreferences {
  shortcuts: ShortcutPreferences;
  windowLayouts: WindowLayout[];
  theme: string;
  accentColor: string;
  [key: string]: unknown;
}

/**
 * User preferences service
 */
export class UserPreferencesService {
  private readonly storageKey = 'fl-studio-user-preferences';

  private preferences: UserPreferences;

  /**
   * Create a new UserPreferencesService instance
   */
  constructor() {
    this.preferences = {
      shortcuts: {},
      windowLayouts: [],
      theme: 'dark',
      accentColor: '#FF9900',
    };
    this.loadPreferences();
  }

  /**
   * Get all preferences
   * @returns User preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Get shortcut preferences
   * @returns Shortcut preferences
   */
  getShortcutPreferences(): ShortcutPreferences {
    return { ...this.preferences.shortcuts };
  }

  /**
   * Set shortcut preferences
   * @param shortcuts - Shortcut preferences
   */
  setShortcutPreferences(shortcuts: ShortcutPreferences): void {
    this.preferences.shortcuts = shortcuts;
    this.savePreferences();
  }

  /**
   * Get window layouts
   * @returns Window layouts
   */
  getWindowLayouts(): WindowLayout[] {
    return [...this.preferences.windowLayouts];
  }

  /**
   * Set window layouts
   * @param layouts - Window layouts
   */
  setWindowLayouts(layouts: WindowLayout[]): void {
    this.preferences.windowLayouts = layouts;
    this.savePreferences();
  }

  /**
   * Get theme
   * @returns Theme name
   */
  getTheme(): string {
    return this.preferences.theme;
  }

  /**
   * Set theme
   * @param theme - Theme name
   */
  setTheme(theme: string): void {
    this.preferences.theme = theme;
    this.savePreferences();
  }

  /**
   * Get accent color
   * @returns Accent color
   */
  getAccentColor(): string {
    return this.preferences.accentColor;
  }

  /**
   * Set accent color
   * @param color - Accent color
   */
  setAccentColor(color: string): void {
    this.preferences.accentColor = color;
    this.savePreferences();
  }

  /**
   * Get preference value
   * @param key - Preference key
   * @returns Preference value
   */
  getPreference(key: string): unknown {
    return this.preferences[key];
  }

  /**
   * Set preference value
   * @param key - Preference key
   * @param value - Preference value
   */
  setPreference(key: string, value: unknown): void {
    this.preferences[key] = value;
    this.savePreferences();
  }

  /**
   * Reset preferences to defaults
   */
  resetToDefaults(): void {
    this.preferences = {
      shortcuts: {},
      windowLayouts: [],
      theme: 'dark',
      accentColor: '#FF9900',
    };
    this.savePreferences();
  }

  /**
   * Save preferences to localStorage
   * @private
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch {
      // Silent error handling
    }
  }

  /**
   * Load preferences from localStorage
   * @private
   */
  private loadPreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch {
      // Silent error handling
    }
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();

