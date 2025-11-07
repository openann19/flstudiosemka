/**
 * Theme Type Definitions
 * Type definitions for theme tokens and theme management
 * @module types/theme
 */

/**
 * Theme token names mapping
 */
export const THEME_TOKEN_NAMES = {
  colors: {
    orange: '--fl-orange',
    orangeHover: '--fl-orange-hover',
    orangeActive: '--fl-orange-active',
    dark: '--fl-bg-dark',
    darker: '--fl-bg-darker',
    light: '--fl-bg-light',
    border: '--fl-border',
    textPrimary: '--fl-text-primary',
    textSecondary: '--fl-text-secondary',
    hover: '--fl-bg-hover',
  },
  spacing: {
    xs: '--spacing-xs',
    sm: '--spacing-sm',
    md: '--spacing-md',
    lg: '--spacing-lg',
    xl: '--spacing-xl',
  },
  gradients: {
    orange: '--gradient-orange',
    orangeHover: '--gradient-orange-hover',
    header: '--gradient-header',
    panel: '--gradient-panel',
    transport: '--gradient-transport',
    button: '--gradient-button',
    buttonHover: '--gradient-button-hover',
    buttonActive: '--gradient-button-active',
    premium: '--fl-premium-gradient',
    premiumActive: '--fl-premium-active',
  },
} as const;

/**
 * Theme interface
 */
export interface Theme {
  colors: {
    orange: string;
    orangeHover: string;
    orangeActive: string;
    dark: string;
    darker: string;
    light: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    hover: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  zIndex: {
    base: number;
    dropdown: number;
    tooltip: number;
    modal: number;
    max: number;
  };
  gradients: {
    orange: string;
    orangeHover: string;
    header: string;
    panel: string;
    transport: string;
    button: string;
    buttonHover: string;
    buttonActive: string;
    premium: string;
    premiumActive: string;
  };
  components: {
    button: {
      paddingSm: string;
      paddingMd: string;
      paddingLg: string;
      heightSm: string;
      heightMd: string;
      heightLg: string;
    };
    input: {
      padding: string;
      height: string;
      borderWidth: string;
      focusRing: string;
    };
    slider: {
      height: string;
      thumbSize: string;
      thumbShadow: string;
    };
    toggle: {
      width: string;
      height: string;
      thumbSize: string;
    };
  };
}

