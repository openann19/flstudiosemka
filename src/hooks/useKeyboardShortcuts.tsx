/**
 * useKeyboardShortcuts - React hook for keyboard shortcuts
 * Integrates KeyboardShortcutService with React components
 * @module hooks/useKeyboardShortcuts
 */

import { useEffect, useCallback, useRef } from 'react';
import type {
  KeyboardShortcutService} from '../services/KeyboardShortcutService';
import {
  keyboardShortcutService
} from '../services/KeyboardShortcutService';
import type {
  ShortcutCombination,
  ShortcutContext,
  ShortcutHandler,
  ShortcutRegistrationOptions,
} from '../types/shortcuts';

/**
 * Options for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  context?: ShortcutContext;
  enabled?: boolean;
}

/**
 * Return type for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsReturn {
  registerShortcut: (
    id: string,
    name: string,
    description: string,
    combination: ShortcutCombination,
    handler: ShortcutHandler,
    options?: ShortcutRegistrationOptions
  ) => void;
  unregisterShortcut: (id: string) => void;
  updateShortcut: (id: string, combination: ShortcutCombination) => void;
  setShortcutEnabled: (id: string, enabled: boolean) => void;
  setContext: (context: ShortcutContext) => void;
  service: KeyboardShortcutService;
}

/**
 * React hook for managing keyboard shortcuts
 * @param options - Hook options
 * @returns Shortcut management functions
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn {
  const { context, enabled = true } = options;
  const registeredIdsRef = useRef<Set<string>>(new Set());

  /**
   * Set context when it changes
   */
  useEffect(() => {
    if (context) {
      keyboardShortcutService.setContext(context);
    }
  }, [context]);

  /**
   * Enable/disable service
   */
  useEffect(() => {
    keyboardShortcutService.setEnabled(enabled);
  }, [enabled]);

  /**
   * Register a shortcut
   */
  const registerShortcut = useCallback(
    (
      id: string,
      name: string,
      description: string,
      combination: ShortcutCombination,
      handler: ShortcutHandler,
      registrationOptions: ShortcutRegistrationOptions = {}
    ): void => {
      try {
        // Merge hook context with registration options
        const finalOptions: ShortcutRegistrationOptions = {
          ...registrationOptions,
          context: registrationOptions.context || context || 'global',
        };

        keyboardShortcutService.register(
          id,
          name,
          description,
          combination,
          handler,
          finalOptions
        );
        registeredIdsRef.current.add(id);
      } catch (err) {
        // Error handling - could emit to error boundary
        if (err instanceof Error) {
          // Silent error handling per user rules
        }
      }
    },
    [context]
  );

  /**
   * Unregister a shortcut
   */
  const unregisterShortcut = useCallback((id: string): void => {
    keyboardShortcutService.unregister(id);
    registeredIdsRef.current.delete(id);
  }, []);

  /**
   * Update shortcut combination
   */
  const updateShortcut = useCallback(
    (id: string, combination: ShortcutCombination): void => {
      try {
        keyboardShortcutService.updateShortcut(id, combination);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Set shortcut enabled state
   */
  const setShortcutEnabled = useCallback((id: string, enabled: boolean): void => {
    keyboardShortcutService.setShortcutEnabled(id, enabled);
  }, []);

  /**
   * Set active context
   */
  const setContext = useCallback((newContext: ShortcutContext): void => {
    keyboardShortcutService.setContext(newContext);
  }, []);

  /**
   * Cleanup: unregister all shortcuts registered by this hook
   */
  useEffect(() => {
    return () => {
      for (const id of registeredIdsRef.current) {
        keyboardShortcutService.unregister(id);
      }
      registeredIdsRef.current.clear();
    };
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    setShortcutEnabled,
    setContext,
    service: keyboardShortcutService,
  };
}

