/**
 * FilterEnvelope - Filter ADSR envelope
 * Modulates filter cutoff with envelope
 * @module audio/synthesizer/filters/FilterEnvelope
 */

import { ADSREnvelope } from '../envelopes/ADSREnvelope';
import type { ADSREnvelopeParams } from '../../../types/synthesizer.types';

/**
 * Filter envelope implementation
 * Wraps ADSR envelope for filter modulation
 */
export class FilterEnvelope extends ADSREnvelope {
  private filterCutoffBase: number = 20000;
  private envelopeAmount: number = 0;

  /**
   * Create a new filter envelope
   */
  constructor(
    audioContext: AudioContext,
    params: ADSREnvelopeParams,
    filterCutoffBase: number = 20000,
    envelopeAmount: number = 0
  ) {
    super(audioContext, params);
    this.filterCutoffBase = filterCutoffBase;
    this.envelopeAmount = envelopeAmount;
  }

  /**
   * Set filter cutoff base
   */
  setFilterCutoffBase(cutoff: number): void {
    this.filterCutoffBase = Math.max(20, Math.min(20000, cutoff));
  }

  /**
   * Set envelope amount
   */
  setEnvelopeAmount(amount: number): void {
    this.envelopeAmount = Math.max(-1, Math.min(1, amount));
  }

  /**
   * Get modulated filter cutoff
   */
  getModulatedCutoff(): number {
    const envelopeValue = this.getValue();
    const modulation = envelopeValue * this.envelopeAmount;
    const cutoff = this.filterCutoffBase * (1 + modulation);
    return Math.max(20, Math.min(20000, cutoff));
  }
}

