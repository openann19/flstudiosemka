/**
 * OfflineContext - Wrapper for OfflineAudioContext
 * Provides utilities for offline rendering
 */
class OfflineContext {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
  }

  /**
   * Create offline audio context
   * @param {number} numberOfChannels - Number of channels
   * @param {number} length - Length in samples
   * @param {number} sampleRate - Sample rate
   * @returns {OfflineAudioContext} Offline audio context
   */
  createContext(numberOfChannels, length, sampleRate = null) {
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
  createContextFromDuration(duration, numberOfChannels = 2, sampleRate = null) {
    const rate = sampleRate || this.sampleRate;
    const length = Math.ceil(duration * rate);
    return this.createContext(numberOfChannels, length, rate);
  }

  /**
   * Render audio
   * @param {OfflineAudioContext} context - Offline audio context
   * @returns {Promise<AudioBuffer>} Rendered buffer
   */
  async render(context) {
    return await context.startRendering();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflineContext };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.OfflineContext = OfflineContext;
}

