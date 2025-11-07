/**
 * Tests for KeyboardShortcutService
 * @module tests/services/KeyboardShortcutService
 */

import { KeyboardShortcutService } from '../../src/services/KeyboardShortcutService';
import { InvalidParameterError, StateError } from '../../src/utils/errors';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;

  beforeEach(() => {
    localStorageMock.clear();
    service = new KeyboardShortcutService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup event listeners
    service.disable();
  });

  describe('initialization', () => {
    it('should initialize with empty shortcuts', () => {
      expect(service.getAllShortcuts()).toEqual([]);
    });

    it('should initialize with global context', () => {
      expect(service.getActiveContext()).toBe('global');
    });

    it('should be enabled by default', () => {
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('shortcut registration', () => {
    it('should register a shortcut', () => {
      const handler = jest.fn();

      service.register('test-shortcut', 'Test', 'Test description', { key: 'a', modifiers: ['ctrl'] }, handler);

      const shortcuts = service.getAllShortcuts();
      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0]?.id).toBe('test-shortcut');
    });

    it('should throw InvalidParameterError for invalid id', () => {
      const handler = jest.fn();

      expect(() => {
        service.register('', 'Test', 'Description', { key: 'a' }, handler);
      }).toThrow(InvalidParameterError);
    });

    it('should throw InvalidParameterError for invalid name', () => {
      const handler = jest.fn();

      expect(() => {
        service.register('test', '', 'Description', { key: 'a' }, handler);
      }).toThrow(InvalidParameterError);
    });

    it('should throw InvalidParameterError for invalid combination', () => {
      const handler = jest.fn();

      expect(() => {
        service.register('test', 'Test', 'Description', {} as any, handler);
      }).toThrow(InvalidParameterError);
    });

    it('should throw InvalidParameterError for invalid handler', () => {
      expect(() => {
        service.register('test', 'Test', 'Description', { key: 'a' }, null as any);
      }).toThrow(InvalidParameterError);
    });

    it('should register shortcut with context', () => {
      const handler = jest.fn();

      service.register(
        'test-shortcut',
        'Test',
        'Description',
        { key: 'a' },
        handler,
        { context: 'playlist' }
      );

      const shortcut = service.getShortcut('test-shortcut');
      expect(shortcut?.context).toBe('playlist');
    });
  });

  describe('shortcut conflicts', () => {
    it('should detect conflicts when registering duplicate combination', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      service.register('shortcut-1', 'Shortcut 1', 'Description 1', { key: 'a', modifiers: ['ctrl'] }, handler1);

      expect(() => {
        service.register('shortcut-2', 'Shortcut 2', 'Description 2', { key: 'a', modifiers: ['ctrl'] }, handler2);
      }).toThrow(StateError);
    });

    it('should not conflict with same id (update existing)', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      service.register('test-shortcut', 'Test', 'Description', { key: 'a' }, handler1);

      // Re-registering with same ID should update, not conflict
      service.register('test-shortcut', 'Test Updated', 'Description Updated', { key: 'b' }, handler2);

      const shortcut = service.getShortcut('test-shortcut');
      expect(shortcut?.name).toBe('Test Updated');
    });

    it('should detect conflicts across contexts', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      service.register(
        'shortcut-1',
        'Shortcut 1',
        'Description 1',
        { key: 'a' },
        handler1,
        { context: 'global' }
      );

      // Global shortcuts conflict with all contexts
      expect(() => {
        service.register(
          'shortcut-2',
          'Shortcut 2',
          'Description 2',
          { key: 'a' },
          handler2,
          { context: 'playlist' }
        );
      }).toThrow(StateError);
    });
  });

  describe('shortcut unregistration', () => {
    it('should unregister a shortcut', () => {
      const handler = jest.fn();

      service.register('test-shortcut', 'Test', 'Description', { key: 'a' }, handler);
      service.unregister('test-shortcut');

      expect(service.getShortcut('test-shortcut')).toBeUndefined();
    });

    it('should handle unregistering non-existent shortcut', () => {
      expect(() => {
        service.unregister('non-existent');
      }).not.toThrow();
    });
  });

  describe('shortcut execution', () => {
    it('should execute shortcut handler on key press', () => {
      const handler = jest.fn();

      service.register('test-shortcut', 'Test', 'Description', { key: 'a', modifiers: ['ctrl'] }, handler);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it('should not execute disabled shortcuts', () => {
      const handler = jest.fn();

      service.register(
        'test-shortcut',
        'Test',
        'Description',
        { key: 'a' },
        handler,
        { enabled: false }
      );

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });

      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not execute shortcuts when service is disabled', () => {
      const handler = jest.fn();

      service.register('test-shortcut', 'Test', 'Description', { key: 'a' }, handler);
      service.disable();

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });

      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should execute shortcuts only in matching context', () => {
      const globalHandler = jest.fn();
      const playlistHandler = jest.fn();

      service.register(
        'global-shortcut',
        'Global',
        'Description',
        { key: 'a' },
        globalHandler,
        { context: 'global' }
      );

      service.register(
        'playlist-shortcut',
        'Playlist',
        'Description',
        { key: 'b' },
        playlistHandler,
        { context: 'playlist' }
      );

      service.setActiveContext('playlist');

      const eventA = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      const eventB = new KeyboardEvent('keydown', { key: 'b', bubbles: true });

      document.dispatchEvent(eventA);
      document.dispatchEvent(eventB);

      // Global shortcuts work in all contexts
      expect(globalHandler).toHaveBeenCalled();
      expect(playlistHandler).toHaveBeenCalled();
    });
  });

  describe('context management', () => {
    it('should set active context', () => {
      service.setActiveContext('playlist');
      expect(service.getActiveContext()).toBe('playlist');
    });

    it('should get shortcuts for context', () => {
      const handler = jest.fn();

      service.register(
        'global-shortcut',
        'Global',
        'Description',
        { key: 'a' },
        handler,
        { context: 'global' }
      );

      service.register(
        'playlist-shortcut',
        'Playlist',
        'Description',
        { key: 'b' },
        handler,
        { context: 'playlist' }
      );

      const globalShortcuts = service.getShortcutsForContext('global');
      const playlistShortcuts = service.getShortcutsForContext('playlist');

      expect(globalShortcuts).toHaveLength(1);
      expect(playlistShortcuts).toHaveLength(1);
    });
  });

  describe('preferences', () => {
    it('should save and load preferences', () => {
      const handler = jest.fn();

      service.register('test-shortcut', 'Test', 'Description', { key: 'a' }, handler);
      service.setShortcutPreference('test-shortcut', { key: 'b', modifiers: ['ctrl'] });

      const newService = new KeyboardShortcutService();
      const shortcut = newService.getShortcut('test-shortcut');

      expect(shortcut?.combination.key).toBe('b');
      expect(shortcut?.combination.modifiers).toEqual(['ctrl']);
    });

    it('should reset to defaults', () => {
      const handler = jest.fn();

      service.register('test-shortcut', 'Test', 'Description', { key: 'a' }, handler);
      service.setShortcutPreference('test-shortcut', { key: 'b' });
      service.resetToDefaults();

      const shortcut = service.getShortcut('test-shortcut');
      expect(shortcut?.combination.key).toBe('a');
    });
  });

  describe('conflict detection', () => {
    it('should detect conflicts', () => {
      const handler = jest.fn();

      service.register('shortcut-1', 'Shortcut 1', 'Description', { key: 'a', modifiers: ['ctrl'] }, handler);

      const conflict = service.detectConflict('shortcut-2', { key: 'a', modifiers: ['ctrl'] });

      expect(conflict).not.toBeNull();
      expect(conflict?.conflictingShortcutId).toBe('shortcut-1');
    });

    it('should return null when no conflict', () => {
      const handler = jest.fn();

      service.register('shortcut-1', 'Shortcut 1', 'Description', { key: 'a', modifiers: ['ctrl'] }, handler);

      const conflict = service.detectConflict('shortcut-2', { key: 'b', modifiers: ['ctrl'] });

      expect(conflict).toBeNull();
    });
  });

  describe('enable/disable', () => {
    it('should enable service', () => {
      service.disable();
      service.enable();

      expect(service.isEnabled()).toBe(true);
    });

    it('should disable service', () => {
      service.disable();

      expect(service.isEnabled()).toBe(false);
    });
  });
});

