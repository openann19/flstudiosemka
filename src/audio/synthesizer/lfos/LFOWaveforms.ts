/**
 * LFOWaveforms - LFO waveform generation functions
 * Provides various LFO waveform shapes
 * @module audio/synthesizer/lfos/LFOWaveforms
 */

import type { LFOWaveform } from '../../../types/synthesizer.types';

/**
 * Generate LFO waveform value at given phase
 * @param phase - Phase (0 to 1)
 * @param waveform - Waveform type
 * @returns Waveform value (-1 to 1)
 */
export function generateLFOWaveform(phase: number, waveform: LFOWaveform): number {
  const normalizedPhase = phase % 1;
  const twoPi = Math.PI * 2;
  const angle = normalizedPhase * twoPi;

  switch (waveform) {
    case 'sine':
      return Math.sin(angle);

    case 'triangle':
      if (normalizedPhase < 0.25) {
        return normalizedPhase * 4;
      }
      if (normalizedPhase < 0.75) {
        return 2 - normalizedPhase * 4;
      }
      return normalizedPhase * 4 - 4;

    case 'sawtooth':
      return normalizedPhase * 2 - 1;

    case 'square':
      return normalizedPhase < 0.5 ? 1 : -1;

    case 'random':
      // Sample & hold at phase 0, random value
      return Math.random() * 2 - 1;

    case 'samplehold':
      // Sample & hold - returns value at integer phase boundaries
      return Math.random() * 2 - 1;

    default:
      return Math.sin(angle);
  }
}

/**
 * Generate LFO waveform with phase offset
 * @param phase - Phase (0 to 1)
 * @param waveform - Waveform type
 * @param phaseOffset - Phase offset (0 to 1)
 * @returns Waveform value (-1 to 1)
 */
export function generateLFOWaveformWithOffset(
  phase: number,
  waveform: LFOWaveform,
  phaseOffset: number
): number {
  const offsetPhase = (phase + phaseOffset) % 1;
  return generateLFOWaveform(offsetPhase, waveform);
}

