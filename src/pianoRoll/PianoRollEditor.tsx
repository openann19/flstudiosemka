/**
 * PianoRollEditor - Advanced piano roll editor
 * Full note drawing, editing, velocity, and quantization
 * @module pianoRoll/PianoRollEditor
 */

/**
 * Piano roll note
 */
export interface PianoRollNote {
  start: number;
  duration: number;
  pitch: number;
  velocity: number;
  selected: boolean;
}

/**
 * Scale highlight
 */
export interface ScaleHighlight {
  key: string;
  scale: string;
}

/**
 * Drag start position
 */
interface DragStart {
  x: number;
  y: number;
  beat: number;
  pitch: number;
}

/**
 * PianoRollEditor - Advanced piano roll editor
 * Full note drawing, editing, velocity, and quantization
 */
export class PianoRollEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  // AudioContext stored for future use (e.g., audio playback)
   
  private _audioContext: AudioContext;
  private notes: PianoRollNote[];
  private selectedNotes: Set<PianoRollNote>;
  private startBeat: number;
  private beatsVisible: number;
  private pixelsPerBeat: number;
  private pixelsPerKey: number;
  private startOctave: number;
  private octavesVisible: number;
  private isDrawing: boolean;
  private isSelecting: boolean;
  private dragStart: DragStart | null;
  private dragNote: PianoRollNote | null;
  public tool: 'draw' | 'select' | 'erase';
  public quantizeEnabled: boolean;
  public quantizeGrid: number;
  public scaleHighlight: ScaleHighlight | null;

  constructor(canvas: HTMLCanvasElement, audioContext: AudioContext) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2d context from canvas');
    }
    this.ctx = context;
    this._audioContext = audioContext;

    this.notes = [];
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
    this.tool = 'draw';

    // Quantization
    this.quantizeEnabled = true;
    this.quantizeGrid = 0.25; // Beats

    // Scale highlighting
    this.scaleHighlight = null;

    this._setupEventListeners();
    this._render();
  }

  /**
   * Setup event listeners
   * @private
   */
  private _setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this._handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this._handleMouseUp());
  }

  /**
   * Handle mouse down
   * @private
   */
  private _handleMouseDown(e: MouseEvent): void {
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
        this._startSelecting(beat, pitch, e);
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
  private _handleMouseMove(e: MouseEvent): void {
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
  private _handleMouseUp(): void {
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
  private _startDrawing(beat: number, pitch: number): void {
    const quantizedBeat = this.quantizeEnabled ? this._quantize(beat) : beat;

    this.dragNote = {
      start: quantizedBeat,
      duration: this.quantizeGrid,
      pitch: Math.round(pitch),
      velocity: 0.8,
      selected: false,
    };

    this.isDrawing = true;
  }

  /**
   * Update drawing
   * @private
   */
  private _updateDrawing(beat: number, pitch: number): void {
    if (!this.dragNote) return;

    const quantizedBeat = this.quantizeEnabled ? this._quantize(beat) : beat;
    const duration = Math.max(
      this.quantizeGrid,
      quantizedBeat - this.dragNote.start
    );

    this.dragNote.duration = duration;
    this.dragNote.pitch = Math.round(pitch);
  }

  /**
   * Finish drawing
   * @private
   */
  private _finishDrawing(): void {
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
  private _startSelecting(beat: number, pitch: number, e: MouseEvent): void {
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
  private _updateSelection(beat: number, pitch: number): void {
    if (this.dragNote && this.selectedNotes.has(this.dragNote)) {
      // Move selected note
      if (!this.dragStart) return;
      const deltaBeat = beat - this.dragStart.beat;
      const deltaPitch = pitch - this.dragStart.pitch;

      this.dragNote.start = this._quantize(this.dragNote.start + deltaBeat);
      this.dragNote.pitch = Math.round(this.dragNote.pitch + deltaPitch);

      this._sortNotes();
    } else if (this.isSelecting && this.dragStart) {
      // Box selection
      const startBeat = Math.min(this.dragStart.beat, beat);
      const endBeat = Math.max(this.dragStart.beat, beat);
      const startPitch = Math.min(this.dragStart.pitch, pitch);
      const endPitch = Math.max(this.dragStart.pitch, pitch);

      this.selectedNotes.clear();
      this.notes.forEach((note) => {
        if (
          note.start >= startBeat &&
          note.start + note.duration <= endBeat &&
          note.pitch >= startPitch &&
          note.pitch <= endPitch
        ) {
          this.selectedNotes.add(note);
        }
      });
    }
  }

  /**
   * Erase at position
   * @private
   */
  private _eraseAt(beat: number, pitch: number): void {
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
  private _findNoteAt(beat: number, pitch: number): PianoRollNote | undefined {
    return this.notes.find((note) => {
      return (
        note.start <= beat &&
        note.start + note.duration >= beat &&
        Math.abs(note.pitch - pitch) < 0.5
      );
    });
  }

  /**
   * Check for overlap
   * @private
   */
  private _checkOverlap(newNote: PianoRollNote): boolean {
    return this.notes.some((note) => {
      return (
        note.pitch === newNote.pitch &&
        note.start < newNote.start + newNote.duration &&
        note.start + note.duration > newNote.start
      );
    });
  }

  /**
   * Quantize value
   * @private
   */
  private _quantize(beat: number): number {
    return Math.round(beat / this.quantizeGrid) * this.quantizeGrid;
  }

  /**
   * Convert pixel to beat
   * @private
   */
  private _pixelToBeat(x: number): number {
    return this.startBeat + x / this.pixelsPerBeat;
  }

  /**
   * Convert pixel to pitch
   * @private
   */
  private _pixelToPitch(y: number): number {
    const keyIndex = Math.floor(y / this.pixelsPerKey);
    const totalKeys = this.octavesVisible * 12;
    const startKey = this.startOctave * 12;
    return startKey + (totalKeys - keyIndex - 1);
  }

  /**
   * Convert beat to pixel
   * @private
   */
  private _beatToPixel(beat: number): number {
    return (beat - this.startBeat) * this.pixelsPerBeat;
  }

  /**
   * Convert pitch to pixel
   * @private
   */
  private _pitchToPixel(pitch: number): number {
    const totalKeys = this.octavesVisible * 12;
    const startKey = this.startOctave * 12;
    const keyIndex = totalKeys - (pitch - startKey) - 1;
    return keyIndex * this.pixelsPerKey;
  }

  /**
   * Sort notes by start time
   * @private
   */
  private _sortNotes(): void {
    this.notes.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.pitch - b.pitch;
    });
  }

  /**
   * Render piano roll
   * @private
   */
  private _render(): void {
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
  private _drawGrid(): void {
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
  private _drawScaleHighlight(): void {
    // Implementation for scale highlighting
    // This would highlight keys in the selected scale
  }

  /**
   * Draw notes
   * @private
   */
  private _drawNotes(): void {
    this.notes.forEach((note) => {
      const isSelected = this.selectedNotes.has(note);
      this._drawNote(note, isSelected);
    });
  }

  /**
   * Draw single note
   * @private
   */
  private _drawNote(note: PianoRollNote, isSelected: boolean = false): void {
    const x = this._beatToPixel(note.start);
    const y = this._pitchToPixel(note.pitch);
    const width = note.duration * this.pixelsPerBeat;
    const height = this.pixelsPerKey;

    // Note color based on velocity
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
  private _drawSelectionBox(): void {
    // Implementation for selection box
    if (!this.dragStart) return;
    // Could add visual selection box rendering here
  }

  /**
   * Add note
   * @param {number} start - Start time in beats
   * @param {number} duration - Duration in beats
   * @param {number} pitch - MIDI pitch
   * @param {number} velocity - Velocity (0-1)
   */
  addNote(
    start: number,
    duration: number,
    pitch: number,
    velocity: number = 0.8
  ): PianoRollNote | null {
    const note: PianoRollNote = {
      start: this.quantizeEnabled ? this._quantize(start) : start,
      duration,
      pitch: Math.round(pitch),
      velocity: Math.max(0, Math.min(1, velocity)),
      selected: false,
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
   * @param {PianoRollNote} note - Note to remove
   */
  removeNote(note: PianoRollNote): void {
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
  quantizeSelected(): void {
    this.selectedNotes.forEach((note) => {
      note.start = this._quantize(note.start);
    });
    this._sortNotes();
    this._render();
  }

  /**
   * Set tool
   * @param {string} tool - Tool name
   */
  setTool(tool: 'draw' | 'select' | 'erase'): void {
    this.tool = tool;
  }

  /**
   * Set quantize grid
   * @param {number} grid - Grid size in beats
   */
  setQuantizeGrid(grid: number): void {
    this.quantizeGrid = grid;
  }

  /**
   * Get notes
   * @returns {PianoRollNote[]} Array of notes
   */
  getNotes(): PianoRollNote[] {
    return this.notes;
  }

  /**
   * Get selected notes
   * @returns {PianoRollNote[]} Array of selected notes
   */
  getSelectedNotes(): PianoRollNote[] {
    return Array.from(this.selectedNotes);
  }

  /**
   * Select all notes
   */
  selectAll(): void {
    this.selectedNotes.clear();
    this.notes.forEach((note) => {
      this.selectedNotes.add(note);
    });
    this._render();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedNotes.clear();
    this._render();
  }

  /**
   * Add multiple notes
   * @param notes - Array of notes to add
   * @returns Array of successfully added notes
   */
  addNotes(notes: PianoRollNote[]): PianoRollNote[] {
    const added: PianoRollNote[] = [];
    notes.forEach((note) => {
      const addedNote = this.addNote(note.start, note.duration, note.pitch, note.velocity);
      if (addedNote) {
        added.push(addedNote);
      }
    });
    return added;
  }

  /**
   * Remove multiple notes
   * @param notes - Array of notes to remove
   */
  removeNotes(notes: PianoRollNote[]): void {
    notes.forEach((note) => {
      this.removeNote(note);
    });
  }

  /**
   * Update note velocity
   * @param note - Note to update
   * @param velocity - New velocity (0-1)
   */
  updateNoteVelocity(note: PianoRollNote, velocity: number): void {
    if (this.notes.includes(note)) {
      note.velocity = Math.max(0, Math.min(1, velocity));
      this._render();
    }
  }

  /**
   * Clear all notes
   */
  clear(): void {
    this.notes = [];
    this.selectedNotes.clear();
    this._render();
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as {
    PianoRollEditor: typeof PianoRollEditor;
  }).PianoRollEditor = PianoRollEditor;
}

