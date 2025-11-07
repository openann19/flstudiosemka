/**
 * Theme Context Provider
 * Provides theme access to React components with type safety
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { Theme } from '../types/theme';

/**
 * Theme Context
 */
interface ThemeContextValue {
  theme: Theme;
  getToken: (tokenName: string) => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Get CSS custom property value from document root
 */
const getCSSVariable = (variableName: string): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
};

/**
 * Theme Provider Component
 */
interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const theme = useMemo<Theme>(() => {
    return {
      colors: {
        orange: getCSSVariable('--fl-orange'),
        orangeHover: getCSSVariable('--fl-orange-hover'),
        orangeActive: getCSSVariable('--fl-orange-active') || getCSSVariable('--fl-orange-dark'),
        dark: getCSSVariable('--fl-bg-dark'),
        darker: getCSSVariable('--fl-bg-darkest'),
        light: getCSSVariable('--fl-bg-medium'),
        border: getCSSVariable('--fl-border'),
        textPrimary: getCSSVariable('--fl-text-primary'),
        textSecondary: getCSSVariable('--fl-text-secondary'),
        hover: getCSSVariable('--fl-bg-hover'),
      },
      spacing: {
        xs: getCSSVariable('--spacing-xs') || getCSSVariable('--spacing-minimal'),
        sm: getCSSVariable('--spacing-sm') || getCSSVariable('--spacing-small'),
        md: getCSSVariable('--spacing-md') || getCSSVariable('--spacing-medium'),
        lg: getCSSVariable('--spacing-lg') || getCSSVariable('--spacing-large'),
        xl: getCSSVariable('--spacing-xl'),
      },
      zIndex: {
        base: Number.parseInt(getCSSVariable('--z-base'), 10) || 1,
        dropdown: Number.parseInt(getCSSVariable('--z-dropdown'), 10) || 100,
        tooltip: Number.parseInt(getCSSVariable('--z-tooltip'), 10) || 10001,
        modal: Number.parseInt(getCSSVariable('--z-modal'), 10) || 10000,
        max: Number.parseInt(getCSSVariable('--z-max'), 10) || 99999,
      },
      gradients: {
        orange: getCSSVariable('--gradient-orange'),
        orangeHover: getCSSVariable('--gradient-orange-hover'),
        header: getCSSVariable('--gradient-header'),
        panel: getCSSVariable('--gradient-panel'),
        transport: getCSSVariable('--gradient-transport'),
        button: getCSSVariable('--gradient-button'),
        buttonHover: getCSSVariable('--gradient-button-hover'),
        buttonActive: getCSSVariable('--gradient-button-active'),
        premium: getCSSVariable('--fl-premium-gradient'),
        premiumActive: getCSSVariable('--fl-premium-active'),
      },
      components: {
        button: {
          paddingSm: getCSSVariable('--btn-padding-sm'),
          paddingMd: getCSSVariable('--btn-padding-md'),
          paddingLg: getCSSVariable('--btn-padding-lg'),
          heightSm: getCSSVariable('--btn-height-sm'),
          heightMd: getCSSVariable('--btn-height-md'),
          heightLg: getCSSVariable('--btn-height-lg'),
        },
        input: {
          padding: getCSSVariable('--input-padding'),
          height: getCSSVariable('--input-height'),
          borderWidth: getCSSVariable('--input-border-width'),
          focusRing: getCSSVariable('--input-focus-ring'),
        },
        slider: {
          height: getCSSVariable('--slider-height'),
          thumbSize: getCSSVariable('--slider-thumb-size'),
          thumbShadow: getCSSVariable('--slider-thumb-shadow'),
        },
        toggle: {
          width: getCSSVariable('--toggle-width'),
          height: getCSSVariable('--toggle-height'),
          thumbSize: getCSSVariable('--toggle-thumb-size'),
        },
      },
    };
  }, []);

  const getToken = useMemo(() => {
    return (tokenName: string): string => {
      return getCSSVariable(tokenName);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      getToken,
    }),
    [theme, getToken]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

