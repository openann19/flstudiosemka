/**
 * UndoRedoService - Undo/Redo system with command pattern
 * Manages history stack for undo/redo functionality
 * @module services/UndoRedoService
 */

/**
 * Command interface
 */
export interface Command {
  execute: () => void;
  undo: () => void;
  description?: string;
}

/**
 * Undo/Redo service
 */
export class UndoRedoService {
  private history: Command[];
  private currentIndex: number;
  private maxHistorySize: number;

  /**
   * Create a new UndoRedoService instance
   */
  constructor(maxHistorySize: number = 100) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Execute a command and add to history
   */
  execute(command: Command): void {
    // Remove any commands after current index (when redo history exists)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Execute command
    command.execute();

    // Add to history
    this.history.push(command);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo last command
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    const command = this.history[this.currentIndex];
    command.undo();
    this.currentIndex--;

    return true;
  }

  /**
   * Redo last undone command
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    command.execute();

    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get command description at index
   */
  getCommandDescription(index: number): string | undefined {
    if (index < 0 || index >= this.history.length) {
      return undefined;
    }
    return this.history[index].description;
  }
}

