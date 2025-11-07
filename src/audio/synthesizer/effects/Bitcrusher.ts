/**
 * Bitcrusher - Bitcrusher and sample rate reduction
 * Digital distortion effect
 * @module audio/synthesizer/effects/Bitcrusher
 */

import { EffectModule } from './EffectModule';
import type { EffectType } from '../../../types/synthesizer.types';

/**
 * Bitcrusher parameters
 */
export interface BitcrusherParams {
  enabled: boolean;
  bitDepth: number; // 1 to 16 bits
  sampleRateReduction: number; // 1 to 1/16 (0.0625)
  wet: number; // 0 to 1
  dry: number; // 0 to 1
}

/**
 * Bitcrusher implementation
 */
export class Bitcrusher extends EffectModule {
  private params: BitcrusherParams;
  private inputGain!: GainNode;
  private outputGain!: GainNode;
  private dryGain!: GainNode;
  private wetGain!: GainNode;
  private lastSample: number = 0;
  private sampleCounter: number = 0;
  private sampleHold: number = 1;

  /**
   * Create a new bitcrusher
   */
  constructor(audioContext: AudioContext, params: BitcrusherParams) {
    super(audioContext);
    this.params = {
      ...params,
      bitDepth: params.bitDepth ?? 8,
      sampleRateReduction: params.sampleRateReduction ?? 1,
      wet: params.wet ?? 0.5,
      dry: params.dry ?? 0.5,
    };
    this.initializeNodes();
  }

  /**
   * Initialize audio nodes
   */
  private initializeNodes(): void {
    this.inputGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();

    this.inputGain.connect(this.dryGain);
    this.inputGain.connect(this.wetGain);
    this.dryGain.connect(this.outputGain);
    this.wetGain.connect(this.outputGain);

    this.applyParams();
  }

  /**
   * Apply parameters
   */
  private applyParams(): void {
    const now = this.audioContext.currentTime;
    this.dryGain.gain.setValueAtTime(this.params.dry, now);
    this.wetGain.gain.setValueAtTime(this.params.wet, now);
    this.sampleHold = Math.max(1, Math.floor(1 / this.params.sampleRateReduction));
  }

  /**
   * Quantize sample to bit depth
   */
  private quantize(sample: number): number {
    const levels = Math.pow(2, this.params.bitDepth);
    const quantized = Math.round(sample * levels) / levels;
    return Math.max(-1, Math.min(1, quantized));
  }

  /**
   * Process audio sample
   */
  processSample(input: number): number {
    // Sample rate reduction (sample and hold)
    this.sampleCounter += 1;
    if (this.sampleCounter >= this.sampleHold) {
      this.lastSample = this.quantize(input);
      this.sampleCounter = 0;
    }

    const crushed = this.lastSample;
    return input * this.params.dry + crushed * this.params.wet;
  }

  /**
   * Get input node
   */
  getInputNode(): AudioNode {
    return this.inputGain;
  }

  /**
   * Get output node
   */
  getOutputNode(): AudioNode {
    return this.outputGain;
  }

  /**
   * Get effect type
   */
  getEffectType(): EffectType {
    return 'distortion';
  }

  /**
   * Update parameters
   */
  updateParams(params: Partial<BitcrusherParams>): void {
    this.params = { ...this.params, ...params };
    this.applyParams();
  }

  /**
   * Reset effect
   */
  reset(): void {
    this.lastSample = 0;
    this.sampleCounter = 0;
  }
}

