/**
 * WindowManagerService - Window state and layout management
 * Handles floating/detachable windows, docking, and layout persistence
 * @module services/WindowManagerService
 */

import type {
  WindowType,
  WindowState,
  WindowLayout,
} from '../types/windows';
import { InvalidParameterError, StateError } from '../utils/errors';

/**
 * Window manager service
 */
export class WindowManagerService {
  private windows: Map<string, WindowState>;

  private layouts: Map<string, WindowLayout>;

  private currentLayoutId: string | null;

  private nextWindowId: number;

  private nextZIndex: number;

  private readonly storageKey = 'fl-studio-window-layouts';

  /**
   * Create a new WindowManagerService instance
   */
  constructor() {
    this.windows = new Map<string, WindowState>();
    this.layouts = new Map<string, WindowLayout>();
    this.currentLayoutId = null;
    this.nextWindowId = 0;
    this.nextZIndex = 1000;
    this.loadLayouts();
  }

  /**
   * Create a new window
   * @param type - Window type
   * @param options - Window options
   * @returns Window ID
   */
  createWindow(
    type: WindowType,
    options: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      isFloating?: boolean;
      dockPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
    } = {}
  ): string {
    const id = `window_${this.nextWindowId++}`;
    const defaultWidth = 800;
    const defaultHeight = 600;
    const globalWindow = typeof window !== 'undefined' ? window : null;

    const windowState: WindowState = {
      id,
      type,
      x: options.x ?? (globalWindow ? globalWindow.innerWidth / 2 - defaultWidth / 2 : 0),
      y: options.y ?? (globalWindow ? globalWindow.innerHeight / 2 - defaultHeight / 2 : 0),
      width: options.width ?? defaultWidth,
      height: options.height ?? defaultHeight,
      isVisible: true,
      isFloating: options.isFloating ?? true,
      isMinimized: false,
      isMaximized: false,
      zIndex: this.nextZIndex++,
      dockPosition: options.dockPosition,
    };

    this.windows.set(id, windowState);
    return id;
  }

  /**
   * Get window state
   * @param id - Window ID
   * @returns Window state or undefined
   */
  getWindow(id: string): WindowState | undefined {
    return this.windows.get(id);
  }

  /**
   * Get all windows
   * @returns Array of window states
   */
  getAllWindows(): WindowState[] {
    return Array.from(this.windows.values());
  }

  /**
   * Get windows by type
   * @param type - Window type
   * @returns Array of window states
   */
  getWindowsByType(type: WindowType): WindowState[] {
    return Array.from(this.windows.values()).filter((w) => w.type === type);
  }

  /**
   * Update window state
   * @param id - Window ID
   * @param updates - Partial window state updates
   */
  updateWindow(id: string, updates: Partial<WindowState>): void {
    const window = this.windows.get(id);
    if (!window) {
      throw new InvalidParameterError('id', id, 'existing window ID');
    }

    Object.assign(window, updates);
    this.saveCurrentLayout();
  }

  /**
   * Show window
   * @param id - Window ID
   */
  showWindow(id: string): void {
    this.updateWindow(id, { isVisible: true, isMinimized: false });
    this.bringToFront(id);
  }

  /**
   * Hide window
   * @param id - Window ID
   */
  hideWindow(id: string): void {
    this.updateWindow(id, { isVisible: false });
  }

  /**
   * Toggle window visibility
   * @param id - Window ID
   */
  toggleWindow(id: string): void {
    const window = this.windows.get(id);
    if (!window) {
      return;
    }
    if (window.isVisible) {
      this.hideWindow(id);
    } else {
      this.showWindow(id);
    }
  }

  /**
   * Toggle window by type (show if hidden, hide if visible)
   * @param type - Window type
   */
  toggleWindowByType(type: WindowType): void {
    const windows = this.getWindowsByType(type);
    if (windows.length === 0) {
      // Create new window if none exists
      this.createWindow(type);
      return;
    }

    const visibleWindows = windows.filter((w) => w.isVisible);
    if (visibleWindows.length > 0) {
      // Hide all visible windows of this type
      visibleWindows.forEach((w) => this.hideWindow(w.id));
    } else {
      // Show the first window of this type
      this.showWindow(windows[0].id);
    }
  }

  /**
   * Minimize window
   * @param id - Window ID
   */
  minimizeWindow(id: string): void {
    this.updateWindow(id, { isMinimized: true });
  }

  /**
   * Maximize window
   * @param id - Window ID
   */
  maximizeWindow(id: string): void {
    const window = this.windows.get(id);
    if (!window) {
      return;
    }
    this.updateWindow(id, { isMaximized: !window.isMaximized });
  }

  /**
   * Close window
   * @param id - Window ID
   */
  closeWindow(id: string): void {
    this.windows.delete(id);
    this.saveCurrentLayout();
  }

  /**
   * Bring window to front
   * @param id - Window ID
   */
  bringToFront(id: string): void {
    const window = this.windows.get(id);
    if (!window) {
      return;
    }
    window.zIndex = this.nextZIndex++;
    this.saveCurrentLayout();
  }

  /**
   * Dock window
   * @param id - Window ID
   * @param position - Dock position
   */
  dockWindow(id: string, position: 'left' | 'right' | 'top' | 'bottom' | 'center'): void {
    this.updateWindow(id, {
      isFloating: false,
      docked: true,
      dockPosition: position,
    });
  }

  /**
   * Float window
   * @param id - Window ID
   */
  floatWindow(id: string): void {
    this.updateWindow(id, {
      isFloating: true,
      dockPosition: undefined,
    });
  }

  /**
   * Create layout
   * @param name - Layout name
   * @returns Layout ID
   */
  createLayout(name: string): string {
    const id = `layout_${Date.now()}`;
    const layout: WindowLayout = {
      id,
      name,
      windows: Array.from(this.windows.values()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.layouts.set(id, layout);
    this.saveLayouts();
    return id;
  }

  /**
   * Save current layout
   */
  saveCurrentLayout(): void {
    if (!this.currentLayoutId) {
      this.currentLayoutId = this.createLayout('Default');
    }

    const layout = this.layouts.get(this.currentLayoutId);
    if (layout) {
      layout.windows = Array.from(this.windows.values());
      layout.updatedAt = new Date().toISOString();
      this.saveLayouts();
    }
  }

  /**
   * Load layout
   * @param layoutId - Layout ID
   */
  loadLayout(layoutId: string): void {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      throw new InvalidParameterError('layoutId', layoutId, 'existing layout ID');
    }

    // Clear current windows
    this.windows.clear();

    // Restore windows from layout
    layout.windows.forEach((window) => {
      this.windows.set(window.id, { ...window });
    });

    this.currentLayoutId = layoutId;
    this.saveLayouts();
  }

  /**
   * Get all layouts
   * @returns Array of layouts
   */
  getAllLayouts(): WindowLayout[] {
    return Array.from(this.layouts.values());
  }

  /**
   * Get current layout ID
   * @returns Current layout ID or null
   */
  getCurrentLayoutId(): string | null {
    return this.currentLayoutId;
  }

  /**
   * Delete layout
   * @param layoutId - Layout ID
   */
  deleteLayout(layoutId: string): void {
    if (this.currentLayoutId === layoutId) {
      throw new StateError('Cannot delete current layout', 'current-layout', 'not-current');
    }
    this.layouts.delete(layoutId);
    this.saveLayouts();
  }

  /**
   * Save layouts to localStorage
   * @private
   */
  private saveLayouts(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const layoutsData = Array.from(this.layouts.values());
      localStorage.setItem(this.storageKey, JSON.stringify(layoutsData));
    } catch {
      // Silent error handling
    }
  }

  /**
   * Load layouts from localStorage
   * @private
   */
  private loadLayouts(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const layoutsData = JSON.parse(stored) as WindowLayout[];
        layoutsData.forEach((layout) => {
          this.layouts.set(layout.id, layout);
        });
        if (layoutsData.length > 0) {
          this.currentLayoutId = layoutsData[0].id;
        }
      }
    } catch {
      // Silent error handling
    }
  }
}

// Export singleton instance
export const windowManagerService = new WindowManagerService();

