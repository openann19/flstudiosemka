/**
 * Tests for ThemeService
 * @module tests/services/ThemeService
 */

import { ThemeService, themeService } from '../../src/services/ThemeService';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    service = new ThemeService();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default theme', () => {
      const theme = service.getCurrentTheme();

      expect(theme.id).toBe('dark');
      expect(theme.name).toBe('Dark');
      expect(theme.colors.orange).toBe('#FF9900');
    });

    it('should register default themes', () => {
      const themes = service.getAllThemes();

      expect(themes.length).toBeGreaterThanOrEqual(2);
      expect(themes.some((t) => t.id === 'dark')).toBe(true);
      expect(themes.some((t) => t.id === 'darker')).toBe(true);
    });
  });

  describe('theme management', () => {
    it('should set theme', () => {
      service.setTheme('darker');

      const theme = service.getCurrentTheme();
      expect(theme.id).toBe('darker');
    });

    it('should not set invalid theme', () => {
      const originalTheme = service.getCurrentTheme();
      service.setTheme('invalid-theme');

      expect(service.getCurrentTheme()).toBe(originalTheme);
    });

    it('should register custom theme', () => {
      const customTheme = {
        id: 'custom',
        name: 'Custom',
        colors: {
          orange: '#FF0000',
          orangeHover: '#FF1111',
          orangeDark: '#EE0000',
          bgDarkest: '#000000',
          bgDark: '#111111',
          bgMedium: '#222222',
          bgInput: '#000000',
          bgHover: '#333333',
          border: '#444444',
          borderLight: '#555555',
          borderDark: '#333333',
          textPrimary: '#FFFFFF',
          textSecondary: '#CCCCCC',
          textDisabled: '#888888',
          textInverted: '#000000',
          green: '#00FF00',
          red: '#FF0000',
          blue: '#0000FF',
          yellow: '#FFFF00',
        },
      };

      service.registerTheme(customTheme);
      service.setTheme('custom');

      const theme = service.getCurrentTheme();
      expect(theme.id).toBe('custom');
    });
  });

  describe('persistence', () => {
    it('should save theme to localStorage', () => {
      service.setTheme('darker');

      const stored = localStorage.getItem('fl-studio-theme');
      expect(stored).toBe('darker');
    });

    it('should load theme from localStorage', () => {
      localStorage.setItem('fl-studio-theme', 'darker');
      const newService = new ThemeService();

      expect(newService.getCurrentTheme().id).toBe('darker');
    });
  });

  describe('singleton', () => {
    it('should export singleton instance', () => {
      expect(themeService).toBeInstanceOf(ThemeService);
    });
  });
});
