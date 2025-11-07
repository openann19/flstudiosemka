/**
 * AdvancedArpeggiator - Advanced arpeggiator
 * Enhanced arpeggiator with multiple patterns and features
 * @module audio/synthesizer/sequencer/AdvancedArpeggiator
 */

import type { ArpeggiatorConfig } from '../../../types/synthesizer.types';

/**
 * Advanced arpeggiator configuration
 */
export interface AdvancedArpeggiatorConfig extends ArpeggiatorConfig {
  latch: boolean; // Latch mode (hold notes)
  velocityPattern: number[]; // Velocity pattern per step
  gatePattern: number[]; // Gate pattern per step (0 to 1)
}

/**
 * Advanced arpeggiator
 */
export class AdvancedArpeggiator {
  private config: AdvancedArpeggiatorConfig;
  private sampleRate: number;
  private currentBPM: number = 120;
  private heldNotes: number[] = [];
  private currentStep: number = 0;
  private phase: number = 0;
  private phaseIncrement: number = 0;
  private _isActive: boolean = false;

  /**
   * Create a new advanced arpeggiator
   */
  constructor(sampleRate: number, config: Partial<AdvancedArpeggiatorConfig>) {
    this.sampleRate = sampleRate;
    this.config = {
      enabled: false,
      pattern: 'up',
      rate: 2,
      tempoSync: false,
      syncDivision: '1/4',
      octaves: 1,
      gate: 0.5,
      swing: 0,
      latch: false,
      velocityPattern: [],
      gatePattern: [],
      ...config,
    };
    this.updatePhaseIncrement();
  }

  /**
   * Update phase increment based on rate
   */
  private updatePhaseIncrement(): void {
    if (this.config.tempoSync) {
      const bps = this.currentBPM / 60;
      const division = this.parseSyncDivision(this.config.syncDivision);
      this.phaseIncrement = (bps * division) / this.sampleRate;
    } else {
      this.phaseIncrement = this.config.rate / this.sampleRate;
    }
  }

  /**
   * Parse sync division
   */
  private parseSyncDivision(division: string): number {
    const [numerator, denominator] = division.split('/').map(Number);
    return (numerator ?? 1) / (denominator ?? 1);
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    this.currentBPM = bpm;
    this.updatePhaseIncrement();
  }

  /**
   * Add note
   */
  addNote(note: number): void {
    if (!this.heldNotes.includes(note)) {
      this.heldNotes.push(note);
      this.heldNotes.sort((a, b) => a - b);
    }
  }

  /**
   * Remove note
   */
  removeNote(note: number): void {
    if (!this.config.latch) {
      this.heldNotes = this.heldNotes.filter((n) => n !== note);
    }
  }

  /**
   * Clear all notes
   */
  clearNotes(): void {
    this.heldNotes = [];
  }

  /**
   * Generate arpeggio pattern
   */
  private generatePattern(notes: number[]): number[] {
    if (notes.length === 0) {
      return [];
    }

    const pattern: number[] = [];

    switch (this.config.pattern) {
      case 'up': {
        // Ascending
        for (let octave = 0; octave < this.config.octaves; octave += 1) {
          notes.forEach((note) => {
            pattern.push(note + octave * 12);
          });
        }
        break;
      }
      case 'down': {
        // Descending
        for (let octave = this.config.octaves - 1; octave >= 0; octave -= 1) {
          [...notes].reverse().forEach((note) => {
            pattern.push(note + octave * 12);
          });
        }
        break;
      }
      case 'updown': {
        // Up then down
        for (let octave = 0; octave < this.config.octaves; octave += 1) {
          notes.forEach((note) => {
            pattern.push(note + octave * 12);
          });
        }
        for (let octave = this.config.octaves - 1; octave >= 0; octave -= 1) {
          [...notes].reverse().forEach((note) => {
            if (octave !== this.config.octaves - 1 || note !== notes[notes.length - 1]) {
              pattern.push(note + octave * 12);
            }
          });
        }
        break;
      }
      case 'random': {
        // Random order
        const allNotes: number[] = [];
        for (let octave = 0; octave < this.config.octaves; octave += 1) {
          notes.forEach((note) => {
            allNotes.push(note + octave * 12);
          });
        }
        for (let i = allNotes.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [allNotes[i], allNotes[j]] = [allNotes[j] ?? 0, allNotes[i] ?? 0];
        }
        pattern.push(...allNotes);
        break;
      }
      case 'custom': {
        // Custom pattern
        if (this.config.customPattern) {
          pattern.push(...this.config.customPattern);
        } else {
          pattern.push(...notes);
        }
        break;
      }
      default:
        pattern.push(...notes);
    }

    return pattern;
  }

  /**
   * Process arpeggiator (call every sample or frame)
   * @returns Note to play (or null), velocity, and gate
   */
  process(): { note: number | null; velocity: number; gate: number } | null {
    if (!this.config.enabled || this.heldNotes.length === 0) {
      return null;
    }

    this.phase += this.phaseIncrement;

    // Calculate step duration with swing
    const pattern = this.generatePattern(this.heldNotes);
    if (pattern.length === 0) {
      return null;
    }

    const stepDuration = 1 / pattern.length;
    const swingAmount = this.config.swing * 0.1;
    const isOddStep = this.currentStep % 2 === 1;
    const swingOffset = isOddStep ? swingAmount : -swingAmount;

    if (this.phase >= stepDuration + swingOffset) {
      this.phase -= stepDuration + swingOffset;
      this.currentStep = (this.currentStep + 1) % pattern.length;
    }

    const note = pattern[this.currentStep];
    const velocity =
      this.config.velocityPattern[this.currentStep] ?? 1.0;
    const gate = this.config.gatePattern[this.currentStep] ?? this.config.gate;

    return {
      note: note ?? null,
      velocity: Math.max(0, Math.min(1, velocity)),
      gate: Math.max(0, Math.min(1, gate)),
    };
  }

  /**
   * Start arpeggiator
   */
  start(): void {
    this._isActive = true;
    this.phase = 0;
    this.currentStep = 0;
  }

  /**
   * Stop arpeggiator
   */
  stop(): void {
    this._isActive = false;
    if (!this.config.latch) {
      this.heldNotes = [];
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AdvancedArpeggiatorConfig>): void {
    this.config = { ...this.config, ...config };
    this.updatePhaseIncrement();
  }

  /**
   * Get configuration
   */
  getConfig(): AdvancedArpeggiatorConfig {
    return { ...this.config };
  }

  /**
   * Get active state
   */
  get isActive(): boolean {
    return this._isActive;
  }
}

