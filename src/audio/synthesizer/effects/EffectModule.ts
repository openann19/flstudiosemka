/**
 * EffectModule - Base effect module
 * Provides common interface for all effects
 * @module audio/synthesizer/effects/EffectModule
 */

import type { EffectType } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Base effect module interface
 */
export interface IEffectModule {
  getInputNode(): AudioNode;
  getOutputNode(): AudioNode;
  getEffectType(): EffectType;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

/**
 * Base effect module class
 */
export abstract class EffectModule implements IEffectModule {
  protected audioContext: AudioContext;
  protected enabled: boolean = false;
  protected inputNode: AudioNode | null = null;
  protected outputNode: AudioNode | null = null;

  /**
   * Create a new effect module
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('EffectModule: Invalid AudioContext');
    }
    this.audioContext = audioContext;
  }

  /**
   * Get input node for audio routing
   */
  abstract getInputNode(): AudioNode;

  /**
   * Get output node for audio routing
   */
  abstract getOutputNode(): AudioNode;

  /**
   * Get effect type
   */
  abstract getEffectType(): EffectType;

  /**
   * Check if effect is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Dispose of effect resources
   */
  dispose(): void {
    try {
      if (this.inputNode) {
        this.inputNode.disconnect();
      }
      if (this.outputNode && this.outputNode !== this.inputNode) {
        this.outputNode.disconnect();
      }
    } catch (error) {
      logger.error('EffectModule: Error disposing effect', { error });
    }
  }
}

