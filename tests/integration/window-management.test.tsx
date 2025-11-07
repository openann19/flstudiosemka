/**
 * Integration tests for window management workflow
 * @module tests/integration/window-management
 */

import { renderHook, act } from '@testing-library/react';
import { useWindowManager } from '../../src/hooks/useWindowManager';

describe('Window Management Workflow', () => {
  it('should create window and verify it exists', () => {
    const { result } = renderHook(() => useWindowManager());

    let windowId: string | undefined;

    act(() => {
      windowId = result.current.createWindow('mixer', { title: 'Mixer' });
    });

    expect(windowId).toBeDefined();
    expect(result.current.windows.length).toBeGreaterThan(0);
  });

  it('should create window, dock it, and verify state', () => {
    const { result } = renderHook(() => useWindowManager());

    let windowId: string | undefined;

    act(() => {
      windowId = result.current.createWindow('playlist', { title: 'Playlist' });
    });

    act(() => {
      if (windowId) {
        result.current.dockWindow(windowId, 'bottom');
      }
    });

    const window = result.current.windows.find((w) => w.id === windowId);
    expect(window?.docked).toBe(true);
    expect(window?.dockPosition).toBe('bottom');
  });

  it('should create window, save layout, and load it', () => {
    const { result } = renderHook(() => useWindowManager());

    let windowId: string | undefined;
    let layoutId: string | undefined;

    act(() => {
      windowId = result.current.createWindow('piano-roll', { title: 'Piano Roll' });
      layoutId = result.current.saveLayout('Test Layout');
    });

    expect(layoutId).toBeDefined();
    expect(result.current.layouts.length).toBeGreaterThan(0);

    act(() => {
      if (layoutId) {
        result.current.loadLayout(layoutId);
      }
    });

    // Layout should be loaded
    expect(result.current.currentLayoutId).toBe(layoutId);
  });

  it('should create multiple windows and manage z-index', () => {
    const { result } = renderHook(() => useWindowManager());

    const windowIds: string[] = [];

    act(() => {
      windowIds.push(result.current.createWindow('mixer') ?? '');
      windowIds.push(result.current.createWindow('playlist') ?? '');
      windowIds.push(result.current.createWindow('piano-roll') ?? '');
    });

    expect(result.current.windows.length).toBe(3);

    // Windows should have different z-index values
    const zIndices = result.current.windows.map((w) => w.zIndex);
    const uniqueZIndices = new Set(zIndices);
    expect(uniqueZIndices.size).toBe(3);
  });

  it('should create window, focus it, and verify it is on top', () => {
    const { result } = renderHook(() => useWindowManager());

    let windowId1: string | undefined;
    let windowId2: string | undefined;

    act(() => {
      windowId1 = result.current.createWindow('mixer');
      windowId2 = result.current.createWindow('playlist');
    });

    act(() => {
      if (windowId1) {
        result.current.focusWindow(windowId1);
      }
    });

    const window1 = result.current.windows.find((w) => w.id === windowId1);
    const window2 = result.current.windows.find((w) => w.id === windowId2);

    expect(window1?.zIndex).toBeGreaterThan(window2?.zIndex ?? 0);
  });

  it('should create window, close it, and verify it is removed', () => {
    const { result } = renderHook(() => useWindowManager());

    let windowId: string | undefined;
    let initialCount: number = 0;

    act(() => {
      initialCount = result.current.windows.length;
      windowId = result.current.createWindow('mixer');
    });

    expect(result.current.windows.length).toBe((initialCount ?? 0) + 1);

    act(() => {
      if (windowId) {
        result.current.closeWindow(windowId);
      }
    });

    expect(result.current.windows.length).toBe(initialCount ?? 0);
    expect(result.current.windows.find((w) => w.id === windowId)).toBeUndefined();
  });
});

