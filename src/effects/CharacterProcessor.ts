/**
 * CharacterProcessor - Analog-style saturation modes
 * Implements PRO Q 4 character modes: Subtle, Warm, Clean
 * @module effects/CharacterProcessor
 */

import {
  AudioContextError,
  InvalidParameterError,
} from '../utils/errors';

/**
 * Character mode enumeration
 */
export enum CharacterMode {
  Clean = 'clean',
  Subtle = 'subtle',
  Warm = 'warm',
}

/**
 * Character processor configuration
 */
export interface CharacterConfig {
  mode: CharacterMode;
  amount: number; // 0.0 to 1.0
}

/**
 * Analog-style saturation processor
 */
export class CharacterProcessor {
  private waveshaper: WaveShaperNode;

  private dryGain: GainNode;

  private wetGain: GainNode;

  private outputGain: GainNode;

  private config: CharacterConfig;

  public readonly inputNode: GainNode;

  public readonly outputNode: GainNode;

  /**
   * Create a new character processor
   * @param audioContext - Web Audio API AudioContext
   * @param config - Character configuration
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext, config: CharacterConfig = { mode: CharacterMode.Clean, amount: 0 }) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.config = { ...config };

    // Create waveshaper for saturation
    this.waveshaper = audioContext.createWaveShaper();
    this.updateCurve();

    // Create dry/wet mix
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();

    // Input/output nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = this.outputGain;

    // Connect: input -> [dry -> output, waveshaper -> wet -> output]
    this.inputNode.connect(this.dryGain);
    this.inputNode.connect(this.waveshaper);
    this.waveshaper.connect(this.wetGain);
    this.dryGain.connect(this.outputGain);
    this.wetGain.connect(this.outputGain);

    // Apply initial settings
    this.updateMix();
  }

  /**
   * Generate waveshaper curve based on character mode
   * @param mode - Character mode
   * @param amount - Saturation amount (0.0-1.0)
   * @returns Float32Array curve
   */
  private generateCurve(mode: CharacterMode, amount: number): Float32Array {
    const curveLength = 4096;
    const curve = new Float32Array(curveLength);

    for (let i = 0; i < curveLength; i += 1) {
      const x = (i * 2) / curveLength - 1; // Normalize to -1 to 1

      let y: number;

      switch (mode) {
        case CharacterMode.Clean:
          // Linear (no saturation)
          y = x;
          break;

        case CharacterMode.Subtle:
          // Gentle transformer-style saturation
          // Soft clipping with gentle curve
          y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * (1 + amount * 2)));
          break;

        case CharacterMode.Warm: {
          // Tube-style saturation
          // More pronounced soft clipping
          const drive = 1 + amount * 3;
          const absX = Math.abs(x);
          if (absX < 1 / drive) {
            y = x * drive;
          } else {
            y = Math.sign(x) * (1 - Math.exp(-absX * drive));
          }
          break;
        }

        default:
          y = x;
      }

      // Apply amount (blend between clean and saturated)
      y = x * (1 - amount) + y * amount;

      // Clamp to prevent overs
      curve[i] = Math.max(-1, Math.min(1, y));
    }

    return curve;
  }

  /**
   * Update waveshaper curve based on current config
   */
  private updateCurve(): void {
    const curve = this.generateCurve(this.config.mode, this.config.amount);
    // Create a new Float32Array from the curve to ensure proper type compatibility
    const curveArray = new Float32Array(curve.length);
    curveArray.set(curve);
    this.waveshaper.curve = curveArray;
    this.waveshaper.oversample = '4x'; // High quality oversampling
  }

  /**
   * Update dry/wet mix
   */
  private updateMix(): void {
    // When amount is 0, use only dry signal
    // When amount is 1, use only wet signal
    const dryAmount = 1 - this.config.amount;
    const wetAmount = this.config.amount;

    this.dryGain.gain.value = dryAmount;
    this.wetGain.gain.value = wetAmount;
  }

  /**
   * Get current configuration
   * @returns Current character configuration
   */
  getConfig(): CharacterConfig {
    return { ...this.config };
  }

  /**
   * Set character mode
   * @param mode - Character mode
   * @throws InvalidParameterError if mode is invalid
   */
  setMode(mode: CharacterMode): void {
    if (!Object.values(CharacterMode).includes(mode)) {
      throw new InvalidParameterError(
        'mode',
        mode,
        `one of: ${Object.values(CharacterMode).join(', ')}`
      );
    }
    this.config.mode = mode;
    this.updateCurve();
  }

  /**
   * Set saturation amount
   * @param amount - Amount (0.0-1.0)
   * @throws InvalidParameterError if amount is invalid
   */
  setAmount(amount: number): void {
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      throw new InvalidParameterError('amount', amount, 'number');
    }
    if (amount < 0 || amount > 1) {
      throw new InvalidParameterError(
        'amount',
        amount,
        'number between 0 and 1',
        { min: 0, max: 1 }
      );
    }
    this.config.amount = amount;
    this.updateCurve();
    this.updateMix();
  }

  /**
   * Update configuration
   * @param updates - Partial configuration updates
   */
  updateConfig(updates: Partial<CharacterConfig>): void {
    if (updates.mode !== undefined) {
      this.setMode(updates.mode);
    }
    if (updates.amount !== undefined) {
      this.setAmount(updates.amount);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.inputNode.disconnect();
      this.waveshaper.disconnect();
      this.dryGain.disconnect();
      this.wetGain.disconnect();
      this.outputGain.disconnect();
    } catch {
      // Already disconnected - ignore
    }
  }
}

