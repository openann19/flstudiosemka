/**
 * Tests for useMouseInteractions hook
 * @module tests/hooks/useMouseInteractions
 */

import { renderHook, act } from '@testing-library/react';
import { useMouseInteractions } from '../../src/hooks/useMouseInteractions';
import { mouseInteractionService } from '../../src/services/MouseInteractionService';

// Mock the service
jest.mock('../../src/services/MouseInteractionService', () => ({
  mouseInteractionService: {
    setEnabled: jest.fn(),
    registerScrollZoom: jest.fn(),
    registerScrollParameter: jest.fn(),
    registerScrollTimeline: jest.fn(),
    registerMiddleMousePan: jest.fn(),
    registerDragStart: jest.fn(),
    registerDrop: jest.fn(),
    registerDrag: jest.fn(),
    unregister: jest.fn(),
  },
}));

describe('useMouseInteractions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useMouseInteractions());

      expect(result.current.service).toBe(mouseInteractionService);
      expect(typeof result.current.registerScrollZoom).toBe('function');
      expect(typeof result.current.registerScrollParameter).toBe('function');
      expect(typeof result.current.registerScrollTimeline).toBe('function');
    });

    it('should set enabled state', () => {
      renderHook(() => useMouseInteractions({ enabled: false }));

      expect(mouseInteractionService.setEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('registration', () => {
    it('should register scroll zoom', () => {
      const { result } = renderHook(() => useMouseInteractions());
      const element = document.createElement('div');
      const handler = jest.fn();

      act(() => {
        result.current.registerScrollZoom(element, handler);
      });

      expect(mouseInteractionService.registerScrollZoom).toHaveBeenCalledWith(element, handler, undefined);
    });

    it('should register scroll parameter', () => {
      const { result } = renderHook(() => useMouseInteractions());
      const element = document.createElement('div');
      const handler = jest.fn();

      act(() => {
        result.current.registerScrollParameter(element, handler);
      });

      expect(mouseInteractionService.registerScrollParameter).toHaveBeenCalledWith(element, handler, undefined);
    });

    it('should register scroll timeline', () => {
      const { result } = renderHook(() => useMouseInteractions());
      const element = document.createElement('div');
      const handler = jest.fn();

      act(() => {
        result.current.registerScrollTimeline(element, handler);
      });

      expect(mouseInteractionService.registerScrollTimeline).toHaveBeenCalledWith(element, handler, undefined);
    });

    it('should register middle mouse pan', () => {
      const { result } = renderHook(() => useMouseInteractions());
      const element = document.createElement('div');
      const handler = jest.fn();

      act(() => {
        result.current.registerMiddleMousePan(element, handler);
      });

      expect(mouseInteractionService.registerMiddleMousePan).toHaveBeenCalledWith(element, handler);
    });

    it('should handle null element gracefully', () => {
      const { result } = renderHook(() => useMouseInteractions());
      const handler = jest.fn();

      act(() => {
        result.current.registerScrollZoom(null, handler);
        result.current.registerScrollParameter(null, handler);
        result.current.registerScrollTimeline(null, handler);
        result.current.registerMiddleMousePan(null, handler);
        // Should not throw
      });
    });
  });

  describe('unregistration', () => {
    it('should unregister element', () => {
      const { result } = renderHook(() => useMouseInteractions());
      const element = document.createElement('div');

      act(() => {
        result.current.unregister(element);
      });

      expect(mouseInteractionService.unregister).toHaveBeenCalledWith(element);
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useMouseInteractions());
      const element = document.createElement('div');
      const handler = jest.fn();

      act(() => {
        result.current.registerScrollZoom(element, handler);
      });

      unmount();

      expect(mouseInteractionService.unregister).toHaveBeenCalled();
    });
  });
});
