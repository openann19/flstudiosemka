/**
 * ConvolutionReverb - Convolution reverb with impulse response
 * High-quality reverb using convolution with IR library
 * @module audio/synthesizer/effects/ConvolutionReverb
 */

import { EffectModule } from './EffectModule';
import type { ReverbEffectParams, EffectType } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Convolution reverb parameters
 */
export interface ConvolutionReverbParams extends ReverbEffectParams {
  impulseResponse: Float32Array | null; // Impulse response buffer
  irLength: number; // Length of IR in samples
}

/**
 * Convolution reverb implementation
 */
export class ConvolutionReverb extends EffectModule {
  private params: ConvolutionReverbParams;
  private convolver: ConvolverNode | null = null;
  private inputGain!: GainNode;
  private outputGain!: GainNode;
  private dryGain!: GainNode;
  private wetGain!: GainNode;

  /**
   * Create a new convolution reverb
   */
  constructor(audioContext: AudioContext, params: ConvolutionReverbParams) {
    super(audioContext);
    this.params = {
      ...params,
      impulseResponse: params.impulseResponse ?? null,
      irLength: params.irLength ?? 0,
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

    if (this.params.impulseResponse) {
      this.loadImpulseResponse(this.params.impulseResponse);
    }

    this.applyParams();
  }

  /**
   * Load impulse response
   */
  loadImpulseResponse(ir: Float32Array): void {
    try {
      // Create audio buffer from IR
      const buffer = this.audioContext.createBuffer(1, ir.length, this.audioContext.sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < ir.length; i += 1) {
        channelData[i] = ir[i] ?? 0;
      }

      // Create convolver
      if (this.convolver) {
        this.convolver.disconnect();
      }
      this.convolver = this.audioContext.createConvolver();
      this.convolver.buffer = buffer;
      this.convolver.normalize = true;

      // Connect
      this.inputGain.connect(this.convolver);
      this.convolver.connect(this.wetGain);
      this.inputGain.connect(this.dryGain);

      this.params.impulseResponse = ir;
      this.params.irLength = ir.length;
    } catch (error) {
      logger.error('ConvolutionReverb: Error loading impulse response', { error });
    }
  }

  /**
   * Apply parameters
   */
  private applyParams(): void {
    const now = this.audioContext.currentTime;
    this.dryGain.gain.setValueAtTime(this.params.dry, now);
    this.wetGain.gain.setValueAtTime(this.params.wet, now);
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
    this.dryGain.connect(this.outputGain);
    this.wetGain.connect(this.outputGain);
    return this.outputGain;
  }

  /**
   * Get effect type
   */
  getEffectType(): EffectType {
    return 'reverb';
  }

  /**
   * Update parameters
   */
  updateParams(params: Partial<ConvolutionReverbParams>): void {
    this.params = { ...this.params, ...params };
    if (params.impulseResponse) {
      this.loadImpulseResponse(params.impulseResponse);
    }
    this.applyParams();
  }

  /**
   * Generate simple impulse response (for testing)
   */
  static generateSimpleIR(
    sampleRate: number,
    roomSize: number,
    decay: number,
    preDelay: number
  ): Float32Array {
    const irLength = Math.floor(decay * sampleRate);
    const ir = new Float32Array(irLength);
    const preDelaySamples = Math.floor(preDelay * sampleRate);

    for (let i = preDelaySamples; i < irLength; i += 1) {
      const t = (i - preDelaySamples) / sampleRate;
      const decayCurve = Math.exp(-t / decay);
      const random = Math.random() * 2 - 1;
      ir[i] = random * decayCurve * roomSize;
    }

    return ir;
  }
}

