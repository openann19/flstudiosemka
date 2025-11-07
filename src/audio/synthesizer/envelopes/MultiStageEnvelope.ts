/**
 * MultiStageEnvelope - Multi-point envelope generator
 * Supports up to 8 stages with custom curves
 * @module audio/synthesizer/envelopes/MultiStageEnvelope
 */

import { EnvelopeModule } from './EnvelopeModule';
import type { EnvelopePoint } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Multi-stage envelope implementation
 */
export class MultiStageEnvelope extends EnvelopeModule {
  private points: EnvelopePoint[] = [];
  private maxStages: number = 8;
  private releaseTime: number = 0.3;

  /**
   * Create a new multi-stage envelope
   */
  constructor(audioContext: AudioContext, maxStages: number = 8) {
    super(audioContext);
    this.maxStages = Math.max(2, Math.min(8, maxStages));
  }

  /**
   * Set envelope points
   */
  setPoints(points: EnvelopePoint[]): void {
    if (points.length > this.maxStages) {
      logger.warn('MultiStageEnvelope: Too many points, truncating', {
        provided: points.length,
        max: this.maxStages,
      });
      this.points = points.slice(0, this.maxStages);
    } else {
      this.points = [...points];
    }

    // Sort by time
    this.points.sort((a, b) => a.time - b.time);

    // Ensure first point is at time 0
    const firstPoint = this.points[0];
    if (firstPoint && firstPoint.time !== 0) {
      this.points.unshift({ time: 0, value: 0, curve: 'linear' });
    }
  }

  /**
   * Set release time
   */
  setReleaseTime(time: number): void {
    this.releaseTime = Math.max(0, Math.min(10, time));
  }

  /**
   * Get current envelope value
   */
  getValue(): number {
    return this.gainNode.gain.value;
  }

  /**
   * Trigger attack phase
   */
  triggerAttack(time?: number): void {
    const now = time ?? this.audioContext.currentTime;
    this.active = true;

    if (this.points.length === 0) {
      this.gainNode.gain.setValueAtTime(1, now);
      return;
    }

    try {
      this.gainNode.gain.cancelScheduledValues(now);
      const firstPoint = this.points[0];
      if (!firstPoint) {
        this.gainNode.gain.setValueAtTime(1, now);
        return;
      }
      this.gainNode.gain.setValueAtTime(firstPoint.value, now);

      for (let i = 1; i < this.points.length; i += 1) {
        const prevPoint = this.points[i - 1];
        const currentPoint = this.points[i];
        if (!prevPoint || !currentPoint) {
          continue;
        }
        const startTime = now + prevPoint.time;
        const endTime = now + currentPoint.time;

        if (prevPoint.curve === 'exponential') {
          this.scheduleExponentialRamp(
            startTime,
            endTime,
            prevPoint.value,
            currentPoint.value
          );
        } else {
          this.scheduleLinearRamp(startTime, endTime, prevPoint.value, currentPoint.value);
        }
      }

      // Store the last point as release point (for future use)
    } catch (error) {
      logger.error('MultiStageEnvelope: Error triggering attack', { error });
    }
  }

  /**
   * Trigger release phase
   */
  triggerRelease(time?: number): void {
    if (!this.active) {
      return;
    }

    const now = time ?? this.audioContext.currentTime;
    const currentValue = this.gainNode.gain.value;

    try {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(currentValue, now);

      if (this.releaseTime > 0) {
        this.scheduleExponentialRamp(now, now + this.releaseTime, currentValue, 0);
      } else {
        this.gainNode.gain.setValueAtTime(0, now);
      }

      setTimeout(() => {
        this.active = false;
      }, this.releaseTime * 1000 + 100);
    } catch (error) {
      logger.error('MultiStageEnvelope: Error triggering release', { error });
      this.active = false;
    }
  }

  /**
   * Get envelope points
   */
  getPoints(): EnvelopePoint[] {
    return this.points.map((point) => ({ ...point }));
  }
}

