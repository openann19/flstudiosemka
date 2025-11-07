/**
 * SamplePlayer - Professional sample playback engine
 * Supports velocity-sensitive playback, pitch shifting, and time stretching
 * @module audio/SamplePlayer
 */

import {
  AudioContextError,
  FileLoadError,
  InvalidParameterError,
  ValidationUtils,
} from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Playback result with source and gain nodes
 */
export interface PlaybackResult {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

/**
 * Professional sample playback engine with pitch shifting and looping
 */
export class SamplePlayer {
  private audioContext: AudioContext;

  private buffer: AudioBuffer | null;

  private playbackRate: number;

  private loop: boolean;

  private loopStart: number;

  private loopEnd: number;

  /**
   * Create a new SamplePlayer instance
   * @param audioContext - Web Audio API AudioContext
   * @param buffer - AudioBuffer to play (optional, can be set later)
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext, buffer: AudioBuffer | null = null) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.buffer = buffer;
    this.playbackRate = 1.0;
    this.loop = false;
    this.loopStart = 0;
    this.loopEnd = buffer ? buffer.length : 0;
  }

  /**
   * Play the sample with optional parameters
   * @param velocity - Velocity 0-1 (default: 1.0)
   * @param pitchShift - Semitones to shift pitch (default: 0)
   * @param startTime - When to start playback (default: current time)
   * @param offset - Sample offset in seconds (default: 0)
   * @returns Playback result with source and gain nodes, or null if buffer unavailable
   * @throws InvalidParameterError if parameters are invalid
   */
  play(
    velocity: number = 1.0,
    pitchShift: number = 0,
    startTime: number | null = null,
    offset: number = 0
  ): PlaybackResult | null {
    try {
      if (!this.buffer || !this.audioContext) {
        logger.warn('SamplePlayer: No buffer or audio context available');
        return null;
      }

      ValidationUtils.validateGain(velocity, 'velocity');
      ValidationUtils.validateTime(offset, 'offset');

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.buffer;
      source.loop = this.loop;

      if (this.loop) {
        source.loopStart = this.loopStart / this.buffer.sampleRate;
        source.loopEnd = this.loopEnd / this.buffer.sampleRate;
      }

      // Calculate playback rate from pitch shift
      const semitoneRatio = 2 ** (pitchShift / 12);
      source.playbackRate.value = this.playbackRate * semitoneRatio;

      // Enhanced gain staging: prevent clipping with proper headroom
      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      // Apply -3dB headroom to prevent clipping and add smooth fade-in
      const headroom = 0.707; // -3dB
      const targetGain = clampedVelocity * headroom;
      
      // Smooth fade-in to prevent clicks
      const currentTime = startTime ?? this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(targetGain, currentTime + 0.001); // 1ms fade-in

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Start playback
      source.start(currentTime, offset);

      // Clean up when finished
      source.onended = (): void => {
        try {
          source.disconnect();
          gainNode.disconnect();
        } catch {
          // Already disconnected - ignore
          logger.debug('SamplePlayer: Nodes already disconnected');
        }
      };

      return { source, gain: gainNode };
    } catch (error) {
      logger.error('SamplePlayer.play error:', error);
      if (error instanceof InvalidParameterError) {
        throw error;
      }
      throw new AudioContextError('Failed to play sample', { velocity, pitchShift, error });
    }
  }

  /**
   * Set playback rate (affects pitch and speed)
   * @param rate - Playback rate (1.0 = normal, range: 0.25-4.0)
   * @throws InvalidParameterError if rate is out of range
   */
  setPlaybackRate(rate: number): void {
    try {
      if (typeof rate !== 'number' || Number.isNaN(rate)) {
        throw new InvalidParameterError('rate', rate, 'number');
      }
      this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
    } catch (error) {
      logger.error('SamplePlayer.setPlaybackRate error:', error);
      throw error;
    }
  }

