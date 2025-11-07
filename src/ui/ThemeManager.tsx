/**
 * ThemeManager - Theme management system
 * Handles theme switching and customization
 * @module ui/ThemeManager
 */

/**
 * Theme colors
 */
export interface ThemeColors {
  background: string;
  panel: string;
  text: string;
  accent: string;
  border: string;
}

/**
 * Theme definition
 */
export interface Theme {
  name: string;
  colors: ThemeColors;
}

/**
 * Theme collection
 */
export interface Themes {
  [key: string]: Theme;
}

/**
 * ThemeManager - Theme management system
 * Handles theme switching and customization
 */
export class ThemeManager {
  private currentTheme: string;
  private themes: Themes;

  constructor() {
    this.currentTheme = 'dark';
    this.themes = {
      dark: {
        name: 'Dark',
        colors: {
          background: '#1a1a1a',
          panel: '#2a2a2a',
          text: '#ffffff',
          accent: '#FF0080',
          border: '#444444',
        },
      },
      light: {
        name: 'Light',
        colors: {
          background: '#f5f5f5',
          panel: '#ffffff',
          text: '#000000',
          accent: '#FF0080',
          border: '#cccccc',
        },
      },
    };
  }

  /**
   * Initialize theme system
   */
  init(): void {
    this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Apply theme
   * @param {string} themeName - Theme name
   */
  applyTheme(themeName: string): void {
    if (!this.themes[themeName]) {
      return;
    }

    this.currentTheme = themeName;
    const theme = this.themes[themeName];

    // Set CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Save to localStorage
    try {
      localStorage.setItem('fl-theme', themeName);
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Load theme from storage
   */
  loadTheme(): void {
    try {
      const saved = localStorage.getItem('fl-theme');
      if (saved && this.themes[saved]) {
        this.currentTheme = saved;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get current theme
   * @returns {string} Theme name
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Get available themes
   * @returns {string[]} Array of theme names
   */
  getAvailableThemes(): string[] {
    return Object.keys(this.themes);
  }

  /**
   * Register custom theme
   * @param {string} name - Theme name
   * @param {Theme} theme - Theme object
   */
  registerTheme(name: string, theme: Theme): void {
    this.themes[name] = theme;
  }
}

// Create singleton instance
export const themeManager = new ThemeManager();

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { ThemeManager: typeof ThemeManager }).ThemeManager =
    ThemeManager;
  (window as unknown as { themeManager: typeof themeManager }).themeManager =
    themeManager;
}

