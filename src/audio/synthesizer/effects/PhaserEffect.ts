/**
 * PhaserEffect - Phaser effect
 * Creates sweeping phase shifts
 * @module audio/synthesizer/effects/PhaserEffect
 */

import { EffectModule } from './EffectModule';
import type { PhaserEffectParams, EffectType } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Phaser effect implementation
 */
export class PhaserEffect extends EffectModule {
  private params: PhaserEffectParams;
  private filters: BiquadFilterNode[] = [];
  private lfo!: OscillatorNode;
  private lfoGain!: GainNode;
  private feedbackGain!: GainNode;
  private wetGain!: GainNode;
  private dryGain!: GainNode;
  private outputGain!: GainNode;

  /**
   * Create a new phaser effect
   */
  constructor(audioContext: AudioContext, params: PhaserEffectParams) {
    super(audioContext);
    this.params = { ...params };
    this.initializeNodes();
  }

  /**
   * Initialize audio nodes
   */
  private initializeNodes(): void {
    const stages = Math.max(2, Math.min(12, this.params.stages));
    this.filters = [];

    for (let i = 0; i < stages; i += 1) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.value = 350;
      filter.Q.value = 10;
      this.filters.push(filter);
    }

    this.lfo = this.audioContext.createOscillator();
    this.lfoGain = this.audioContext.createGain();
    this.feedbackGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();

    this.updateParams();
    this.connectNodes();
    this.startLFO();
  }

  /**
   * Connect audio nodes
   */
  private connectNodes(): void {
    this.inputNode = this.dryGain;

    // LFO modulates all filters
    this.lfo.connect(this.lfoGain);
    this.filters.forEach((filter) => {
      this.lfoGain.connect(filter.frequency);
    });

    // Input -> filter chain
    let currentNode: AudioNode = this.dryGain;
    this.filters.forEach((filter) => {
      currentNode.connect(filter);
      currentNode = filter;
    });

    // Feedback loop
    currentNode.connect(this.feedbackGain);
    const firstFilter = this.filters[0];
    if (!firstFilter) {
      throw new Error('PhaserEffect: First filter is required');
    }
    this.feedbackGain.connect(firstFilter);

    // Wet path
    currentNode.connect(this.wetGain);

    // Dry and wet -> output
    this.dryGain.connect(this.outputGain);
    this.wetGain.connect(this.outputGain);

    this.outputNode = this.outputGain;
  }

  /**
   * Start LFO
   */
  private startLFO(): void {
    const now = this.audioContext.currentTime;
    this.lfo.start(now);
  }

  /**
   * Update effect parameters
   */
  updateParams(params?: Partial<PhaserEffectParams>): void {
    if (params) {
      this.params = { ...this.params, ...params };
    }

    const now = this.audioContext.currentTime;
    const baseFreq = 350;
    const depth = this.params.depth * 300;

    // Set LFO
    this.lfo.frequency.setValueAtTime(this.params.rate, now);
    this.lfoGain.gain.setValueAtTime(depth, now);

    // Update filter frequencies
    this.filters.forEach((filter, index) => {
      const offset = (index / this.filters.length) * depth;
      filter.frequency.setValueAtTime(baseFreq + offset, now);
    });

    // Set feedback
    this.feedbackGain.gain.setValueAtTime(this.params.feedback, now);

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
    return 'phaser';
  }

  /**
   * Dispose of effect resources
   */
  override dispose(): void {
    try {
      this.lfo.stop();
    } catch (error) {
      logger.error('PhaserEffect: Error stopping LFO', { error });
    }
    super.dispose();
  }
}

