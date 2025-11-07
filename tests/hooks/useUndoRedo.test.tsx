/**
 * Tests for useUndoRedo hook
 * @module tests/hooks/useUndoRedo
 */

import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../../src/hooks/useUndoRedo';
import type { Command } from '../../src/services/UndoRedoService';

describe('useUndoRedo', () => {
  describe('initialization', () => {
    it('should initialize with default max history size', () => {
      const { result } = renderHook(() => useUndoRedo());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.historySize).toBe(0);
    });

    it('should initialize with custom max history size', () => {
      const { result } = renderHook(() => useUndoRedo(50));

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.historySize).toBe(0);
    });
  });

  describe('command execution', () => {
    it('should execute a command', () => {
      const { result } = renderHook(() => useUndoRedo());
      let executed = false;

      const command: Command = {
        execute: () => {
          executed = true;
        },
        undo: () => {
          executed = false;
        },
      };

      act(() => {
        result.current.execute(command);
      });

      expect(executed).toBe(true);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.historySize).toBe(1);
    });

    it('should execute multiple commands', () => {
      const { result } = renderHook(() => useUndoRedo());
      let counter = 0;

      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      act(() => {
        result.current.execute(createCommand());
        result.current.execute(createCommand());
        result.current.execute(createCommand());
      });

      expect(counter).toBe(3);
      expect(result.current.historySize).toBe(3);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('undo', () => {
    it('should undo last command', () => {
      const { result } = renderHook(() => useUndoRedo());
      let value = 0;

      const command: Command = {
        execute: () => {
          value = 10;
        },
        undo: () => {
          value = 0;
        },
      };

      act(() => {
        result.current.execute(command);
        expect(value).toBe(10);
        result.current.undo();
      });

      expect(value).toBe(0);
      expect(result.current.canUndo).toBe(false);
    });

    it('should not undo when history is empty', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.historySize).toBe(0);
    });

    it('should undo multiple commands', () => {
      const { result } = renderHook(() => useUndoRedo());
      let counter = 0;

      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      act(() => {
        result.current.execute(createCommand());
        result.current.execute(createCommand());
        result.current.execute(createCommand());
        result.current.undo();
        result.current.undo();
      });

      expect(counter).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('redo', () => {
    it('should redo last undone command', () => {
      const { result } = renderHook(() => useUndoRedo());
      let value = 0;

      const command: Command = {
        execute: () => {
          value += 10;
        },
        undo: () => {
          value -= 10;
        },
      };

      act(() => {
        result.current.execute(command);
        result.current.undo();
        expect(value).toBe(0);
        result.current.redo();
      });

      expect(value).toBe(10);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should not redo when no redo history', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should redo multiple commands', () => {
      const { result } = renderHook(() => useUndoRedo());
      let counter = 0;

      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      act(() => {
        result.current.execute(createCommand());
        result.current.execute(createCommand());
        result.current.undo();
        result.current.undo();
        result.current.redo();
        result.current.redo();
      });

      expect(counter).toBe(2);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('history limits', () => {
    it('should limit history size', () => {
      const { result } = renderHook(() => useUndoRedo(3));
      let counter = 0;

      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      act(() => {
        // Execute more commands than max history
        for (let i = 0; i < 5; i += 1) {
          result.current.execute(createCommand());
        }
      });

      // History should be limited
      expect(result.current.historySize).toBeLessThanOrEqual(3);
    });
  });

  describe('clear history', () => {
    it('should clear all history', () => {
      const { result } = renderHook(() => useUndoRedo());
      let counter = 0;

      const createCommand = (): Command => ({
        execute: () => {
          counter += 1;
        },
        undo: () => {
          counter -= 1;
        },
      });

      act(() => {
        result.current.execute(createCommand());
        result.current.execute(createCommand());
        result.current.clear();
      });

      expect(result.current.historySize).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('command with description', () => {
    it('should execute command with description', () => {
      const { result } = renderHook(() => useUndoRedo());

      const command: Command = {
        execute: () => {},
        undo: () => {},
        description: 'Test command',
      };

      act(() => {
        result.current.execute(command);
      });

      expect(result.current.historySize).toBe(1);
    });
  });
});

