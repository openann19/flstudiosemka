/**
 * MultiLFO - Multiple LFO management
 * Manages up to 3 independent LFOs
 * @module audio/synthesizer/lfos/MultiLFO
 */

import { LFOModule } from './LFOModule';
import type { LFOConfig } from '../../../types/synthesizer.types';
import type { ModulationSource } from '../../../types/synthesizer.types';

/**
 * Multi-LFO system
 */
export class MultiLFO {
  private audioContext: AudioContext;
  private lfos: [LFOModule | null, LFOModule | null, LFOModule | null] = [null, null, null];
  private sourceTypes: [ModulationSource, ModulationSource, ModulationSource] = [
    'lfo1',
    'lfo2',
    'lfo3',
  ];

  /**
   * Create a new multi-LFO system
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('MultiLFO: Invalid AudioContext');
    }
    this.audioContext = audioContext;
  }

  /**
   * Initialize LFO at index
   */
  initializeLFO(index: number, config: LFOConfig): void {
    if (index < 0 || index >= 3) {
      return;
    }
    const sourceType = this.sourceTypes[index];
    if (!sourceType) {
      return;
    }
    this.lfos[index] = new LFOModule(this.audioContext, config, sourceType);
  }

  /**
   * Update LFO configuration at index
   */
  updateLFO(index: number, config: Partial<LFOConfig>): void {
    const lfo = this.lfos[index];
    if (lfo) {
      lfo.updateConfig(config);
    }
  }

  /**
   * Get LFO at index
   */
  getLFO(index: number): LFOModule | null {
    if (index < 0 || index >= 3) {
      return null;
    }
    const lfo = this.lfos[index];
    return lfo ?? null;
  }

  /**
   * Set BPM for all LFOs (for tempo sync)
   */
  setBPM(bpm: number): void {
    this.lfos.forEach((lfo) => {
      if (lfo) {
        lfo.setBPM(bpm);
      }
    });
  }

  /**
   * Process all LFOs (update their values)
   */
  process(): void {
    this.lfos.forEach((lfo) => {
      if (lfo) {
        lfo.getValue();
      }
    });
  }

  /**
   * Reset all LFOs
   */
  reset(): void {
    this.lfos.forEach((lfo) => {
      if (lfo) {
        lfo.reset();
      }
    });
  }

  /**
   * Get all LFO modules
   */
  getAllLFOs(): (LFOModule | null)[] {
    return [...this.lfos];
  }
}

