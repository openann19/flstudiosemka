/**
 * Tests for UserPreferencesService
 * @module tests/services/UserPreferencesService
 */

import { UserPreferencesService, userPreferencesService } from '../../src/services/UserPreferencesService';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  beforeEach(() => {
    service = new UserPreferencesService();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default preferences', () => {
      const prefs = service.getPreferences();

      expect(prefs.theme).toBe('dark');
      expect(prefs.accentColor).toBe('#FF9900');
      expect(prefs.shortcuts).toEqual({});
      expect(prefs.windowLayouts).toEqual([]);
    });
  });

  describe('theme preferences', () => {
    it('should get theme', () => {
      expect(service.getTheme()).toBe('dark');
    });

    it('should set theme', () => {
      service.setTheme('light');

      expect(service.getTheme()).toBe('light');
      expect(service.getPreferences().theme).toBe('light');
    });
  });

  describe('accent color', () => {
    it('should get accent color', () => {
      expect(service.getAccentColor()).toBe('#FF9900');
    });

    it('should set accent color', () => {
      service.setAccentColor('#FF0000');

      expect(service.getAccentColor()).toBe('#FF0000');
    });
  });

  describe('shortcut preferences', () => {
    it('should get shortcut preferences', () => {
      const shortcuts = service.getShortcutPreferences();

      expect(shortcuts).toEqual({});
    });

    it('should set shortcut preferences', () => {
      const shortcuts = { 'play-pause': { key: 'Space' } };

      service.setShortcutPreferences(shortcuts);

      expect(service.getShortcutPreferences()).toEqual(shortcuts);
    });
  });

  describe('window layouts', () => {
    it('should get window layouts', () => {
      const layouts = service.getWindowLayouts();

      expect(layouts).toEqual([]);
    });

    it('should set window layouts', () => {
      const layouts = [{
        id: 'layout1',
        name: 'Test Layout',
        windows: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];

      service.setWindowLayouts(layouts);

      expect(service.getWindowLayouts()).toEqual(layouts);
    });
  });

  describe('generic preferences', () => {
    it('should get preference value', () => {
      const value = service.getPreference('theme');

      expect(value).toBe('dark');
    });

    it('should set preference value', () => {
      service.setPreference('customKey', 'customValue');

      expect(service.getPreference('customKey')).toBe('customValue');
    });
  });

  describe('reset', () => {
    it('should reset to defaults', () => {
      service.setTheme('light');
      service.setAccentColor('#FF0000');
      service.setPreference('custom', 'value');

      service.resetToDefaults();

      expect(service.getTheme()).toBe('dark');
      expect(service.getAccentColor()).toBe('#FF9900');
      expect(service.getPreference('custom')).toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('should save preferences to localStorage', () => {
      service.setTheme('light');

      const stored = localStorage.getItem('fl-studio-user-preferences');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.theme).toBe('light');
    });

    it('should load preferences from localStorage', () => {
      localStorage.setItem(
        'fl-studio-user-preferences',
        JSON.stringify({ theme: 'light', accentColor: '#FF0000' })
      );

      const newService = new UserPreferencesService();

      expect(newService.getTheme()).toBe('light');
      expect(newService.getAccentColor()).toBe('#FF0000');
    });
  });

  describe('singleton', () => {
    it('should export singleton instance', () => {
      expect(userPreferencesService).toBeInstanceOf(UserPreferencesService);
    });
  });
});
