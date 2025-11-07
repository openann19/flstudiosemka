/**
 * CPUMonitor - CPU usage monitoring and adaptive quality system
 * Monitors audio processing performance and adjusts quality settings
 * @module audio/synthesizer/utils/CPUMonitor
 */

/**
 * CPU usage levels
 */
export type CPULevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Quality settings based on CPU usage
 */
export interface QualitySettings {
  oversampling: 1 | 2 | 4 | 8;
  enablePolyBLEP: boolean;
  enableAnalogModeling: boolean;
  enableHighQualityFilters: boolean;
}

/**
 * CPU monitor for adaptive quality
 */
export class CPUMonitor {
  private samples: number[] = [];
  private readonly maxSamples: number = 100;
  private readonly sampleInterval: number = 100; // ms
  private currentLevel: CPULevel = 'low';
  private frameCount: number = 0;
  private lastFrameTime: number = 0;

  /**
   * Create a new CPU monitor
   */
  constructor() {
    this.lastFrameTime = performance.now();
  }

  /**
   * Record a frame processing time
   * Call this at the start of each audio processing frame
   */
  startFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount += 1;

    // Sample every N frames
    if (this.frameCount % this.sampleInterval === 0) {
      this.recordSample(frameTime);
    }
  }

  /**
   * Record a sample
   */
  private recordSample(frameTime: number): void {
    this.samples.push(frameTime);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.updateCPULevel();
  }

  /**
   * Update CPU level based on samples
   */
  private updateCPULevel(): void {
    if (this.samples.length < 10) {
      return;
    }

    const avgFrameTime = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const maxFrameTime = Math.max(...this.samples);

    // Assuming 128 sample buffer at 44.1kHz = ~2.9ms per buffer
    // Target: < 2ms = low, 2-4ms = medium, 4-6ms = high, > 6ms = critical
    if (avgFrameTime < 2 && maxFrameTime < 3) {
      this.currentLevel = 'low';
    } else if (avgFrameTime < 4 && maxFrameTime < 5) {
      this.currentLevel = 'medium';
    } else if (avgFrameTime < 6 && maxFrameTime < 8) {
      this.currentLevel = 'high';
    } else {
      this.currentLevel = 'critical';
    }
  }

  /**
   * Get current CPU level
   */
  getCPULevel(): CPULevel {
    return this.currentLevel;
  }

  /**
   * Get current quality settings based on CPU usage
   */
  getQualitySettings(): QualitySettings {
    switch (this.currentLevel) {
      case 'low':
        return {
          oversampling: 8,
          enablePolyBLEP: true,
          enableAnalogModeling: true,
          enableHighQualityFilters: true,
        };
      case 'medium':
        return {
          oversampling: 4,
          enablePolyBLEP: true,
          enableAnalogModeling: true,
          enableHighQualityFilters: true,
        };
      case 'high':
        return {
          oversampling: 2,
          enablePolyBLEP: true,
          enableAnalogModeling: false,
          enableHighQualityFilters: false,
        };
      case 'critical':
        return {
          oversampling: 1,
          enablePolyBLEP: false,
          enableAnalogModeling: false,
          enableHighQualityFilters: false,
        };
      default:
        return {
          oversampling: 2,
          enablePolyBLEP: true,
          enableAnalogModeling: false,
          enableHighQualityFilters: false,
        };
    }
  }

  /**
   * Get average frame time in milliseconds
   */
  getAverageFrameTime(): number {
    if (this.samples.length === 0) {
      return 0;
    }
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  /**
   * Get maximum frame time in milliseconds
   */
  getMaxFrameTime(): number {
    if (this.samples.length === 0) {
      return 0;
    }
    return Math.max(...this.samples);
  }

  /**
   * Reset monitoring data
   */
  reset(): void {
    this.samples = [];
    this.frameCount = 0;
    this.currentLevel = 'low';
    this.lastFrameTime = performance.now();
  }
}

