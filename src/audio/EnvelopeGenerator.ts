/**
 * EnvelopeGenerator - ADSR and other envelope generators
 * Provides flexible envelope shaping for synthesis
 * @module audio/EnvelopeGenerator
 */

import {
  AudioContextError,
  InvalidParameterError,
  ValidationUtils,
} from '../utils/errors';
import { logger } from '../utils/logger';

// EnvelopeConfig type is used in type definitions but not directly imported

/**
 * Envelope point for custom envelopes
 */
export interface EnvelopePoint {
  time: number;
  value: number;
}

/**
 * ADSR envelope parameters
 */
export interface ADSRParams {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  peak?: number;
}

/**
 * Exponential envelope parameters
 */
export interface ExponentialParams {
  attack?: number;
  release?: number;
  peak?: number;
}

/**
 * Envelope result with gain node and release trigger
 */
export interface EnvelopeResult {
  gain: GainNode;
  triggerRelease: (releaseTime?: number, releaseDuration?: number) => void;
}

/**
 * ADSR and other envelope generators for synthesis
 */
export class EnvelopeGenerator {
  private audioContext: AudioContext;

  /**
   * Create a new EnvelopeGenerator instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }
    this.audioContext = audioContext;
  }

  /**
   * Create ADSR envelope
   * @param params - Envelope parameters
   * @param params.attack - Attack time in seconds (default: 0.01)
   * @param params.decay - Decay time in seconds (default: 0.1)
   * @param params.sustain - Sustain level 0-1 (default: 0.7)
   * @param params.release - Release time in seconds (default: 0.3)
   * @param params.peak - Peak level 0-1 (default: 1.0)
   * @param startTime - When to start envelope (default: current time)
   * @returns Gain node with envelope applied and release trigger function
   * @throws InvalidParameterError if parameters are invalid
   */
  createADSR(
    params: ADSRParams,
    startTime: number | null = null
  ): EnvelopeResult {
    try {
      const {
        attack = 0.01,
        decay = 0.1,
        sustain = 0.7,
        release = 0.3,
        peak = 1.0,
      } = params;

      ValidationUtils.validateTime(attack, 'attack');
      ValidationUtils.validateTime(decay, 'decay');
      ValidationUtils.validateGain(sustain, 'sustain');
      ValidationUtils.validateTime(release, 'release');
      ValidationUtils.validateGain(peak, 'peak');

      const gain = this.audioContext.createGain();
      const now = startTime ?? this.audioContext.currentTime;

      // Attack
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + attack);

      // Decay
      gain.gain.linearRampToValueAtTime(peak * sustain, now + attack + decay);

      return {
        gain,
        triggerRelease: (releaseTime: number | null = null): void => {
          const releaseStart = releaseTime ?? this.audioContext.currentTime;
          gain.gain.cancelScheduledValues(releaseStart);
          gain.gain.setValueAtTime(gain.gain.value, releaseStart);
          gain.gain.linearRampToValueAtTime(0, releaseStart + release);
        },
      };
    } catch (error) {
      logger.error('EnvelopeGenerator.createADSR error:', error);
      throw error;
    }
  }

  /**
   * Create exponential envelope
   * @param params - Envelope parameters
   * @param params.attack - Attack time (default: 0.01)
   * @param params.release - Release time (default: 0.3)
   * @param params.peak - Peak level 0-1 (default: 1.0)
   * @param startTime - When to start (default: current time)
   * @returns Gain node with exponential envelope
   * @throws InvalidParameterError if parameters are invalid
   */
  createExponential(
    params: ExponentialParams,
    startTime: number | null = null
  ): EnvelopeResult {
    try {
      const { attack = 0.01, release = 0.3, peak = 1.0 } = params;

      ValidationUtils.validateTime(attack, 'attack');
      ValidationUtils.validateTime(release, 'release');
      ValidationUtils.validateGain(peak, 'peak');

      const gain = this.audioContext.createGain();
      const now = startTime ?? this.audioContext.currentTime;

      gain.gain.setValueAtTime(0, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + attack);

      return {
        gain,
        triggerRelease: (releaseTime: number | null = null): void => {
          const releaseStart = releaseTime ?? this.audioContext.currentTime;
          gain.gain.cancelScheduledValues(releaseStart);
          gain.gain.setValueAtTime(gain.gain.value, releaseStart);
          gain.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);
        },
      };
    } catch (error) {
      logger.error('EnvelopeGenerator.createExponential error:', error);
      throw error;
    }
  }

  /**
   * Create custom envelope from points
   * @param points - Array of {time, value} points
   * @param startTime - When to start (default: current time)
   * @returns Gain node with custom envelope
   * @throws InvalidParameterError if points are invalid
   */
  createCustom(
    points: EnvelopePoint[],
    startTime: number | null = null
  ): EnvelopeResult {
    try {
      if (!Array.isArray(points)) {
        throw new InvalidParameterError('points', points, 'array of EnvelopePoint');
      }

      const gain = this.audioContext.createGain();
      const now = startTime ?? this.audioContext.currentTime;

      if (points.length === 0) {
        gain.gain.value = 1.0;
        return {
          gain,
          triggerRelease: (): void => {
            // No-op for empty envelope
          },
        };
      }

      // Sort points by time
      const sortedPoints = [...points].sort((a, b) => {
        ValidationUtils.validateTime(a.time, 'point time');
        ValidationUtils.validateTime(b.time, 'point time');
        ValidationUtils.validateGain(a.value, 'point value');
        ValidationUtils.validateGain(b.value, 'point value');
        return a.time - b.time;
      });

      // Set initial value
      const firstPoint = sortedPoints[0];
      if (!firstPoint) {
        return { gain, triggerRelease: () => {} };
      }
      gain.gain.setValueAtTime(firstPoint.value, now);

      // Set intermediate points
      for (let i = 1; i < sortedPoints.length; i += 1) {
        const point = sortedPoints[i];
        if (!point) {
          continue;
        }
        gain.gain.linearRampToValueAtTime(point.value, now + point.time);
      }

      return {
        gain,
        triggerRelease: (
          releaseTime: number | null = null,
          releaseDuration: number = 0.1
        ): void => {
          ValidationUtils.validateTime(releaseDuration, 'releaseDuration');
          const releaseStart = releaseTime ?? this.audioContext.currentTime;
          gain.gain.cancelScheduledValues(releaseStart);
          gain.gain.setValueAtTime(gain.gain.value, releaseStart);
          gain.gain.linearRampToValueAtTime(0, releaseStart + releaseDuration);
        },
      };
    } catch (error) {
      logger.error('EnvelopeGenerator.createCustom error:', error);
      throw error;
    }
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.EnvelopeGenerator = EnvelopeGenerator;
}

