/**
 * GhostNotesService - Ghost notes management
 * Handles displaying notes from other channels in Piano Roll
 * @module services/GhostNotesService
 */

/**
 * Note definition for ghost notes
 */
export interface GhostNote {
  start: number;
  duration: number;
  pitch: number;
  velocity: number;
  channelId: string;
  channelName: string;
  channelColor?: string;
}

/**
 * Ghost notes service
 */
export class GhostNotesService {
  private ghostNotes: Map<string, GhostNote[]>;

  private enabled: boolean;

  private opacity: number;

  /**
   * Create a new GhostNotesService instance
   */
  constructor() {
    this.ghostNotes = new Map<string, GhostNote[]>();
    this.enabled = true;
    this.opacity = 0.3;
  }

  /**
   * Set ghost notes for a channel
   * @param channelId - Channel ID
   * @param notes - Notes array
   */
  setGhostNotes(channelId: string, notes: GhostNote[]): void {
    this.ghostNotes.set(channelId, notes);
  }

  /**
   * Get ghost notes for a channel
   * @param channelId - Channel ID
   * @returns Notes array
   */
  getGhostNotes(channelId: string): GhostNote[] {
    return this.ghostNotes.get(channelId) || [];
  }

  /**
   * Get all ghost notes (excluding current channel)
   * @param excludeChannelId - Channel ID to exclude
   * @returns All ghost notes
   */
  getAllGhostNotes(excludeChannelId?: string): GhostNote[] {
    const allNotes: GhostNote[] = [];
    for (const [channelId, notes] of this.ghostNotes.entries()) {
      if (channelId !== excludeChannelId) {
        allNotes.push(...notes);
      }
    }
    return allNotes;
  }

  /**
   * Clear ghost notes for a channel
   * @param channelId - Channel ID
   */
  clearGhostNotes(channelId: string): void {
    this.ghostNotes.delete(channelId);
  }

  /**
   * Clear all ghost notes
   */
  clearAllGhostNotes(): void {
    this.ghostNotes.clear();
  }

  /**
   * Enable or disable ghost notes
   * @param enabled - Enable state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if ghost notes are enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set ghost notes opacity
   * @param opacity - Opacity (0-1)
   */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Get ghost notes opacity
   * @returns Opacity value
   */
  getOpacity(): number {
    return this.opacity;
  }

  /**
   * Render ghost notes on canvas
   * @param ctx - Canvas 2D context
   * @param notes - Ghost notes to render
   * @param pixelToBeat - Function to convert pixels to beats
   * @param pixelToPitch - Function to convert pixels to pitch
   * @param beatToPixel - Function to convert beats to pixels
   * @param pitchToPixel - Function to convert pitch to pixels
   */
  renderGhostNotes(
    ctx: CanvasRenderingContext2D,
    notes: GhostNote[],
    pixelToBeat: (x: number) => number,
    pixelToPitch: (y: number) => number,
    beatToPixel: (beat: number) => number,
    pitchToPixel: (pitch: number) => number
  ): void {
    if (!this.enabled || notes.length === 0) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = this.opacity;

    for (const note of notes) {
      const x = beatToPixel(note.start);
      const y = pitchToPixel(note.pitch);
      const width = beatToPixel(note.start + note.duration) - x;
      const height = pitchToPixel(note.pitch - 1) - y;

      // Draw ghost note with channel color or default gray
      ctx.fillStyle = note.channelColor || '#888888';
      ctx.fillRect(x, y, width, height);

      // Draw border
      ctx.strokeStyle = note.channelColor || '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
    }

    ctx.restore();
  }
}

// Export singleton instance
export const ghostNotesService = new GhostNotesService();

