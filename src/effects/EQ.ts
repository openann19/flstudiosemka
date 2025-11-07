/**
 * EQ - Professional parametric equalizer matching PRO Q 4
 * Supports multiple bands, dynamic processing, character modes, and linear phase
 * @module effects/EQ
 */

import {
  AudioContextError,
  InvalidParameterError,
  EQError,
} from '../utils/errors';
import { EQBand, FilterType, type EQBandConfig } from './EQBand';
import { CharacterProcessor, CharacterMode } from './CharacterProcessor';
import { LinearPhaseProcessor } from './LinearPhaseProcessor';

/**
 * Processing mode enumeration
 */
export enum ProcessingMode {
  ZeroLatency = 'zero-latency',
  LinearPhase = 'linear-phase',
}

/**
 * EQ band parameters (backward compatibility)
 */
export interface EQBandParams {
  frequency: number;
  gain: number;
  Q?: number;
}

/**
 * Complete EQ parameters (backward compatibility)
 */
export interface EQParams {
  low?: EQBandParams;
  mid?: EQBandParams;
  high?: EQBandParams;
}

/**
 * EQ settings structure (backward compatibility)
 */
export interface EQSettings {
  low: {
    frequency: number;
    gain: number;
  };
  mid: {
    frequency: number;
    gain: number;
    Q: number;
  };
  high: {
    frequency: number;
    gain: number;
  };
}

/**
 * Complete EQ configuration
 */
export interface EQConfiguration {
  bands: EQBandConfig[];
  characterMode: CharacterMode;
  characterAmount: number;
  processingMode: ProcessingMode;
  dryWet: number; // 0.0 to 1.0
  bypass: boolean;
}

/**
 * Professional parametric equalizer matching PRO Q 4
 */
export class EQ {
  private audioContext: AudioContext;

  private bands: EQBand[];

  private characterProcessor: CharacterProcessor;

  private linearPhaseProcessor: LinearPhaseProcessor;

  private inputGain: GainNode;

  private outputGain: GainNode;

  private dryGain: GainNode;

  private wetGain: GainNode;

  private bypassGain: GainNode;

  private processingMode: ProcessingMode;

  private dryWet: number;

  private bypass: boolean;

  // Legacy band references for backward compatibility
  private legacyLowBand: EQBand | null;

  private legacyMidBand: EQBand | null;

  private legacyHighBand: EQBand | null;

  public readonly inputNode: GainNode;

  public readonly outputNode: GainNode;

  /**
   * Maximum number of bands
   */
  private static readonly MAX_BANDS = 24;

  /**
   * Create a new EQ instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.bands = [];
    this.processingMode = ProcessingMode.ZeroLatency;
    this.dryWet = 1.0;
    this.bypass = false;
    this.legacyLowBand = null;
    this.legacyMidBand = null;
    this.legacyHighBand = null;

    // Create gain nodes for routing
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.bypassGain = audioContext.createGain();

    // Create character processor
    this.characterProcessor = new CharacterProcessor(audioContext, {
      mode: CharacterMode.Clean,
      amount: 0,
    });

    // Create linear phase processor
    this.linearPhaseProcessor = new LinearPhaseProcessor(audioContext, {
      enabled: false,
      fftSize: 4096,
    });

    // Input/output nodes
    this.inputNode = this.inputGain;
    this.outputNode = this.bypassGain;

    // Build initial routing
    this.rebuildRouting();

    // Initialize legacy bands for backward compatibility
    this.initializeLegacyBands();
  }

  /**
   * Initialize legacy 3-band structure for backward compatibility
   */
  private initializeLegacyBands(): void {
    // Low shelf
    this.legacyLowBand = this.addBand({
      id: 'legacy-low',
      type: FilterType.LowShelf,
      frequency: 200,
      gain: 0,
      enabled: true,
    });

    // Mid peak
    this.legacyMidBand = this.addBand({
      id: 'legacy-mid',
      type: FilterType.Peaking,
      frequency: 1000,
      gain: 0,
      Q: 1,
      enabled: true,
    });

    // High shelf
    this.legacyHighBand = this.addBand({
      id: 'legacy-high',
      type: FilterType.HighShelf,
      frequency: 5000,
      gain: 0,
      enabled: true,
    });
  }

