/**
 * UndoRedo - Undo/redo system using command pattern
 * Manages command history and state restoration
 */

/**
 * Piano roll note interface
 */
interface PianoRollNote {
  start: number;
  duration: number;
  pitch: number;
  velocity: number;
  selected?: boolean;
}

/**
 * Piano roll editor interface
 */
interface PianoRollEditor {
  notes?: PianoRollNote[];
  addNote?: (start: number, duration: number, pitch: number, velocity: number) => void;
  removeNote?: (note: PianoRollNote) => void;
  updateNote?: (note: PianoRollNote, updates: Partial<PianoRollNote>) => void;
}

interface Command {
  name: string;
  execute: () => void;
  undo: () => void;
}

class UndoRedo {
  private history: Command[] = [];
  private currentIndex = -1;
  private maxHistory: number;
  private isExecuting = false;

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory;
  }

  /**
   * Execute a command
   */
  execute(command: Command): void {
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
   */
  canUndo(): boolean {
    return this.currentIndex >= 0 && !this.isExecuting;
  }

  /**
   * Check if redo is possible
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
   */
  getInfo(): {
    canUndo: boolean;
    canRedo: boolean;
    historySize: number;
    currentIndex: number;
  } {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historySize: this.history.length,
      currentIndex: this.currentIndex
    };
  }
}

/**
 * Command - Base command class
 */
abstract class BaseCommand implements Command {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract execute(): void;
  abstract undo(): void;
}

/**
 * AddNoteCommand - Command for adding a note
 */
class AddNoteCommand extends BaseCommand {
  private pianoRoll: PianoRollEditor;
  private note: PianoRollNote;

  constructor(pianoRoll: PianoRollEditor, note: PianoRollNote) {
    super('Add Note');
    this.pianoRoll = pianoRoll;
    this.note = note;
  }

  execute(): void {
    this.pianoRoll.addNote?.(
      this.note.start,
      this.note.duration,
      this.note.pitch,
      this.note.velocity
    );
  }

  undo(): void {
    this.pianoRoll.removeNote?.(this.note);
  }
}

/**
 * DeleteNoteCommand - Command for deleting a note
 */
class DeleteNoteCommand extends BaseCommand {
  private pianoRoll: PianoRollEditor;
  private note: PianoRollNote;
  private index = -1;

  constructor(pianoRoll: PianoRollEditor, note: PianoRollNote) {
    super('Delete Note');
    this.pianoRoll = pianoRoll;
    this.note = note;
  }

  execute(): void {
    this.index = this.pianoRoll.notes?.indexOf(this.note) ?? -1;
    if (this.index !== -1) {
      this.pianoRoll.notes?.splice(this.index, 1);
    }
  }

  undo(): void {
    if (this.index !== -1) {
      this.pianoRoll.notes?.splice(this.index, 0, this.note);
    }
  }
}

/**
 * UpdateNoteCommand - Command for updating a note
 */
class UpdateNoteCommand extends BaseCommand {
  private pianoRoll: PianoRollEditor;
  private note: PianoRollNote;
  private oldValues: Partial<PianoRollNote>;
  private newValues: Partial<PianoRollNote>;

  constructor(
    pianoRoll: PianoRollEditor,
    note: PianoRollNote,
    oldValues: Partial<PianoRollNote>,
    newValues: Partial<PianoRollNote>
  ) {
    super('Update Note');
    this.pianoRoll = pianoRoll;
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
class SetPropertyCommand extends BaseCommand {
  private object: Record<string, unknown>;
  private property: string;
  private newValue: unknown;
  private oldValue: unknown;

  constructor(object: Record<string, unknown>, property: string, newValue: unknown, oldValue: unknown | null = null) {
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

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    UndoRedo, 
    BaseCommand, 
    AddNoteCommand, 
    DeleteNoteCommand, 
    UpdateNoteCommand,
    SetPropertyCommand
  };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).UndoRedo = UndoRedo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).BaseCommand = BaseCommand;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).AddNoteCommand = AddNoteCommand;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).DeleteNoteCommand = DeleteNoteCommand;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).UpdateNoteCommand = UpdateNoteCommand;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SetPropertyCommand = SetPropertyCommand;
}

export { UndoRedo, BaseCommand, AddNoteCommand, DeleteNoteCommand, UpdateNoteCommand, SetPropertyCommand };
export type { Command };

