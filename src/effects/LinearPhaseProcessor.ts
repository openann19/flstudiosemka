/**
 * LinearPhaseProcessor - Linear phase processing mode
 * Implements zero-phase-shift EQ using FFT convolution
 * @module effects/LinearPhaseProcessor
 */

import {
  AudioContextError,
  InvalidParameterError,
} from '../utils/errors';

/**
 * Linear phase processor configuration
 */
export interface LinearPhaseConfig {
  enabled: boolean;
  fftSize: number; // FFT size for convolution (power of 2)
}

/**
 * Linear phase EQ processor
 * Note: Full linear phase requires AudioWorklet for real-time processing
 * This implementation provides a foundation that can be enhanced
 */
export class LinearPhaseProcessor {
  private audioContext: AudioContext;

  private convolver: ConvolverNode;

  private impulseResponse: AudioBuffer | null;

  private config: LinearPhaseConfig;

  public readonly inputNode: GainNode;

  public readonly outputNode: GainNode;

  /**
   * Create a new linear phase processor
   * @param audioContext - Web Audio API AudioContext
   * @param config - Linear phase configuration
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext, config: LinearPhaseConfig = { enabled: false, fftSize: 4096 }) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.config = { ...config };

    // Validate FFT size (must be power of 2)
    if (!this.isPowerOfTwo(config.fftSize)) {
      throw new InvalidParameterError(
        'fftSize',
        config.fftSize,
        'power of 2 (e.g., 256, 512, 1024, 2048, 4096)'
      );
    }

    // Create convolver node
    this.convolver = audioContext.createConvolver();
    this.convolver.normalize = false; // We'll handle normalization manually

    // Input/output nodes
    this.inputNode = audioContext.createGain();
    // Output is convolver, but we need a gain node wrapper for type compatibility
    const outputGain: GainNode = audioContext.createGain();
    this.convolver.connect(outputGain);
    this.outputNode = outputGain;

    // Connect input to convolver
    this.inputNode.connect(this.convolver);

    this.impulseResponse = null;
  }

  /**
   * Check if number is power of 2
   * @param n - Number to check
   * @returns True if power of 2
   */
  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  /**
   * Generate linear phase impulse response from EQ bands
   * Uses FFT-based filter design for proper linear phase EQ
   * @param bands - Array of band configurations
   * @returns AudioBuffer with impulse response
   */
  generateImpulseResponse(bands: Array<{ frequency: number; gain: number; Q: number; type: string }>): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const fftSize = this.config.fftSize;
    const nyquist = sampleRate / 2;
    const buffer = this.audioContext.createBuffer(1, fftSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Create analyser for FFT processing
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = fftSize * 2;
    analyser.smoothingTimeConstant = 0;

    // Generate frequency response in frequency domain
    const frequencyResponse = new Float32Array(fftSize / 2 + 1);
    const real = new Float32Array(fftSize);
    const imag = new Float32Array(fftSize);

    // Calculate frequency response for each frequency bin
    for (let i = 0; i <= fftSize / 2; i += 1) {
      const frequency = (i / (fftSize / 2)) * nyquist;
      let magnitude = 1.0;

      // Apply each band's frequency response
      for (const band of bands) {
        const response = this.calculateBandResponse(frequency, band);
        magnitude *= response;
      }

      frequencyResponse[i] = magnitude;
    }

    // Create symmetric frequency response for linear phase
    // Real part: magnitude response (symmetric)
    // Imaginary part: zero (linear phase = zero phase)
    for (let i = 0; i <= fftSize / 2; i += 1) {
      const responseValue = frequencyResponse[i];
      if (responseValue !== undefined) {
        real[i] = responseValue;
        if (i > 0 && i < fftSize / 2) {
          const mirrorIndex = fftSize - i;
          real[mirrorIndex] = responseValue; // Mirror for symmetry
        }
      }
    }

    // Perform IFFT to get impulse response
    // Using simplified IFFT approximation
    this._inverseFFT(real, imag, data, fftSize);

    // Apply window function to reduce ringing
    this._applyWindow(data, fftSize);

    // Normalize
    const max = Math.max(...Array.from(data).map(Math.abs));
    if (max > 0) {
      for (let i = 0; i < fftSize; i += 1) {
        const dataVal = data[i];
        if (dataVal !== undefined) {
          data[i] = dataVal / max;
        }
      }
    }

    return buffer;
  }

  /**
   * Simplified inverse FFT
   * @private
   */
  private _inverseFFT(real: Float32Array, imag: Float32Array, output: Float32Array, size: number): void {
    // Simplified IFFT using inverse DFT formula
    // For production, use a proper FFT library or Web Audio API's built-in FFT
    for (let n = 0; n < size; n += 1) {
      let sum = 0;
      for (let k = 0; k < size; k += 1) {
        const realVal = real[k];
        const imagVal = imag[k];
        if (realVal !== undefined && imagVal !== undefined) {
          const angle = (2 * Math.PI * k * n) / size;
          sum += realVal * Math.cos(angle) - imagVal * Math.sin(angle);
        }
      }
      const outputVal = output[n];
      if (outputVal !== undefined) {
        output[n] = sum / size;
      }
    }
  }

