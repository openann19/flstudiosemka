/**
 * EnvelopeModule - Base envelope generator
 * Provides common interface for all envelope types
 * @module audio/synthesizer/envelopes/EnvelopeModule
 */

import type { EnvelopeCurve } from '../../../types/synthesizer.types';

/**
 * Base envelope module interface
 */
export interface IEnvelopeModule {
  getValue(): number;
  triggerAttack(time?: number): void;
  triggerRelease(time?: number): void;
  isActive(): boolean;
  reset(): void;
}

/**
 * Base envelope module class
 */
export abstract class EnvelopeModule implements IEnvelopeModule {
  protected audioContext: AudioContext;
  protected gainNode: GainNode;
  protected active: boolean = false;
  protected currentValue: number = 0;

  /**
   * Create a new envelope module
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('EnvelopeModule: Invalid AudioContext');
    }
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0;
  }

  /**
   * Get current envelope value (0 to 1)
   */
  abstract getValue(): number;

  /**
   * Trigger attack phase
   */
  abstract triggerAttack(time?: number): void;

  /**
   * Trigger release phase
   */
  abstract triggerRelease(time?: number): void;

  /**
   * Check if envelope is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Reset envelope to initial state
   */
  reset(): void {
    this.active = false;
    this.currentValue = 0;
    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(0, now);
  }

  /**
   * Get gain node for audio routing
   */
  getGainNode(): GainNode {
    return this.gainNode;
  }

  /**
   * Apply envelope curve to value
   */
  protected applyCurve(value: number, curve: EnvelopeCurve): number {
    switch (curve) {
      case 'linear':
        return value;
      case 'exponential':
        return value * value;
      case 'logarithmic':
        return Math.sqrt(value);
      default:
        return value;
    }
  }

  /**
   * Schedule linear ramp
   */
  protected scheduleLinearRamp(
    startTime: number,
    endTime: number,
    startValue: number,
    endValue: number
  ): void {
    try {
      this.gainNode.gain.setValueAtTime(startValue, startTime);
      this.gainNode.gain.linearRampToValueAtTime(endValue, endTime);
    } catch {
      // Silent error handling
    }
  }

  /**
   * Schedule exponential ramp
   */
  protected scheduleExponentialRamp(
    startTime: number,
    endTime: number,
    startValue: number,
    endValue: number
  ): void {
    try {
      const minValue = 0.0001;
      const safeStart = Math.max(startValue, minValue);
      const safeEnd = Math.max(endValue, minValue);
      this.gainNode.gain.setValueAtTime(safeStart, startTime);
      this.gainNode.gain.exponentialRampToValueAtTime(safeEnd, endTime);
    } catch {
      // Silent error handling
    }
  }
}

