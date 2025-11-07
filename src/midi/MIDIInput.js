/**
 * MIDIInput - Web MIDI API integration for MIDI keyboard input
 * Handles MIDI device connection, note events, and CC messages
 */
class MIDIInput {
  constructor() {
    this.inputs = new Map();
    this.activeInputs = new Set();
    this.onNoteOn = null;
    this.onNoteOff = null;
    this.onCC = null;
    this.onPitchBend = null;
    this.isSupported = false;
    this.midiAccess = null;
  }

  /**
   * Initialize MIDI access
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (!navigator.requestMIDIAccess) {
      console.warn('MIDIInput: Web MIDI API not supported');
      this.isSupported = false;
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.isSupported = true;
      
      // Set up initial inputs
      this._updateInputs();
      
      // Listen for device changes
      this.midiAccess.onstatechange = () => {
        this._updateInputs();
      };

      return true;
    } catch (error) {
      console.error('MIDIInput: Failed to initialize MIDI', error);
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Update available MIDI inputs
   * @private
   */
  _updateInputs() {
    if (!this.midiAccess) return;

    const inputs = this.midiAccess.inputs;
    this.inputs.clear();

    for (const input of inputs.values()) {
      this.inputs.set(input.id, input);
    }
  }

  /**
   * List available MIDI inputs
   * @returns {Array<Object>} Array of input info
   */
  listInputs() {
    return Array.from(this.inputs.values()).map(input => ({
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
      state: input.state
    }));
  }

  /**
   * Connect to a MIDI input
   * @param {string} inputId - Input ID (or 'all' for all inputs)
   * @returns {boolean} Success status
   */
  connect(inputId = 'all') {
    if (!this.midiAccess) {
      console.warn('MIDIInput: MIDI not initialized');
      return false;
    }

    if (inputId === 'all') {
      // Connect all inputs
      for (const input of this.inputs.values()) {
        this._connectInput(input);
      }
      return true;
    }

    const input = this.inputs.get(inputId);
    if (!input) {
      console.warn(`MIDIInput: Input ${inputId} not found`);
      return false;
    }

    return this._connectInput(input);
  }

  /**
   * Connect a single input
   * @private
   */
  _connectInput(input) {
    if (this.activeInputs.has(input.id)) {
      return true; // Already connected
    }

    input.onmidimessage = (event) => {
      this._handleMIDIMessage(event);
    };

    this.activeInputs.add(input.id);
    return true;
  }

  /**
   * Disconnect from a MIDI input
   * @param {string} inputId - Input ID (or 'all' for all inputs)
   */
  disconnect(inputId = 'all') {
    if (inputId === 'all') {
      for (const input of this.inputs.values()) {
        input.onmidimessage = null;
      }
      this.activeInputs.clear();
      return;
    }

    const input = this.inputs.get(inputId);
    if (input) {
      input.onmidimessage = null;
      this.activeInputs.delete(inputId);
    }
  }

  /**
   * Handle MIDI message
   * @private
   */
  _handleMIDIMessage(event) {
    const [status, data1, data2] = event.data;
    const command = status & 0xf0;
    const channel = status & 0x0f;

    switch (command) {
      case 0x90: // Note On
        if (data2 > 0) {
          if (this.onNoteOn) {
            this.onNoteOn({
              note: data1,
              velocity: data2 / 127,
              channel,
              timestamp: event.timeStamp
            });
          }
        } else {
          // Note off (velocity 0)
          if (this.onNoteOff) {
            this.onNoteOff({
              note: data1,
              velocity: 0,
              channel,
              timestamp: event.timeStamp
            });
          }
        }
        break;

      case 0x80: // Note Off
        if (this.onNoteOff) {
          this.onNoteOff({
            note: data1,
            velocity: data2 / 127,
            channel,
            timestamp: event.timeStamp
          });
        }
        break;

      case 0xb0: // Control Change
        if (this.onCC) {
          this.onCC({
            controller: data1,
            value: data2 / 127,
            channel,
            timestamp: event.timeStamp
          });
        }
        break;

      case 0xe0: // Pitch Bend
        const bendValue = ((data2 << 7) | data1) - 8192;
        const normalizedBend = bendValue / 8192; // -1 to 1
        if (this.onPitchBend) {
          this.onPitchBend({
            value: normalizedBend,
            channel,
            timestamp: event.timeStamp
          });
        }
        break;

      default:
        // Other MIDI messages (program change, aftertouch, etc.)
        break;
    }
  }

  /**
   * Set note on callback
   * @param {Function} callback - Callback function
   */
  setNoteOnCallback(callback) {
    this.onNoteOn = callback;
  }

  /**
   * Set note off callback
   * @param {Function} callback - Callback function
   */
  setNoteOffCallback(callback) {
    this.onNoteOff = callback;
  }

  /**
   * Set CC callback
   * @param {Function} callback - Callback function
   */
  setCCCallback(callback) {
    this.onCC = callback;
  }

  /**
   * Set pitch bend callback
   * @param {Function} callback - Callback function
   */
  setPitchBendCallback(callback) {
    this.onPitchBend = callback;
  }

  /**
   * Check if MIDI is supported
   * @returns {boolean} Support status
   */
  isMIDISupported() {
    return this.isSupported;
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      connected: this.activeInputs.size > 0,
      activeInputs: Array.from(this.activeInputs),
      availableInputs: this.listInputs()
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MIDIInput };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.MIDIInput = MIDIInput;
}

