/**
 * ProjectExporter - Export project in various formats
 * Handles project, stems, MIDI, and audio export
 * @module export/ProjectExporter
 */

import { AudioRenderer } from './AudioRenderer';
import type { ProjectData } from './AudioRenderer';

/**
 * Track data
 */
export interface TrackData {
  id: string;
  name?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Stem export result
 */
export interface StemExport {
  trackId: string;
  trackName?: string;
  buffer: AudioBuffer;
}

/**
 * Batch export options
 */
export interface BatchExportOptions {
  stems?: boolean;
  stemsWithEffects?: boolean;
  fullMix?: boolean;
  fullMixFormat?: 'wav' | 'mp3';
  projectJSON?: boolean;
}

/**
 * ProjectExporter - Export project in various formats
 * Handles project, stems, MIDI, and audio export
 */
export class ProjectExporter {
  private project: ProjectData;
  private renderer: AudioRenderer;

  constructor(audioContext: AudioContext, project: ProjectData) {
    this.project = project;
    this.renderer = new AudioRenderer(audioContext);
  }

  /**
   * Export project as JSON
   * @param {string} filename - Filename
   */
  exportProject(filename: string = 'project.json'): void {
    const data = JSON.stringify(this.project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export individual track stems
   * @param {string[]} trackIds - Track IDs to export (empty = all)
   * @param {boolean} withEffects - Include effects
   * @returns {Promise<StemExport[]>} Array of {trackId, buffer}
   */
  async exportStems(
    trackIds: string[] = [],
    withEffects: boolean = true
  ): Promise<StemExport[]> {
    const tracks =
      trackIds.length > 0
        ? (this.project.tracks as TrackData[])?.filter((t) =>
            trackIds.includes(t.id)
          ) || []
        : (this.project.tracks as TrackData[]) || [];

    const stems: StemExport[] = [];

    for (const track of tracks) {
      const buffer = await this._renderTrack(track, withEffects);
      stems.push({
        trackId: track.id,
        trackName: track.name,
        buffer,
      });
    }

    return stems;
  }

  /**
   * Export stems as WAV files
   * @param {string[]} trackIds - Track IDs to export
   * @param {boolean} withEffects - Include effects
   */
  async exportStemsAsWAV(
    trackIds: string[] = [],
    withEffects: boolean = true
  ): Promise<void> {
    const stems = await this.exportStems(trackIds, withEffects);

    stems.forEach(({ trackId, trackName, buffer }) => {
      const filename = `${trackName || trackId}.wav`;
      this.renderer.exportWAV(buffer, filename);
    });
  }

  /**
   * Export MIDI
   * @param {string} filename - Filename
   * @param {number} bpm - BPM (default: 120)
   */
  exportMIDI(filename: string = 'project.mid', bpm: number = 120): void {
    try {
      const midiData = this._generateMIDI(bpm);
      const buffer = midiData.buffer instanceof ArrayBuffer 
        ? midiData.buffer.slice(midiData.byteOffset, midiData.byteOffset + midiData.length)
        : new ArrayBuffer(midiData.length);
      const typedArray = new Uint8Array(buffer);
      if (!(midiData.buffer instanceof ArrayBuffer)) {
        typedArray.set(midiData);
      }
      const blob = new Blob([typedArray], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to export MIDI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate MIDI file data
   * @private
   * @param {number} bpm - BPM
   * @returns {Uint8Array} MIDI file data
   */
  private _generateMIDI(bpm: number): Uint8Array {
    const ticksPerQuarter = 480;

    // MIDI file structure:
    // Header chunk: "MThd" + length + format + tracks + division
    // Track chunks: "MTrk" + length + events

    const tracks = (this.project.tracks as TrackData[]) || [];
    const trackChunks: Uint8Array[] = [];

    // Generate track chunks
    tracks.forEach((track, trackIndex) => {
      const events: Uint8Array[] = [];
      let currentTick = 0;

      // Track name
      const trackName = track.name || `Track ${trackIndex + 1}`;
      events.push(this._writeMetaEvent(0x03, this._stringToBytes(trackName)));

      // Note events (if available in track data)
      // This is a simplified implementation - in a full version,
      // you would extract notes from PianoRollEditor or track notes
      if (track.notes && typeof track.notes === 'string') {
        // Parse notes if stored as JSON string
        try {
          const notes = JSON.parse(track.notes) as Array<{ start: number; duration: number; pitch: number; velocity: number }>;
          notes.forEach((note) => {
            const startTick = Math.round(note.start * ticksPerQuarter);
            const endTick = Math.round((note.start + note.duration) * ticksPerQuarter);
            const midiNote = Math.max(0, Math.min(127, Math.round(note.pitch)));
            const velocity = Math.max(1, Math.min(127, Math.round(note.velocity * 127)));

            // Note on
            const deltaTimeOn = startTick - currentTick;
            events.push(this._writeVariableLength(deltaTimeOn));
            events.push(new Uint8Array([0x90, midiNote, velocity]));
            currentTick = startTick;

            // Note off
            const deltaTimeOff = endTick - currentTick;
            events.push(this._writeVariableLength(deltaTimeOff));
            events.push(new Uint8Array([0x80, midiNote, 0]));
            currentTick = endTick;
          });
        } catch {
          // Invalid notes format, skip
        }
      }

      // End of track
      events.push(this._writeVariableLength(0));
      events.push(new Uint8Array([0xFF, 0x2F, 0x00]));

      // Combine events
      const trackData = this._concatArrays(...events);
      trackChunks.push(this._createTrackChunk(trackData));
    });

    // Create header
    const header = this._createMIDIHeader(1, trackChunks.length, ticksPerQuarter);

    // Combine header and tracks
    const midiFile = this._concatArrays(header, ...trackChunks);
    return midiFile;
  }

  /**
   * Create MIDI header chunk
   * @private
   */
  private _createMIDIHeader(format: number, numTracks: number, division: number): Uint8Array {
    const header = new Uint8Array(14);
    const view = new DataView(header.buffer);

    // "MThd"
    header[0] = 0x4D;
    header[1] = 0x54;
    header[2] = 0x68;
    header[3] = 0x64;

    // Length (always 6)
    view.setUint32(4, 6, false);

    // Format (0 = single track, 1 = multi-track, 2 = multi-song)
    view.setUint16(8, format, false);

    // Number of tracks
    view.setUint16(10, numTracks, false);

    // Division (ticks per quarter note)
    view.setUint16(12, division, false);

    return header;
  }

  /**
   * Create track chunk
   * @private
   */
  private _createTrackChunk(trackData: Uint8Array): Uint8Array {
    const chunk = new Uint8Array(8 + trackData.length);
    const view = new DataView(chunk.buffer);

    // "MTrk"
    chunk[0] = 0x4D;
    chunk[1] = 0x54;
    chunk[2] = 0x72;
    chunk[3] = 0x6B;

    // Length
    view.setUint32(4, trackData.length, false);

    // Track data
    chunk.set(trackData, 8);

    return chunk;
  }

  /**
   * Write meta event
   * @private
   */
  private _writeMetaEvent(type: number, data: Uint8Array): Uint8Array {
    const event = new Uint8Array(2 + data.length + 1);
    event[0] = 0xFF;
    event[1] = type;
    event[2] = data.length;
    event.set(data, 3);
    return event;
  }

  /**
   * Write variable length quantity
   * @private
   */
  private _writeVariableLength(value: number): Uint8Array {
    const bytes: number[] = [];
    let val = value;

    do {
      bytes.unshift(val & 0x7F);
      val >>= 7;
    } while (val > 0);

    // Set continuation bit on all but last byte
    for (let i = 0; i < bytes.length - 1; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        bytes[i] = byte | 0x80;
      }
    }

    return new Uint8Array(bytes);
  }

  /**
   * Convert string to bytes
   * @private
   */
  private _stringToBytes(str: string): Uint8Array {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Concatenate arrays
   * @private
   */
  private _concatArrays(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach((arr) => {
      result.set(arr, offset);
      offset += arr.length;
    });
    return result;
  }

  /**
   * Export full mix as audio
   * @param {string} filename - Filename
   * @param {string} format - Format ('wav' or 'mp3')
   * @param {boolean} withEffects - Include effects
   */
  async exportAudio(
    filename: string = 'mix.wav',
    format: 'wav' | 'mp3' = 'wav',
    _withEffects: boolean = true
  ): Promise<void> {
    const duration = (this.project.duration as number) || 60;
    const buffer = await this.renderer.renderProject(this.project, 0, duration);

    if (format === 'mp3') {
      await this.renderer.exportMP3(buffer, filename);
    } else {
      this.renderer.exportWAV(buffer, filename);
    }
  }

  /**
   * Render single track
   * @private
   */
  private async _renderTrack(
    track: TrackData,
    _withEffects: boolean
  ): Promise<AudioBuffer> {
    // This would render a single track with or without effects
    // Implementation depends on project structure
    const duration = track.duration || 60;

    return await this.renderer.render(async (offlineContext: OfflineAudioContext) => {
      // Set up track audio graph
      const trackGain = offlineContext.createGain();
      trackGain.connect(offlineContext.destination);

      // Render track audio
      // This would play back track's audio clips, patterns, etc.
    }, duration);
  }

  /**
   * Export audio without effects
   * @param {string} filename - Filename
   */
  async exportAudioDry(filename: string = 'mix-dry.wav'): Promise<void> {
    await this.exportAudio(filename, 'wav', false);
  }

  /**
   * Batch export options
   * @param {BatchExportOptions} options - Export options
   */
  async batchExport(options: BatchExportOptions = {}): Promise<void> {
    const {
      stems = false,
      stemsWithEffects = true,
      fullMix = true,
      fullMixFormat = 'wav',
      projectJSON = false,
    } = options;

    if (projectJSON) {
      this.exportProject('project.json');
    }

    if (stems) {
      await this.exportStemsAsWAV([], stemsWithEffects);
    }

    if (fullMix) {
      await this.exportAudio('mix.wav', fullMixFormat, true);
    }
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as {
    ProjectExporter: typeof ProjectExporter;
  }).ProjectExporter = ProjectExporter;
}