  /**
   * Set loop points
   * @param start - Loop start in samples
   * @param end - Loop end in samples
   * @throws InvalidParameterError if buffer is unavailable or points are invalid
   */
  setLoopPoints(start: number, end: number): void {
    try {
      if (!this.buffer) {
        throw new InvalidParameterError('buffer', null, 'AudioBuffer must be set first');
      }

      if (typeof start !== 'number' || Number.isNaN(start)) {
        throw new InvalidParameterError('start', start, 'number');
      }
      if (typeof end !== 'number' || Number.isNaN(end)) {
        throw new InvalidParameterError('end', end, 'number');
      }

      this.loopStart = Math.max(0, Math.min(start, this.buffer.length));
      this.loopEnd = Math.max(this.loopStart, Math.min(end, this.buffer.length));
    } catch (error) {
      logger.error('SamplePlayer.setLoopPoints error:', error);
      throw error;
    }
  }

  /**
   * Enable/disable looping
   * @param enabled - Whether to loop
   */
  setLoop(enabled: boolean): void {
    this.loop = enabled;
  }

  /**
   * Get sample duration in seconds
   * @returns Duration in seconds, or 0 if buffer unavailable
   */
  getDuration(): number {
    if (!this.buffer) return 0;
    return this.buffer.duration;
  }

  /**
   * Get sample length in samples
   * @returns Length in samples, or 0 if buffer unavailable
   */
  getLength(): number {
    if (!this.buffer) return 0;
    return this.buffer.length;
  }

  /**
   * Set the audio buffer
   * @param buffer - AudioBuffer to use
   * @throws InvalidParameterError if buffer is invalid
   */
  setBuffer(buffer: AudioBuffer | null): void {
    if (buffer && !(buffer instanceof AudioBuffer)) {
      throw new InvalidParameterError('buffer', buffer, 'AudioBuffer');
    }
    this.buffer = buffer;
    if (buffer) {
      this.loopEnd = buffer.length;
    }
  }

  /**
   * Get the current audio buffer
   * @returns Current AudioBuffer or null
   */
  getBuffer(): AudioBuffer | null {
    return this.buffer;
  }
}

/**
 * Load audio sample from URL, File, or ArrayBuffer
 * @param audioContext - Audio context
 * @param source - URL string, File, or ArrayBuffer
 * @returns Promise resolving to loaded AudioBuffer
 * @throws FileLoadError if loading fails
 */
export async function loadAudioSample(
  audioContext: AudioContext,
  source: string | File | ArrayBuffer
): Promise<AudioBuffer> {
  try {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    let arrayBuffer: ArrayBuffer;

    if (source instanceof File) {
      arrayBuffer = await source.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else if (typeof source === 'string') {
      // URL
      ValidationUtils.validateString(source, 'source URL');
      const response = await fetch(source);
      if (!response.ok) {
        throw new FileLoadError(source, `HTTP ${response.status}: ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } else {
      throw new InvalidParameterError('source', source, 'string | File | ArrayBuffer');
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error('[DEBUG] SamplePlayer.loadAudioSample error:', error);
    if (error instanceof FileLoadError || error instanceof InvalidParameterError) {
      throw error;
    }
    const fileName = source instanceof File ? source.name : typeof source === 'string' ? source : 'ArrayBuffer';
    throw new FileLoadError(fileName, String(error));
  }
}

/**
 * Create a SamplePlayer from a source
 * @param audioContext - Audio context
 * @param source - Audio source (URL, File, ArrayBuffer, or AudioBuffer)
 * @returns Promise resolving to SamplePlayer instance
 * @throws FileLoadError if loading fails
 */
export async function createSamplePlayer(
  audioContext: AudioContext,
  source: string | File | ArrayBuffer | AudioBuffer
): Promise<SamplePlayer> {
  try {
    let buffer: AudioBuffer;

    if (source instanceof AudioBuffer) {
      buffer = source;
    } else {
      buffer = await loadAudioSample(audioContext, source);
    }

    return new SamplePlayer(audioContext, buffer);
  } catch (error) {
    logger.error('SamplePlayer.createSamplePlayer error:', error);
    throw error;
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.SamplePlayer = SamplePlayer;
  window.loadAudioSample = loadAudioSample;
  window.createSamplePlayer = createSamplePlayer;
}

