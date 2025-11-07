/**
 * InstrumentManager - Manages instrument instances and sample libraries
 * Handles loading, caching, and playback of instrument samples
 * @module audio/InstrumentManager
 */

import { SamplePlayer, loadAudioSample, type PlaybackResult } from './SamplePlayer';
import {
  AudioContextError,
  InvalidParameterError,
  ValidationUtils,
} from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Instrument configuration
 */
export interface InstrumentConfig {
  samples: Record<string, string | File | ArrayBuffer | AudioBuffer>;
  defaultVelocity?: number;
  loop?: boolean;
}

/**
 * Internal instrument data structure
 */
interface InstrumentData {
  name: string;
  samples: Map<string, AudioBuffer>;
  defaultVelocity: number;
  loop: boolean;
  samplePlayers: Map<string, SamplePlayer>;
}

/**
 * Manages instrument instances and sample libraries
 */
export class InstrumentManager {
  private audioContext: AudioContext;

  private instruments: Map<string, InstrumentData>;

  private sampleCache: Map<string | File | ArrayBuffer, AudioBuffer>;

  /**
   * Create a new InstrumentManager instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.instruments = new Map<string, InstrumentData>();
    this.sampleCache = new Map<string | File | ArrayBuffer, AudioBuffer>();
  }

  /**
   * Register an instrument with samples
   * @param name - Instrument name
   * @param config - Instrument configuration
   * @param config.samples - Map of note/sample pairs
   * @param config.defaultVelocity - Default velocity (default: 1.0)
   * @param config.loop - Whether samples should loop (default: false)
   * @returns Promise resolving to instrument data
   * @throws InvalidParameterError if parameters are invalid
   */
  async registerInstrument(name: string, config: InstrumentConfig): Promise<InstrumentData> {
    try {
      ValidationUtils.validateString(name, 'name');

      const { samples, defaultVelocity = 1.0, loop = false } = config;

      ValidationUtils.validateGain(defaultVelocity, 'defaultVelocity');

      const instrument: InstrumentData = {
        name,
        samples: new Map(),
        defaultVelocity,
        loop,
        samplePlayers: new Map(),
      };

      // Load all samples for this instrument
      for (const [note, sampleSource] of Object.entries(samples)) {
        try {
          let buffer: AudioBuffer;
          if (sampleSource instanceof AudioBuffer) {
            buffer = sampleSource;
          } else {
            buffer = await this._loadSample(sampleSource);
          }
          const samplePlayer = new SamplePlayer(this.audioContext, buffer);
          samplePlayer.setLoop(loop);
          instrument.samples.set(note, buffer);
          instrument.samplePlayers.set(note, samplePlayer);
        } catch (error) {
          logger.error(`InstrumentManager: Failed to load sample for ${note}`, error);
          // Continue loading other samples
        }
      }

      this.instruments.set(name, instrument);
      return instrument;
    } catch (error) {
      logger.error('InstrumentManager.registerInstrument error:', error);
      throw error;
    }
  }

  /**
   * Load a sample (with caching)
   * @private
   * @param source - Sample source
   * @returns Promise resolving to AudioBuffer
   */
  private async _loadSample(
    source: string | File | ArrayBuffer
  ): Promise<AudioBuffer> {
    // Check cache first
    if (this.sampleCache.has(source)) {
      const cached = this.sampleCache.get(source);
      if (cached) return cached;
    }

    // Load and cache
    const buffer = await loadAudioSample(this.audioContext, source);
    this.sampleCache.set(source, buffer);
    return buffer;
  }

