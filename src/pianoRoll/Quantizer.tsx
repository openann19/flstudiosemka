/**
 * Quantizer - Note quantization utilities
 * Provides various quantization algorithms
 * @module pianoRoll/Quantizer
 */

/**
 * Quantization mode
 */
export type QuantizationMode = 'nearest' | 'floor' | 'ceil';

/**
 * Grid size option
 */
export interface GridSizeOption {
  value: number;
  label: string;
}

/**
 * Note object
 */
export interface Note {
  start: number;
  duration?: number;
  pitch?: number;
  velocity?: number;
  [key: string]: unknown;
}

/**
 * Quantizer - Note quantization utilities
 * Provides various quantization algorithms
 */
export class Quantizer {
  private gridSize: number;
  private strength: number;

  constructor() {
    this.gridSize = 0.25; // Beats
    this.strength = 1.0; // 0-1, how much to quantize
  }

  /**
   * Quantize note start time
   * @param {number} time - Time in beats
   * @param {QuantizationMode} mode - Quantization mode
   * @returns {number} Quantized time
   */
  quantizeTime(time: number, mode: QuantizationMode = 'nearest'): number {
    const grid = this.gridSize;
    let quantized: number;

    switch (mode) {
      case 'floor':
        quantized = Math.floor(time / grid) * grid;
        break;
      case 'ceil':
        quantized = Math.ceil(time / grid) * grid;
        break;
      case 'nearest':
      default:
        quantized = Math.round(time / grid) * grid;
        break;
    }

    // Apply strength
    return time + (quantized - time) * this.strength;
  }

  /**
   * Quantize note
   * @param {Note} note - Note object
   * @param {QuantizationMode} mode - Quantization mode
   * @returns {Note} Quantized note
   */
  quantizeNote(note: Note, mode: QuantizationMode = 'nearest'): Note {
    return {
      ...note,
      start: this.quantizeTime(note.start, mode),
    };
  }

  /**
   * Quantize array of notes
   * @param {Note[]} notes - Array of notes
   * @param {QuantizationMode} mode - Quantization mode
   * @returns {Note[]} Quantized notes
   */
  quantizeNotes(notes: Note[], mode: QuantizationMode = 'nearest'): Note[] {
    return notes.map((note) => this.quantizeNote(note, mode));
  }

  /**
   * Set grid size
   * @param {number} gridSize - Grid size in beats
   */
  setGridSize(gridSize: number): void {
    this.gridSize = Math.max(0.0625, gridSize); // Minimum 1/16 note
  }

  /**
   * Set strength
   * @param {number} strength - Quantization strength (0-1)
   */
  setStrength(strength: number): void {
    this.strength = Math.max(0, Math.min(1, strength));
  }

  /**
   * Get grid size options
   * @returns {GridSizeOption[]} Array of grid size options
   */
  getGridSizeOptions(): GridSizeOption[] {
    return [
      { value: 1, label: 'Whole Note' },
      { value: 0.5, label: 'Half Note' },
      { value: 0.25, label: 'Quarter Note' },
      { value: 0.125, label: 'Eighth Note' },
      { value: 0.0625, label: 'Sixteenth Note' },
      { value: 0.03125, label: 'Thirty-Second Note' },
    ];
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { Quantizer: typeof Quantizer }).Quantizer = Quantizer;
}

