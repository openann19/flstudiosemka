/**
 * NoteEditor - Note editing utilities
 * Provides note manipulation, velocity editing, and chord detection
 */
class NoteEditor {
  constructor() {
    this.notes = [];
  }

  /**
   * Set notes
   * @param {Array} notes - Array of notes
   */
  setNotes(notes) {
    this.notes = notes;
  }

  /**
   * Set velocity for notes
   * @param {Array} notes - Notes to update
   * @param {number} velocity - Velocity (0-1)
   */
  setVelocity(notes, velocity) {
    notes.forEach(note => {
      note.velocity = Math.max(0, Math.min(1, velocity));
    });
  }

  /**
   * Adjust note length
   * @param {Array} notes - Notes to adjust
   * @param {number} delta - Change in duration
   */
  adjustLength(notes, delta) {
    notes.forEach(note => {
      note.duration = Math.max(0.0625, note.duration + delta);
    });
  }

  /**
   * Transpose notes
   * @param {Array} notes - Notes to transpose
   * @param {number} semitones - Semitones to transpose
   */
  transpose(notes, semitones) {
    notes.forEach(note => {
      note.pitch = Math.max(0, Math.min(127, note.pitch + semitones));
    });
  }

  /**
   * Detect chords
   * @param {number} time - Time to check
   * @param {number} tolerance - Time tolerance in beats
   * @returns {Array} Array of detected chords
   */
  detectChords(time, tolerance = 0.1) {
    const notesAtTime = this.notes.filter(note => {
      return Math.abs(note.start - time) < tolerance;
    });

    if (notesAtTime.length < 2) return [];

    const pitches = notesAtTime.map(n => n.pitch).sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < pitches.length; i++) {
      intervals.push(pitches[i] - pitches[0]);
    }

    // Simple chord detection
    const chordTypes = this._identifyChord(intervals);
    
    return chordTypes.map(type => ({
      type,
      pitches,
      notes: notesAtTime
    }));
  }

  /**
   * Identify chord from intervals
   * @private
   */
  _identifyChord(intervals) {
    const chords = [];
    
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
   * @param {Array} notes - Notes to duplicate
   * @param {number} offset - Time offset in beats
   * @returns {Array} Duplicated notes
   */
  duplicate(notes, offset) {
    return notes.map(note => ({
      ...note,
      start: note.start + offset,
      selected: false
    }));
  }

  /**
   * Delete notes
   * @param {Array} notes - Notes to delete
   */
  delete(notes) {
    notes.forEach(note => {
      const index = this.notes.indexOf(note);
      if (index !== -1) {
        this.notes.splice(index, 1);
      }
    });
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NoteEditor };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.NoteEditor = NoteEditor;
}

