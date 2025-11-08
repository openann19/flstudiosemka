/**
 * LoopService - Loop region management
 * Handles loop regions with start/end beat markers and playback integration
 * @module services/LoopService
 */

import { InvalidParameterError, ValidationUtils } from '../utils/errors';

/**
 * Loop region
 */
export interface LoopRegion {
  start: number; // Start beat
  end: number; // End beat
  enabled: boolean;
}

/**
 * Loop service
 * Manages loop regions for playback
 */
export class LoopService {
  private loopRegion: LoopRegion | null;
  private listeners: Set<(region: LoopRegion | null) => void>;

  /**
   * Create a new LoopService instance
   */
  constructor() {
    this.loopRegion = null;
    this.listeners = new Set();
  }

  /**
   * Set loop region
   * @param start - Start beat
   * @param end - End beat
   * @throws InvalidParameterError if parameters are invalid
   */
  setLoopRegion(start: number, end: number): void {
    ValidationUtils.validateTime(start, 'start');
    ValidationUtils.validateTime(end, 'end');

    if (start >= end) {
      throw new InvalidParameterError('end', end, `number greater than start (${start})`);
    }

    this.loopRegion = {
      start,
      end,
      enabled: true,
    };

    this._notifyListeners();
  }

  /**
   * Get current loop region
   * @returns Loop region or null if not set
   */
  getLoopRegion(): LoopRegion | null {
    return this.loopRegion ? { ...this.loopRegion } : null;
  }

  /**
   * Enable loop
   */
  enableLoop(): void {
    if (this.loopRegion) {
      this.loopRegion.enabled = true;
      this._notifyListeners();
    }
  }

  /**
   * Disable loop
   */
  disableLoop(): void {
    if (this.loopRegion) {
      this.loopRegion.enabled = false;
      this._notifyListeners();
    }
  }

  /**
   * Toggle loop enabled state
   */
  toggleLoop(): void {
    if (this.loopRegion) {
      this.loopRegion.enabled = !this.loopRegion.enabled;
      this._notifyListeners();
    }
  }

  /**
   * Check if loop is enabled
   * @returns True if loop is enabled
   */
  isLoopEnabled(): boolean {
    return this.loopRegion?.enabled ?? false;
  }

  /**
   * Check if position is within loop region
   * @param position - Position in beats
   * @returns True if position is within loop region
   */
  isInLoopRegion(position: number): boolean {
    if (!this.loopRegion || !this.loopRegion.enabled) {
      return false;
    }

    return position >= this.loopRegion.start && position < this.loopRegion.end;
  }

  /**
   * Wrap position to loop region (for looping playback)
   * @param position - Position in beats
   * @returns Wrapped position or original if not in loop
   */
  wrapToLoop(position: number): number {
    if (!this.loopRegion || !this.loopRegion.enabled) {
      return position;
    }

    if (position >= this.loopRegion.end) {
      return this.loopRegion.start;
    }

    if (position < this.loopRegion.start) {
      return this.loopRegion.start;
    }

    return position;
  }

  /**
   * Clear loop region
   */
  clearLoop(): void {
    this.loopRegion = null;
    this._notifyListeners();
  }

  /**
   * Add listener for loop region changes
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  addListener(listener: (region: LoopRegion | null) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   * @private
   */
  private _notifyListeners(): void {
    const region = this.getLoopRegion();
    this.listeners.forEach((listener) => {
      try {
        listener(region);
      } catch {
        // Ignore listener errors
      }
    });
  }
}

// Export singleton instance
export const loopService = new LoopService();

