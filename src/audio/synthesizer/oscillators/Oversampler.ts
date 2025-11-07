/**
 * Oversampler - Oversampling processor with downsampling filters
 * Provides 2x, 4x, and 8x oversampling for anti-aliasing
 * @module audio/synthesizer/oscillators/Oversampler
 */

/**
 * Oversampling factor
 */
export type OversamplingFactor = 1 | 2 | 4 | 8;

/**
 * Oversampling processor
 */
export class Oversampler {
  private factor: OversamplingFactor;
  private readonly sampleRate: number;
  private readonly bufferSize: number;

  /**
   * Create a new oversampler
   * @param sampleRate - Audio sample rate
   * @param factor - Oversampling factor (1, 2, 4, or 8)
   * @param bufferSize - Buffer size for processing
   */
  constructor(sampleRate: number, factor: OversamplingFactor = 2, bufferSize: number = 128) {
    this.sampleRate = sampleRate;
    this.factor = factor;
    this.bufferSize = bufferSize;
    // Buffer is created on-demand during processing
  }

  /**
   * Set oversampling factor
   */
  setFactor(factor: OversamplingFactor): void {
    this.factor = factor;
    // Buffer is created on-demand during processing
  }

  /**
   * Get current oversampling factor
   */
  getFactor(): OversamplingFactor {
    return this.factor;
  }

  /**
   * Get oversampled sample rate
   */
  getOversampledSampleRate(): number {
    return this.sampleRate * this.factor;
  }

  /**
   * Get oversampled buffer size
   */
  getOversampledBufferSize(): number {
    return this.bufferSize * this.factor;
  }

  /**
   * Process input buffer with oversampling
   * @param input - Input audio buffer
   * @param processCallback - Callback to process oversampled data
   * @returns Downsampled output buffer
   */
  process(
    input: Float32Array,
    processCallback: (oversampled: Float32Array) => Float32Array
  ): Float32Array {
    if (this.factor === 1) {
      return processCallback(input);
    }

    // Upsample: linear interpolation
    const oversampled = this.upsample(input);

    // Process at higher sample rate
    const processed = processCallback(oversampled);

    // Downsample: low-pass filter + decimation
    return this.downsample(processed);
  }

  /**
   * Upsample input buffer
   */
  private upsample(input: Float32Array): Float32Array {
    const output = new Float32Array(input.length * this.factor);

    for (let i = 0; i < input.length; i += 1) {
      const value = input[i] ?? 0;
      const nextValue = input[i + 1] ?? value;

      for (let j = 0; j < this.factor; j += 1) {
        const t = j / this.factor;
        output[i * this.factor + j] = value * (1 - t) + nextValue * t;
      }
    }

    return output;
  }

  /**
   * Downsample with anti-aliasing filter
   */
  private downsample(input: Float32Array): Float32Array {
    const output = new Float32Array(input.length / this.factor);

    // Simple low-pass filter (moving average)
    const filterSize = this.factor;
    const filter = new Float32Array(filterSize);
    for (let i = 0; i < filterSize; i += 1) {
      filter[i] = 1 / filterSize;
    }

    for (let i = 0; i < output.length; i += 1) {
      let sum = 0;
      const startIdx = i * this.factor;

      for (let j = 0; j < filterSize; j += 1) {
        const idx = startIdx + j;
        if (idx < input.length) {
          sum += (input[idx] ?? 0) * (filter[j] ?? 0);
        }
      }

      output[i] = sum;
    }

    return output;
  }

  /**
   * Apply low-pass filter for anti-aliasing
   * @param buffer - Buffer to filter
   * @param cutoff - Cutoff frequency (normalized 0-1)
   */
  applyAntiAliasFilter(buffer: Float32Array, cutoff: number = 0.5): Float32Array {
    const filtered = new Float32Array(buffer.length);
    const alpha = Math.min(1, Math.max(0, cutoff));

    // Simple one-pole low-pass filter
    let y = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      y = alpha * (buffer[i] ?? 0) + (1 - alpha) * y;
      filtered[i] = y;
    }

    return filtered;
  }
}

