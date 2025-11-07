/**
 * ThemeService - Theme management
 * Handles theme switching and customization
 * @module services/ThemeService
 */

/**
 * Theme definition
 */
export interface Theme {
  id: string;
  name: string;
  colors: {
    orange: string;
    orangeHover: string;
    orangeDark: string;
    bgDarkest: string;
    bgDark: string;
    bgMedium: string;
    bgInput: string;
    bgHover: string;
    border: string;
    borderLight: string;
    borderDark: string;
    textPrimary: string;
    textSecondary: string;
    textDisabled: string;
    textInverted: string;
    green: string;
    red: string;
    blue: string;
    yellow: string;
  };
}

/**
 * Theme service
 */
export class ThemeService {
  private currentTheme: Theme;

  private themes: Map<string, Theme>;

  private readonly storageKey = 'fl-studio-theme';

  /**
   * Create a new ThemeService instance
   */
  constructor() {
    this.themes = new Map<string, Theme>();
    this.currentTheme = this.getDefaultTheme();
    this.registerDefaultThemes();
    this.loadTheme();
  }

  /**
   * Get default theme
   * @returns Default theme
   */
  private getDefaultTheme(): Theme {
    return {
      id: 'dark',
      name: 'Dark',
      colors: {
        orange: '#FF9900',
        orangeHover: '#FFB640',
        orangeDark: '#E58900',
        bgDarkest: '#1E1E1E',
        bgDark: '#252525',
        bgMedium: '#2D2D2D',
        bgInput: '#1A1A1A',
        bgHover: '#353535',
        border: '#3A3A3A',
        borderLight: '#4A4A4A',
        borderDark: '#2A2A2A',
        textPrimary: '#E8E8E8',
        textSecondary: '#B0B0B0',
        textDisabled: '#707070',
        textInverted: '#1A1A1E',
        green: '#3FB53F',
        red: '#E84C3D',
        blue: '#4A90E2',
        yellow: '#F5A623',
      },
    };
  }

  /**
   * Register default themes
   * @private
   */
  private registerDefaultThemes(): void {
    this.themes.set('dark', this.getDefaultTheme());
    this.themes.set('darker', {
      id: 'darker',
      name: 'Darker',
      colors: {
        ...this.getDefaultTheme().colors,
        bgDarkest: '#0F0F0F',
        bgDark: '#1A1A1A',
        bgMedium: '#222222',
      },
    });
  }

  /**
   * Register a theme
   * @param theme - Theme to register
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * Get current theme
   * @returns Current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set theme
   * @param themeId - Theme ID
   */
  setTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (!theme) {
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme();
  }

  /**
   * Get all themes
   * @returns Array of themes
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Apply theme to document
   * @param theme - Theme to apply
   * @private
   */
  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const { colors } = theme;

    root.style.setProperty('--fl-orange', colors.orange);
    root.style.setProperty('--fl-orange-hover', colors.orangeHover);
    root.style.setProperty('--fl-orange-dark', colors.orangeDark);
    root.style.setProperty('--fl-bg-darkest', colors.bgDarkest);
    root.style.setProperty('--fl-bg-dark', colors.bgDark);
    root.style.setProperty('--fl-bg-medium', colors.bgMedium);
    root.style.setProperty('--fl-bg-input', colors.bgInput);
    root.style.setProperty('--fl-bg-hover', colors.bgHover);
    root.style.setProperty('--fl-border', colors.border);
    root.style.setProperty('--fl-border-light', colors.borderLight);
    root.style.setProperty('--fl-border-dark', colors.borderDark);
    root.style.setProperty('--fl-text-primary', colors.textPrimary);
    root.style.setProperty('--fl-text-secondary', colors.textSecondary);
    root.style.setProperty('--fl-text-disabled', colors.textDisabled);
    root.style.setProperty('--fl-text-inverted', colors.textInverted);
    root.style.setProperty('--fl-green', colors.green);
    root.style.setProperty('--fl-red', colors.red);
    root.style.setProperty('--fl-blue', colors.blue);
    root.style.setProperty('--fl-yellow', colors.yellow);
  }

  /**
   * Save theme to localStorage
   * @private
   */
  private saveTheme(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, this.currentTheme.id);
    } catch {
      // Silent error handling
    }
  }

  /**
   * Load theme from localStorage
   * @private
   */
  private loadTheme(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const theme = this.themes.get(stored);
        if (theme) {
          this.currentTheme = theme;
          this.applyTheme(theme);
        }
      } else {
        this.applyTheme(this.currentTheme);
      }
    } catch {
      // Silent error handling
      this.applyTheme(this.currentTheme);
    }
  }
}

// Export singleton instance
export const themeService = new ThemeService();

