/**
 * LFOModule - Low Frequency Oscillator module
 * Generates modulation signals for various destinations
 * @module audio/synthesizer/lfos/LFOModule
 */

import type { LFOConfig, TempoSync } from '../../../types/synthesizer.types';
import { generateLFOWaveformWithOffset } from './LFOWaveforms';
import { ModulationSource } from '../modulation/ModulationSource';
import type { ModulationSource as ModulationSourceType } from '../../../types/synthesizer.types';

/**
 * Convert tempo sync division to Hz at given BPM
 */
function tempoSyncToHz(division: TempoSync, bpm: number): number {
  const beatsPerSecond = bpm / 60;
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
  return beatsPerSecond * (divisions[division] ?? 1);
}

/**
 * LFO module implementation
 */
export class LFOModule extends ModulationSource {
  private audioContext: AudioContext;
  private config: LFOConfig;
  private phase: number = 0;
  private currentBPM: number = 120;
  private lastUpdateTime: number = 0;
  private delayPhase: number = 0;
  private fadeInPhase: number = 0;
  private sourceType: ModulationSourceType;

  /**
   * Create a new LFO module
   */
  constructor(
    audioContext: AudioContext,
    config: LFOConfig,
    sourceType: ModulationSourceType
  ) {
    super();
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('LFOModule: Invalid AudioContext');
    }
    this.audioContext = audioContext;
    this.config = { ...config };
    this.sourceType = sourceType;
    this.lastUpdateTime = audioContext.currentTime;
  }

  /**
   * Update LFO configuration
   */
  updateConfig(config: Partial<LFOConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set current BPM for tempo sync
   */
  setBPM(bpm: number): void {
    this.currentBPM = Math.max(1, Math.min(300, bpm));
  }

  /**
   * Get current modulation value (-1 to 1)
   */
  getValue(): number {
    const now = this.audioContext.currentTime;
    const deltaTime = now - this.lastUpdateTime;

    if (!this.config.enabled) {
      return 0;
    }

    // Calculate frequency
    let frequency: number;
    if (this.config.tempoSync) {
      frequency = tempoSyncToHz(this.config.syncDivision, this.currentBPM);
    } else {
      frequency = Math.max(0.01, Math.min(100, this.config.rate));
    }

    // Update phase
    this.phase += deltaTime * frequency;
    this.phase %= 1;

    // Handle delay
    if (this.config.delay > 0) {
      this.delayPhase += deltaTime;
      if (this.delayPhase < this.config.delay) {
        return 0;
      }
    }

    // Handle fade-in
    let fadeInMultiplier = 1;
    if (this.config.fadeIn > 0) {
      this.fadeInPhase += deltaTime;
      if (this.fadeInPhase < this.config.fadeIn) {
        fadeInMultiplier = this.fadeInPhase / this.config.fadeIn;
      }
    }

    // Generate waveform
    const waveformValue = generateLFOWaveformWithOffset(
      this.phase,
      this.config.waveform,
      this.config.phase
    );

    // Apply depth and fade-in
    const value = waveformValue * this.config.depth * fadeInMultiplier;

    this.lastUpdateTime = now;
    this.value = value;
    this.active = this.config.enabled && value !== 0;

    return value;
  }

  /**
   * Get source type
   */
  getSourceType(): ModulationSourceType {
    return this.sourceType;
  }

  /**
   * Reset LFO phase
   */
  reset(): void {
    this.phase = 0;
    this.delayPhase = 0;
    this.fadeInPhase = 0;
    this.lastUpdateTime = this.audioContext.currentTime;
  }

  /**
   * Get LFO configuration
   */
  getConfig(): LFOConfig {
    return { ...this.config };
  }
}

