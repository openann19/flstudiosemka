/**
 * Tests for UndoRedoService
 * @module tests/services/UndoRedoService
 */

import { UndoRedoService, type Command } from '../../src/services/UndoRedoService';

describe('UndoRedoService', () => {
  let service: UndoRedoService;

  beforeEach(() => {
    service = new UndoRedoService();
  });

  describe('initialization', () => {
    it('should initialize with empty history', () => {
      expect(service.getHistorySize()).toBe(0);
      expect(service.canUndo()).toBe(false);
      expect(service.canRedo()).toBe(false);
    });

    it('should initialize with custom max history size', () => {
      const customService = new UndoRedoService(50);
      expect(customService.getHistorySize()).toBe(0);
    });
  });

  describe('command execution', () => {
    it('should execute a command', () => {
      let executed = false;
      const command: Command = {
        execute: () => {
          executed = true;
        },
        undo: () => {
          executed = false;
        },
      };

      service.execute(command);

      expect(executed).toBe(true);
      expect(service.getHistorySize()).toBe(1);
      expect(service.canUndo()).toBe(true);
    });

    it('should execute multiple commands', () => {
      let counter = 0;
      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      service.execute(createCommand());
      service.execute(createCommand());
      service.execute(createCommand());

      expect(counter).toBe(3);
      expect(service.getHistorySize()).toBe(3);
    });
  });

  describe('undo', () => {
    it('should undo last command', () => {
      let value = 0;
      const command: Command = {
        execute: () => {
          value = 10;
        },
        undo: () => {
          value = 0;
        },
      };

      service.execute(command);
      expect(value).toBe(10);

      const result = service.undo();
      expect(result).toBe(true);
      expect(value).toBe(0);
      expect(service.canUndo()).toBe(false);
    });

    it('should return false when nothing to undo', () => {
      const result = service.undo();
      expect(result).toBe(false);
    });

    it('should undo multiple commands', () => {
      let counter = 0;
      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      service.execute(createCommand());
      service.execute(createCommand());
      service.execute(createCommand());

      service.undo();
      service.undo();

      expect(counter).toBe(1);
      expect(service.canUndo()).toBe(true);
      expect(service.canRedo()).toBe(true);
    });
  });

  describe('redo', () => {
    it('should redo last undone command', () => {
      let value = 0;
      const command: Command = {
        execute: () => {
          value += 10;
        },
        undo: () => {
          value -= 10;
        },
      };

      service.execute(command);
      service.undo();
      expect(value).toBe(0);

      const result = service.redo();
      expect(result).toBe(true);
      expect(value).toBe(10);
      expect(service.canUndo()).toBe(true);
      expect(service.canRedo()).toBe(false);
    });

    it('should return false when nothing to redo', () => {
      const result = service.redo();
      expect(result).toBe(false);
    });

    it('should redo multiple commands', () => {
      let counter = 0;
      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      service.execute(createCommand());
      service.execute(createCommand());
      service.undo();
      service.undo();
      service.redo();
      service.redo();

      expect(counter).toBe(2);
      expect(service.canUndo()).toBe(true);
      expect(service.canRedo()).toBe(false);
    });
  });

  describe('history limits', () => {
    it('should limit history size', () => {
      const limitedService = new UndoRedoService(3);
      let counter = 0;

      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      // Execute more commands than max
      for (let i = 0; i < 5; i += 1) {
        limitedService.execute(createCommand());
      }

      expect(limitedService.getHistorySize()).toBeLessThanOrEqual(3);
    });
  });

  describe('clear history', () => {
    it('should clear all history', () => {
      let counter = 0;
      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      service.execute(createCommand());
      service.execute(createCommand());
      service.clear();

      expect(service.getHistorySize()).toBe(0);
      expect(service.canUndo()).toBe(false);
      expect(service.canRedo()).toBe(false);
    });
  });

  describe('command descriptions', () => {
    it('should store command description', () => {
      const command: Command = {
        execute: () => {},
        undo: () => {},
        description: 'Test command',
      };

      service.execute(command);

      const description = service.getCommandDescription(0);
      expect(description).toBe('Test command');
    });

    it('should return undefined for invalid index', () => {
      const description = service.getCommandDescription(0);
      expect(description).toBeUndefined();
    });
  });

  describe('current index', () => {
    it('should track current index', () => {
      let counter = 0;
      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      service.execute(createCommand());
      expect(service.getCurrentIndex()).toBe(0);

      service.execute(createCommand());
      expect(service.getCurrentIndex()).toBe(1);

      service.undo();
      expect(service.getCurrentIndex()).toBe(0);
    });
  });

  describe('new command after undo', () => {
    it('should clear redo history when new command is executed', () => {
      let counter = 0;
      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      service.execute(createCommand());
      service.execute(createCommand());
      service.undo();
      expect(service.canRedo()).toBe(true);

      service.execute(createCommand());
      expect(service.canRedo()).toBe(false);
      expect(service.getHistorySize()).toBe(2);
    });
  });
});

