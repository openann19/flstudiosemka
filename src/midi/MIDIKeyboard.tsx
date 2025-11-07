/**
 * MIDIKeyboard - Virtual MIDI keyboard using computer keys
 * Maps computer keyboard keys to MIDI notes
 * @module midi/MIDIKeyboard
 */

import type { MIDINoteEvent } from './MIDIInput';

/**
 * Key map type
 */
type KeyMap = {
  [key: string]: number | 'octaveDown' | 'octaveUp';
};

/**
 * MIDI keyboard state
 */
export interface MIDIKeyboardState {
  enabled: boolean;
  octave: number;
  velocity: number;
  pressedKeys: number[];
}

/**
 * MIDIKeyboard - Virtual MIDI keyboard using computer keys
 * Maps computer keyboard keys to MIDI notes
 */
export class MIDIKeyboard {
  private keyMap: KeyMap;
  private pressedKeys: Set<number>;
  public onNoteOn: ((event: MIDINoteEvent) => void) | null;
  public onNoteOff: ((event: MIDINoteEvent) => void) | null;
  private octave: number;
  private velocity: number;
  public isEnabled: boolean;
  private _keyDownHandler: (event: KeyboardEvent) => void;
  private _keyUpHandler: (event: KeyboardEvent) => void;

  constructor() {
    this.keyMap = this._createKeyMap();
    this.pressedKeys = new Set();
    this.onNoteOn = null;
    this.onNoteOff = null;
    this.octave = 4; // Default octave
    this.velocity = 0.8; // Default velocity
    this.isEnabled = false;
    this._keyDownHandler = this._handleKeyDown.bind(this);
    this._keyUpHandler = this._handleKeyUp.bind(this);
  }

  /**
   * Create default key mapping
   * @private
   */
  private _createKeyMap(): KeyMap {
    // QWERTY layout mapping to white keys
    // A-S-D-F-G-H-J-K for C-D-E-F-G-A-B-C
    return {
      KeyA: 0, // C
      KeyS: 2, // D
      KeyD: 4, // E
      KeyF: 5, // F
      KeyG: 7, // G
      KeyH: 9, // A
      KeyJ: 11, // B
      KeyK: 12, // C (octave up)

      // Black keys (W-E-R-T-Y-U)
      KeyW: 1, // C#
      KeyE: 3, // D#
      KeyR: 6, // F#
      KeyT: 8, // G#
      KeyY: 10, // A#
      KeyU: 13, // C# (octave up)

      // Octave controls
      KeyZ: 'octaveDown',
      KeyX: 'octaveUp',
    };
  }

  /**
   * Enable virtual keyboard
   */
  enable(): void {
    if (this.isEnabled) return;

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this._keyDownHandler);
      document.addEventListener('keyup', this._keyUpHandler);
      this.isEnabled = true;
    }
  }

  /**
   * Disable virtual keyboard
   */
  disable(): void {
    if (!this.isEnabled) return;

    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this._keyDownHandler);
      document.removeEventListener('keyup', this._keyUpHandler);
      this.isEnabled = false;
    }

    // Release all pressed keys
    for (const key of this.pressedKeys) {
      this._triggerNoteOff(key);
    }
    this.pressedKeys.clear();
  }

  /**
   * Handle key down
   * @private
   */
  private _handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return; // Ignore key repeat
    if (event.target) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return; // Don't interfere with text input
      }
    }

    const code = event.code;
    const mapping = this.keyMap[code];

    if (mapping === undefined) return;

    event.preventDefault();

    if (mapping === 'octaveDown') {
      this.setOctave(Math.max(0, this.octave - 1));
      return;
    }

    if (mapping === 'octaveUp') {
      this.setOctave(Math.min(8, this.octave + 1));
      return;
    }

    if (typeof mapping === 'number') {
      const note = this.octave * 12 + mapping;
      if (!this.pressedKeys.has(note)) {
        this.pressedKeys.add(note);
        this._triggerNoteOn(note);
      }
    }
  }

  /**
   * Handle key up
   * @private
   */
  private _handleKeyUp(event: KeyboardEvent): void {
    const code = event.code;
    const mapping = this.keyMap[code];

    if (mapping === undefined || typeof mapping !== 'number') return;

    event.preventDefault();

    const note = this.octave * 12 + mapping;
    if (this.pressedKeys.has(note)) {
      this.pressedKeys.delete(note);
      this._triggerNoteOff(note);
    }
  }

  /**
   * Trigger note on
   * @private
   */
  private _triggerNoteOn(note: number): void {
    if (this.onNoteOn) {
      this.onNoteOn({
        note,
        velocity: this.velocity,
        channel: 0,
        timestamp: performance.now(),
      });
    }
  }

  /**
   * Trigger note off
   * @private
   */
  private _triggerNoteOff(note: number): void {
    if (this.onNoteOff) {
      this.onNoteOff({
        note,
        velocity: 0,
        channel: 0,
        timestamp: performance.now(),
      });
    }
  }

  /**
   * Set octave
   * @param {number} octave - Octave number (0-8)
   */
  setOctave(octave: number): void {
    this.octave = Math.max(0, Math.min(8, octave));
  }

  /**
   * Set velocity
   * @param {number} velocity - Velocity (0-1)
   */
  setVelocity(velocity: number): void {
    this.velocity = Math.max(0, Math.min(1, velocity));
  }

  /**
   * Set note on callback
   * @param {Function} callback - Callback function
   */
  setNoteOnCallback(
    callback: ((event: MIDINoteEvent) => void) | null
  ): void {
    this.onNoteOn = callback;
  }

  /**
   * Set note off callback
   * @param {Function} callback - Callback function
   */
  setNoteOffCallback(
    callback: ((event: MIDINoteEvent) => void) | null
  ): void {
    this.onNoteOff = callback;
  }

  /**
   * Get current state
   * @returns {MIDIKeyboardState} Current state
   */
  getState(): MIDIKeyboardState {
    return {
      enabled: this.isEnabled,
      octave: this.octave,
      velocity: this.velocity,
      pressedKeys: Array.from(this.pressedKeys),
    };
  }

  /**
   * Convert MIDI note to frequency
   * @param {number} note - MIDI note number
   * @returns {number} Frequency in Hz
   */
  midiToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /**
   * Convert MIDI note to note name
   * @param {number} note - MIDI note number
   * @returns {string} Note name (e.g., "C4")
   */
  midiToNoteName(note: number): string {
    const notes = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    const octave = Math.floor(note / 12) - 1;
    const noteName = notes[note % 12];
    return `${noteName}${octave}`;
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { MIDIKeyboard: typeof MIDIKeyboard }).MIDIKeyboard =
    MIDIKeyboard;
}

