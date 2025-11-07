/**
 * ReverbEffect - Convolution reverb effect
 * Creates spatial depth with impulse response
 * @module audio/synthesizer/effects/ReverbEffect
 */

import { EffectModule } from './EffectModule';
import type { ReverbEffectParams, EffectType } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Convolution reverb effect implementation
 */
export class ReverbEffect extends EffectModule {
  private params: ReverbEffectParams;
  private convolver!: ConvolverNode;
  private wetGain!: GainNode;
  private dryGain!: GainNode;
  private outputGain!: GainNode;

  /**
   * Create a new reverb effect
   */
  constructor(audioContext: AudioContext, params: ReverbEffectParams) {
    super(audioContext);
    this.params = { ...params };
    this.initializeNodes();
  }

  /**
   * Initialize audio nodes
   */
  private initializeNodes(): void {
    this.convolver = this.audioContext.createConvolver();
    this.wetGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();

    this.generateImpulseResponse();
    this.connectNodes();
  }

  /**
   * Generate impulse response
   */
  private generateImpulseResponse(): void {
    const length = this.audioContext.sampleRate * this.params.decay;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel += 1) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const n = length - i;
        const decay = Math.pow(n / length, 2);
        const damping = Math.pow(1 - i / length, this.params.damping * 10);
        channelData[i] = (Math.random() * 2 - 1) * decay * damping;
      }
    }

    try {
      this.convolver.buffer = impulse;
      this.convolver.normalize = true;
    } catch (error) {
      logger.error('ReverbEffect: Error setting impulse response', { error });
    }
  }

  /**
   * Connect audio nodes
   */
  private connectNodes(): void {
    this.inputNode = this.dryGain;

    // Input -> dry and wet paths
    this.dryGain.connect(this.outputGain);
    this.dryGain.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);

    this.outputNode = this.outputGain;
  }

  /**
   * Update effect parameters
   */
  updateParams(params?: Partial<ReverbEffectParams>): void {
    if (params) {
      this.params = { ...this.params, ...params };
    }

    const now = this.audioContext.currentTime;

    this.wetGain.gain.setValueAtTime(this.params.wet, now);
    this.dryGain.gain.setValueAtTime(this.params.dry, now);

    // Regenerate impulse if decay changed
    if (params?.decay !== undefined) {
      this.generateImpulseResponse();
    }

    this.enabled = this.params.enabled;
  }

  /**
   * Get input node
   */
  getInputNode(): AudioNode {
    return this.dryGain;
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
    return 'reverb';
  }
}

