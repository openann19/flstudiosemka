/**
 * MIDIInput - Web MIDI API integration for MIDI keyboard input
 * Handles MIDI device connection, note events, and CC messages
 * @module midi/MIDIInput
 */

/**
 * MIDI note event
 */
export interface MIDINoteEvent {
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
}

/**
 * MIDI CC event
 */
export interface MIDICCEvent {
  controller: number;
  value: number;
  channel: number;
  timestamp: number;
}

/**
 * MIDI pitch bend event
 */
export interface MIDIPitchBendEvent {
  value: number;
  channel: number;
  timestamp: number;
}

/**
 * MIDI input info
 */
export interface MIDIInputInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

/**
 * MIDI connection status
 */
export interface MIDIStatus {
  supported: boolean;
  connected: boolean;
  activeInputs: string[];
  availableInputs: MIDIInputInfo[];
}

/**
 * MIDIInput - Web MIDI API integration for MIDI keyboard input
 * Handles MIDI device connection, note events, and CC messages
 */
export class MIDIInput {
  private inputs: Map<string, MIDIInputPort>;
  private activeInputs: Set<string>;
  public onNoteOn: ((event: MIDINoteEvent) => void) | null;
  public onNoteOff: ((event: MIDINoteEvent) => void) | null;
  public onCC: ((event: MIDICCEvent) => void) | null;
  public onPitchBend: ((event: MIDIPitchBendEvent) => void) | null;
  public isSupported: boolean;
  private midiAccess: MIDIAccess | null;

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
  async initialize(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      this.isSupported = false;
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.isSupported = true;

      // Set up initial inputs
      this._updateInputs();

      // Listen for device changes
      if (this.midiAccess) {
        this.midiAccess.onstatechange = () => {
          this._updateInputs();
        };
      }

      return true;
    } catch {
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Update available MIDI inputs
   * @private
   */
  private _updateInputs(): void {
    if (!this.midiAccess) return;

    const inputs = this.midiAccess.inputs;
    this.inputs.clear();

    for (const input of inputs.values()) {
      this.inputs.set(input.id, input);
    }
  }

  /**
   * List available MIDI inputs
   * @returns {Array<MIDIInputInfo>} Array of input info
   */
  listInputs(): MIDIInputInfo[] {
    return Array.from(this.inputs.values()).map((input) => ({
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
      state: input.state,
    }));
  }

  /**
   * Connect to a MIDI input
   * @param {string} inputId - Input ID (or 'all' for all inputs)
   * @returns {boolean} Success status
   */
  connect(inputId: string = 'all'): boolean {
    if (!this.midiAccess) {
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
      return false;
    }

    return this._connectInput(input);
  }

  /**
   * Connect a single input
   * @private
   */
  private _connectInput(input: MIDIInputPort): boolean {
    if (this.activeInputs.has(input.id)) {
      return true; // Already connected
    }

    input.onmidimessage = (event: MIDIMessageEvent) => {
      this._handleMIDIMessage(event);
    };

    this.activeInputs.add(input.id);
    return true;
  }

  /**
   * Disconnect from a MIDI input
   * @param {string} inputId - Input ID (or 'all' for all inputs)
   */
  disconnect(inputId: string = 'all'): void {
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
  private _handleMIDIMessage(event: MIDIMessageEvent): void {
    const [status, data1, data2] = event.data;
    
    if (status === undefined || data1 === undefined) {
      return;
    }
    
    const command = status & 0xf0;
    const channel = status & 0x0f;

    switch (command) {
      case 0x90: // Note On
        if (data2 !== undefined && data2 > 0) {
          if (this.onNoteOn) {
            this.onNoteOn({
              note: data1,
              velocity: data2 / 127,
              channel,
              timestamp: event.timeStamp,
            });
          }
        } else {
          // Note off (velocity 0)
          if (this.onNoteOff) {
            this.onNoteOff({
              note: data1,
              velocity: 0,
              channel,
              timestamp: event.timeStamp,
            });
          }
        }
        break;

      case 0x80: // Note Off
        if (this.onNoteOff && data2 !== undefined) {
          this.onNoteOff({
            note: data1,
            velocity: data2 / 127,
            channel,
            timestamp: event.timeStamp,
          });
        }
        break;

      case 0xb0: // Control Change
        if (this.onCC && data2 !== undefined) {
          this.onCC({
            controller: data1,
            value: data2 / 127,
            channel,
            timestamp: event.timeStamp,
          });
        }
        break;

      case 0xe0: // Pitch Bend
        {
          if (data2 !== undefined) {
            const bendValue = ((data2 << 7) | data1) - 8192;
            const normalizedBend = bendValue / 8192; // -1 to 1
            if (this.onPitchBend) {
              this.onPitchBend({
                value: normalizedBend,
                channel,
                timestamp: event.timeStamp,
              });
            }
          }
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
  setNoteOnCallback(callback: ((event: MIDINoteEvent) => void) | null): void {
    this.onNoteOn = callback;
  }

  /**
   * Set note off callback
   * @param {Function} callback - Callback function
   */
  setNoteOffCallback(callback: ((event: MIDINoteEvent) => void) | null): void {
    this.onNoteOff = callback;
  }

  /**
   * Set CC callback
   * @param {Function} callback - Callback function
   */
  setCCCallback(callback: ((event: MIDICCEvent) => void) | null): void {
    this.onCC = callback;
  }

  /**
   * Set pitch bend callback
   * @param {Function} callback - Callback function
   */
  setPitchBendCallback(
    callback: ((event: MIDIPitchBendEvent) => void) | null
  ): void {
    this.onPitchBend = callback;
  }

  /**
   * Check if MIDI is supported
   * @returns {boolean} Support status
   */
  isMIDISupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get connection status
   * @returns {MIDIStatus} Connection status
   */
  getStatus(): MIDIStatus {
    return {
      supported: this.isSupported,
      connected: this.activeInputs.size > 0,
      activeInputs: Array.from(this.activeInputs),
      availableInputs: this.listInputs(),
    };
  }
}

// Type definitions for Web MIDI API
interface MIDIAccess {
  inputs: MIDIInputMap;
  outputs: MIDIOutputMap;
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
}

interface MIDIInputMap extends Map<string, MIDIInputPort> {}

interface MIDIOutputMap extends Map<string, MIDIOutputPort> {}

interface MIDIInputPort extends MIDIPort {
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIOutputPort extends MIDIPort {}

interface MIDIPort {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
  type: 'input' | 'output';
}

interface MIDIMessageEvent {
  data: Uint8Array;
  timeStamp: number;
}

interface MIDIConnectionEvent {
  port: MIDIPort;
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { MIDIInput: typeof MIDIInput }).MIDIInput = MIDIInput;
}

