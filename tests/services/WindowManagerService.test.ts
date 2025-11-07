/**
 * Tests for WindowManagerService
 * @module tests/services/WindowManagerService
 */

import { WindowManagerService } from '../../src/services/WindowManagerService';
import { InvalidParameterError } from '../../src/utils/errors';

describe('WindowManagerService', () => {
  let service: WindowManagerService;

  beforeEach(() => {
    service = new WindowManagerService();
    localStorage.clear();
  });

  describe('window creation', () => {
    it('should create a new window', () => {
      const windowId = service.createWindow('playlist');

      expect(windowId).toBeDefined();
      expect(typeof windowId).toBe('string');
    });

    it('should create window with default dimensions', () => {
      const windowId = service.createWindow('playlist');
      const window = service.getWindow(windowId);

      expect(window).toBeDefined();
      expect(window?.width).toBe(800);
      expect(window?.height).toBe(600);
    });

    it('should create window with custom options', () => {
      const windowId = service.createWindow('mixer', {
        x: 100,
        y: 200,
        width: 1000,
        height: 700,
      });

      const window = service.getWindow(windowId);
      expect(window?.x).toBe(100);
      expect(window?.y).toBe(200);
      expect(window?.width).toBe(1000);
      expect(window?.height).toBe(700);
    });

    it('should create floating window by default', () => {
      const windowId = service.createWindow('playlist');
      const window = service.getWindow(windowId);

      expect(window?.isFloating).toBe(true);
    });

    it('should create docked window when specified', () => {
      const windowId = service.createWindow('playlist', { dockPosition: 'left' });
      const window = service.getWindow(windowId);

      expect(window?.isFloating).toBe(false);
      expect(window?.dockPosition).toBe('left');
    });
  });

  describe('window retrieval', () => {
    it('should get window by ID', () => {
      const windowId = service.createWindow('playlist');
      const window = service.getWindow(windowId);

      expect(window).toBeDefined();
      expect(window?.id).toBe(windowId);
      expect(window?.type).toBe('playlist');
    });

    it('should return undefined for non-existent window', () => {
      const window = service.getWindow('non-existent');

      expect(window).toBeUndefined();
    });

    it('should get all windows', () => {
      service.createWindow('playlist');
      service.createWindow('mixer');
      service.createWindow('piano-roll');

      const windows = service.getAllWindows();
      expect(windows.length).toBe(3);
    });

    it('should get windows by type', () => {
      service.createWindow('playlist');
      service.createWindow('mixer');
      service.createWindow('playlist');

      const playlistWindows = service.getWindowsByType('playlist');
      expect(playlistWindows.length).toBe(2);
    });
  });

  describe('window updates', () => {
    it('should update window properties', () => {
      const windowId = service.createWindow('playlist');

      service.updateWindow(windowId, { title: 'Updated Title' });

      const window = service.getWindow(windowId);
      expect(window?.title).toBe('Updated Title');
    });

    it('should throw error when updating non-existent window', () => {
      expect(() => {
        service.updateWindow('non-existent', { title: 'Test' });
      }).toThrow(InvalidParameterError);
    });
  });

  describe('window visibility', () => {
    it('should show window', () => {
      const windowId = service.createWindow('playlist');
      service.hideWindow(windowId);
      service.showWindow(windowId);

      const window = service.getWindow(windowId);
      expect(window?.isVisible).toBe(true);
      expect(window?.isMinimized).toBe(false);
    });

    it('should hide window', () => {
      const windowId = service.createWindow('playlist');
      service.hideWindow(windowId);

      const window = service.getWindow(windowId);
      expect(window?.isVisible).toBe(false);
    });

    it('should toggle window visibility', () => {
      const windowId = service.createWindow('playlist');
      const initialVisible = service.getWindow(windowId)?.isVisible ?? false;

      service.toggleWindow(windowId);

      const window = service.getWindow(windowId);
      expect(window?.isVisible).toBe(!initialVisible);
    });
  });

  describe('window operations', () => {
    it('should minimize window', () => {
      const windowId = service.createWindow('playlist');
      service.minimizeWindow(windowId);

      const window = service.getWindow(windowId);
      expect(window?.isMinimized).toBe(true);
    });

    it('should maximize window', () => {
      const windowId = service.createWindow('playlist');
      service.maximizeWindow(windowId);

      const window = service.getWindow(windowId);
      expect(window?.isMaximized).toBe(true);
    });

    it('should close window', () => {
      const windowId = service.createWindow('playlist');
      const initialCount = service.getAllWindows().length;

      service.closeWindow(windowId);

      expect(service.getAllWindows().length).toBe(initialCount - 1);
      expect(service.getWindow(windowId)).toBeUndefined();
    });

    it('should bring window to front', () => {
      const windowId1 = service.createWindow('playlist');
      const windowId2 = service.createWindow('mixer');

      service.bringToFront(windowId1);

      const window1 = service.getWindow(windowId1);
      const window2 = service.getWindow(windowId2);
      expect(window1?.zIndex).toBeGreaterThan(window2?.zIndex ?? 0);
    });
  });

  describe('window docking', () => {
    it('should dock window', () => {
      const windowId = service.createWindow('playlist');
      service.dockWindow(windowId, 'left');

      const window = service.getWindow(windowId);
      expect(window?.isFloating).toBe(false);
      expect(window?.dockPosition).toBe('left');
    });

    it('should float window', () => {
      const windowId = service.createWindow('playlist', { dockPosition: 'left' });
      service.floatWindow(windowId);

      const window = service.getWindow(windowId);
      expect(window?.isFloating).toBe(true);
    });
  });

  describe('window by type', () => {
    it('should toggle window by type - create if none exists', () => {
      service.toggleWindowByType('playlist');

      const windows = service.getWindowsByType('playlist');
      expect(windows.length).toBeGreaterThan(0);
    });

    it('should toggle window by type - hide if visible', () => {
      const windowId = service.createWindow('playlist');
      service.toggleWindowByType('playlist');

      const window = service.getWindow(windowId);
      expect(window?.isVisible).toBe(false);
    });

    it('should toggle window by type - show if hidden', () => {
      const windowId = service.createWindow('playlist');
      service.hideWindow(windowId);
      service.toggleWindowByType('playlist');

      const window = service.getWindow(windowId);
      expect(window?.isVisible).toBe(true);
    });
  });

  describe('layouts', () => {
    it('should create a layout', () => {
      const layoutId = service.createLayout('My Layout');

      expect(layoutId).toBeDefined();
      expect(typeof layoutId).toBe('string');
    });

    it('should get all layouts', () => {
      service.createLayout('Layout 1');
      service.createLayout('Layout 2');

      const layouts = service.getAllLayouts();
      expect(layouts.length).toBeGreaterThanOrEqual(2);
    });

    it('should load a layout', () => {
      const layoutId = service.createLayout('Test Layout');
      service.createWindow('playlist');

      service.loadLayout(layoutId);

      // Layout should be loaded
      expect(service.getAllLayouts().find((l) => l.id === layoutId)).toBeDefined();
    });
  });
});

