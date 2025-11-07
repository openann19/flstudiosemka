/**
 * Theme Utility Functions
 * Helper functions for accessing theme tokens in TypeScript
 */

import { THEME_TOKEN_NAMES } from '../types/theme';

/**
 * Get CSS custom property value from document root
 * @param variableName - CSS variable name (e.g., '--fl-orange')
 * @returns The computed value of the CSS variable
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

/**
 * Get theme color value
 * @param colorName - Name of the color token
 * @returns The color value
 */
export function getThemeColor(colorName: keyof typeof THEME_TOKEN_NAMES.colors): string {
  const tokenName = THEME_TOKEN_NAMES.colors[colorName];
  return getCSSVariable(tokenName);
}

/**
 * Get theme spacing value
 * @param spacingName - Name of the spacing token
 * @returns The spacing value
 */
export function getThemeSpacing(spacingName: keyof typeof THEME_TOKEN_NAMES.spacing): string {
  const tokenName = THEME_TOKEN_NAMES.spacing[spacingName];
  return getCSSVariable(tokenName);
}

/**
 * Get theme gradient value
 * @param gradientName - Name of the gradient token
 * @returns The gradient value
 */
export function getThemeGradient(gradientName: keyof typeof THEME_TOKEN_NAMES.gradients): string {
  const tokenName = THEME_TOKEN_NAMES.gradients[gradientName];
  return getCSSVariable(tokenName);
}

/**
 * Generate CSS class name with theme token reference
 * This is a utility for programmatic class generation if needed
 * @param className - Base class name
 * @param tokenName - Theme token name to reference
 * @returns Combined class name (for use with CSS modules or styled-components)
 */
export function withThemeToken(className: string, tokenName: string): string {
  return `${className}--${tokenName.replace('--', '').replace(/-/g, '_')}`;
}

/**
 * Get inline style object using theme tokens
 * Useful for dynamic styling in React components
 * @param tokenName - CSS variable name
 * @param property - CSS property name (e.g., 'color', 'backgroundColor')
 * @returns Style object with the property set to the token value
 */
export function getThemeStyle(tokenName: string, property: string): Record<string, string> {
  const value = getCSSVariable(tokenName);
  return { [property]: value };
}

/**
 * Get multiple theme styles at once
 * @param styles - Array of { tokenName, property } objects
 * @returns Combined style object
 */
export function getThemeStyles(
  styles: Array<{ tokenName: string; property: string }>
): Record<string, string> {
  return styles.reduce((acc, { tokenName, property }) => {
    const value = getCSSVariable(tokenName);
    return { ...acc, [property]: value };
  }, {});
}