  /**
   * Play a note on an instrument
   * @param instrumentName - Instrument name
   * @param note - MIDI note number or note name (e.g., 'C4', 60)
   * @param velocity - Velocity 0-1 (optional, uses instrument default if null)
   * @param startTime - When to start playback (optional)
   * @param duration - Duration in seconds for non-looping samples (optional)
   * @returns Playback control object or null if instrument/note not found
   * @throws InvalidParameterError if parameters are invalid
   */
  playNote(
    instrumentName: string,
    note: number | string,
    velocity: number | null = null,
    startTime: number | null = null,
    duration: number | null = null
  ): PlaybackResult | null {
    try {
      ValidationUtils.validateString(instrumentName, 'instrumentName');

      const instrument = this.instruments.get(instrumentName);
      if (!instrument) {
        logger.warn(`InstrumentManager: Instrument '${instrumentName}' not found`);
        return null;
      }

      // Convert note to string key if it's a number
      const noteKey = typeof note === 'number' ? this._midiToNoteName(note) : note;

      // Find closest sample if exact match not found
      let sampleKey = noteKey;
      if (!instrument.samplePlayers.has(noteKey)) {
        sampleKey = this._findClosestSample(instrument, noteKey);
      }

      const samplePlayer = instrument.samplePlayers.get(sampleKey);
      if (!samplePlayer) {
        logger.warn(`InstrumentManager: No sample found for note ${noteKey}`);
        return null;
      }

      // Calculate pitch shift if needed
      const targetMidi = typeof note === 'number' ? note : this._noteNameToMidi(note);
      const sampleMidi = this._noteNameToMidi(sampleKey);
      const pitchShift = targetMidi - sampleMidi;

      // Use default velocity if not provided
      const finalVelocity = velocity !== null ? velocity : instrument.defaultVelocity;
      ValidationUtils.validateGain(finalVelocity, 'velocity');

      // Play the sample
      const playback = samplePlayer.play(finalVelocity, pitchShift, startTime);

      // Auto-stop if duration specified and not looping
      if (duration && !instrument.loop && playback) {
        ValidationUtils.validateTime(duration, 'duration');
        setTimeout(() => {
          if (playback.source) {
            try {
              playback.source.stop();
            } catch {
              // Already stopped - ignore
              logger.debug('InstrumentManager: Source already stopped');
            }
          }
        }, duration * 1000);
      }

      return playback;
    } catch (error) {
      logger.error('InstrumentManager.playNote error:', error);
      if (error instanceof InvalidParameterError) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Stop all notes for an instrument
   * @param instrumentName - Instrument name
   * @throws InvalidParameterError if instrumentName is invalid
   */
  stopAllNotes(instrumentName: string): void {
    try {
      ValidationUtils.validateString(instrumentName, 'instrumentName');
      const instrument = this.instruments.get(instrumentName);
      if (!instrument) {
        logger.warn(`InstrumentManager: Instrument '${instrumentName}' not found`);
        return;
      }

      // Note: We can't easily stop all playing sources without tracking them
      // This would require a more sophisticated voice management system
      logger.info(`InstrumentManager: Stop all notes for ${instrumentName}`);
    } catch (error) {
      logger.error('InstrumentManager.stopAllNotes error:', error);
    }
  }

  /**
   * Find closest sample to a given note
   * @private
   * @param instrument - Instrument data
   * @param noteName - Note name to find
   * @returns Closest sample key
   */
  private _findClosestSample(instrument: InstrumentData, noteName: string): string {
    const targetMidi = this._noteNameToMidi(noteName);
    let closestKey: string | null = null;
    let closestDistance = Infinity;

    for (const key of instrument.samplePlayers.keys()) {
      const keyMidi = this._noteNameToMidi(key);
      const distance = Math.abs(targetMidi - keyMidi);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestKey = key;
      }
    }

    return closestKey || noteName;
  }

  /**
   * Convert MIDI note number to note name
   * @private
   * @param midiNote - MIDI note number (0-127)
   * @returns Note name (e.g., 'C4')
   */
  private _midiToNoteName(midiNote: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = notes[midiNote % 12];
    return `${note}${octave}`;
  }

  /**
   * Convert note name to MIDI note number
   * @private
   * @param noteName - Note name (e.g., 'C4')
   * @returns MIDI note number (0-127), defaults to 60 (C4) if invalid
   */
  private _noteNameToMidi(noteName: string): number {
    const match = noteName.match(/^([A-G]#?)(\d+)$/);
    if (!match) return 60; // Default to C4

    const [, note, octave] = match;
    if (!note || !octave) {
      return 60;
    }
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = notes.indexOf(note);
    if (noteIndex === -1) return 60;

    return (parseInt(octave, 10) + 1) * 12 + noteIndex;
  }

  /**
   * Get instrument info
   * @param name - Instrument name
   * @returns Instrument data or undefined if not found
   */
  getInstrument(name: string): InstrumentData | undefined {
    return this.instruments.get(name);
  }

  /**
   * List all registered instruments
   * @returns Array of instrument names
   */
  listInstruments(): string[] {
    return Array.from(this.instruments.keys());
  }

  /**
   * Remove an instrument
   * @param name - Instrument name
   * @throws InvalidParameterError if name is invalid
   */
  removeInstrument(name: string): void {
    try {
      ValidationUtils.validateString(name, 'name');
      this.instruments.delete(name);
    } catch (error) {
      logger.error('InstrumentManager.removeInstrument error:', error);
      throw error;
    }
  }

  /**
   * Clear sample cache
   */
  clearCache(): void {
    this.sampleCache.clear();
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.InstrumentManager = InstrumentManager;
}

