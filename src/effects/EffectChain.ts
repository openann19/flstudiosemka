/**
 * EffectChain - Per-track effect chain with up to 8 effect slots
 * Manages effect routing and processing order
 * @module effects/EffectChain
 */

import {
  AudioContextError,
  InvalidParameterError,
} from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Effect interface - effects must implement this
 */
export interface Effect {
  inputNode: AudioNode;
  outputNode: AudioNode;
  cleanup?: () => void;
}

/**
 * Effect slot in the chain
 */
interface EffectSlot {
  effect: Effect;
  enabled: boolean;
  position: number;
}

/**
 * Per-track effect chain with up to 8 effect slots
 */
export class EffectChain {
  private effects: EffectSlot[];

  private inputNode: GainNode;

  private outputNode: GainNode;

  private bypass: boolean;

  /**
   * Create a new EffectChain instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.effects = [];
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    this.bypass = false;
    this._buildChain();
  }

  /**
   * Build the effect chain
   * @private
   */
  private _buildChain(): void {
    // Start with input
    let currentNode: AudioNode = this.inputNode;

    // Effects will be inserted between input and output
    // For now, just connect input to output
    currentNode.connect(this.outputNode);
  }

  /**
   * Add an effect to the chain
   * @param effect - Effect instance with input/output nodes
   * @param position - Position in chain 0-7 (default: -1 for end)
   * @returns True if successful, false if maximum effects reached
   * @throws InvalidParameterError if effect is invalid
   */
  addEffect(effect: Effect, position: number = -1): boolean {
      if (!effect || !effect.inputNode || !effect.outputNode) {
        throw new InvalidParameterError('effect', effect, 'Effect with inputNode and outputNode');
      }

      if (this.effects.length >= 10) {
        return false;
      }

      if (position === -1) {
        position = this.effects.length;
      }

      // Validate position is within valid range (0-9)
      if (position < 0 || position > 9) {
        throw new InvalidParameterError(
          'position',
          position,
          'number between 0 and 9',
          { min: 0, max: 9 }
        );
      }

      // Clamp position to current effects length if needed
      position = Math.max(0, Math.min(position, this.effects.length));

      // Disconnect current chain
      this._disconnectChain();

      // Insert effect
      this.effects.splice(position, 0, {
        effect,
        enabled: true,
        position,
      });

      // Rebuild chain
      this._rebuildChain();

      return true;

  }

  /**
   * Remove an effect from the chain
   * @param position - Position in chain
   * @returns True if successful, false if position invalid
   */
  removeEffect(position: number): boolean {
    if (position < 0 || position >= this.effects.length) {
      return false;
    }

    // Disconnect current chain
    this._disconnectChain();

    // Remove effect
    const removed = this.effects.splice(position, 1)[0];
    if (removed && removed.effect.cleanup) {
      try {
        removed.effect.cleanup();
      } catch {
        logger.error('EffectChain: Error during effect cleanup', error);
      }
    }

    // Rebuild chain
    this._rebuildChain();

    return true;
  }

  /**
   * Enable/disable an effect
   * @param position - Position in chain
   * @param enabled - Whether to enable
   */
  setEffectEnabled(position: number, enabled: boolean): void {
    if (position < 0 || position >= this.effects.length) {
      return;
    }

    const effectSlot = this.effects[position];
    if (effectSlot !== undefined) {
      effectSlot.enabled = enabled;
    }
    this._rebuildChain();
  }

  /**
   * Rebuild the effect chain
   * @private
   */
  private _rebuildChain(): void {
    this._disconnectChain();

    if (this.bypass) {
      this.inputNode.connect(this.outputNode);
      return;
    }

    let currentNode: AudioNode = this.inputNode;

    for (let i = 0; i < this.effects.length; i += 1) {
      const effectSlot = this.effects[i];
      if (!effectSlot) {
        continue;
      }

      if (effectSlot.enabled && effectSlot.effect) {
        const effect = effectSlot.effect;

        // Connect to effect input
        currentNode.connect(effect.inputNode);

        // Update current node to effect output
        currentNode = effect.outputNode;
      }
    }

    // Connect to output
    currentNode.connect(this.outputNode);
  }

  /**
   * Disconnect current chain
   * @private
   */
  private _disconnectChain(): void {
    // Disconnect input
    try {
      this.inputNode.disconnect();
    } catch {
      // Already disconnected - ignore
      logger.debug('EffectChain: Input already disconnected');
    }

    // Disconnect all effects
    for (const slot of this.effects) {
      if (slot.effect) {
        const effect = slot.effect;
        try {
          if (effect.inputNode) effect.inputNode.disconnect();
        } catch {
          // Already disconnected - ignore
        }
        try {
          if (effect.outputNode) effect.outputNode.disconnect();
        } catch {
          // Already disconnected - ignore
        }
      }
    }
  }

  /**
   * Set bypass state
   * @param bypass - Whether to bypass
   */
  setBypass(bypass: boolean): void {
    this.bypass = bypass;
    // Bypass is handled by rebuilding chain with effects disabled
    if (bypass) {
      this._disconnectChain();
      this.inputNode.connect(this.outputNode);
    } else {
      this._rebuildChain();
    }
  }

  /**
   * Get effect at position
   * @param position - Position in chain
   * @returns Effect slot or undefined if position invalid
   */
  getEffect(position: number): EffectSlot | undefined {
    return this.effects[position];
  }

  /**
   * Get all effects
   * @returns Array of effect slots
   */
  getAllEffects(): EffectSlot[] {
    return [...this.effects];
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this._disconnectChain();

    for (const slot of this.effects) {
      if (slot.effect && slot.effect.cleanup) {
        try {
          slot.effect.cleanup();
        } catch {
          logger.error('EffectChain: Error during effect cleanup', error);
        }
      }
    }

    this.effects = [];
    this._rebuildChain();
  }

  /**
   * Get input node
   * @returns Input GainNode
   */
  getInput(): GainNode {
    return this.inputNode;
  }

  /**
   * Get output node
   * @returns Output GainNode
   */
  getOutput(): GainNode {
    return this.outputNode;
  }

  /**
   * Get the number of effects in the chain
   * @returns Number of effects
   */
  getEffectCount(): number {
    return this.effects.length;
  }

  /**
   * Check if the chain is bypassed
   * @returns True if bypassed
   */
  isBypassed(): boolean {
    return this.bypass;
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as Window & { EffectChain: typeof EffectChain }).EffectChain = EffectChain;
}

