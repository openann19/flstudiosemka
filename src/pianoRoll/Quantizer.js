/**
 * Quantizer - Note quantization utilities
 * Provides various quantization algorithms
 */
class Quantizer {
  constructor() {
    this.gridSize = 0.25; // Beats
    this.strength = 1.0; // 0-1, how much to quantize
  }

  /**
   * Quantize note start time
   * @param {number} time - Time in beats
   * @param {string} mode - Quantization mode ('nearest', 'floor', 'ceil')
   * @returns {number} Quantized time
   */
  quantizeTime(time, mode = 'nearest') {
    const grid = this.gridSize;
    let quantized;

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
   * @param {Object} note - Note object
   * @param {string} mode - Quantization mode
   * @returns {Object} Quantized note
   */
  quantizeNote(note, mode = 'nearest') {
    return {
      ...note,
      start: this.quantizeTime(note.start, mode)
    };
  }

  /**
   * Quantize array of notes
   * @param {Array} notes - Array of notes
   * @param {string} mode - Quantization mode
   * @returns {Array} Quantized notes
   */
  quantizeNotes(notes, mode = 'nearest') {
    return notes.map(note => this.quantizeNote(note, mode));
  }

  /**
   * Set grid size
   * @param {number} gridSize - Grid size in beats
   */
  setGridSize(gridSize) {
    this.gridSize = Math.max(0.0625, gridSize); // Minimum 1/16 note
  }

  /**
   * Set strength
   * @param {number} strength - Quantization strength (0-1)
   */
  setStrength(strength) {
    this.strength = Math.max(0, Math.min(1, strength));
  }

  /**
   * Get grid size options
   * @returns {Array} Array of grid size options
   */
  getGridSizeOptions() {
    return [
      { value: 1, label: 'Whole Note' },
      { value: 0.5, label: 'Half Note' },
      { value: 0.25, label: 'Quarter Note' },
      { value: 0.125, label: 'Eighth Note' },
      { value: 0.0625, label: 'Sixteenth Note' },
      { value: 0.03125, label: 'Thirty-Second Note' }
    ];
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Quantizer };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.Quantizer = Quantizer;
}

