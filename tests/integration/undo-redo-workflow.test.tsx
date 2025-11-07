/**
 * Integration tests for undo/redo workflow
 * @module tests/integration/undo-redo-workflow
 */

import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../../src/hooks/useUndoRedo';
import { useTracks } from '../../src/hooks/useTracks';
import { usePatterns } from '../../src/hooks/usePatterns';

describe('Undo/Redo Workflow', () => {
  it('should undo track addition', () => {
    const { result: tracksResult } = renderHook(() => useTracks());
    const { result: undoRedoResult } = renderHook(() => useUndoRedo());

    let initialCount: number;

    act(() => {
      initialCount = tracksResult.current.tracks.length;
      tracksResult.current.addTrack('Track 1', 'drum');

      // In real implementation, this would be wrapped in undo/redo command
      const command = {
        execute: () => {
          tracksResult.current.addTrack('Track 2', 'synth');
        },
        undo: () => {
          const lastTrack = tracksResult.current.tracks[tracksResult.current.tracks.length - 1];
          if (lastTrack) {
            tracksResult.current.deleteTrack(lastTrack.id);
          }
        },
      };

      undoRedoResult.current.execute(command);
    });

    expect(tracksResult.current.tracks.length).toBeGreaterThan(initialCount ?? 0);

    act(() => {
      undoRedoResult.current.undo();
    });

    // After undo, should be back to initial count
    expect(tracksResult.current.tracks.length).toBe(initialCount ?? 0);
  });

  it('should redo track addition after undo', () => {
    const { result: tracksResult } = renderHook(() => useTracks());
    const { result: undoRedoResult } = renderHook(() => useUndoRedo());

    let initialCount = 0;

    act(() => {
      initialCount = tracksResult.current.tracks.length;

      const command = {
        execute: () => {
          tracksResult.current.addTrack('Track 1', 'drum');
        },
        undo: () => {
          const lastTrack = tracksResult.current.tracks[tracksResult.current.tracks.length - 1];
          if (lastTrack) {
            tracksResult.current.deleteTrack(lastTrack.id);
          }
        },
      };

      undoRedoResult.current.execute(command);
    });

    expect(tracksResult.current.tracks.length).toBe(initialCount + 1);

    act(() => {
      undoRedoResult.current.undo();
    });

    expect(tracksResult.current.tracks.length).toBe(initialCount);

    act(() => {
      undoRedoResult.current.redo();
    });

    expect(tracksResult.current.tracks.length).toBe(initialCount + 1);
  });

  it('should undo pattern creation', () => {
    const { result: patternsResult } = renderHook(() => usePatterns());
    const { result: undoRedoResult } = renderHook(() => useUndoRedo());

    let initialCount: number;

    act(() => {
      initialCount = patternsResult.current.patterns.length;

      const command = {
        execute: () => {
          patternsResult.current.createPattern('New Pattern');
        },
        undo: () => {
          const lastPattern = patternsResult.current.patterns[patternsResult.current.patterns.length - 1];
          if (lastPattern) {
            patternsResult.current.deletePattern(lastPattern.id);
          }
        },
      };

      undoRedoResult.current.execute(command);
    });

    expect(patternsResult.current.patterns.length).toBeGreaterThan(initialCount ?? 0);

    act(() => {
      undoRedoResult.current.undo();
    });

    expect(patternsResult.current.patterns.length).toBe(initialCount ?? 0);
  });

  it('should undo multiple operations in sequence', () => {
    const { result: tracksResult } = renderHook(() => useTracks());
    const { result: undoRedoResult } = renderHook(() => useUndoRedo());

    let initialCount: number;

    act(() => {
      initialCount = tracksResult.current.tracks.length;

      // Execute multiple commands
      for (let i = 0; i < 3; i++) {
        const command = {
          execute: () => {
            tracksResult.current.addTrack(`Track ${i}`, 'drum');
          },
          undo: () => {
            const lastTrack = tracksResult.current.tracks[tracksResult.current.tracks.length - 1];
            if (lastTrack) {
              tracksResult.current.deleteTrack(lastTrack.id);
            }
          },
        };
        undoRedoResult.current.execute(command);
      }
    });

    expect(tracksResult.current.tracks.length).toBe((initialCount ?? 0) + 3);

    // Undo all operations
    act(() => {
      undoRedoResult.current.undo();
      undoRedoResult.current.undo();
      undoRedoResult.current.undo();
    });

    expect(tracksResult.current.tracks.length).toBe(initialCount ?? 0);
  });

  it('should limit history size', () => {
    const { result: undoRedoResult } = renderHook(() => useUndoRedo(3)); // Max 3 history items

    act(() => {
      // Execute more commands than history limit
      for (let i = 0; i < 5; i++) {
        const command = {
          execute: jest.fn(),
          undo: jest.fn(),
        };
        undoRedoResult.current.execute(command);
      }
    });

    // History should be limited
    expect(undoRedoResult.current.historySize).toBeLessThanOrEqual(3);
  });

  it('should clear history', () => {
    const { result: undoRedoResult } = renderHook(() => useUndoRedo());

    act(() => {
      const command = {
        execute: jest.fn(),
        undo: jest.fn(),
      };
      undoRedoResult.current.execute(command);
    });

    expect(undoRedoResult.current.historySize).toBeGreaterThan(0);

    act(() => {
      undoRedoResult.current.clear();
    });

    expect(undoRedoResult.current.historySize).toBe(0);
    expect(undoRedoResult.current.canUndo).toBe(false);
    expect(undoRedoResult.current.canRedo).toBe(false);
  });
});

