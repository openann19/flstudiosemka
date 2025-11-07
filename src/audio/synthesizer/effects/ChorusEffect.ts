/**
 * ChorusEffect - Chorus/flanger effect
 * Creates stereo width and movement
 * @module audio/synthesizer/effects/ChorusEffect
 */

import { EffectModule } from './EffectModule';
import type { ChorusEffectParams, EffectType } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Chorus/flanger effect implementation
 */
export class ChorusEffect extends EffectModule {
  private params: ChorusEffectParams;
  private delayLeft!: DelayNode;
  private delayRight!: DelayNode;
  private lfoLeft!: OscillatorNode;
  private lfoRight!: OscillatorNode;
  private lfoGainLeft!: GainNode;
  private lfoGainRight!: GainNode;
  private feedbackLeft!: GainNode;
  private feedbackRight!: GainNode;
  private wetGain!: GainNode;
  private dryGain!: GainNode;
  private outputGain!: GainNode;
  private splitter!: ChannelSplitterNode;
  private merger!: ChannelMergerNode;

  /**
   * Create a new chorus effect
   */
  constructor(audioContext: AudioContext, params: ChorusEffectParams) {
    super(audioContext);
    this.params = { ...params };
    this.initializeNodes();
  }

  /**
   * Initialize audio nodes
   */
  private initializeNodes(): void {
    const maxDelay = 0.05;
    this.delayLeft = this.audioContext.createDelay(maxDelay);
    this.delayRight = this.audioContext.createDelay(maxDelay);
    this.lfoLeft = this.audioContext.createOscillator();
    this.lfoRight = this.audioContext.createOscillator();
    this.lfoGainLeft = this.audioContext.createGain();
    this.lfoGainRight = this.audioContext.createGain();
    this.feedbackLeft = this.audioContext.createGain();
    this.feedbackRight = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.splitter = this.audioContext.createChannelSplitter(2);
    this.merger = this.audioContext.createChannelMerger(2);

    this.updateParams();
    this.connectNodes();
    this.startLFOs();
  }

  /**
   * Connect audio nodes
   */
  private connectNodes(): void {
    this.inputNode = this.splitter;

    // LFOs modulate delay times
    this.lfoLeft.connect(this.lfoGainLeft);
    this.lfoGainLeft.connect(this.delayLeft.delayTime);
    this.lfoRight.connect(this.lfoGainRight);
    this.lfoGainRight.connect(this.delayRight.delayTime);

    // Input -> delays
    this.splitter.connect(this.delayLeft, 0);
    this.splitter.connect(this.delayRight, 1);

    // Feedback loops
    this.delayLeft.connect(this.feedbackLeft);
    this.feedbackLeft.connect(this.delayLeft);
    this.delayRight.connect(this.feedbackRight);
    this.feedbackRight.connect(this.delayRight);

    // Delays -> wet gain
    this.delayLeft.connect(this.wetGain);
    this.delayRight.connect(this.wetGain);

    // Input -> dry gain
    this.splitter.connect(this.dryGain, 0);
    this.splitter.connect(this.dryGain, 1);

    // Wet and dry -> merger
    this.wetGain.connect(this.merger, 0, 0);
    this.wetGain.connect(this.merger, 0, 1);
    this.dryGain.connect(this.merger, 0, 0);
    this.dryGain.connect(this.merger, 0, 1);

    // Merger -> output
    this.merger.connect(this.outputGain);

    this.outputNode = this.outputGain;
  }

  /**
   * Start LFOs
   */
  private startLFOs(): void {
    const now = this.audioContext.currentTime;
    this.lfoLeft.start(now);
    this.lfoRight.start(now);
  }

  /**
   * Update effect parameters
   */
  updateParams(params?: Partial<ChorusEffectParams>): void {
    if (params) {
      this.params = { ...this.params, ...params };
    }

    const now = this.audioContext.currentTime;
    const baseDelay = this.params.delay;

    // Set LFO rates (slightly offset for stereo width)
    this.lfoLeft.frequency.setValueAtTime(this.params.rate, now);
    this.lfoRight.frequency.setValueAtTime(this.params.rate * 1.1, now);

    // Set LFO depth
    this.lfoGainLeft.gain.setValueAtTime(this.params.depth * baseDelay, now);
    this.lfoGainRight.gain.setValueAtTime(this.params.depth * baseDelay, now);

    // Set base delay times
    this.delayLeft.delayTime.setValueAtTime(baseDelay, now);
    this.delayRight.delayTime.setValueAtTime(baseDelay, now);

    // Set feedback
    this.feedbackLeft.gain.setValueAtTime(this.params.feedback, now);
    this.feedbackRight.gain.setValueAtTime(this.params.feedback, now);

    // Set wet/dry mix
    this.wetGain.gain.setValueAtTime(this.params.wet * this.params.stereoWidth, now);
    this.dryGain.gain.setValueAtTime(this.params.dry, now);

    this.enabled = this.params.enabled;
  }

  /**
   * Get input node
   */
  getInputNode(): AudioNode {
    return this.splitter;
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
   * Dispose of effect resources
   */
  override dispose(): void {
    try {
      this.lfoLeft.stop();
      this.lfoRight.stop();
    } catch (error) {
      logger.error('ChorusEffect: Error stopping LFOs', { error });
    }
    super.dispose();
  }
}

