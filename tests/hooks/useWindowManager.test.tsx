/**
 * Tests for useWindowManager hook
 * @module tests/hooks/useWindowManager
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWindowManager } from '../../src/hooks/useWindowManager';

describe('useWindowManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('window creation', () => {
    it('should create a new window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        expect(windowId).toBeDefined();
      });

      expect(result.current.windows.length).toBeGreaterThan(0);
    });

    it('should create window with custom options', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('mixer', {
          x: 100,
          y: 200,
          width: 800,
          height: 600,
        });

        const window = result.current.getWindow(windowId);
        expect(window).toBeDefined();
        if (window) {
          expect(window.x).toBe(100);
          expect(window.y).toBe(200);
        }
      });
    });

    it('should create floating window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('pianoRoll', { isFloating: true });
        const window = result.current.getWindow(windowId);
        expect(window?.isFloating).toBe(true);
      });
    });
  });

  describe('window state management', () => {
    it('should get window by ID', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        const window = result.current.getWindow(windowId);
        expect(window).toBeDefined();
        expect(window?.id).toBe(windowId);
      });
    });

    it('should update window properties', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        result.current.updateWindow(windowId, { title: 'Updated Title' });

        const window = result.current.getWindow(windowId);
        expect(window?.title).toBe('Updated Title');
      });
    });

    it('should show window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        result.current.hideWindow(windowId);
        result.current.showWindow(windowId);

        const window = result.current.getWindow(windowId);
        expect(window?.isVisible).toBe(true);
      });
    });

    it('should hide window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        result.current.hideWindow(windowId);

        const window = result.current.getWindow(windowId);
        expect(window?.isVisible).toBe(false);
      });
    });

    it('should toggle window visibility', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        const initialVisible = result.current.getWindow(windowId)?.isVisible ?? false;

        result.current.toggleWindow(windowId);
        const afterToggle = result.current.getWindow(windowId)?.isVisible ?? false;
        expect(afterToggle).toBe(!initialVisible);
      });
    });
  });

  describe('window operations', () => {
    it('should minimize window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        result.current.minimizeWindow(windowId);

        const window = result.current.getWindow(windowId);
        expect(window?.isMinimized).toBe(true);
      });
    });

    it('should maximize window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        result.current.maximizeWindow(windowId);

        const window = result.current.getWindow(windowId);
        expect(window?.isMaximized).toBe(true);
      });
    });

    it('should close window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const initialCount = result.current.windows.length;
        const windowId = result.current.createWindow('playlist');
        const afterCreateCount = result.current.windows.length;

        result.current.closeWindow(windowId);

        expect(result.current.windows.length).toBe(afterCreateCount - 1);
        expect(result.current.getWindow(windowId)).toBeUndefined();
      });
    });

    it('should bring window to front', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId1 = result.current.createWindow('playlist');
        const windowId2 = result.current.createWindow('mixer');

        result.current.bringToFront(windowId1);

        const window1 = result.current.getWindow(windowId1);
        const window2 = result.current.getWindow(windowId2);
        expect(window1?.zIndex).toBeGreaterThan(window2?.zIndex ?? 0);
      });
    });
  });

  describe('window docking', () => {
    it('should dock window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        result.current.dockWindow(windowId, 'left');

        const window = result.current.getWindow(windowId);
        expect(window?.isFloating).toBe(false);
        expect(window?.dockPosition).toBe('left');
      });
    });

    it('should float window', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const windowId = result.current.createWindow('playlist');
        result.current.floatWindow(windowId);

        const window = result.current.getWindow(windowId);
        expect(window?.isFloating).toBe(true);
      });
    });
  });

  describe('window layouts', () => {
    it('should create a layout', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const layoutId = result.current.createLayout('My Layout');
        expect(layoutId).toBeDefined();
      });
    });

    it('should get all layouts', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        result.current.createLayout('Layout 1');
        result.current.createLayout('Layout 2');

        const layouts = result.current.getAllLayouts();
        expect(layouts.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should load a layout', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        const layoutId = result.current.createLayout('Test Layout');
        result.current.loadLayout(layoutId);

        // Layout loading should restore window state
        expect(result.current.getAllLayouts().find((l) => l.id === layoutId)).toBeDefined();
      });
    });
  });

  describe('window by type', () => {
    it('should toggle window by type', () => {
      const { result } = renderHook(() => useWindowManager());

      act(() => {
        result.current.toggleWindowByType('playlist');
        const playlistWindows = result.current.windows.filter((w) => w.type === 'playlist');
        expect(playlistWindows.length).toBeGreaterThan(0);
      });
    });
  });
});

