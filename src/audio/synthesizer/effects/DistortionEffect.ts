/**
 * DistortionEffect - Distortion/saturation effect
 * Multiple algorithms for different character
 * @module audio/synthesizer/effects/DistortionEffect
 */

import { EffectModule } from './EffectModule';
import type { DistortionEffectParams, EffectType } from '../../../types/synthesizer.types';

/**
 * Distortion effect implementation
 */
export class DistortionEffect extends EffectModule {
  private params: DistortionEffectParams;
  private waveShaper!: WaveShaperNode;
  private toneFilter!: BiquadFilterNode;
  private wetGain!: GainNode;
  private dryGain!: GainNode;
  private outputGain!: GainNode;

  /**
   * Create a new distortion effect
   */
  constructor(audioContext: AudioContext, params: DistortionEffectParams) {
    super(audioContext);
    this.params = { ...params };
    this.initializeNodes();
  }

  /**
   * Initialize audio nodes
   */
  private initializeNodes(): void {
    this.waveShaper = this.audioContext.createWaveShaper();
    this.toneFilter = this.audioContext.createBiquadFilter();
    this.wetGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();

    this.updateParams();
    this.connectNodes();
  }

  /**
   * Generate distortion curve based on algorithm
   */
  private generateDistortionCurve(): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const drive = this.params.drive;
    const amount = this.params.amount;

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2) / samples - 1;
      let y: number;

      switch (this.params.algorithm) {
        case 'soft':
          y = Math.tanh(x * (1 + drive * 10)) * (1 + amount);
          break;

        case 'hard':
          y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * (1 + drive * 20))) * (1 + amount);
          break;

        case 'tube':
          y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * (1 + drive * 15))) * (1 + amount * 0.5);
          break;

        case 'tape':
          y = Math.tanh(x * (1 + drive * 8)) * (1 + amount * 0.7);
          break;

        default:
          y = Math.tanh(x * (1 + drive * 10)) * (1 + amount);
      }

      curve[i] = Math.max(-1, Math.min(1, y));
    }

    return curve;
  }

  /**
   * Connect audio nodes
   */
  private connectNodes(): void {
    this.inputNode = this.dryGain;

    // Input -> dry and wet paths
    this.dryGain.connect(this.outputGain);
    this.dryGain.connect(this.waveShaper);
    this.waveShaper.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);

    this.outputNode = this.outputGain;
  }

  /**
   * Update effect parameters
   */
  updateParams(params?: Partial<DistortionEffectParams>): void {
    if (params) {
      this.params = { ...this.params, ...params };
    }

    const now = this.audioContext.currentTime;

    // Update distortion curve
    const curve = this.generateDistortionCurve();
    const buffer = curve.buffer instanceof ArrayBuffer ? curve.buffer : new ArrayBuffer(curve.buffer.byteLength);
    this.waveShaper.curve = new Float32Array(buffer, curve.byteOffset, curve.length);
    this.waveShaper.oversample = '4x';

    // Update tone filter (lowpass)
    const cutoff = 20000 * (1 - this.params.tone);
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.setValueAtTime(Math.max(20, Math.min(20000, cutoff)), now);
    this.toneFilter.Q.setValueAtTime(1, now);

    // Set wet/dry mix
    this.wetGain.gain.setValueAtTime(this.params.wet, now);
    this.dryGain.gain.setValueAtTime(this.params.dry, now);

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
    return 'distortion';
  }
}

