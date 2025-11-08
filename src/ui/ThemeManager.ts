/**
 * ThemeManager - Theme management system
 * Handles theme switching and customization
 */

interface ThemeColors {
  background: string;
  panel: string;
  text: string;
  accent: string;
  border: string;
}

interface Theme {
  name: string;
  colors: ThemeColors;
}

class ThemeManager {
  private currentTheme = 'dark';
  private themes: Record<string, Theme> = {
    dark: {
      name: 'Dark',
      colors: {
        background: '#1a1a1a',
        panel: '#2a2a2a',
        text: '#ffffff',
        accent: '#FF0080',
        border: '#444444'
      }
    },
    light: {
      name: 'Light',
      colors: {
        background: '#f5f5f5',
        panel: '#ffffff',
        text: '#000000',
        accent: '#FF0080',
        border: '#cccccc'
      }
    }
  };

  /**
   * Initialize theme system
   */
  init(): void {
    this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Apply theme
   */
  applyTheme(themeName: string): void {
    if (!this.themes[themeName]) {
       
      console.warn(`ThemeManager: Theme '${themeName}' not found`);
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
       
      console.warn('ThemeManager: Failed to save theme', e);
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
       
      console.warn('ThemeManager: Failed to load theme', e);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): string[] {
    return Object.keys(this.themes);
  }

  /**
   * Register custom theme
   */
  registerTheme(name: string, theme: Theme): void {
    this.themes[name] = theme;
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeManager, themeManager };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ThemeManager = ThemeManager;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).themeManager = themeManager;
}

