/**
 * Tests for useContextMenu hook
 * @module tests/hooks/useContextMenu
 */

import { renderHook, act } from '@testing-library/react';
import { useContextMenu } from '../../src/hooks/useContextMenu';
import { contextMenu } from '../../src/ui/ContextMenu';

// Mock the contextMenu service
jest.mock('../../src/ui/ContextMenu', () => ({
  contextMenu: {
    show: jest.fn(),
    hide: jest.fn(),
    getIsVisible: jest.fn(() => false),
  },
}));

describe('useContextMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contextMenu.getIsVisible as jest.Mock).mockReturnValue(false);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useContextMenu());

      expect(result.current.isVisible).toBe(false);
      expect(typeof result.current.attach).toBe('function');
      expect(typeof result.current.detach).toBe('function');
      expect(typeof result.current.show).toBe('function');
      expect(typeof result.current.hide).toBe('function');
    });
  });

  describe('show/hide', () => {
    it('should show context menu', () => {
      (contextMenu.getIsVisible as jest.Mock).mockReturnValue(true);
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.show(100, 200, [{ label: 'Test', action: jest.fn() }]);
      });

      expect(contextMenu.show).toHaveBeenCalledWith(100, 200, [{ label: 'Test', action: expect.any(Function) }]);
    });

    it('should hide context menu', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.hide();
      });

      expect(contextMenu.hide).toHaveBeenCalled();
    });
  });

  describe('attach/detach', () => {
    it('should attach context menu to element', () => {
      const { result } = renderHook(() => useContextMenu());
      const element = document.createElement('div');
      const items = [{ label: 'Test', action: jest.fn() }];

      act(() => {
        result.current.attach(element, items);
      });

      // Trigger contextmenu event
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200,
      });

      act(() => {
        element.dispatchEvent(event);
      });

      expect(contextMenu.show).toHaveBeenCalled();
    });

    it('should detach context menu from element', () => {
      const { result } = renderHook(() => useContextMenu());
      const element = document.createElement('div');
      const items = [{ label: 'Test', action: jest.fn() }];

      act(() => {
        result.current.attach(element, items);
        result.current.detach(element);
      });

      // Trigger contextmenu event - should not call show
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });

      act(() => {
        element.dispatchEvent(event);
      });

      // Show should not be called after detach
      expect(contextMenu.show).not.toHaveBeenCalled();
    });

    it('should handle null element gracefully', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.attach(null, []);
        result.current.detach(null);
        // Should not throw
      });
    });
  });
});
