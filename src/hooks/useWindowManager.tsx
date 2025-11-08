/**
 * useWindowManager - React hook for window management
 * Integrates WindowManagerService with React components
 * @module hooks/useWindowManager
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  WindowManagerService} from '../services/WindowManagerService';
import {
  windowManagerService
} from '../services/WindowManagerService';
import type { WindowType, WindowState, WindowLayout } from '../types/windows';

/**
 * Return type for useWindowManager hook
 */
export interface UseWindowManagerReturn {
  windows: WindowState[];
  layouts: WindowLayout[];
  currentLayoutId: string | null;
  createWindow: (
    type: WindowType,
    options?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      isFloating?: boolean;
      dockPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
    }
  ) => string;
  getWindow: (id: string) => WindowState | undefined;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  showWindow: (id: string) => void;
  hideWindow: (id: string) => void;
  toggleWindow: (id: string) => void;
  toggleWindowByType: (type: WindowType) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  focusWindow: (id: string) => void;
  dockWindow: (id: string, position: 'left' | 'right' | 'top' | 'bottom' | 'center') => void;
  floatWindow: (id: string) => void;
  createLayout: (name: string) => string;
  saveLayout: (name: string) => string;
  saveCurrentLayout: () => void;
  loadLayout: (layoutId: string) => void;
  getAllLayouts: () => WindowLayout[];
  service: WindowManagerService;
}

/**
 * React hook for managing windows
 * @returns Window management functions
 */
export function useWindowManager(): UseWindowManagerReturn {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [layouts, setLayouts] = useState<WindowLayout[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

  /**
   * Update windows state from service
   */
  const updateWindows = useCallback(() => {
    setWindows(windowManagerService.getAllWindows());
    setLayouts(windowManagerService.getAllLayouts());
    setCurrentLayoutId(windowManagerService.getCurrentLayoutId());
  }, []);

  /**
   * Initialize and subscribe to changes
   */
  useEffect(() => {
    updateWindows();
    // Note: In a full implementation, we'd subscribe to service events
    // For now, we'll update manually when needed
  }, [updateWindows]);

  /**
   * Create window
   */
  const createWindow = useCallback(
    (
      type: WindowType,
      options?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        isFloating?: boolean;
        dockPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
      }
    ): string => {
      const id = windowManagerService.createWindow(type, options);
      updateWindows();
      return id;
    },
    [updateWindows]
  );

  /**
   * Get window
   */
  const getWindow = useCallback((id: string): WindowState | undefined => {
    return windowManagerService.getWindow(id);
  }, []);

  /**
   * Update window
   */
  const updateWindow = useCallback(
    (id: string, updates: Partial<WindowState>): void => {
      windowManagerService.updateWindow(id, updates);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Show window
   */
  const showWindow = useCallback(
    (id: string): void => {
      windowManagerService.showWindow(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Hide window
   */
  const hideWindow = useCallback(
    (id: string): void => {
      windowManagerService.hideWindow(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Toggle window
   */
  const toggleWindow = useCallback(
    (id: string): void => {
      windowManagerService.toggleWindow(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Toggle window by type
   */
  const toggleWindowByType = useCallback(
    (type: WindowType): void => {
      windowManagerService.toggleWindowByType(type);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Minimize window
   */
  const minimizeWindow = useCallback(
    (id: string): void => {
      windowManagerService.minimizeWindow(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Maximize window
   */
  const maximizeWindow = useCallback(
    (id: string): void => {
      windowManagerService.maximizeWindow(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Close window
   */
  const closeWindow = useCallback(
    (id: string): void => {
      windowManagerService.closeWindow(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Bring to front
   */
  const bringToFront = useCallback(
    (id: string): void => {
      windowManagerService.bringToFront(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Focus window (alias for bringToFront)
   */
  const focusWindow = useCallback(
    (id: string): void => {
      windowManagerService.bringToFront(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Dock window
   */
  const dockWindow = useCallback(
    (id: string, position: 'left' | 'right' | 'top' | 'bottom' | 'center'): void => {
      windowManagerService.dockWindow(id, position);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Float window
   */
  const floatWindow = useCallback(
    (id: string): void => {
      windowManagerService.floatWindow(id);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Create layout
   */
  const createLayout = useCallback((name: string): string => {
    const id = windowManagerService.createLayout(name);
    updateWindows();
    return id;
  }, [updateWindows]);

  /**
   * Save layout (alias for createLayout)
   */
  const saveLayout = useCallback((name: string): string => {
    const id = windowManagerService.createLayout(name);
    updateWindows();
    return id;
  }, [updateWindows]);

  /**
   * Save current layout
   */
  const saveCurrentLayout = useCallback((): void => {
    windowManagerService.saveCurrentLayout();
    updateWindows();
  }, [updateWindows]);

  /**
   * Load layout
   */
  const loadLayout = useCallback(
    (layoutId: string): void => {
      windowManagerService.loadLayout(layoutId);
      updateWindows();
    },
    [updateWindows]
  );

  /**
   * Get all layouts
   */
  const getAllLayouts = useCallback((): WindowLayout[] => {
    return windowManagerService.getAllLayouts();
  }, []);

  return {
    windows,
    layouts,
    currentLayoutId,
    createWindow,
    getWindow,
    updateWindow,
    showWindow,
    hideWindow,
    toggleWindow,
    toggleWindowByType,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    bringToFront,
    focusWindow,
    dockWindow,
    floatWindow,
    createLayout,
    saveLayout,
    saveCurrentLayout,
    loadLayout,
    getAllLayouts,
    service: windowManagerService,
  };
}

