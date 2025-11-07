/**
 * Test utilities for React Testing Library
 * Provides custom render function with common providers
 * @module tests/utils/test-utils
 */

import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

/**
 * Custom render function with providers
 * Extends React Testing Library's render with app-specific providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> {
  // Add any global providers here (ThemeProvider, etc.)
  const Wrapper = ({ children }: { children: React.ReactNode }): ReactElement => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

