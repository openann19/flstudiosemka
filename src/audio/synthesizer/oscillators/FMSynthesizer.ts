/**
 * FMSynthesizer - Frequency Modulation synthesis engine
 * Supports 2-op, 4-op, and 8-op FM algorithms
 * @module audio/synthesizer/oscillators/FMSynthesizer
 */

/**
 * FM operator configuration
 */
export interface FMOperator {
  frequency: number; // Frequency in Hz
  ratio: number; // Frequency ratio (1.0 = fundamental)
  amplitude: number; // 0 to 1
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  phase: number; // Initial phase (0 to 1)
}

/**
 * FM algorithm type
 */
export type FMAlgorithm = '2-op' | '4-op' | '8-op';

/**
 * FM algorithm configuration
 */
export interface FMAlgorithmConfig {
  algorithm: FMAlgorithm;
  operators: FMOperator[];
  feedback: number[]; // Feedback amount per operator (0 to 1)
  modulationMatrix: number[][]; // Modulation matrix (operator i modulates operator j)
}

/**
 * FM synthesis engine
 */
export class FMSynthesizer {
  private sampleRate: number;
  private config: FMAlgorithmConfig;
  private operatorPhases: number[] = [];
  private operatorEnvelopes: number[] = [];
  private envelopeStages: ('attack' | 'decay' | 'sustain' | 'release')[] = [];
  private envelopeTimes: number[] = [];
  private isActive: boolean = false;

  /**
   * Create a new FM synthesizer
   * @param sampleRate - Audio sample rate
   * @param config - FM algorithm configuration
   */
  constructor(sampleRate: number, config: FMAlgorithmConfig) {
    this.sampleRate = sampleRate;
    this.config = config;
    this.initializeOperators();
  }

  /**
   * Initialize operators
   */
  private initializeOperators(): void {
    const numOps = this.config.operators.length;
    this.operatorPhases = new Array(numOps).fill(0);
    this.operatorEnvelopes = new Array(numOps).fill(0);
    this.envelopeStages = new Array(numOps).fill('attack' as const);
    this.envelopeTimes = new Array(numOps).fill(0);
  }

  /**
   * Start FM synthesis (trigger note)
   */
  start(): void {
    this.isActive = true;
    this.initializeOperators();
    this.config.operators.forEach((op, i) => {
      this.operatorPhases[i] = op.phase;
      this.envelopeStages[i] = 'attack';
      this.envelopeTimes[i] = 0;
      this.operatorEnvelopes[i] = 0;
    });
  }

  /**
   * Stop FM synthesis (release note)
   */
  stop(): void {
    this.config.operators.forEach((_op, i) => {
      this.envelopeStages[i] = 'release';
      this.envelopeTimes[i] = 0;
    });
  }

  /**
   * Update operator envelope
   */
  private updateEnvelope(operatorIndex: number): void {
    const op = this.config.operators[operatorIndex];
    if (!op) {
      return;
    }

    const stage = this.envelopeStages[operatorIndex];
    let envelope = this.operatorEnvelopes[operatorIndex] ?? 0;
    let time = this.envelopeTimes[operatorIndex] ?? 0;

    switch (stage) {
      case 'attack': {
        const attackTime = op.envelope.attack * this.sampleRate;
        if (time < attackTime && attackTime > 0) {
          envelope = time / attackTime;
        } else {
          envelope = 1;
          this.envelopeStages[operatorIndex] = 'decay';
          time = 0;
        }
        break;
      }
      case 'decay': {
        const decayTime = op.envelope.decay * this.sampleRate;
        const sustainLevel = op.envelope.sustain;
        if (time < decayTime && decayTime > 0) {
          envelope = 1 - (time / decayTime) * (1 - sustainLevel);
        } else {
          envelope = sustainLevel;
          this.envelopeStages[operatorIndex] = 'sustain';
          time = 0;
        }
        break;
      }
      case 'sustain': {
        envelope = op.envelope.sustain;
        break;
      }
      case 'release': {
        const releaseTime = op.envelope.release * this.sampleRate;
        const sustainLevel = op.envelope.sustain;
        if (time < releaseTime && releaseTime > 0) {
          envelope = sustainLevel * (1 - time / releaseTime);
        } else {
          envelope = 0;
          this.isActive = false;
        }
        break;
      }
    }

    this.operatorEnvelopes[operatorIndex] = envelope;
    this.envelopeTimes[operatorIndex] = time + 1;
  }

  /**
   * Generate next sample
   * @param baseFrequency - Base frequency (carrier frequency)
   * @returns Next sample value (-1 to 1)
   */
  generate(baseFrequency: number): number {
    if (!this.isActive) {
      return 0;
    }

    const numOps = this.config.operators.length;
    const operatorOutputs: number[] = new Array(numOps).fill(0);

    // Process operators in order
    for (let i = 0; i < numOps; i += 1) {
      this.updateEnvelope(i);

      const op = this.config.operators[i];
      if (!op) {
        continue;
      }

      // Calculate phase increment
      const opFrequency = baseFrequency * op.ratio;
      const phaseIncrement = opFrequency / this.sampleRate;

      // Calculate modulation from other operators
      let modulation = 0;
      for (let j = 0; j < numOps; j += 1) {
        if (i !== j && this.config.modulationMatrix[j]?.[i]) {
          const output = operatorOutputs[j];
          if (output !== undefined) {
            modulation += output * (this.config.modulationMatrix[j]?.[i] ?? 0);
          }
        }
      }

      // Add feedback
      if (this.config.feedback[i]) {
        const output = operatorOutputs[i];
        if (output !== undefined) {
          modulation += output * (this.config.feedback[i] ?? 0);
        }
      }

      // Generate operator output (sine wave with modulation)
      const phase = (this.operatorPhases[i] ?? 0) + modulation;
      operatorOutputs[i] = Math.sin(phase * Math.PI * 2) * (op.amplitude ?? 0) * (this.operatorEnvelopes[i] ?? 0);

      // Advance phase
      this.operatorPhases[i] = ((this.operatorPhases[i] ?? 0) + phaseIncrement) % 1;
    }

    // Sum operator outputs (typically use first operator as carrier)
    return Math.max(-1, Math.min(1, operatorOutputs[0] ?? 0));
  }

  /**
   * Set operator configuration
   */
  setOperator(index: number, operator: Partial<FMOperator>): void {
    if (this.config.operators[index]) {
      this.config.operators[index] = { ...this.config.operators[index], ...operator };
    }
  }

  /**
   * Get operator configuration
   */
  getOperator(index: number): FMOperator | undefined {
    return this.config.operators[index];
  }

  /**
   * Check if synthesizer is active
   */
  isPlaying(): boolean {
    return this.isActive;
  }
}

