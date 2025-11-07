/**
 * AudioRenderer - Offline audio rendering for export
 * Renders audio to WAV, MP3, and other formats
 * @module export/AudioRenderer
 */

/**
 * Render function type
 */
export type RenderFunction = (context: OfflineAudioContext) => Promise<void> | void;

/**
 * WAV export options
 */
export interface WAVExportOptions {
  bitDepth?: number;
  float32?: boolean;
}

/**
 * MP3 export options
 */
export interface MP3ExportOptions {
  bitrate?: number;
  quality?: number;
}

/**
 * Project data structure
 */
export interface ProjectData {
  duration?: number;
  tracks?: unknown[];
  [key: string]: unknown;
}

/**
 * AudioRenderer - Offline audio rendering for export
 * Renders audio to WAV, MP3, and other formats
 */
export class AudioRenderer {
  private audioContext: AudioContext;
  private sampleRate: number;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.sampleRate = audioContext.sampleRate;
  }

  /**
   * Render audio to buffer
   * @param {RenderFunction} renderFunction - Function that sets up audio graph
   * @param {number} duration - Duration in seconds
   * @param {number} sampleRate - Sample rate (optional)
   * @returns {Promise<AudioBuffer>} Rendered audio buffer
   */
  async render(
    renderFunction: RenderFunction,
    duration: number,
    sampleRate: number | null = null
  ): Promise<AudioBuffer> {
    const rate = sampleRate || this.sampleRate;
    const length = Math.ceil(duration * rate);
    const numberOfChannels =
      this.audioContext.destination.channelCount || 2;

    const offlineContext = new OfflineAudioContext(
      numberOfChannels,
      length,
      rate
    );

    // Set up audio graph in offline context
    if (typeof renderFunction === 'function') {
      await renderFunction(offlineContext);
    }

    // Render
    const renderedBuffer = await offlineContext.startRendering();
    return renderedBuffer;
  }

  /**
   * Render project to audio buffer
   * @param {ProjectData} project - Project data
   * @param {number} startTime - Start time in seconds
   * @param {number} endTime - End time in seconds
   * @returns {Promise<AudioBuffer>} Rendered audio buffer
   */
  async renderProject(
    project: ProjectData,
    startTime: number = 0,
    endTime: number | null = null
  ): Promise<AudioBuffer> {
    const duration =
      endTime !== null ? endTime - startTime : project.duration || 60;

    return this.render(async (offlineContext: OfflineAudioContext) => {
      // Set up project audio graph
      // This would connect all tracks, effects, etc.
      const masterGain = offlineContext.createGain();
      masterGain.connect(offlineContext.destination);

      // Render each track
      // Implementation would depend on project structure
    }, duration);
  }

  /**
   * Convert AudioBuffer to WAV
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {WAVExportOptions} options - Export options
   * @returns {Blob} WAV blob
   */
  bufferToWAV(buffer: AudioBuffer, options: WAVExportOptions = {}): Blob {
    const { bitDepth = 16, float32 = false } = options;

    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string): void => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, float32 ? 3 : 1, true); // audio format (1=PCM, 3=Float)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    const maxValue = Math.pow(2, bitDepth - 1) - 1;

    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        const sample = channelData[i];
        let value: number;

        if (float32) {
          view.setFloat32(offset, sample, true);
          offset += 4;
        } else {
          value = Math.max(-1, Math.min(1, sample));
          value = Math.floor(value * maxValue);

          if (bitDepth === 16) {
            view.setInt16(offset, value, true);
            offset += 2;
          } else if (bitDepth === 24) {
            value = value << 8;
            view.setUint8(offset, value & 0xff);
            view.setUint8(offset + 1, (value >> 8) & 0xff);
            view.setUint8(offset + 2, (value >> 16) & 0xff);
            offset += 3;
          } else if (bitDepth === 32) {
            view.setInt32(offset, value, true);
            offset += 4;
          }
        }
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Export to WAV file
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {string} filename - Filename
   * @param {WAVExportOptions} options - Export options
   */
  exportWAV(
    buffer: AudioBuffer,
    filename: string = 'export.wav',
    options: WAVExportOptions = {}
  ): void {
    const blob = this.bufferToWAV(buffer, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Convert buffer to MP3 (requires external library)
   * Uses lamejs for MP3 encoding with fallback to WAV
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {MP3ExportOptions} options - Export options
   * @returns {Promise<Blob>} MP3 blob
   */
  async bufferToMP3(
    buffer: AudioBuffer,
    options: MP3ExportOptions = {}
  ): Promise<Blob> {
    try {
      // Try to use lamejs if available
      if (typeof window !== 'undefined' && (window as { lamejs?: unknown }).lamejs) {
        const lamejs = (window as unknown as { lamejs: { Mp3Encoder: new (channels: number, sampleRate: number, bitrate: number) => { encodeBuffer: (left: Int16Array, right: Int16Array) => Int8Array; flush: () => Int8Array } } }).lamejs;
        const { bitrate = 128 } = options;

        const sampleRate = buffer.sampleRate;
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length;

        // Create MP3 encoder
        const mp3encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, bitrate) as { encodeBuffer: (left: Int16Array, right: Int16Array) => Int8Array; flush: () => Int8Array };

        // Convert AudioBuffer to PCM samples
        const samples: Int16Array[] = [];
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          const pcm = new Int16Array(length);
          for (let i = 0; i < length; i++) {
            // Convert float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
          samples.push(pcm);
        }

        // Encode to MP3
        const mp3Data: Int8Array[] = [];
        const sampleBlockSize = 1152; // MP3 frame size

        for (let i = 0; i < length; i += sampleBlockSize) {
          const leftChannel = samples[0];
          if (!leftChannel) {
            continue;
          }
          const left = leftChannel.subarray(i, i + sampleBlockSize);
          const rightChannel = numberOfChannels > 1 ? samples[1] : leftChannel;
          const right = rightChannel ? rightChannel.subarray(i, i + sampleBlockSize) : left;

          const mp3buf = mp3encoder.encodeBuffer(left, right);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }

        // Flush encoder
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        // Combine all MP3 data
        const totalLength = mp3Data.reduce((sum, arr) => sum + arr.length, 0);
        const combined = new Int8Array(totalLength);
        let offset = 0;
        mp3Data.forEach((arr) => {
          combined.set(arr, offset);
          offset += arr.length;
        });

        return new Blob([combined], { type: 'audio/mpeg' });
      }

      // Fallback to WAV if lamejs is not available
      return this.bufferToWAV(buffer, {});
    } catch {
      // If encoding fails, fallback to WAV
      return this.bufferToWAV(buffer, {});
    }
  }

  /**
   * Export to MP3 file
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {string} filename - Filename
   * @param {MP3ExportOptions} options - Export options
   */
  async exportMP3(
    buffer: AudioBuffer,
    filename: string = 'export.mp3',
    options: MP3ExportOptions = {}
  ): Promise<void> {
    const blob = await this.bufferToMP3(buffer, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { AudioRenderer: typeof AudioRenderer }).AudioRenderer =
    AudioRenderer;
}

