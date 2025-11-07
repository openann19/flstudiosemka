/**
 * WavetableOscillator - Wavetable synthesis oscillator
 * Supports multiple wavetables and morphing
 * @module audio/synthesizer/oscillators/WavetableOscillator
 */

import { OscillatorModule } from './OscillatorModule';
import type { OscillatorConfig } from '../../../types/synthesizer.types';
import type { ModulationDestination } from '../../../types/synthesizer.types';
import { generateWavetable, interpolateWavetable } from './WaveformGenerator';
import { logger } from '../../../utils/logger';

/**
 * Wavetable oscillator implementation
 */
export class WavetableOscillator extends OscillatorModule {
  private wavetables: Float32Array[] = [];
  private currentTableIndex: number = 0;
  private morphAmount: number = 0;

  /**
   * Create a new wavetable oscillator
   */
  constructor(
    audioContext: AudioContext,
    config: OscillatorConfig,
    destinationType: ModulationDestination
  ) {
    super(audioContext, config, destinationType);
    this.initializeDefaultWavetables();
  }

  /**
   * Initialize default wavetables
   */
  private initializeDefaultWavetables(): void {
    const waveforms: Array<'sine' | 'triangle' | 'sawtooth' | 'square'> = [
      'sine',
      'triangle',
      'sawtooth',
      'square',
    ];
    this.wavetables = waveforms.map((waveform) => generateWavetable(waveform, 256));
  }

  /**
   * Add custom wavetable
   */
  addWavetable(table: Float32Array): void {
    if (table.length !== 256) {
      logger.warn('WavetableOscillator: Wavetable size should be 256', {
        provided: table.length,
      });
      // Resample if needed (simplified)
      const resampled = new Float32Array(256);
      for (let i = 0; i < 256; i += 1) {
        const index = (i / 256) * table.length;
        resampled[i] = interpolateWavetable(table, index);
      }
      this.wavetables.push(resampled);
    } else {
      this.wavetables.push(new Float32Array(table));
    }
  }

  /**
   * Set current wavetable index
   */
  setWavetableIndex(index: number): void {
    if (index >= 0 && index < this.wavetables.length) {
      this.currentTableIndex = index;
      this.updatePeriodicWave();
    }
  }

  /**
   * Set morph amount (0 to 1) for blending between wavetables
   */
  setMorphAmount(amount: number): void {
    this.morphAmount = Math.max(0, Math.min(1, amount));
    this.updatePeriodicWave();
  }

  /**
   * Update periodic wave based on current wavetable and morph
   */
  private updatePeriodicWave(): void {
    const audioContext = this.getAudioContext();
    if (!audioContext) {
      return;
    }

    const currentTable = this.wavetables[this.currentTableIndex];
    if (!currentTable) {
      return;
    }

    // If morphing, blend with next table
    if (this.morphAmount > 0 && this.currentTableIndex < this.wavetables.length - 1) {
      const nextTable = this.wavetables[this.currentTableIndex + 1];
      if (!nextTable) {
        return;
      }
      const blended = new Float32Array(256);
      for (let i = 0; i < 256; i += 1) {
        const currentValue = currentTable[i];
        const nextValue = nextTable[i];
        if (currentValue !== undefined && nextValue !== undefined) {
          blended[i] = currentValue * (1 - this.morphAmount) + nextValue * this.morphAmount;
        }
      }

      const periodicWave = audioContext.createPeriodicWave(
        blended,
        new Float32Array(256).fill(0)
      );
      const oscillator = this.getOscillator();
      if (oscillator) {
        oscillator.setPeriodicWave(periodicWave);
      }
    } else {
      const periodicWave = audioContext.createPeriodicWave(
        currentTable,
        new Float32Array(256).fill(0)
      );
      const oscillator = this.getOscillator();
      if (oscillator) {
        oscillator.setPeriodicWave(periodicWave);
      }
    }
  }

  /**
   * Get audio context (helper method)
   */
  private getAudioContext(): AudioContext | null {
    // Access audioContext from parent class
    return (this as unknown as { audioContext: AudioContext }).audioContext;
  }

  /**
   * Get wavetable count
   */
  getWavetableCount(): number {
    return this.wavetables.length;
  }
}

