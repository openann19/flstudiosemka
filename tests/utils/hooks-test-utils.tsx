/**
 * Hook testing utilities
 * Provides helpers for testing React hooks
 * @module tests/utils/hooks-test-utils
 */

import { renderHook, type RenderHookOptions } from '@testing-library/react';
import { type ReactElement } from 'react';

/**
 * Custom render hook function
 * Wraps renderHook with app-specific providers if needed
 */
export function renderHookWithProviders<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'>
): ReturnType<typeof renderHook<TResult, TProps>> {
  const Wrapper = ({ children }: { children: React.ReactNode }): ReactElement => {
    return <>{children}</>;
  };

  return renderHook(hook, { wrapper: Wrapper, ...options });
}

// Re-export renderHook for convenience
export { renderHook } from '@testing-library/react';