  /**
   * Rebuild audio routing based on current configuration
   */
  private rebuildRouting(): void {
    // Disconnect all
    try {
      this.inputGain.disconnect();
      this.dryGain.disconnect();
      this.wetGain.disconnect();
      this.bypassGain.disconnect();
      this.characterProcessor.inputNode.disconnect();
      this.linearPhaseProcessor.inputNode.disconnect();
    } catch (error) {
      // Ignore disconnection errors
    }

    // Disconnect all bands
    for (const band of this.bands) {
      try {
        band.inputNode.disconnect();
        band.outputNode.disconnect();
      } catch (error) {
        // Ignore
      }
    }

    if (this.bypass) {
      // Bypass: input -> output
      this.inputGain.connect(this.bypassGain);
      return;
    }

    // Dry path: input -> dry -> output
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.bypassGain);

    // Wet path: input -> bands -> character -> output
    let currentNode: AudioNode = this.inputGain;

    // Connect bands in series
    for (const band of this.bands) {
      if (band.isEnabled()) {
        currentNode.connect(band.inputNode);
        currentNode = band.outputNode;
      }
    }

    // Apply processing mode
    if (this.processingMode === ProcessingMode.LinearPhase && this.linearPhaseProcessor.isEnabled()) {
      currentNode.connect(this.linearPhaseProcessor.inputNode);
      currentNode = this.linearPhaseProcessor.outputNode;
    }

    // Apply character processing
    currentNode.connect(this.characterProcessor.inputNode);
    currentNode = this.characterProcessor.outputNode;

    // Connect wet path to output
    currentNode.connect(this.wetGain);
    this.wetGain.connect(this.bypassGain);

