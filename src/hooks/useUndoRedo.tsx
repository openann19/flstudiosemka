/**
 * useUndoRedo - Undo/Redo hook
 * Provides undo/redo functionality using UndoRedoService
 * @module hooks/useUndoRedo
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { UndoRedoService, type Command } from '../services/UndoRedoService';

/**
 * useUndoRedo hook return
 */
export interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  execute: (command: Command) => void;
  clear: () => void;
  historySize: number;
}

/**
 * Undo/Redo hook
 */
export function useUndoRedo(maxHistorySize: number = 100): UseUndoRedoReturn {
  const serviceRef = useRef<UndoRedoService>(new UndoRedoService(maxHistorySize));
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [historySize, setHistorySize] = useState<number>(0);

  /**
   * Update state from service
   */
  const updateState = useCallback((): void => {
    setCanUndo(serviceRef.current.canUndo());
    setCanRedo(serviceRef.current.canRedo());
    setHistorySize(serviceRef.current.getHistorySize());
  }, []);

  /**
   * Execute command
   */
  const execute = useCallback(
    (command: Command): void => {
      serviceRef.current.execute(command);
      updateState();
    },
    [updateState]
  );

  /**
   * Undo
   */
  const undo = useCallback((): void => {
    serviceRef.current.undo();
    updateState();
  }, [updateState]);

  /**
   * Redo
   */
  const redo = useCallback((): void => {
    serviceRef.current.redo();
    updateState();
  }, [updateState]);

  /**
   * Clear history
   */
  const clear = useCallback((): void => {
    serviceRef.current.clear();
    updateState();
  }, [updateState]);

  /**
   * Setup keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    execute,
    clear,
    historySize,
  };
}

