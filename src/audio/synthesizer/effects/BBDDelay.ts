/**
 * BBDDelay - Bucket Brigade Delay
 * Analog-modeled BBD (bucket brigade device) delay
 * @module audio/synthesizer/effects/BBDDelay
 */

import { EffectModule } from './EffectModule';
import type { DelayEffectParams, EffectType } from '../../../types/synthesizer.types';

/**
 * BBD delay parameters
 */
export interface BBDDelayParams extends DelayEffectParams {
  stages: number; // Number of BBD stages (64, 128, 256, 512, 1024)
  clockRate: number; // Clock rate in Hz
  noiseLevel: number; // Noise level (0 to 1)
}

/**
 * BBD delay implementation
 */
export class BBDDelay extends EffectModule {
  private params: BBDDelayParams;
  private delayBuffer: Float32Array;
  private writeIndex: number = 0;
  private sampleRate: number;
  private delaySamples: number = 0;
  private feedback: number = 0;
  private noiseGain: number = 0;

  /**
   * Create a new BBD delay
   */
  constructor(audioContext: AudioContext, params: BBDDelayParams) {
    super(audioContext);
    this.sampleRate = audioContext.sampleRate;
    this.params = {
      ...params,
      stages: params.stages ?? 512,
      clockRate: params.clockRate ?? 10000,
      noiseLevel: params.noiseLevel ?? 0.01,
    };
    const maxDelaySamples = Math.floor(2.0 * this.sampleRate);
    this.delayBuffer = new Float32Array(maxDelaySamples);
    this.applyParams();
  }

  /**
   * Apply parameters
   */
  private applyParams(): void {
    // BBD delay time is determined by stages and clock rate
    const delayTime = this.params.stages / this.params.clockRate;
    this.delaySamples = Math.floor(delayTime * this.sampleRate);
    this.feedback = this.params.feedback;
    this.noiseGain = this.params.noiseLevel * 0.1;
  }

  /**
   * Apply BBD characteristic filtering (low-pass)
   */
  private applyBBDFilter(input: number, state: { last: number }): number {
    const cutoff = 0.7; // BBD has limited bandwidth
    const filtered = input * (1 - cutoff) + state.last * cutoff;
    state.last = filtered;
    return filtered;
  }

  /**
   * Add noise (BBD characteristic)
   */
  private addNoise(input: number): number {
    const noise = (Math.random() * 2 - 1) * this.noiseGain;
    return input + noise;
  }

  /**
   * Process audio sample
   */
  processSample(input: number): number {
    // Read from delay buffer
    const readIndex = (this.writeIndex - this.delaySamples + this.delayBuffer.length) %
      this.delayBuffer.length;
    const delayed = this.delayBuffer[readIndex] ?? 0;

    // Apply BBD filtering
    const filterState = { last: 0 };
    const filtered = this.applyBBDFilter(delayed, filterState);

    // Add noise
    const noisy = this.addNoise(filtered);

    // Apply feedback
    const output = input + noisy * this.feedback;

    // Write to delay buffer
    this.delayBuffer[this.writeIndex] = output;
    this.writeIndex = (this.writeIndex + 1) % this.delayBuffer.length;

    // Mix dry and wet
    return input * this.params.dry + noisy * this.params.wet;
  }

  /**
   * Get input node
   */
  getInputNode(): AudioNode {
    return this.audioContext.createGain();
  }

  /**
   * Get output node
   */
  getOutputNode(): AudioNode {
    return this.audioContext.createGain();
  }

  /**
   * Get effect type
   */
  getEffectType(): EffectType {
    return 'delay';
  }

  /**
   * Update parameters
   */
  updateParams(params: Partial<BBDDelayParams>): void {
    this.params = { ...this.params, ...params };
    this.applyParams();
  }

  /**
   * Reset delay buffer
   */
  reset(): void {
    this.delayBuffer.fill(0);
    this.writeIndex = 0;
  }
}

