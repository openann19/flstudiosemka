/**
 * ADSREnvelope - ADSR envelope generator
 * Attack, Decay, Sustain, Release envelope with velocity sensitivity
 * @module audio/synthesizer/envelopes/ADSREnvelope
 */

import { EnvelopeModule } from './EnvelopeModule';
import type { ADSREnvelopeParams } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * ADSR envelope implementation
 */
export class ADSREnvelope extends EnvelopeModule {
  private params: ADSREnvelopeParams;
  private attackTime: number = 0;
  private decayTime: number = 0;
  private sustainLevel: number = 0;
  private releaseTime: number = 0;
  private velocity: number = 1.0;
  private releaseStartTime: number = 0;

  /**
   * Create a new ADSR envelope
   */
  constructor(audioContext: AudioContext, params: ADSREnvelopeParams) {
    super(audioContext);
    this.params = { ...params };
    this.updateParams();
  }

  /**
   * Update envelope parameters
   */
  updateParams(params?: Partial<ADSREnvelopeParams>): void {
    if (params) {
      this.params = { ...this.params, ...params };
    }
    this.attackTime = Math.max(0, Math.min(10, this.params.attack));
    this.decayTime = Math.max(0, Math.min(10, this.params.decay));
    this.sustainLevel = Math.max(0, Math.min(1, this.params.sustain));
    this.releaseTime = Math.max(0, Math.min(10, this.params.release));
  }

  /**
   * Set velocity (affects peak level)
   */
  setVelocity(velocity: number): void {
    this.velocity = Math.max(0, Math.min(1, velocity));
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
    this.releaseStartTime = 0;

    const peakLevel = this.velocity * (1.0 - this.params.velocitySensitivity * (1.0 - this.velocity));

    try {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);

      const attackEnd = now + this.attackTime;
      const decayEnd = attackEnd + this.decayTime;
      const sustainLevel = peakLevel * this.sustainLevel;

      // Attack phase
      if (this.attackTime > 0) {
        if (this.params.curve === 'exponential') {
          this.scheduleExponentialRamp(now, attackEnd, 0, peakLevel);
        } else {
          this.scheduleLinearRamp(now, attackEnd, 0, peakLevel);
        }
      } else {
        this.gainNode.gain.setValueAtTime(peakLevel, now);
      }

      // Decay phase
      if (this.decayTime > 0) {
        if (this.params.curve === 'exponential') {
          this.scheduleExponentialRamp(attackEnd, decayEnd, peakLevel, sustainLevel);
        } else {
          this.scheduleLinearRamp(attackEnd, decayEnd, peakLevel, sustainLevel);
        }
      } else {
        this.gainNode.gain.setValueAtTime(sustainLevel, attackEnd);
      }
    } catch (error) {
      logger.error('ADSREnvelope: Error triggering attack', { error });
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
    this.releaseStartTime = now;
    const currentValue = this.gainNode.gain.value;

    try {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(currentValue, now);

      if (this.releaseTime > 0) {
        if (this.params.curve === 'exponential') {
          this.scheduleExponentialRamp(now, now + this.releaseTime, currentValue, 0);
        } else {
          this.scheduleLinearRamp(now, now + this.releaseTime, currentValue, 0);
        }
      } else {
        this.gainNode.gain.setValueAtTime(0, now);
      }

      // Mark as inactive after release completes
      setTimeout(() => {
        if (this.releaseStartTime === now) {
          this.active = false;
        }
      }, this.releaseTime * 1000 + 100);
    } catch (error) {
      logger.error('ADSREnvelope: Error triggering release', { error });
      this.active = false;
    }
  }

  /**
   * Get envelope parameters
   */
  getParams(): ADSREnvelopeParams {
    return { ...this.params };
  }
}

