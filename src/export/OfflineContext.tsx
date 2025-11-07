/**
 * OfflineContext - Wrapper for OfflineAudioContext
 * Provides utilities for offline rendering
 * @module export/OfflineContext
 */

/**
 * OfflineContext - Wrapper for OfflineAudioContext
 * Provides utilities for offline rendering
 */
export class OfflineContext {
  private sampleRate: number;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  /**
   * Create offline audio context
   * @param {number} numberOfChannels - Number of channels
   * @param {number} length - Length in samples
   * @param {number} sampleRate - Sample rate
   * @returns {OfflineAudioContext} Offline audio context
   */
  createContext(
    numberOfChannels: number,
    length: number,
    sampleRate: number | null = null
  ): OfflineAudioContext {
    const rate = sampleRate || this.sampleRate;
    return new OfflineAudioContext(numberOfChannels, length, rate);
  }

  /**
   * Create context from duration
   * @param {number} duration - Duration in seconds
   * @param {number} numberOfChannels - Number of channels
   * @param {number} sampleRate - Sample rate
   * @returns {OfflineAudioContext} Offline audio context
   */
  createContextFromDuration(
    duration: number,
    numberOfChannels: number = 2,
    sampleRate: number | null = null
  ): OfflineAudioContext {
    const rate = sampleRate || this.sampleRate;
    const length = Math.ceil(duration * rate);
    return this.createContext(numberOfChannels, length, rate);
  }

  /**
   * Render audio
   * @param {OfflineAudioContext} context - Offline audio context
   * @returns {Promise<AudioBuffer>} Rendered buffer
   */
  async render(context: OfflineAudioContext): Promise<AudioBuffer> {
    return await context.startRendering();
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { OfflineContext: typeof OfflineContext }).OfflineContext =
    OfflineContext;
}

