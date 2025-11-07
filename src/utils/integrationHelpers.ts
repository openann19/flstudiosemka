/**
 * Integration Helpers - Utility functions for integrating workflow features
 * @module utils/integrationHelpers
 */

import { keyboardShortcutService } from '../services/KeyboardShortcutService';
import { windowManagerService } from '../services/WindowManagerService';
import { toolManagerService } from '../services/ToolManagerService';
import { themeService } from '../services/ThemeService';
import type { WindowType } from '../types/windows';
import type { ToolType } from '../types/FLStudio.types';

/**
 * Register default FL Studio keyboard shortcuts
 */
export function registerDefaultShortcuts(): void {
  // Navigation shortcuts
  keyboardShortcutService.register(
    'toggle-playlist',
    'Toggle Playlist',
    'Show/hide Playlist window',
    { key: 'F7' },
    () => {
      windowManagerService.toggleWindowByType('playlist');
    }
  );

  keyboardShortcutService.register(
    'toggle-channel-rack',
    'Toggle Channel Rack',
    'Show/hide Channel Rack window',
    { key: 'F6' },
    () => {
      windowManagerService.toggleWindowByType('channel-rack');
    }
  );

  keyboardShortcutService.register(
    'toggle-piano-roll',
    'Toggle Piano Roll',
    'Show/hide Piano Roll window',
    { key: 'F9' },
    () => {
      windowManagerService.toggleWindowByType('piano-roll');
    }
  );

  keyboardShortcutService.register(
    'toggle-mixer',
    'Toggle Mixer',
    'Show/hide Mixer window',
    { key: 'F8' },
    () => {
      windowManagerService.toggleWindowByType('mixer');
    }
  );

  keyboardShortcutService.register(
    'toggle-browser',
    'Toggle Browser',
    'Show/hide Browser window',
    { key: 'F5' },
    () => {
      windowManagerService.toggleWindowByType('browser');
    }
  );

  // Tool shortcuts
  const toolShortcuts: Array<{ key: string; tool: ToolType }> = [
    { key: 'Digit1', tool: 'draw' },
    { key: 'Digit2', tool: 'paint' },
    { key: 'Digit3', tool: 'select' },
    { key: 'Digit4', tool: 'slip' },
    { key: 'Digit5', tool: 'delete' },
    { key: 'Digit6', tool: 'mute' },
    { key: 'Digit7', tool: 'slice' },
  ];

  toolShortcuts.forEach(({ key, tool }) => {
    keyboardShortcutService.register(
      `tool-${tool}`,
      `Select ${toolManagerService.getToolName(tool)} Tool`,
      toolManagerService.getToolDescription(tool),
      { key },
      () => {
        toolManagerService.setTool(tool);
      }
    );
  });
}

/**
 * Initialize default windows
 */
export function initializeDefaultWindows(): void {
  const windowTypes: WindowType[] = ['channel-rack', 'piano-roll', 'playlist', 'mixer', 'browser'];

  windowTypes.forEach((type) => {
    const existing = windowManagerService.getWindowsByType(type);
    if (existing.length === 0) {
      windowManagerService.createWindow(type, {
        isFloating: false,
        dockPosition: 'center',
      });
    }
  });
}

/**
 * Initialize theme
 */
export function initializeTheme(): void {
  // Theme is automatically initialized by ThemeService constructor
  // This function can be used to apply custom theme on startup
  const savedTheme = localStorage.getItem('fl-studio-theme');
  if (savedTheme) {
    themeService.setTheme(savedTheme);
  }
}

/**
 * Initialize all workflow systems
 */
export function initializeWorkflowSystems(): void {
  registerDefaultShortcuts();
  initializeDefaultWindows();
  initializeTheme();
}

