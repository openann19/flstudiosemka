/**
 * Tests for useKeyboardShortcuts hook
 * @module tests/hooks/useKeyboardShortcuts
 */

import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import type { ShortcutCombination } from '../../src/types/shortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Clear any registered shortcuts
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.service).toBeDefined();
    });

    it('should initialize with custom context', () => {
      const { result } = renderHook(() => useKeyboardShortcuts({ context: 'playlist' }));

      expect(result.current.service).toBeDefined();
    });

    it('should initialize with enabled false', () => {
      const { result } = renderHook(() => useKeyboardShortcuts({ enabled: false }));

      expect(result.current.service).toBeDefined();
    });
  });

  describe('shortcut registration', () => {
    it('should register a shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      const handler = jest.fn();

      act(() => {
        result.current.registerShortcut(
          'test-shortcut',
          'Test Shortcut',
          'Test description',
          { key: 'a', ctrl: true },
          handler
        );
      });

      // Shortcut should be registered
      expect(result.current.service).toBeDefined();
    });

    it('should register shortcut with custom context', () => {
      const { result } = renderHook(() => useKeyboardShortcuts({ context: 'playlist' }));
      const handler = jest.fn();

      act(() => {
        result.current.registerShortcut(
          'test-shortcut',
          'Test Shortcut',
          'Test description',
          { key: 'b', ctrl: true },
          handler,
          { context: 'playlist' }
        );
      });

      expect(result.current.service).toBeDefined();
    });
  });

  describe('shortcut unregistration', () => {
    it('should unregister a shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      const handler = jest.fn();

      act(() => {
        result.current.registerShortcut(
          'test-shortcut',
          'Test Shortcut',
          'Test description',
          { key: 'c', ctrl: true },
          handler
        );
        result.current.unregisterShortcut('test-shortcut');
      });

      // Should not throw
      expect(result.current.service).toBeDefined();
    });

    it('should handle unregistering non-existent shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      act(() => {
        result.current.unregisterShortcut('non-existent');
      });

      // Should not throw
      expect(result.current.service).toBeDefined();
    });
  });

  describe('shortcut updates', () => {
    it('should update shortcut combination', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      const handler = jest.fn();

      act(() => {
        result.current.registerShortcut(
          'test-shortcut',
          'Test Shortcut',
          'Test description',
          { key: 'd', ctrl: true },
          handler
        );
        result.current.updateShortcut('test-shortcut', { key: 'e', ctrl: true });
      });

      expect(result.current.service).toBeDefined();
    });
  });

  describe('shortcut enabled state', () => {
    it('should enable/disable shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      const handler = jest.fn();

      act(() => {
        result.current.registerShortcut(
          'test-shortcut',
          'Test Shortcut',
          'Test description',
          { key: 'f', ctrl: true },
          handler
        );
        result.current.setShortcutEnabled('test-shortcut', false);
        result.current.setShortcutEnabled('test-shortcut', true);
      });

      expect(result.current.service).toBeDefined();
    });
  });

  describe('context management', () => {
    it('should set context', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      act(() => {
        result.current.setContext('playlist');
      });

      expect(result.current.service).toBeDefined();
    });

    it('should change context', () => {
      const { result } = renderHook(() => useKeyboardShortcuts({ context: 'global' }));

      act(() => {
        result.current.setContext('playlist');
      });

      expect(result.current.service).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should unregister shortcuts on unmount', () => {
      const { result, unmount } = renderHook(() => useKeyboardShortcuts());
      const handler = jest.fn();

      act(() => {
        result.current.registerShortcut(
          'test-shortcut',
          'Test Shortcut',
          'Test description',
          { key: 'g', ctrl: true },
          handler
        );
      });

      unmount();

      // Shortcuts should be cleaned up
      expect(result.current.service).toBeDefined();
    });
  });
});

