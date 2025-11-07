/**
 * BandLimitedOscillator - Band-limited waveform generator
 * Generates anti-aliased waveforms using PolyBLEP and band-limited wavetables
 * @module audio/synthesizer/oscillators/BandLimitedOscillator
 */

import type { OscillatorWaveform } from '../../../types/synthesizer.types';
import {
  generateBandLimitedSawtooth,
  generateBandLimitedSquare,
  generateBandLimitedPulse,
} from './PolyBLEP';
import { generateWaveform } from './WaveformGenerator';

/**
 * Band-limited oscillator generator
 */
export class BandLimitedOscillator {
  private phase: number = 0;
  private sampleRate: number;
  private frequency: number = 440;
  private phaseIncrement: number = 0;

  /**
   * Create a new band-limited oscillator
   * @param sampleRate - Audio sample rate
   */
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.updatePhaseIncrement();
  }

  /**
   * Set frequency
   */
  setFrequency(frequency: number): void {
    this.frequency = Math.max(20, Math.min(20000, frequency));
    this.updatePhaseIncrement();
  }

  /**
   * Get current frequency
   */
  getFrequency(): number {
    return this.frequency;
  }

  /**
   * Set phase (0 to 1)
   */
  setPhase(phase: number): void {
    this.phase = phase % 1;
  }

  /**
   * Get current phase
   */
  getPhase(): number {
    return this.phase;
  }

  /**
   * Update phase increment based on frequency
   */
  private updatePhaseIncrement(): void {
    this.phaseIncrement = this.frequency / this.sampleRate;
  }

  /**
   * Generate next sample
   * @param waveform - Waveform type
   * @param pulseWidth - Pulse width (for pulse waveform)
   * @param usePolyBLEP - Whether to use PolyBLEP anti-aliasing
   * @returns Next sample value (-1 to 1)
   */
  generate(
    waveform: OscillatorWaveform,
    pulseWidth: number = 0.5,
    usePolyBLEP: boolean = true
  ): number {
    let value: number;

    if (usePolyBLEP) {
      switch (waveform) {
        case 'sawtooth':
          value = generateBandLimitedSawtooth(this.phase, this.phaseIncrement);
          break;
        case 'square':
          value = generateBandLimitedSquare(this.phase, this.phaseIncrement);
          break;
        case 'pulse':
          value = generateBandLimitedPulse(this.phase, this.phaseIncrement, pulseWidth);
          break;
        default:
          // For other waveforms, use standard generation
          value = generateWaveform(this.phase, waveform, pulseWidth);
      }
    } else {
      value = generateWaveform(this.phase, waveform, pulseWidth);
    }

    // Advance phase
    this.phase += this.phaseIncrement;
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
    }

    return value;
  }

  /**
   * Generate band-limited wavetable
   * @param waveform - Base waveform type
   * @param tableSize - Size of wavetable
   * @param maxHarmonics - Maximum harmonics to include
   * @returns Band-limited wavetable
   */
  static generateBandLimitedWavetable(
    waveform: OscillatorWaveform,
    tableSize: number = 256,
    maxHarmonics: number = 64
  ): Float32Array {
    const table = new Float32Array(tableSize);
    const twoPi = Math.PI * 2;

    // Generate using additive synthesis with limited harmonics
    for (let i = 0; i < tableSize; i += 1) {
      const phase = i / tableSize;
      let value = 0;

      switch (waveform) {
        case 'sawtooth': {
          // Sawtooth: sum of odd harmonics with decreasing amplitude
          for (let n = 1; n <= maxHarmonics; n += 1) {
            const amplitude = 1 / n;
            value += amplitude * Math.sin(n * phase * twoPi);
          }
          value *= 2 / Math.PI; // Normalize
          break;
        }
        case 'square': {
          // Square: sum of odd harmonics
          for (let n = 1; n <= maxHarmonics; n += 2) {
            const amplitude = 1 / n;
            value += amplitude * Math.sin(n * phase * twoPi);
          }
          value *= 4 / Math.PI; // Normalize
          break;
        }
        case 'triangle': {
          // Triangle: sum of odd harmonics with alternating signs
          for (let n = 1; n <= maxHarmonics; n += 2) {
            const amplitude = 1 / (n * n);
            const sign = (n - 1) / 2 % 2 === 0 ? 1 : -1;
            value += sign * amplitude * Math.sin(n * phase * twoPi);
          }
          value *= 8 / (Math.PI * Math.PI); // Normalize
          break;
        }
        default:
          value = generateWaveform(phase, waveform);
      }

      table[i] = Math.max(-1, Math.min(1, value));
    }

    return table;
  }

  /**
   * Reset phase to 0
   */
  reset(): void {
    this.phase = 0;
  }
}

