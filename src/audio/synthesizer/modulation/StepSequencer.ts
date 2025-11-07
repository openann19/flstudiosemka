/**
 * StepSequencer - Step sequencer as modulation source
 * Provides 16-64 step sequencer for modulation
 * @module audio/synthesizer/modulation/StepSequencer
 */

import { ModulationSource } from './ModulationSource';
import type { ModulationSource as ModulationSourceType } from '../../../types/synthesizer.types';

/**
 * Step sequencer configuration
 */
export interface StepSequencerConfig {
  steps: number; // Number of steps (16-64)
  values: number[]; // Step values (-1 to 1)
  rate: number; // Rate in Hz
  tempoSync: boolean; // Sync to tempo
  swing: number; // Swing amount (0 to 1)
  currentStep: number; // Current step index
}

/**
 * Step sequencer modulation source
 */
export class StepSequencer extends ModulationSource {
  private config: StepSequencerConfig;
  private sampleRate: number;
  private phase: number = 0;
  private phaseIncrement: number = 0;

  /**
   * Create a new step sequencer
   */
  constructor(sampleRate: number, config: Partial<StepSequencerConfig>) {
    super();
    this.sampleRate = sampleRate;
    this.config = {
      steps: 16,
      values: new Array(16).fill(0),
      rate: 1,
      tempoSync: false,
      swing: 0,
      currentStep: 0,
      ...config,
    };
    this.updatePhaseIncrement();
  }

  /**
   * Update phase increment based on rate
   */
  private updatePhaseIncrement(): void {
    this.phaseIncrement = this.config.rate / this.sampleRate;
  }

  /**
   * Set rate
   */
  setRate(rate: number): void {
    this.config.rate = rate;
    this.updatePhaseIncrement();
  }

  /**
   * Set step value
   */
  setStep(step: number, value: number): void {
    if (step >= 0 && step < this.config.steps) {
      this.config.values[step] = Math.max(-1, Math.min(1, value));
    }
  }

  /**
   * Get step value
   */
  getStep(step: number): number {
    if (step >= 0 && step < this.config.steps) {
      return this.config.values[step] ?? 0;
    }
    return 0;
  }

  /**
   * Set number of steps
   */
  setSteps(steps: number): void {
    this.config.steps = Math.max(16, Math.min(64, steps));
    if (this.config.values.length < this.config.steps) {
      // Extend values array
      const newValues = new Array(this.config.steps).fill(0);
      for (let i = 0; i < this.config.values.length; i += 1) {
        newValues[i] = this.config.values[i] ?? 0;
      }
      this.config.values = newValues;
    } else if (this.config.values.length > this.config.steps) {
      // Truncate values array
      this.config.values = this.config.values.slice(0, this.config.steps);
    }
  }

  /**
   * Get current modulation value
   */
  getValue(): number {
    return this.generate();
  }

  /**
   * Generate next modulation value
   */
  generate(): number {
    // Advance phase
    this.phase += this.phaseIncrement;

    // Calculate step duration with swing
    const stepDuration = 1 / this.config.steps;
    const swingAmount = this.config.swing * 0.1; // 10% max swing
    const swingOffset = Math.sin((this.config.currentStep % 2) * Math.PI) * swingAmount;

    // Check if we should advance to next step
    if (this.phase >= stepDuration + swingOffset) {
      this.phase -= stepDuration + swingOffset;
      this.config.currentStep = (this.config.currentStep + 1) % this.config.steps;
    }

    // Return current step value
    return this.config.values[this.config.currentStep] ?? 0;
  }

  /**
   * Reset sequencer
   */
  reset(): void {
    this.phase = 0;
    this.config.currentStep = 0;
  }

  /**
   * Get source type
   */
  getSourceType(): ModulationSourceType {
    return 'lfo1' as ModulationSourceType; // Use LFO as closest match
  }

  /**
   * Get current step
   */
  getCurrentStep(): number {
    return this.config.currentStep;
  }

  /**
   * Get configuration
   */
  getConfig(): StepSequencerConfig {
    return { ...this.config };
  }
}

