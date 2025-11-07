/**
 * AnalogOscillator - Analog-modeled oscillator with drift and phase randomization
 * Simulates analog hardware imperfections for more realistic sound
 * @module audio/synthesizer/oscillators/AnalogOscillator
 */

import type { OscillatorWaveform } from '../../../types/synthesizer.types';
import { generateWaveform } from './WaveformGenerator';

/**
 * Analog oscillator drift configuration
 */
export interface AnalogDriftConfig {
  pitchDrift: number; // 0 to 1, amount of pitch instability
  phaseRandomization: number; // 0 to 1, amount of phase randomization per voice
  warmupTime: number; // 0 to 10 seconds, time to reach stable pitch
}

/**
 * Analog-modeled oscillator with drift and phase randomization
 */
export class AnalogOscillator {
  private phase: number = 0;
  private sampleRate: number;
  private frequency: number = 440;
  private phaseIncrement: number = 0;
  private driftConfig: AnalogDriftConfig;
  private pitchDriftValue: number = 0;
  private phaseOffset: number = 0;
  private warmupProgress: number = 0;
  private driftLFO: number = 0;
  private driftLFOSpeed: number = 0.1;

  /**
   * Create a new analog oscillator
   * @param sampleRate - Audio sample rate
   * @param driftConfig - Drift configuration
   */
  constructor(sampleRate: number, driftConfig: AnalogDriftConfig) {
    this.sampleRate = sampleRate;
    this.driftConfig = { ...driftConfig };
    this.phaseOffset = Math.random(); // Random phase offset per voice
    this.driftLFOSpeed = 0.05 + Math.random() * 0.1; // Random LFO speed
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
   * Get current frequency (with drift applied)
   */
  getFrequency(): number {
    return this.frequency * (1 + this.pitchDriftValue);
  }

  /**
   * Set drift configuration
   */
  setDriftConfig(config: Partial<AnalogDriftConfig>): void {
    this.driftConfig = { ...this.driftConfig, ...config };
  }

  /**
   * Update phase increment based on frequency and drift
   */
  private updatePhaseIncrement(): void {
    const baseIncrement = this.frequency / this.sampleRate;
    const driftMultiplier = 1 + this.pitchDriftValue;
    this.phaseIncrement = baseIncrement * driftMultiplier;
  }

  /**
   * Update drift values (call once per sample)
   */
  private updateDrift(): void {
    // Update warmup progress
    if (this.warmupProgress < 1) {
      this.warmupProgress += 1 / (this.driftConfig.warmupTime * this.sampleRate);
      this.warmupProgress = Math.min(1, this.warmupProgress);
    }

    // Update drift LFO (slow random variation)
    this.driftLFO += this.driftLFOSpeed / this.sampleRate;
    if (this.driftLFO >= 1) {
      this.driftLFO -= 1;
    }

    // Calculate pitch drift (combination of warmup and LFO)
    const warmupDrift = (1 - this.warmupProgress) * 0.01; // 1% drift during warmup
    const lfoDrift = Math.sin(this.driftLFO * Math.PI * 2) * this.driftConfig.pitchDrift * 0.005; // 0.5% max drift
    const randomDrift = (Math.random() - 0.5) * this.driftConfig.pitchDrift * 0.001; // Small random component

    this.pitchDriftValue = warmupDrift + lfoDrift + randomDrift;
    this.updatePhaseIncrement();
  }

  /**
   * Generate next sample
   * @param waveform - Waveform type
   * @param pulseWidth - Pulse width (for pulse waveform)
   * @returns Next sample value (-1 to 1)
   */
  generate(waveform: OscillatorWaveform, pulseWidth: number = 0.5): number {
    // Update drift
    this.updateDrift();

    // Apply phase offset (randomization per voice)
    const phaseWithOffset = (this.phase + this.phaseOffset) % 1;

    // Generate waveform
    const value = generateWaveform(phaseWithOffset, waveform, pulseWidth);

    // Advance phase
    this.phase += this.phaseIncrement;
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
    }

    return value;
  }

  /**
   * Reset phase and warmup
   */
  reset(): void {
    this.phase = 0;
    this.warmupProgress = 0;
    this.phaseOffset = Math.random();
  }

  /**
   * Get warmup progress (0 to 1)
   */
  getWarmupProgress(): number {
    return this.warmupProgress;
  }
}

