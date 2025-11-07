/**
 * TapeDelay - Analog-modeled tape delay
 * Simulates tape delay with wow/flutter and saturation
 * @module audio/synthesizer/effects/TapeDelay
 */

import { EffectModule } from './EffectModule';
import type { DelayEffectParams, EffectType } from '../../../types/synthesizer.types';

/**
 * Tape delay parameters
 */
export interface TapeDelayParams extends DelayEffectParams {
  wowFlutter: number; // 0 to 1, wow and flutter amount
  saturation: number; // 0 to 1, tape saturation
  tapeSpeed: number; // 0.5 to 2.0, tape speed variation
}

/**
 * Tape delay implementation
 */
export class TapeDelay extends EffectModule {
  private params: TapeDelayParams;
  private delayBuffer: Float32Array;
  private writeIndex: number = 0;
  private sampleRate: number;
  private delaySamples: number = 0;
  private wowPhase: number = 0;
  private flutterPhase: number = 0;
  private feedback: number = 0;

  /**
   * Create a new tape delay
   */
  constructor(audioContext: AudioContext, params: TapeDelayParams) {
    super(audioContext);
    this.sampleRate = audioContext.sampleRate;
    this.params = {
      ...params,
      wowFlutter: params.wowFlutter ?? 0.1,
      saturation: params.saturation ?? 0.3,
      tapeSpeed: params.tapeSpeed ?? 1.0,
    };
    const maxDelaySamples = Math.floor(2.0 * this.sampleRate);
    this.delayBuffer = new Float32Array(maxDelaySamples);
    this.applyParams();
  }

  /**
   * Apply parameters
   */
  private applyParams(): void {
    const delayTime = this.params.tempoSync
      ? this.params.time
      : this.params.time * this.params.tapeSpeed;
    this.delaySamples = Math.floor(delayTime * this.sampleRate);
    this.feedback = this.params.feedback;
  }

  /**
   * Apply tape saturation
   */
  private applySaturation(input: number): number {
    const drive = 1 + this.params.saturation * 2;
    const driven = input * drive;
    return Math.tanh(driven) / drive;
  }

  /**
   * Calculate wow and flutter modulation
   */
  private calculateWowFlutter(): number {
    const wowFreq = 0.5; // Hz
    const flutterFreq = 6.0; // Hz
    const wow = Math.sin(this.wowPhase * Math.PI * 2) * this.params.wowFlutter * 0.02;
    const flutter = Math.sin(this.flutterPhase * Math.PI * 2) * this.params.wowFlutter * 0.005;

    this.wowPhase += wowFreq / this.sampleRate;
    this.flutterPhase += flutterFreq / this.sampleRate;
    if (this.wowPhase >= 1) {
      this.wowPhase -= 1;
    }
    if (this.flutterPhase >= 1) {
      this.flutterPhase -= 1;
    }

    return 1 + wow + flutter;
  }

  /**
   * Process audio sample
   */
  processSample(input: number): number {
    // Calculate modulated delay time
    const modulation = this.calculateWowFlutter();
    const modulatedDelay = this.delaySamples * modulation;

    // Read from delay buffer (with interpolation)
    const readPos = this.writeIndex - modulatedDelay;
    const readIndex = (readPos + this.delayBuffer.length) % this.delayBuffer.length;
    const lowerIndex = Math.floor(readIndex);
    const upperIndex = (lowerIndex + 1) % this.delayBuffer.length;
    const fraction = readIndex - lowerIndex;

    const delayed =
      (this.delayBuffer[lowerIndex] ?? 0) * (1 - fraction) +
      (this.delayBuffer[upperIndex] ?? 0) * fraction;

    // Apply saturation
    const saturated = this.applySaturation(delayed);

    // Mix input with feedback
    const output = input + saturated * this.feedback;

    // Write to delay buffer
    this.delayBuffer[this.writeIndex] = output;
    this.writeIndex = (this.writeIndex + 1) % this.delayBuffer.length;

    // Mix dry and wet
    return input * this.params.dry + saturated * this.params.wet;
  }

  /**
   * Get input node
   */
  getInputNode(): AudioNode {
    // For tape delay, we'd use ScriptProcessorNode or AudioWorklet
    // For now, return a gain node as placeholder
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
  updateParams(params: Partial<TapeDelayParams>): void {
    this.params = { ...this.params, ...params };
    this.applyParams();
  }

  /**
   * Reset delay buffer
   */
  reset(): void {
    this.delayBuffer.fill(0);
    this.writeIndex = 0;
    // Reset read position (calculated dynamically in process)
    this.wowPhase = 0;
    this.flutterPhase = 0;
  }
}

