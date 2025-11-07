/**
 * ClipboardService - Centralized clipboard for notes, clips, and patterns
 * Handles copy, paste, cut operations with format detection and serialization
 * @module services/ClipboardService
 */

import type { Clip } from '../types/FLStudio.types';
import { InvalidParameterError } from '../utils/errors';

/**
 * Piano roll note interface
 */
export interface ClipboardNote {
  start: number;
  duration: number;
  pitch: number;
  velocity: number;
}

/**
 * Clipboard data types
 */
export type ClipboardDataType = 'notes' | 'clips' | 'pattern';

/**
 * Clipboard data structure
 */
export interface ClipboardData {
  type: ClipboardDataType;
  data: ClipboardNote[] | Clip[] | { steps: boolean[]; name: string };
  timestamp: number;
  metadata?: {
    trackId?: number | string;
    beatsPerBar?: number;
    stepsPerBeat?: number;
  };
}

/**
 * Clipboard service
 * Singleton service for managing clipboard operations
 */
export class ClipboardService {
  private clipboard: ClipboardData | null;
  private maxClipboardSize: number;

  /**
   * Create a new ClipboardService instance
   * @param maxClipboardSize - Maximum clipboard size in bytes (default: 10MB)
   */
  constructor(maxClipboardSize: number = 10 * 1024 * 1024) {
    this.clipboard = null;
    this.maxClipboardSize = maxClipboardSize;
  }

  /**
   * Copy notes to clipboard
   * @param notes - Array of notes to copy
   * @param metadata - Optional metadata (trackId, beatsPerBar, etc.)
   * @throws InvalidParameterError if notes array is invalid
   */
  copyNotes(notes: ClipboardNote[], metadata?: ClipboardData['metadata']): void {
    if (!Array.isArray(notes)) {
      throw new InvalidParameterError('notes', notes, 'array');
    }

    if (notes.length === 0) {
      return;
    }

    // Validate notes structure
    notes.forEach((note, index) => {
      if (typeof note.start !== 'number' || Number.isNaN(note.start)) {
        throw new InvalidParameterError(`notes[${index}].start`, note.start, 'number');
      }
      if (typeof note.duration !== 'number' || Number.isNaN(note.duration)) {
        throw new InvalidParameterError(`notes[${index}].duration`, note.duration, 'number');
      }
      if (typeof note.pitch !== 'number' || Number.isNaN(note.pitch)) {
        throw new InvalidParameterError(`notes[${index}].pitch`, note.pitch, 'number');
      }
      if (typeof note.velocity !== 'number' || Number.isNaN(note.velocity)) {
        throw new InvalidParameterError(`notes[${index}].velocity`, note.velocity, 'number');
      }
    });

    // Calculate relative start time (normalize to start at 0)
    const minStart = Math.min(...notes.map((n) => n.start));
    const normalizedNotes: ClipboardNote[] = notes.map((note) => ({
      ...note,
      start: note.start - minStart,
    }));

    this.clipboard = {
      type: 'notes',
      data: normalizedNotes,
      timestamp: Date.now(),
      metadata,
    };
  }

  /**
   * Copy clips to clipboard
   * @param clips - Array of clips to copy
   * @param metadata - Optional metadata
   * @throws InvalidParameterError if clips array is invalid
   */
  copyClips(clips: Clip[], metadata?: ClipboardData['metadata']): void {
    if (!Array.isArray(clips)) {
      throw new InvalidParameterError('clips', clips, 'array');
    }

    if (clips.length === 0) {
      return;
    }

    // Validate clips structure
    clips.forEach((clip, index) => {
      if (!clip.id || typeof clip.id !== 'string') {
        throw new InvalidParameterError(`clips[${index}].id`, clip.id, 'string');
      }
      if (typeof clip.start !== 'number' || Number.isNaN(clip.start)) {
        throw new InvalidParameterError(`clips[${index}].start`, clip.start, 'number');
      }
    });

    // Calculate relative start time
    const minStart = Math.min(...clips.map((c) => c.start));
    const normalizedClips: Clip[] = clips.map((clip) => ({
      ...clip,
      id: `${clip.id}_copy_${Date.now()}`, // Generate new IDs for paste
      start: clip.start - minStart,
    }));

    this.clipboard = {
      type: 'clips',
      data: normalizedClips,
      timestamp: Date.now(),
      metadata,
    };
  }

