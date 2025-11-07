/**
 * WavetableImporter - Import wavetables from audio files
 * Supports WAV and AIFF formats
 * @module audio/synthesizer/utils/WavetableImporter
 */

/**
 * Wavetable import result
 */
export interface WavetableImportResult {
  wavetable: Float32Array;
  sampleRate: number;
  channels: number;
  length: number;
}

/**
 * Wavetable importer
 */
export class WavetableImporter {
  /**
   * Import wavetable from audio file
   * @param file - Audio file (File or Blob)
   * @param tableSize - Target wavetable size (optional)
   * @returns Promise resolving to wavetable data
   */
  static async importFromFile(
    file: File | Blob,
    tableSize?: number
  ): Promise<WavetableImportResult> {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return this.processAudioBuffer(audioBuffer, tableSize);
    } catch (error) {
      throw new Error(`Failed to decode audio file: ${error}`);
    }
  }

  /**
   * Import wavetable from audio buffer
   * @param audioBuffer - AudioBuffer from Web Audio API
   * @param tableSize - Target wavetable size (optional)
   * @returns Wavetable data
   */
  static processAudioBuffer(
    audioBuffer: AudioBuffer,
    tableSize?: number
  ): WavetableImportResult {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Use first channel or mix all channels
    const channelData = audioBuffer.getChannelData(0);
    let wavetable: Float32Array;

    if (tableSize && tableSize !== length) {
      // Resample to target size
      wavetable = this.resample(channelData, tableSize);
    } else {
      wavetable = new Float32Array(channelData);
    }

    // Normalize
    this.normalize(wavetable);

    return {
      wavetable,
      sampleRate,
      channels,
      length: wavetable.length,
    };
  }

  /**
   * Resample audio data to target size
   */
  private static resample(source: Float32Array, targetSize: number): Float32Array {
    const sourceSize = source.length;
    const ratio = sourceSize / targetSize;
    const result = new Float32Array(targetSize);

    for (let i = 0; i < targetSize; i += 1) {
      const sourceIndex = i * ratio;
      const lowerIndex = Math.floor(sourceIndex);
      const upperIndex = Math.min(lowerIndex + 1, sourceSize - 1);
      const fraction = sourceIndex - lowerIndex;

      result[i] =
        (source[lowerIndex] ?? 0) * (1 - fraction) + (source[upperIndex] ?? 0) * fraction;
    }

    return result;
  }

  /**
   * Normalize wavetable to -1 to 1 range
   */
  private static normalize(wavetable: Float32Array): void {
    let max = 0;
    for (let i = 0; i < wavetable.length; i += 1) {
      const abs = Math.abs(wavetable[i] ?? 0);
      if (abs > max) {
        max = abs;
      }
    }

    if (max > 0) {
      const scale = 1 / max;
      for (let i = 0; i < wavetable.length; i += 1) {
        wavetable[i] = (wavetable[i] ?? 0) * scale;
      }
    }
  }

  /**
   * Extract single cycle from audio
   * @param audioBuffer - Audio buffer
   * @param cycleLength - Length of cycle in samples
   * @returns Single cycle wavetable
   */
  static extractCycle(audioBuffer: AudioBuffer, cycleLength: number): Float32Array {
    const channelData = audioBuffer.getChannelData(0);
    const cycle = new Float32Array(cycleLength);

    for (let i = 0; i < cycleLength; i += 1) {
      cycle[i] = channelData[i] ?? 0;
    }

    this.normalize(cycle);
    return cycle;
  }

  /**
   * Create wavetable from audio URL
   * @param url - Audio file URL
   * @param tableSize - Target wavetable size (optional)
   * @returns Promise resolving to wavetable data
   */
  static async importFromURL(
    url: string,
    tableSize?: number
  ): Promise<WavetableImportResult> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    const blob = await response.blob();
    return this.importFromFile(blob, tableSize);
  }
}

