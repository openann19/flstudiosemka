/**
 * AnalogChorus - BBD-based analog chorus/flanger
 * Analog-modeled chorus using bucket brigade device
 * @module audio/synthesizer/effects/AnalogChorus
 */

import { EffectModule } from './EffectModule';
import type { ChorusEffectParams, EffectType } from '../../../types/synthesizer.types';

/**
 * Analog chorus parameters
 */
export interface AnalogChorusParams extends ChorusEffectParams {
  bbdStages: number; // Number of BBD stages
  noiseLevel: number; // Noise level (0 to 1)
}

/**
 * Analog chorus implementation
 */
export class AnalogChorus extends EffectModule {
  private params: AnalogChorusParams;
  private lfo!: OscillatorNode;
  private lfoGain!: GainNode;
  private delay!: DelayNode;
  private feedback!: GainNode;
  private wetGain!: GainNode;
  private dryGain!: GainNode;
  private outputGain!: GainNode;
  private noiseGain!: GainNode;

  /**
   * Create a new analog chorus
   */
  constructor(audioContext: AudioContext, params: AnalogChorusParams) {
    super(audioContext);
    this.params = {
      ...params,
      bbdStages: params.bbdStages ?? 256,
      noiseLevel: params.noiseLevel ?? 0.01,
    };
    this.initializeNodes();
  }

  /**
   * Initialize audio nodes
   */
  private initializeNodes(): void {
    const maxDelay = 0.05;
    this.delay = this.audioContext.createDelay(maxDelay);
    this.lfo = this.audioContext.createOscillator();
    this.lfoGain = this.audioContext.createGain();
    this.feedback = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.noiseGain = this.audioContext.createGain();

    // Setup LFO
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.params.rate;
    this.lfoGain.gain.value = this.params.depth * maxDelay * 0.5;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delay.delayTime);

    // Setup noise (BBD characteristic)
    this.setupNoise();

    this.applyParams();
    this.connectNodes();
  }

  /**
   * Setup noise source
   */
  private setupNoise(): void {
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      channelData[i] = Math.random() * 2 - 1;
    }

    this.noiseGain.gain.value = this.params.noiseLevel * 0.1;
  }

  /**
   * Connect audio nodes
   */
  private connectNodes(): void {
    // Input -> delay -> feedback -> delay (feedback loop)
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);

    // Delay -> wet gain
    this.delay.connect(this.wetGain);

    // Input -> dry gain
    // Both -> output
    this.wetGain.connect(this.outputGain);
    this.dryGain.connect(this.outputGain);
  }

  /**
   * Apply parameters to audio nodes
   */
  private applyParams(): void {
    const now = this.audioContext.currentTime;
    this.lfo.frequency.setValueAtTime(this.params.rate, now);
    this.lfoGain.gain.setValueAtTime(
      this.params.depth * 0.025,
      now
    ); // Max 25ms modulation
    this.delay.delayTime.setValueAtTime(this.params.delay, now);
    this.feedback.gain.setValueAtTime(this.params.feedback, now);
    this.wetGain.gain.setValueAtTime(this.params.wet, now);
    this.dryGain.gain.setValueAtTime(this.params.dry, now);
    this.noiseGain.gain.setValueAtTime(this.params.noiseLevel * 0.1, now);
  }

  /**
   * Get input node
   */
  getInputNode(): AudioNode {
    return this.delay;
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
    return 'chorus';
  }

  /**
   * Start effect
   */
  start(): void {
    this.lfo.start();
  }

  /**
   * Stop effect
   */
  stop(): void {
    this.lfo.stop();
  }

  /**
   * Update parameters
   */
  updateParams(params: Partial<AnalogChorusParams>): void {
    this.params = { ...this.params, ...params };
    this.applyParams();
  }
}

