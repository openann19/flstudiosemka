/**
 * DelayEffect - Stereo delay effect
 * Supports ping-pong delay and tempo sync
 * @module audio/synthesizer/effects/DelayEffect
 */

import { EffectModule } from './EffectModule';
import type { DelayEffectParams, TempoSync, EffectType } from '../../../types/synthesizer.types';

/**
 * Convert tempo sync division to seconds at given BPM
 */
function tempoSyncToSeconds(division: TempoSync, bpm: number): number {
  const divisions: Record<TempoSync, number> = {
    '1/1': 1,
    '1/2': 2,
    '1/4': 4,
    '1/8': 8,
    '1/16': 16,
    '1/32': 32,
    '1/64': 64,
    '2/1': 0.5,
    '4/1': 0.25,
  };
  return (60 / bpm) * (divisions[division] ?? 1);
}

/**
 * Stereo delay effect implementation
 */
export class DelayEffect extends EffectModule {
  private params: DelayEffectParams;
  private delayLeft!: DelayNode;
  private delayRight!: DelayNode;
  private feedbackLeft!: GainNode;
  private feedbackRight!: GainNode;
  private wetGainLeft!: GainNode;
  private wetGainRight!: GainNode;
  private dryGain!: GainNode;
  private outputGain!: GainNode;
  private splitter!: ChannelSplitterNode;
  private merger!: ChannelMergerNode;
  private currentBPM: number = 120;

  /**
   * Create a new delay effect
   */
  constructor(audioContext: AudioContext, params: DelayEffectParams) {
    super(audioContext);
    this.params = { ...params };
    this.initializeNodes();
  }

  /**
   * Initialize audio nodes
   */
  private initializeNodes(): void {
    const maxDelay = 2.0;
    this.delayLeft = this.audioContext.createDelay(maxDelay);
    this.delayRight = this.audioContext.createDelay(maxDelay);
    this.feedbackLeft = this.audioContext.createGain();
    this.feedbackRight = this.audioContext.createGain();
    this.wetGainLeft = this.audioContext.createGain();
    this.wetGainRight = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.splitter = this.audioContext.createChannelSplitter(2);
    this.merger = this.audioContext.createChannelMerger(2);

    this.updateParams();
    this.connectNodes();
  }

  /**
   * Connect audio nodes
   */
  private connectNodes(): void {
    // Input -> splitter
    this.inputNode = this.splitter;

    // Splitter -> dry gain
    this.splitter.connect(this.dryGain, 0);
    this.splitter.connect(this.dryGain, 1);

    // Splitter -> delays
    this.splitter.connect(this.delayLeft, 0);
    this.splitter.connect(this.delayRight, 1);

    // Delay feedback loops
    this.delayLeft.connect(this.feedbackLeft);
    this.feedbackLeft.connect(this.delayLeft);
    this.delayRight.connect(this.feedbackRight);
    this.feedbackRight.connect(this.delayRight);

    // Ping-pong routing
    if (this.params.pingPong) {
      this.delayLeft.connect(this.wetGainRight);
      this.delayRight.connect(this.wetGainLeft);
    } else {
      this.delayLeft.connect(this.wetGainLeft);
      this.delayRight.connect(this.wetGainRight);
    }

    // Wet gains -> merger
    this.wetGainLeft.connect(this.merger, 0, 0);
    this.wetGainRight.connect(this.merger, 0, 1);

    // Dry and wet -> output
    this.dryGain.connect(this.outputGain);
    this.merger.connect(this.outputGain);

    this.outputNode = this.outputGain;
  }

  /**
   * Update effect parameters
   */
  updateParams(params?: Partial<DelayEffectParams>): void {
    if (params) {
      this.params = { ...this.params, ...params };
    }

    const now = this.audioContext.currentTime;

    // Calculate delay time
    let delayTime: number;
    if (this.params.tempoSync) {
      delayTime = tempoSyncToSeconds(this.params.syncDivision, this.currentBPM);
    } else {
      delayTime = Math.max(0, Math.min(2, this.params.time));
    }

    this.delayLeft.delayTime.setValueAtTime(delayTime, now);
    this.delayRight.delayTime.setValueAtTime(delayTime, now);

    // Set feedback
    this.feedbackLeft.gain.setValueAtTime(this.params.feedback, now);
    this.feedbackRight.gain.setValueAtTime(this.params.feedback, now);

    // Set wet/dry mix
    this.wetGainLeft.gain.setValueAtTime(this.params.wet * this.params.stereoWidth, now);
    this.wetGainRight.gain.setValueAtTime(this.params.wet * this.params.stereoWidth, now);
    this.dryGain.gain.setValueAtTime(this.params.dry, now);

    this.enabled = this.params.enabled;
  }

  /**
   * Set BPM for tempo sync
   */
  setBPM(bpm: number): void {
    this.currentBPM = Math.max(1, Math.min(300, bpm));
    if (this.params.tempoSync) {
      this.updateParams();
    }
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
    return 'delay';
  }
}

