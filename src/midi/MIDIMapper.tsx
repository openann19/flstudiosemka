/**
 * MIDIMapper - MIDI learn system for mapping MIDI CC to controls
 * Allows users to map MIDI controllers to DAW parameters
 * @module midi/MIDIMapper
 */

import type { MIDIInput } from './MIDIInput';
import type { MIDICCEvent } from './MIDIInput';

/**
 * MIDI mapping
 */
export interface MIDIMapping {
  controller: number;
  channel: number;
  controlId: string;
}

/**
 * Learning state
 */
interface LearningState {
  controlId: string;
  callback: ((mapping: { controller: number; channel: number }) => void) | null;
}

/**
 * Exported mappings
 */
export interface ExportedMappings {
  [controlId: string]: {
    controller: number;
    channel: number;
  };
}

/**
 * MIDIMapper - MIDI learn system for mapping MIDI CC to controls
 * Allows users to map MIDI controllers to DAW parameters
 */
export class MIDIMapper {
  private mappings: Map<string, MIDIMapping>;
  private learning: LearningState | null;
  private midiInput: MIDIInput | null;
  public onControlUpdate: ((controlId: string, value: number) => void) | null;

  constructor() {
    this.mappings = new Map();
    this.learning = null;
    this.midiInput = null;
    this.onControlUpdate = null;
  }

  /**
   * Set MIDI input instance
   * @param {MIDIInput} midiInput - MIDI input instance
   */
  setMIDIInput(midiInput: MIDIInput | null): void {
    if (this.midiInput) {
      this.midiInput.setCCCallback(null);
    }

    this.midiInput = midiInput;

    if (midiInput) {
      midiInput.setCCCallback((cc: MIDICCEvent) => {
        this._handleCC(cc);
      });
    }
  }

  /**
   * Start learning a control
   * @param {string} controlId - Control ID
   * @param {Function} callback - Callback when learned
   * @returns {boolean} Success status
   */
  startLearn(
    controlId: string,
    callback: ((mapping: { controller: number; channel: number }) => void) | null = null
  ): boolean {
    if (!this.midiInput) {
      return false;
    }

    this.learning = {
      controlId,
      callback,
    };

    return true;
  }

  /**
   * Cancel learning
   */
  cancelLearn(): void {
    this.learning = null;
  }

  /**
   * Map a control to MIDI CC
   * @param {string} controlId - Control ID
   * @param {number} controller - MIDI CC number
   * @param {number} channel - MIDI channel (0-15, or -1 for all)
   */
  mapControl(controlId: string, controller: number, channel: number = -1): void {
    this.mappings.set(controlId, {
      controller,
      channel,
      controlId,
    });
  }

  /**
   * Remove mapping
   * @param {string} controlId - Control ID
   */
  removeMapping(controlId: string): void {
    this.mappings.delete(controlId);
  }

  /**
   * Get mapping for a control
   * @param {string} controlId - Control ID
   * @returns {MIDIMapping | undefined} Mapping object
   */
  getMapping(controlId: string): MIDIMapping | undefined {
    return this.mappings.get(controlId);
  }

  /**
   * Handle MIDI CC message
   * @private
   */
  private _handleCC(cc: MIDICCEvent): void {
    // If learning, capture this CC
    if (this.learning) {
      this.mapControl(this.learning.controlId, cc.controller, cc.channel);

      if (this.learning.callback) {
        this.learning.callback({
          controller: cc.controller,
          channel: cc.channel,
        });
      }

      this.learning = null;
      return;
    }

    // Find and trigger mapped controls
    for (const [controlId, mapping] of this.mappings.entries()) {
      if (mapping.controller === cc.controller) {
        if (mapping.channel === -1 || mapping.channel === cc.channel) {
          // Trigger control update
          if (this.onControlUpdate) {
            this.onControlUpdate(controlId, cc.value);
          }
        }
      }
    }
  }

  /**
   * Set control update callback
   * @param {Function} callback - Callback function
   */
  setControlUpdateCallback(
    callback: ((controlId: string, value: number) => void) | null
  ): void {
    this.onControlUpdate = callback;
  }

  /**
   * Export mappings
   * @returns {ExportedMappings} Mappings object
   */
  exportMappings(): ExportedMappings {
    const exported: ExportedMappings = {};
    for (const [controlId, mapping] of this.mappings.entries()) {
      exported[controlId] = {
        controller: mapping.controller,
        channel: mapping.channel,
      };
    }
    return exported;
  }

  /**
   * Import mappings
   * @param {ExportedMappings} mappings - Mappings object
   */
  importMappings(mappings: ExportedMappings): void {
    this.mappings.clear();
    for (const [controlId, mapping] of Object.entries(mappings)) {
      this.mappings.set(controlId, {
        ...mapping,
        controlId,
      });
    }
  }

  /**
   * Clear all mappings
   */
  clearMappings(): void {
    this.mappings.clear();
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { MIDIMapper: typeof MIDIMapper }).MIDIMapper =
    MIDIMapper;
}