  /**
   * Copy pattern to clipboard
   * @param pattern - Pattern data (steps array and name)
   * @param metadata - Optional metadata
   * @throws InvalidParameterError if pattern is invalid
   */
  copyPattern(pattern: { steps: boolean[]; name: string }, metadata?: ClipboardData['metadata']): void {
    if (!pattern || typeof pattern !== 'object') {
      throw new InvalidParameterError('pattern', pattern, 'object');
    }

    if (!Array.isArray(pattern.steps)) {
      throw new InvalidParameterError('pattern.steps', pattern.steps, 'array');
    }

    if (typeof pattern.name !== 'string') {
      throw new InvalidParameterError('pattern.name', pattern.name, 'string');
    }

    this.clipboard = {
      type: 'pattern',
      data: {
        steps: [...pattern.steps],
        name: pattern.name,
      },
      timestamp: Date.now(),
      metadata,
    };
  }

  /**
   * Paste notes from clipboard
   * @param targetStart - Target start beat position
   * @returns Array of pasted notes with updated positions, or null if clipboard is empty or wrong type
   */
  pasteNotes(targetStart: number): ClipboardNote[] | null {
    if (!this.clipboard || this.clipboard.type !== 'notes') {
      return null;
    }

    if (typeof targetStart !== 'number' || Number.isNaN(targetStart)) {
      throw new InvalidParameterError('targetStart', targetStart, 'number');
    }

    const notes = this.clipboard.data as ClipboardNote[];
    return notes.map((note) => ({
      ...note,
      start: note.start + targetStart,
    }));
  }

  /**
   * Paste clips from clipboard
   * @param targetStart - Target start beat position
   * @param generateId - Function to generate new clip IDs
   * @returns Array of pasted clips with updated positions, or null if clipboard is empty or wrong type
   */
  pasteClips(targetStart: number, generateId: () => string): Clip[] | null {
    if (!this.clipboard || this.clipboard.type !== 'clips') {
      return null;
    }

    if (typeof targetStart !== 'number' || Number.isNaN(targetStart)) {
      throw new InvalidParameterError('targetStart', targetStart, 'number');
    }

    const clips = this.clipboard.data as Clip[];
    return clips.map((clip) => ({
      ...clip,
      id: generateId(),
      start: clip.start + targetStart,
    }));
  }

  /**
   * Paste pattern from clipboard
   * @returns Pattern data or null if clipboard is empty or wrong type
   */
  pastePattern(): { steps: boolean[]; name: string } | null {
    if (!this.clipboard || this.clipboard.type !== 'pattern') {
      return null;
    }

    const pattern = this.clipboard.data as { steps: boolean[]; name: string };
    return {
      steps: [...pattern.steps],
      name: `${pattern.name} (Copy)`,
    };
  }

  /**
   * Cut notes (copy and return for deletion)
   * @param notes - Array of notes to cut
   * @param metadata - Optional metadata
   * @returns Array of notes that were cut (for deletion)
   */
  cutNotes(notes: ClipboardNote[], metadata?: ClipboardData['metadata']): ClipboardNote[] {
    this.copyNotes(notes, metadata);
    return [...notes];
  }

  /**
   * Cut clips (copy and return for deletion)
   * @param clips - Array of clips to cut
   * @param metadata - Optional metadata
   * @returns Array of clips that were cut (for deletion)
   */
  cutClips(clips: Clip[], metadata?: ClipboardData['metadata']): Clip[] {
    this.copyClips(clips, metadata);
    return [...clips];
  }

  /**
   * Check if clipboard has data
   * @param type - Optional type to check for
   * @returns True if clipboard has data (and optionally matches type)
   */
  hasData(type?: ClipboardDataType): boolean {
    if (!this.clipboard) {
      return false;
    }

    if (type) {
      return this.clipboard.type === type;
    }

    return true;
  }

  /**
   * Get clipboard data type
   * @returns Clipboard data type or null if empty
   */
  getDataType(): ClipboardDataType | null {
    return this.clipboard?.type || null;
  }

  /**
   * Clear clipboard
   */
  clear(): void {
    this.clipboard = null;
  }

  /**
   * Get clipboard size in bytes (approximate)
   * @returns Size in bytes
   */
  getSize(): number {
    if (!this.clipboard) {
      return 0;
    }

    try {
      const serialized = JSON.stringify(this.clipboard);
      return new Blob([serialized]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Check if clipboard is within size limit
   * @returns True if within limit
   */
  isWithinSizeLimit(): boolean {
    return this.getSize() <= this.maxClipboardSize;
  }
}

// Export singleton instance
export const clipboardService = new ClipboardService();