    // Update dry/wet mix
    this.updateDryWet();
  }

  /**
   * Update dry/wet mix
   */
  private updateDryWet(): void {
    this.dryGain.gain.value = 1 - this.dryWet;
    this.wetGain.gain.value = this.dryWet;
  }

  /**
   * Add a new EQ band
   * @param config - Band configuration
   * @returns Created EQBand instance
   * @throws EQError if maximum bands reached
   */
  addBand(config: EQBandConfig): EQBand {
    if (this.bands.length >= EQ.MAX_BANDS) {
      throw new EQError(`Maximum ${EQ.MAX_BANDS} bands allowed`, {
        currentBands: this.bands.length,
        maxBands: EQ.MAX_BANDS,
      });
    }

    const band = new EQBand(this.audioContext, config);
    this.bands.push(band);
    this.rebuildRouting();

    return band;
  }

  /**
   * Remove a band by ID
   * @param bandId - Band ID to remove
   * @returns True if band was removed
   */
  removeBand(bandId: string): boolean {
    const index = this.bands.findIndex((band) => band.getConfig().id === bandId);
    if (index === -1) {
      return false;
    }

    const band = this.bands[index];
    if (band === undefined) {
      return false;
    }
    band.cleanup();
    this.bands.splice(index, 1);

    // Update legacy references if needed
    if (band === this.legacyLowBand) {
      this.legacyLowBand = null;
    }
    if (band === this.legacyMidBand) {
      this.legacyMidBand = null;
    }
    if (band === this.legacyHighBand) {
      this.legacyHighBand = null;
    }

    this.rebuildRouting();
    return true;
  }

  /**
   * Get band by ID
   * @param bandId - Band ID
   * @returns EQBand instance or undefined
   */
  getBand(bandId: string): EQBand | undefined {
    return this.bands.find((band) => band.getConfig().id === bandId);
  }

  /**
   * Get all bands
   * @returns Array of all bands
   */
  getAllBands(): EQBand[] {
    return [...this.bands];
  }

  /**
   * Enable a band
   * @param bandId - Band ID
   * @returns True if band was enabled
   */
  enableBand(bandId: string): boolean {
    const band = this.getBand(bandId);
    if (!band) {
      return false;
    }
    band.setEnabled(true);
    return true;
  }

  /**
   * Disable a band
   * @param bandId - Band ID
   * @returns True if band was disabled
   */
  disableBand(bandId: string): boolean {
    const band = this.getBand(bandId);
    if (!band) {
      return false;
    }
    band.setEnabled(false);
    return true;
  }

  /**
   * Set band configuration
   * @param bandId - Band ID
   * @param updates - Partial configuration updates
   * @returns True if band was updated
   */
  setBand(bandId: string, updates: Partial<EQBandConfig>): boolean {
    const band = this.getBand(bandId);
    if (!band) {
      return false;
    }
    band.updateConfig(updates);
    this.rebuildRouting();
    return true;
  }

  /**
   * Set processing mode
   * @param mode - Processing mode
   */
  setProcessingMode(mode: ProcessingMode): void {
    if (!Object.values(ProcessingMode).includes(mode)) {
      throw new InvalidParameterError(
        'mode',
        mode,
        `one of: ${Object.values(ProcessingMode).join(', ')}`
      );
    }
    this.processingMode = mode;
    this.linearPhaseProcessor.setEnabled(mode === ProcessingMode.LinearPhase);
    this.rebuildRouting();
  }

  /**
   * Get processing mode
   * @returns Current processing mode
   */
  getProcessingMode(): ProcessingMode {
    return this.processingMode;
  }

  /**
   * Set character mode
   * @param mode - Character mode
   */
  setCharacterMode(mode: CharacterMode): void {
    this.characterProcessor.setMode(mode);
  }

  /**
   * Get character mode
   * @returns Current character mode
   */
  getCharacterMode(): CharacterMode {
    return this.characterProcessor.getConfig().mode;
  }

  /**
   * Set character amount
   * @param amount - Amount (0.0-1.0)
   */
  setCharacterAmount(amount: number): void {
    this.characterProcessor.setAmount(amount);
  }

  /**
   * Get character amount
   * @returns Current character amount
   */
  getCharacterAmount(): number {
    return this.characterProcessor.getConfig().amount;
  }

  /**
   * Set dry/wet mix
   * @param mix - Mix (0.0-1.0, 0 = dry, 1 = wet)
   */
  setDryWet(mix: number): void {
    if (typeof mix !== 'number' || Number.isNaN(mix)) {
      throw new InvalidParameterError('mix', mix, 'number');
    }
    if (mix < 0 || mix > 1) {
      throw new InvalidParameterError('mix', mix, 'number between 0 and 1', { min: 0, max: 1 });
    }
    this.dryWet = mix;
    this.updateDryWet();
  }

  /**
   * Get dry/wet mix
   * @returns Current dry/wet mix
   */
  getDryWet(): number {
    return this.dryWet;
  }

  /**
   * Set bypass state
   * @param bypass - Whether to bypass
   */
  setBypass(bypass: boolean): void {
    this.bypass = bypass;
    this.rebuildRouting();
  }

  /**
   * Get bypass state
   * @returns True if bypassed
   */
  isBypassed(): boolean {
    return this.bypass;
  }

  /**
   * Get complete configuration
   * @returns Current EQ configuration
   */
  getConfiguration(): EQConfiguration {
    return {
      bands: this.bands.map((band) => band.getConfig()),
      characterMode: this.characterProcessor.getConfig().mode,
      characterAmount: this.characterProcessor.getConfig().amount,
      processingMode: this.processingMode,
      dryWet: this.dryWet,
      bypass: this.bypass,
    };
  }

  /**
   * Set complete configuration
   * @param config - EQ configuration
   */
  setConfiguration(config: Partial<EQConfiguration>): void {
    if (config.bands !== undefined) {
      // Clear existing bands
      for (const band of this.bands) {
        band.cleanup();
      }
      this.bands = [];

      // Add new bands
      for (const bandConfig of config.bands) {
        this.addBand(bandConfig);
      }
    }

    if (config.characterMode !== undefined) {
      this.setCharacterMode(config.characterMode);
    }

    if (config.characterAmount !== undefined) {
      this.setCharacterAmount(config.characterAmount);
    }

    if (config.processingMode !== undefined) {
      this.setProcessingMode(config.processingMode);
    }

    if (config.dryWet !== undefined) {
      this.setDryWet(config.dryWet);
    }

    if (config.bypass !== undefined) {
      this.setBypass(config.bypass);
    }

    this.rebuildRouting();
  }

  // ========== Backward Compatibility Methods ==========

  /**
   * Set low shelf parameters (backward compatibility)
   * @param frequency - Frequency in Hz (20-500)
   * @param gain - Gain in dB (-24 to +24)
   * @throws InvalidParameterError if parameters are invalid
   */
  setLowShelf(frequency: number, gain: number): void {
    if (!this.legacyLowBand) {
      this.legacyLowBand = this.addBand({
        id: 'legacy-low',
        type: FilterType.LowShelf,
        frequency: 200,
        gain: 0,
        enabled: true,
      });
    }

    // Clamp to legacy ranges for compatibility
    const clampedFreq = Math.max(20, Math.min(500, frequency));
    const clampedGain = Math.max(-24, Math.min(24, gain));

    this.legacyLowBand.setFrequency(clampedFreq);
    this.legacyLowBand.setGain(clampedGain);
  }

  /**
   * Set mid band parameters (backward compatibility)
   * @param frequency - Frequency in Hz (200-8000)
   * @param gain - Gain in dB (-24 to +24)
   * @param Q - Q factor (0.1-10, default: 1)
   * @throws InvalidParameterError if parameters are invalid
   */
  setMidBand(frequency: number, gain: number, Q: number = 1): void {
    if (!this.legacyMidBand) {
      this.legacyMidBand = this.addBand({
        id: 'legacy-mid',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        Q: 1,
        enabled: true,
      });
    }

    // Clamp to legacy ranges for compatibility
    const clampedFreq = Math.max(200, Math.min(8000, frequency));
    const clampedGain = Math.max(-24, Math.min(24, gain));
    const clampedQ = Math.max(0.1, Math.min(10, Q));

    this.legacyMidBand.setFrequency(clampedFreq);
    this.legacyMidBand.setGain(clampedGain);
    this.legacyMidBand.setQ(clampedQ);
  }

  /**
   * Set high shelf parameters (backward compatibility)
   * @param frequency - Frequency in Hz (2000-20000)
   * @param gain - Gain in dB (-24 to +24)
   * @throws InvalidParameterError if parameters are invalid
   */
  setHighShelf(frequency: number, gain: number): void {
    if (!this.legacyHighBand) {
      this.legacyHighBand = this.addBand({
        id: 'legacy-high',
        type: FilterType.HighShelf,
        frequency: 5000,
        gain: 0,
        enabled: true,
      });
    }

    // Clamp to legacy ranges for compatibility
    const clampedFreq = Math.max(2000, Math.min(20000, frequency));
    const clampedGain = Math.max(-24, Math.min(24, gain));

    this.legacyHighBand.setFrequency(clampedFreq);
    this.legacyHighBand.setGain(clampedGain);
  }

  /**
   * Set all bands at once (backward compatibility)
   * @param params - EQ parameters
   */
  setBands(params: EQParams): void {
    if (params.low) {
      this.setLowShelf(params.low.frequency, params.low.gain);
    }
    if (params.mid) {
      this.setMidBand(
        params.mid.frequency,
        params.mid.gain,
        params.mid.Q
      );
    }
    if (params.high) {
      this.setHighShelf(params.high.frequency, params.high.gain);
    }
  }

  /**
   * Get current settings (backward compatibility)
   * @returns Current EQ settings
   */
  getSettings(): EQSettings {
    return {
      low: {
        frequency: this.legacyLowBand?.getConfig().frequency ?? 200,
        gain: this.legacyLowBand?.getConfig().gain ?? 0,
      },
      mid: {
        frequency: this.legacyMidBand?.getConfig().frequency ?? 1000,
        gain: this.legacyMidBand?.getConfig().gain ?? 0,
        Q: this.legacyMidBand?.getConfig().Q ?? 1,
      },
      high: {
        frequency: this.legacyHighBand?.getConfig().frequency ?? 5000,
        gain: this.legacyHighBand?.getConfig().gain ?? 0,
      },
    };
  }

  /**
   * Reset to flat response
   */
  reset(): void {
    for (const band of this.bands) {
      band.setGain(0);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      // Cleanup bands
      for (const band of this.bands) {
        band.cleanup();
      }
      this.bands = [];

      // Cleanup processors
      this.characterProcessor.cleanup();
      this.linearPhaseProcessor.cleanup();

      // Disconnect gain nodes
      this.inputGain.disconnect();
      this.dryGain.disconnect();
      this.wetGain.disconnect();
      this.bypassGain.disconnect();
      this.outputGain.disconnect();
    } catch (error) {
      // Already disconnected - ignore
    }
  }
}

// Export types and enums for external use
export { FilterType, type EQBandConfig } from './EQBand';
export { CharacterMode } from './CharacterProcessor';
export { DynamicMode } from './DynamicEQProcessor';

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { EQ: typeof EQ }).EQ = EQ;
}
