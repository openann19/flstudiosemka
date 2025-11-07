/**
 * WaveformGenerator - Advanced waveform generation
 * Generates various oscillator waveforms including wavetables
 * @module audio/synthesizer/oscillators/WaveformGenerator
 */

import type { OscillatorWaveform } from '../../../types/synthesizer.types';
import {
  generateBandLimitedSawtooth,
  generateBandLimitedSquare,
  generateBandLimitedPulse,
} from './PolyBLEP';

/**
 * Generate waveform value at given phase
 * @param phase - Phase (0 to 1)
 * @param waveform - Waveform type
 * @param pulseWidth - Pulse width (0 to 1, for pulse waveform)
 * @param usePolyBLEP - Whether to use PolyBLEP anti-aliasing
 * @param phaseIncrement - Phase increment per sample (for PolyBLEP)
 * @returns Waveform value (-1 to 1)
 */
export function generateWaveform(
  phase: number,
  waveform: OscillatorWaveform,
  pulseWidth: number = 0.5,
  usePolyBLEP: boolean = false,
  phaseIncrement: number = 0.001
): number {
  const normalizedPhase = phase % 1;
  const twoPi = Math.PI * 2;
  const angle = normalizedPhase * twoPi;

  if (usePolyBLEP) {
    switch (waveform) {
      case 'sawtooth':
        return generateBandLimitedSawtooth(normalizedPhase, phaseIncrement);
      case 'square':
        return generateBandLimitedSquare(normalizedPhase, phaseIncrement);
      case 'pulse':
        return generateBandLimitedPulse(normalizedPhase, phaseIncrement, pulseWidth);
      default:
        // Fall through to standard generation
        break;
    }
  }

  switch (waveform) {
    case 'sine':
      return Math.sin(angle);

    case 'triangle':
      if (normalizedPhase < 0.5) {
        return normalizedPhase * 4 - 1;
      }
      return 3 - normalizedPhase * 4;

    case 'sawtooth':
      return normalizedPhase * 2 - 1;

    case 'square':
      return normalizedPhase < 0.5 ? 1 : -1;

    case 'pulse': {
      const width = Math.max(0.01, Math.min(0.99, pulseWidth));
      return normalizedPhase < width ? 1 : -1;
    }

    case 'noise':
      return Math.random() * 2 - 1;

    case 'wavetable':
      // Default to sine for wavetable (actual wavetable handled separately)
      return Math.sin(angle);

    default:
      return Math.sin(angle);
  }
}

/**
 * Generate wavetable from waveform
 * @param waveform - Base waveform type
 * @param tableSize - Size of wavetable (default: 256)
 * @param useBandLimited - Whether to use band-limited generation
 * @returns Wavetable array
 */
export function generateWavetable(
  waveform: OscillatorWaveform,
  tableSize: number = 256,
  useBandLimited: boolean = false
): Float32Array {
  const table = new Float32Array(tableSize);

  if (useBandLimited) {
    // Use additive synthesis for band-limited wavetables
    const maxHarmonics = Math.min(64, Math.floor(tableSize / 4));
    const twoPi = Math.PI * 2;

    for (let i = 0; i < tableSize; i += 1) {
      const phase = i / tableSize;
      const angle = phase * twoPi;
      let value = 0;

      switch (waveform) {
        case 'sawtooth': {
          // Sawtooth: sum of harmonics with decreasing amplitude
          for (let n = 1; n <= maxHarmonics; n += 1) {
            const amplitude = 1 / n;
            value += amplitude * Math.sin(n * angle);
          }
          value *= 2 / Math.PI;
          break;
        }
        case 'square': {
          // Square: sum of odd harmonics
          for (let n = 1; n <= maxHarmonics; n += 2) {
            const amplitude = 1 / n;
            value += amplitude * Math.sin(n * angle);
          }
          value *= 4 / Math.PI;
          break;
        }
        case 'triangle': {
          // Triangle: sum of odd harmonics with alternating signs
          for (let n = 1; n <= maxHarmonics; n += 2) {
            const amplitude = 1 / (n * n);
            const sign = ((n - 1) / 2) % 2 === 0 ? 1 : -1;
            value += sign * amplitude * Math.sin(n * angle);
          }
          value *= 8 / (Math.PI * Math.PI);
          break;
        }
        default:
          value = generateWaveform(phase, waveform);
      }

      table[i] = Math.max(-1, Math.min(1, value));
    }
  } else {
    for (let i = 0; i < tableSize; i += 1) {
      const phase = i / tableSize;
      table[i] = generateWaveform(phase, waveform);
    }
  }

  return table;
}

/**
 * Interpolate between two wavetable values
 * @param table - Wavetable array
 * @param index - Index (can be fractional)
 * @returns Interpolated value
 */
export function interpolateWavetable(table: Float32Array, index: number): number {
  const tableSize = table.length;
  const normalizedIndex = index % tableSize;
  const lowerIndex = Math.floor(normalizedIndex);
  const upperIndex = (lowerIndex + 1) % tableSize;
  const fraction = normalizedIndex - lowerIndex;

  const lowerValue = table[lowerIndex];
  const upperValue = table[upperIndex];
  if (lowerValue === undefined || upperValue === undefined) {
    return 0;
  }
  return lowerValue * (1 - fraction) + upperValue * fraction;
}

