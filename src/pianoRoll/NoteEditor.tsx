/**
 * NoteEditor - Note editing utilities
 * Provides note manipulation, velocity editing, and chord detection
 * @module pianoRoll/NoteEditor
 */

/**
 * Note object
 */
export interface Note {
  start: number;
  duration: number;
  pitch: number;
  velocity: number;
  selected?: boolean;
  [key: string]: unknown;
}

/**
 * Detected chord
 */
export interface DetectedChord {
  type: string;
  pitches: number[];
  notes: Note[];
}

/**
 * NoteEditor - Note editing utilities
 * Provides note manipulation, velocity editing, and chord detection
 */
export class NoteEditor {
  private notes: Note[];

  constructor() {
    this.notes = [];
  }

  /**
   * Set notes
   * @param {Note[]} notes - Array of notes
   */
  setNotes(notes: Note[]): void {
    this.notes = notes;
  }

  /**
   * Set velocity for notes
   * @param {Note[]} notes - Notes to update
   * @param {number} velocity - Velocity (0-1)
   */
  setVelocity(notes: Note[], velocity: number): void {
    notes.forEach((note) => {
      note.velocity = Math.max(0, Math.min(1, velocity));
    });
  }

  /**
   * Adjust note length
   * @param {Note[]} notes - Notes to adjust
   * @param {number} delta - Change in duration
   */
  adjustLength(notes: Note[], delta: number): void {
    notes.forEach((note) => {
      note.duration = Math.max(0.0625, note.duration + delta);
    });
  }

  /**
   * Transpose notes
   * @param {Note[]} notes - Notes to transpose
   * @param {number} semitones - Semitones to transpose
   */
  transpose(notes: Note[], semitones: number): void {
    notes.forEach((note) => {
      note.pitch = Math.max(0, Math.min(127, note.pitch + semitones));
    });
  }

  /**
   * Detect chords
   * @param {number} time - Time to check
   * @param {number} tolerance - Time tolerance in beats
   * @returns {DetectedChord[]} Array of detected chords
   */
  detectChords(time: number, tolerance: number = 0.1): DetectedChord[] {
    const notesAtTime = this.notes.filter((note) => {
      return Math.abs(note.start - time) < tolerance;
    });

    if (notesAtTime.length < 2) return [];

    const pitches = notesAtTime.map((n) => n.pitch).sort((a, b) => a - b);
    const intervals: number[] = [];
    const rootPitch = pitches[0];
    
    if (rootPitch === undefined) {
      return [];
    }

    for (let i = 1; i < pitches.length; i++) {
      const pitch = pitches[i];
      if (pitch !== undefined) {
        intervals.push(pitch - rootPitch);
      }
    }

    // Simple chord detection
    const chordTypes = this._identifyChord(intervals);

    return chordTypes.map((type) => ({
      type,
      pitches,
      notes: notesAtTime,
    }));
  }

  /**
   * Identify chord from intervals
   * @private
   */
  private _identifyChord(intervals: number[]): string[] {
    const chords: string[] = [];

    // Major triad: 0, 4, 7
    if (intervals.includes(4) && intervals.includes(7)) {
      chords.push('major');
    }

    // Minor triad: 0, 3, 7
    if (intervals.includes(3) && intervals.includes(7)) {
      chords.push('minor');
    }

    // Diminished: 0, 3, 6
    if (intervals.includes(3) && intervals.includes(6)) {
      chords.push('diminished');
    }

    // Augmented: 0, 4, 8
    if (intervals.includes(4) && intervals.includes(8)) {
      chords.push('augmented');
    }

    return chords.length > 0 ? chords : ['unknown'];
  }

  /**
   * Duplicate notes
   * @param {Note[]} notes - Notes to duplicate
   * @param {number} offset - Time offset in beats
   * @returns {Note[]} Duplicated notes
   */
  duplicate(notes: Note[], offset: number): Note[] {
    return notes.map((note) => ({
      ...note,
      start: note.start + offset,
      selected: false,
    }));
  }

  /**
   * Delete notes
   * @param {Note[]} notes - Notes to delete
   */
  delete(notes: Note[]): void {
    notes.forEach((note) => {
      const index = this.notes.indexOf(note);
      if (index !== -1) {
        this.notes.splice(index, 1);
      }
    });
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { NoteEditor: typeof NoteEditor }).NoteEditor =
    NoteEditor;
}

