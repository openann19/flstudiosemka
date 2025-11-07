/**
 * MIDIMapper - MIDI learn system for mapping MIDI CC to controls
 * Allows users to map MIDI controllers to DAW parameters
 */
class MIDIMapper {
  constructor() {
    this.mappings = new Map();
    this.learning = null; // { controlId, callback }
    this.midiInput = null;
  }

  /**
   * Set MIDI input instance
   * @param {MIDIInput} midiInput - MIDI input instance
   */
  setMIDIInput(midiInput) {
    if (this.midiInput) {
      this.midiInput.setCCCallback(null);
    }

    this.midiInput = midiInput;

    if (midiInput) {
      midiInput.setCCCallback((cc) => {
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
  startLearn(controlId, callback) {
    if (!this.midiInput) {
      console.warn('MIDIMapper: No MIDI input available');
      return false;
    }

    this.learning = {
      controlId,
      callback
    };

    return true;
  }

  /**
   * Cancel learning
   */
  cancelLearn() {
    this.learning = null;
  }

  /**
   * Map a control to MIDI CC
   * @param {string} controlId - Control ID
   * @param {number} controller - MIDI CC number
   * @param {number} channel - MIDI channel (0-15, or -1 for all)
   */
  mapControl(controlId, controller, channel = -1) {
    this.mappings.set(controlId, {
      controller,
      channel,
      controlId
    });
  }

  /**
   * Remove mapping
   * @param {string} controlId - Control ID
   */
  removeMapping(controlId) {
    this.mappings.delete(controlId);
  }

  /**
   * Get mapping for a control
   * @param {string} controlId - Control ID
   * @returns {Object} Mapping object
   */
  getMapping(controlId) {
    return this.mappings.get(controlId);
  }

  /**
   * Handle MIDI CC message
   * @private
   */
  _handleCC(cc) {
    // If learning, capture this CC
    if (this.learning) {
      this.mapControl(
        this.learning.controlId,
        cc.controller,
        cc.channel
      );

      if (this.learning.callback) {
        this.learning.callback({
          controller: cc.controller,
          channel: cc.channel
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
  setControlUpdateCallback(callback) {
    this.onControlUpdate = callback;
  }

  /**
   * Export mappings
   * @returns {Object} Mappings object
   */
  exportMappings() {
    const exported = {};
    for (const [controlId, mapping] of this.mappings.entries()) {
      exported[controlId] = {
        controller: mapping.controller,
        channel: mapping.channel
      };
    }
    return exported;
  }

  /**
   * Import mappings
   * @param {Object} mappings - Mappings object
   */
  importMappings(mappings) {
    this.mappings.clear();
    for (const [controlId, mapping] of Object.entries(mappings)) {
      this.mappings.set(controlId, {
        ...mapping,
        controlId
      });
    }
  }

  /**
   * Clear all mappings
   */
  clearMappings() {
    this.mappings.clear();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MIDIMapper };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.MIDIMapper = MIDIMapper;
}

