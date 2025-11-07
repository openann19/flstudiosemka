/**
 * PianoRollEditor - Advanced piano roll editor
 * Full note drawing, editing, velocity, and quantization
 */
class PianoRollEditor {
  constructor(canvas, audioContext) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioContext = audioContext;
    
    this.notes = []; // Array of {start, duration, pitch, velocity, selected}
    this.selectedNotes = new Set();
    
    // View settings
    this.startBeat = 0;
    this.beatsVisible = 16;
    this.pixelsPerBeat = 60;
    this.pixelsPerKey = 20;
    this.startOctave = 2;
    this.octavesVisible = 5;
    
    // Interaction state
    this.isDrawing = false;
    this.isSelecting = false;
    this.dragStart = null;
    this.dragNote = null;
    this.tool = 'draw'; // 'draw', 'select', 'erase'
    
    // Quantization
    this.quantizeEnabled = true;
    this.quantizeGrid = 0.25; // Beats
    
    // Scale highlighting
    this.scaleHighlight = null; // {key: 'C', scale: 'major'}
    
    this._setupEventListeners();
    this._render();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this._handleMouseUp());
  }

  /**
   * Handle mouse down
   * @private
   */
  _handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const beat = this._pixelToBeat(x);
    const pitch = this._pixelToPitch(y);
    
    this.dragStart = { x, y, beat, pitch };
    
    switch (this.tool) {
      case 'draw':
        this._startDrawing(beat, pitch);
        break;
      case 'select':
        this._startSelecting(beat, pitch);
        break;
      case 'erase':
        this._eraseAt(beat, pitch);
        break;
    }
  }

  /**
   * Handle mouse move
   * @private
   */
  _handleMouseMove(e) {
    if (!this.dragStart) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const beat = this._pixelToBeat(x);
    const pitch = this._pixelToPitch(y);
    
    if (this.tool === 'draw' && this.isDrawing) {
      this._updateDrawing(beat, pitch);
    } else if (this.tool === 'select') {
      this._updateSelection(beat, pitch);
    }
    
    this._render();
  }

  /**
   * Handle mouse up
   * @private
   */
  _handleMouseUp() {
    if (this.isDrawing) {
      this._finishDrawing();
    }
    
    this.isDrawing = false;
    this.isSelecting = false;
    this.dragStart = null;
    this.dragNote = null;
    this._render();
  }

  /**
   * Start drawing note
   * @private
   */
  _startDrawing(beat, pitch) {
    const quantizedBeat = this.quantizeEnabled ? this._quantize(beat) : beat;
    
    this.dragNote = {
      start: quantizedBeat,
      duration: this.quantizeGrid,
      pitch: Math.round(pitch),
      velocity: 0.8,
      selected: false
    };
    
    this.isDrawing = true;
  }

  /**
   * Update drawing
   * @private
   */
  _updateDrawing(beat, pitch) {
    if (!this.dragNote) return;
    
    const quantizedBeat = this.quantizeEnabled ? this._quantize(beat) : beat;
    const duration = Math.max(this.quantizeGrid, quantizedBeat - this.dragNote.start);
    
    this.dragNote.duration = duration;
    this.dragNote.pitch = Math.round(pitch);
  }

  /**
   * Finish drawing
   * @private
   */
  _finishDrawing() {
    if (!this.dragNote) return;
    
    // Check for overlap
    if (!this._checkOverlap(this.dragNote)) {
      this.notes.push(this.dragNote);
      this._sortNotes();
    }
    
    this.dragNote = null;
  }

  /**
   * Start selecting
   * @private
   */
  _startSelecting(beat, pitch) {
    const note = this._findNoteAt(beat, pitch);
    
    if (note && e.shiftKey) {
      // Toggle selection
      if (this.selectedNotes.has(note)) {
        this.selectedNotes.delete(note);
      } else {
        this.selectedNotes.add(note);
      }
    } else if (note) {
      // Select single note
      this.selectedNotes.clear();
      this.selectedNotes.add(note);
      this.dragNote = note;
    } else {
      // Start box selection
      this.isSelecting = true;
      this.selectedNotes.clear();
    }
  }

  /**
   * Update selection
   * @private
   */
  _updateSelection(beat, pitch) {
    if (this.dragNote && this.selectedNotes.has(this.dragNote)) {
      // Move selected note
      const deltaBeat = beat - this.dragStart.beat;
      const deltaPitch = pitch - this.dragStart.pitch;
      
      this.dragNote.start = this._quantize(this.dragNote.start + deltaBeat);
      this.dragNote.pitch = Math.round(this.dragNote.pitch + deltaPitch);
      
      this._sortNotes();
    } else if (this.isSelecting) {
      // Box selection
      const startBeat = Math.min(this.dragStart.beat, beat);
      const endBeat = Math.max(this.dragStart.beat, beat);
      const startPitch = Math.min(this.dragStart.pitch, pitch);
      const endPitch = Math.max(this.dragStart.pitch, pitch);
      
      this.selectedNotes.clear();
      this.notes.forEach(note => {
        if (note.start >= startBeat && 
            note.start + note.duration <= endBeat &&
            note.pitch >= startPitch && 
            note.pitch <= endPitch) {
          this.selectedNotes.add(note);
        }
      });
    }
  }

  /**
   * Erase at position
   * @private
   */
  _eraseAt(beat, pitch) {
    const note = this._findNoteAt(beat, pitch);
    if (note) {
      const index = this.notes.indexOf(note);
      if (index !== -1) {
        this.notes.splice(index, 1);
        this.selectedNotes.delete(note);
      }
    }
  }

  /**
   * Find note at position
   * @private
   */
  _findNoteAt(beat, pitch) {
    return this.notes.find(note => {
      return note.start <= beat &&
             note.start + note.duration >= beat &&
             Math.abs(note.pitch - pitch) < 0.5;
    });
  }

  /**
   * Check for overlap
   * @private
   */
  _checkOverlap(newNote) {
    return this.notes.some(note => {
      return note.pitch === newNote.pitch &&
             note.start < newNote.start + newNote.duration &&
             note.start + note.duration > newNote.start;
    });
  }

  /**
   * Quantize value
   * @private
   */
  _quantize(beat) {
    return Math.round(beat / this.quantizeGrid) * this.quantizeGrid;
  }

  /**
   * Convert pixel to beat
   * @private
   */
  _pixelToBeat(x) {
    return this.startBeat + (x / this.pixelsPerBeat);
  }

  /**
   * Convert pixel to pitch
   * @private
   */
  _pixelToPitch(y) {
    const keyIndex = Math.floor(y / this.pixelsPerKey);
    const totalKeys = this.octavesVisible * 12;
    const startKey = this.startOctave * 12;
    return startKey + (totalKeys - keyIndex - 1);
  }

  /**
   * Convert beat to pixel
   * @private
   */
  _beatToPixel(beat) {
    return (beat - this.startBeat) * this.pixelsPerBeat;
  }

  /**
   * Convert pitch to pixel
   * @private
   */
  _pitchToPixel(pitch) {
    const totalKeys = this.octavesVisible * 12;
    const startKey = this.startOctave * 12;
    const keyIndex = totalKeys - (pitch - startKey) - 1;
    return keyIndex * this.pixelsPerKey;
  }

  /**
   * Sort notes by start time
   * @private
   */
  _sortNotes() {
    this.notes.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.pitch - b.pitch;
    });
  }

  /**
   * Render piano roll
   * @private
   */
  _render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    this._drawGrid();
    
    // Draw scale highlighting
    if (this.scaleHighlight) {
      this._drawScaleHighlight();
    }
    
    // Draw notes
    this._drawNotes();
    
    // Draw selection box
    if (this.isSelecting && this.dragStart) {
      this._drawSelectionBox();
    }
    
    // Draw drag note
    if (this.dragNote && this.isDrawing) {
      this._drawNote(this.dragNote, true);
    }
  }

  /**
   * Draw grid
   * @private
   */
  _drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    // Vertical lines (beats)
    const startBeat = Math.floor(this.startBeat);
    const endBeat = Math.ceil(this.startBeat + this.beatsVisible);
    
    for (let beat = startBeat; beat <= endBeat; beat++) {
      const x = this._beatToPixel(beat);
      if (x >= 0 && x <= this.canvas.width) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
    }
    
    // Horizontal lines (keys)
    const totalKeys = this.octavesVisible * 12;
    for (let i = 0; i <= totalKeys; i++) {
      const y = i * this.pixelsPerKey;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Draw scale highlight
   * @private
   */
  _drawScaleHighlight() {
    // Implementation for scale highlighting
    // This would highlight keys in the selected scale
  }

  /**
   * Draw notes
   * @private
   */
  _drawNotes() {
    this.notes.forEach(note => {
      const isSelected = this.selectedNotes.has(note);
      this._drawNote(note, isSelected);
    });
  }

  /**
   * Draw single note
   * @private
   */
  _drawNote(note, isSelected = false) {
    const x = this._beatToPixel(note.start);
    const y = this._pitchToPixel(note.pitch);
    const width = note.duration * this.pixelsPerBeat;
    const height = this.pixelsPerKey;
    
    // Note color based on velocity
    const velocityColor = Math.floor(note.velocity * 255);
    this.ctx.fillStyle = isSelected 
      ? `rgba(255, 215, 0, 0.8)`
      : `rgba(255, 0, 128, ${0.5 + note.velocity * 0.5})`;
    
    this.ctx.fillRect(x, y, width, height);
    
    // Border
    this.ctx.strokeStyle = isSelected ? '#FFD700' : '#FFFFFF';
    this.ctx.lineWidth = isSelected ? 2 : 1;
    this.ctx.strokeRect(x, y, width, height);
  }

  /**
   * Draw selection box
   * @private
   */
  _drawSelectionBox() {
    // Implementation for selection box
  }

  /**
   * Add note
   * @param {number} start - Start time in beats
   * @param {number} duration - Duration in beats
   * @param {number} pitch - MIDI pitch
   * @param {number} velocity - Velocity (0-1)
   */
  addNote(start, duration, pitch, velocity = 0.8) {
    const note = {
      start: this.quantizeEnabled ? this._quantize(start) : start,
      duration,
      pitch: Math.round(pitch),
      velocity: Math.max(0, Math.min(1, velocity)),
      selected: false
    };
    
    if (!this._checkOverlap(note)) {
      this.notes.push(note);
      this._sortNotes();
      this._render();
      return note;
    }
    
    return null;
  }

  /**
   * Remove note
   * @param {Object} note - Note to remove
   */
  removeNote(note) {
    const index = this.notes.indexOf(note);
    if (index !== -1) {
      this.notes.splice(index, 1);
      this.selectedNotes.delete(note);
      this._render();
    }
  }

  /**
   * Quantize selected notes
   */
  quantizeSelected() {
    this.selectedNotes.forEach(note => {
      note.start = this._quantize(note.start);
    });
    this._sortNotes();
    this._render();
  }

  /**
   * Set tool
   * @param {string} tool - Tool name
   */
  setTool(tool) {
    this.tool = tool;
  }

  /**
   * Set quantize grid
   * @param {number} grid - Grid size in beats
   */
  setQuantizeGrid(grid) {
    this.quantizeGrid = grid;
  }

  /**
   * Get notes
   * @returns {Array} Array of notes
   */
  getNotes() {
    return this.notes;
  }

  /**
   * Clear all notes
   */
  clear() {
    this.notes = [];
    this.selectedNotes.clear();
    this._render();
  }
}

// Export for ES modules
export { PianoRollEditor };

// Export for CommonJS module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PianoRollEditor };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.PianoRollEditor = PianoRollEditor;
}