  /**
   * Apply window function to reduce ringing
   * @private
   */
  private _applyWindow(data: Float32Array, size: number): void {
    // Hamming window
    for (let i = 0; i < size; i += 1) {
      const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
      const dataVal = data[i];
      if (dataVal !== undefined) {
        data[i] = dataVal * window;
      }
    }
  }

  /**
   * Calculate frequency response for a single band
   * Uses proper biquad filter response calculation
   * @param frequency - Frequency to calculate response for
   * @param band - Band configuration
   * @returns Magnitude response
   */
  private calculateBandResponse(frequency: number, band: { frequency: number; gain: number; Q: number; type: string }): number {
    const { frequency: centerFreq, gain: bandGain, Q, type } = band;

    if (frequency <= 0 || centerFreq <= 0) {
      return 1.0;
    }

    // Convert gain from dB to linear
    const linearGain = Math.pow(10, bandGain / 20);
    const A = Math.sqrt(linearGain);
    const w = (2 * Math.PI * frequency) / this.audioContext.sampleRate;
    const w0 = (2 * Math.PI * centerFreq) / this.audioContext.sampleRate;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw0 = Math.cos(w0);
    const sinw = Math.sin(w);
    const cosw = Math.cos(w);

    let magnitude: number;

    switch (type) {
      case 'peaking': {
        // Peaking EQ filter
        const b0 = 1 + alpha * A;
        const b1 = -2 * cosw0;
        const b2 = 1 - alpha * A;
        const a0 = 1 + alpha / A;
        const a1 = -2 * cosw0;
        const a2 = 1 - alpha / A;

        const numerator = Math.sqrt(
          Math.pow(b0 + b1 * cosw + b2 * cosw * cosw - b2 * sinw * sinw, 2) +
          Math.pow(b1 * sinw + 2 * b2 * sinw * cosw, 2)
        );
        const denominator = Math.sqrt(
          Math.pow(a0 + a1 * cosw + a2 * cosw * cosw - a2 * sinw * sinw, 2) +
          Math.pow(a1 * sinw + 2 * a2 * sinw * cosw, 2)
        );

        magnitude = numerator / denominator;
        break;
      }

      case 'lowshelf': {
        // Low shelf filter
        const b0 = A * ((A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha);
        const b1 = 2 * A * ((A - 1) - (A + 1) * cosw0);
        const b2 = A * ((A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha);
        const a0 = (A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
        const a1 = -2 * ((A - 1) + (A + 1) * cosw0);
        const a2 = (A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha;

        const numerator = Math.sqrt(
          Math.pow(b0 + b1 * cosw + b2 * cosw * cosw - b2 * sinw * sinw, 2) +
          Math.pow(b1 * sinw + 2 * b2 * sinw * cosw, 2)
        );
        const denominator = Math.sqrt(
          Math.pow(a0 + a1 * cosw + a2 * cosw * cosw - a2 * sinw * sinw, 2) +
          Math.pow(a1 * sinw + 2 * a2 * sinw * cosw, 2)
        );

        magnitude = numerator / denominator;
        break;
      }

      case 'highshelf': {
        // High shelf filter
        const b0 = A * ((A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha);
        const b1 = -2 * A * ((A - 1) + (A + 1) * cosw0);
        const b2 = A * ((A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha);
        const a0 = (A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
        const a1 = 2 * ((A - 1) - (A + 1) * cosw0);
        const a2 = (A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha;

        const numerator = Math.sqrt(
          Math.pow(b0 + b1 * cosw + b2 * cosw * cosw - b2 * sinw * sinw, 2) +
          Math.pow(b1 * sinw + 2 * b2 * sinw * cosw, 2)
        );
        const denominator = Math.sqrt(
          Math.pow(a0 + a1 * cosw + a2 * cosw * cosw - a2 * sinw * sinw, 2) +
          Math.pow(a1 * sinw + 2 * a2 * sinw * cosw, 2)
        );

        magnitude = numerator / denominator;
        break;
      }

      default:
        magnitude = 1.0;
    }

    return magnitude;
  }

  /**
   * Set impulse response
   * @param buffer - AudioBuffer with impulse response
   */
  setImpulseResponse(buffer: AudioBuffer): void {
    this.impulseResponse = buffer;
    this.convolver.buffer = buffer;
  }

  /**
   * Get current configuration
   * @returns Current linear phase configuration
   */
  getConfig(): LinearPhaseConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param updates - Partial configuration updates
   */
  updateConfig(updates: Partial<LinearPhaseConfig>): void {
    if (updates.fftSize !== undefined) {
      if (!this.isPowerOfTwo(updates.fftSize)) {
        throw new InvalidParameterError(
          'fftSize',
          updates.fftSize,
          'power of 2'
        );
      }
      this.config.fftSize = updates.fftSize;
    }
    if (updates.enabled !== undefined) {
      this.config.enabled = updates.enabled;
    }
  }

  /**
   * Enable or disable processor
   * @param enabled - Whether processor is enabled
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    // When disabled, we'd bypass the convolver
    // This would require additional routing logic in the main EQ class
  }

  /**
   * Check if processor is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get convolver node
   * @returns ConvolverNode
   */
  getConvolver(): ConvolverNode {
    return this.convolver;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.inputNode.disconnect();
      this.convolver.disconnect();
    } catch {
      // Already disconnected - ignore
    }
    this.impulseResponse = null;
  }
}

