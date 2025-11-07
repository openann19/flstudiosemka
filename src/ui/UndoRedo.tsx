/**
 * UndoRedo - Undo/redo system using command pattern
 * Manages command history and state restoration
 * @module ui/UndoRedo
 */

/**
 * Command interface
 */
export interface ICommand {
  name: string;
  execute(): void;
  undo(): void;
}

/**
 * History info
 */
export interface HistoryInfo {
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  currentIndex: number;
}

/**
 * UndoRedo - Undo/redo system using command pattern
 * Manages command history and state restoration
 */
export class UndoRedo {
  private history: ICommand[];
  private currentIndex: number;
  private maxHistory: number;
  private isExecuting: boolean;

  constructor(maxHistory: number = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
    this.isExecuting = false;
  }

  /**
   * Execute a command
   * @param {ICommand} command - Command to execute
   */
  execute(command: ICommand): void {
    if (this.isExecuting) return;

    // Remove any commands after current index (when undoing and then doing new action)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Execute command
    this.isExecuting = true;
    command.execute();
    this.isExecuting = false;

    // Add to history
    this.history.push(command);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo last command
   * @returns {boolean} Success status
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    this.isExecuting = true;
    const command = this.history[this.currentIndex];
    command.undo();
    this.currentIndex--;
    this.isExecuting = false;

    return true;
  }

  /**
   * Redo last undone command
   * @returns {boolean} Success status
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    this.isExecuting = true;
    const command = this.history[this.currentIndex];
    command.execute();
    this.isExecuting = false;

    return true;
  }

  /**
   * Check if undo is possible
   * @returns {boolean} Can undo
   */
  canUndo(): boolean {
    return this.currentIndex >= 0 && !this.isExecuting;
  }

  /**
   * Check if redo is possible
   * @returns {boolean} Can redo
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1 && !this.isExecuting;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history info
   * @returns {HistoryInfo} History info
   */
  getInfo(): HistoryInfo {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historySize: this.history.length,
      currentIndex: this.currentIndex,
    };
  }
}

/**
 * Command - Base command class
 */
export class Command implements ICommand {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  execute(): void {
    throw new Error('Command.execute() must be implemented');
  }

  undo(): void {
    throw new Error('Command.undo() must be implemented');
  }
}

/**
 * AddNoteCommand - Command for adding a note
 */
export class AddNoteCommand extends Command {
  private pianoRoll: { addNote: (...args: unknown[]) => void; removeNote: (note: unknown) => void };
  private note: { start: number; duration: number; pitch: number; velocity: number };

  constructor(
    pianoRoll: { addNote: (...args: unknown[]) => void; removeNote: (note: unknown) => void },
    note: { start: number; duration: number; pitch: number; velocity: number }
  ) {
    super('Add Note');
    this.pianoRoll = pianoRoll;
    this.note = note;
  }

  execute(): void {
    this.pianoRoll.addNote(
      this.note.start,
      this.note.duration,
      this.note.pitch,
      this.note.velocity
    );
  }

  undo(): void {
    this.pianoRoll.removeNote(this.note);
  }
}

/**
 * DeleteNoteCommand - Command for deleting a note
 */
export class DeleteNoteCommand extends Command {
  private pianoRoll: { notes: unknown[] };
  private note: unknown;
  private index: number;

  constructor(pianoRoll: { notes: unknown[] }, note: unknown) {
    super('Delete Note');
    this.pianoRoll = pianoRoll;
    this.note = note;
    this.index = -1;
  }

  execute(): void {
    this.index = (this.pianoRoll.notes as unknown[]).indexOf(this.note);
    if (this.index !== -1) {
      this.pianoRoll.notes.splice(this.index, 1);
    }
  }

  undo(): void {
    if (this.index !== -1) {
      this.pianoRoll.notes.splice(this.index, 0, this.note);
    }
  }
}

/**
 * UpdateNoteCommand - Command for updating a note
 */
export class UpdateNoteCommand extends Command {
  private note: Record<string, unknown>;
  private oldValues: Record<string, unknown>;
  private newValues: Record<string, unknown>;

  constructor(
    note: Record<string, unknown>,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ) {
    super('Update Note');
    this.note = note;
    this.oldValues = oldValues;
    this.newValues = newValues;
  }

  execute(): void {
    Object.assign(this.note, this.newValues);
  }

  undo(): void {
    Object.assign(this.note, this.oldValues);
  }
}

/**
 * SetPropertyCommand - Generic command for setting properties
 */
export class SetPropertyCommand extends Command {
  private object: Record<string, unknown>;
  private property: string;
  private newValue: unknown;
  private oldValue: unknown;

  constructor(
    object: Record<string, unknown>,
    property: string,
    newValue: unknown,
    oldValue: unknown = null
  ) {
    super(`Set ${property}`);
    this.object = object;
    this.property = property;
    this.newValue = newValue;
    this.oldValue = oldValue !== null ? oldValue : object[property];
  }

  execute(): void {
    this.object[this.property] = this.newValue;
  }

  undo(): void {
    this.object[this.property] = this.oldValue;
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { UndoRedo: typeof UndoRedo }).UndoRedo = UndoRedo;
  (window as unknown as { Command: typeof Command }).Command = Command;
  (window as unknown as { AddNoteCommand: typeof AddNoteCommand }).AddNoteCommand =
    AddNoteCommand;
  (window as unknown as { DeleteNoteCommand: typeof DeleteNoteCommand }).DeleteNoteCommand =
    DeleteNoteCommand;
  (window as unknown as { UpdateNoteCommand: typeof UpdateNoteCommand }).UpdateNoteCommand =
    UpdateNoteCommand;
  (window as unknown as { SetPropertyCommand: typeof SetPropertyCommand }).SetPropertyCommand =
    SetPropertyCommand;
}

