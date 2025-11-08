/**
 * EffectsChain - Effects chain manager
 * Manages multiple effects in series or parallel
 * @module audio/synthesizer/effects/EffectsChain
 */

import type { EffectModule } from './EffectModule';

/**
 * Effects chain configuration
 */
export interface EffectsChainConfig {
  effects: EffectModule[];
  order: number[]; // Effect order indices
  parallel: boolean; // Whether effects are in parallel
}

/**
 * Effects chain manager
 */
export class EffectsChain {
  private audioContext: AudioContext;
  private config: EffectsChainConfig;
  private inputGain: GainNode;
  private outputGain: GainNode;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;

  /**
   * Create a new effects chain
   */
  constructor(audioContext: AudioContext, config: Partial<EffectsChainConfig>) {
    this.audioContext = audioContext;
    this.config = {
      effects: [],
      order: [],
      parallel: false,
      ...config,
    };
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.reconnect();
  }

  /**
   * Add effect to chain
   */
  addEffect(effect: EffectModule, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.config.effects.length) {
      this.config.effects.splice(index, 0, effect);
      this.config.order.splice(index, 0, this.config.order.length);
    } else {
      this.config.effects.push(effect);
      this.config.order.push(this.config.order.length);
    }
    this.reconnect();
  }

  /**
   * Remove effect from chain
   */
  removeEffect(index: number): void {
    if (index >= 0 && index < this.config.effects.length) {
      const effect = this.config.effects[index];
      if (effect) {
        effect.dispose();
      }
      this.config.effects.splice(index, 1);
      this.config.order = this.config.order
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
      this.reconnect();
    }
  }

  /**
   * Reorder effects
   */
  reorderEffects(newOrder: number[]): void {
    if (newOrder.length !== this.config.effects.length) {
      return;
    }

    // Validate order
    const sorted = [...newOrder].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i += 1) {
      if (sorted[i] !== i) {
        return; // Invalid order
      }
    }

    this.config.order = newOrder;
    this.reconnect();
  }

  /**
   * Reconnect effects
   */
  private reconnect(): void {
    // Disconnect all
    this.inputGain.disconnect();
    if (this.splitter) {
      this.splitter.disconnect();
    }
    if (this.merger) {
      this.merger.disconnect();
    }

    this.config.effects.forEach((effect) => {
      effect.getInputNode().disconnect();
      effect.getOutputNode().disconnect();
    });

    if (this.config.parallel) {
      // Parallel routing
      this.splitter = this.audioContext.createChannelSplitter(this.config.effects.length);
      this.merger = this.audioContext.createChannelMerger(this.config.effects.length);

      this.inputGain.connect(this.splitter);

      this.config.effects.forEach((effect, i) => {
        const splitterOutput = this.audioContext.createGain();
        this.splitter?.connect(splitterOutput, i);
        splitterOutput.connect(effect.getInputNode());
        const mergerNode = this.merger;
        if (mergerNode) {
          effect.getOutputNode().connect(mergerNode, 0, i);
        }
      });

      this.merger.connect(this.outputGain);
    } else {
      // Series routing
      let currentNode: AudioNode = this.inputGain;

      const orderedEffects = this.config.order.map((i) => this.config.effects[i]).filter(Boolean);

      orderedEffects.forEach((effect) => {
        if (!effect) {
          return;
        }
        currentNode.connect(effect.getInputNode());
        currentNode = effect.getOutputNode();
      });

      currentNode.connect(this.outputGain);
    }
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
   * Set parallel mode
   */
  setParallel(parallel: boolean): void {
    this.config.parallel = parallel;
    this.reconnect();
  }

  /**
   * Get effects
   */
  getEffects(): EffectModule[] {
    return [...this.config.effects];
  }

  /**
   * Get effect by index
   */
  getEffect(index: number): EffectModule | undefined {
    return this.config.effects[index];
  }

  /**
   * Dispose of all effects
   */
  dispose(): void {
    this.config.effects.forEach((effect) => {
      effect.dispose();
    });
    this.config.effects = [];
    this.config.order = [];
  }
}

