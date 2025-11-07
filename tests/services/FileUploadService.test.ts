/**
 * FileUploadService unit tests
 * Tests file upload and processing
 */

import { FileUploadService } from '../../src/services/FileUploadService';
import { FileLoadError } from '../../src/utils/errors';

describe('FileUploadService', () => {
  let audioContext: AudioContext;
  let service: FileUploadService;

  beforeEach(() => {
    audioContext = new AudioContext();
    service = new FileUploadService({ audioContext });
  });

  afterEach(async () => {
    await audioContext.close();
  });

  describe('validateFile', () => {
    it('should validate valid audio file', () => {
      const file = new File(['test'], 'test.wav', { type: 'audio/wav' });
      expect(() => service.validateFile(file)).not.toThrow();
    });

    it('should throw error for file too large', () => {
      service.setMaxFileSize(100); // 100 bytes
      const largeFile = new File([new ArrayBuffer(200)], 'test.wav', { type: 'audio/wav' });
      expect(() => service.validateFile(largeFile)).toThrow(FileLoadError);
    });

    it('should throw error for invalid file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(() => service.validateFile(file)).toThrow(FileLoadError);
    });
  });

  describe('processFile', () => {
    it('should process valid audio file', async () => {
      // Create a minimal WAV file
      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);
      // RIFF header
      view.setUint32(0, 0x46464952, true); // "RIFF"
      view.setUint32(4, 36, true); // File size
      view.setUint32(8, 0x45564157, true); // "WAVE"
      // fmt chunk
      view.setUint32(12, 0x20746d66, true); // "fmt "
      view.setUint32(16, 16, true); // Chunk size
      view.setUint16(20, 1, true); // Audio format (PCM)
      view.setUint16(22, 1, true); // Channels
      view.setUint32(24, 44100, true); // Sample rate
      view.setUint32(28, 88200, true); // Byte rate
      view.setUint16(32, 2, true); // Block align
      view.setUint16(34, 16, true); // Bits per sample
      // data chunk
      view.setUint32(36, 0x61746164, true); // "data"
      view.setUint32(40, 0, true); // Data size

      const file = new File([wavHeader], 'test.wav', { type: 'audio/wav' });

      // Mock decodeAudioData to succeed
      const originalDecode = audioContext.decodeAudioData;
      audioContext.decodeAudioData = jest.fn(() =>
        Promise.resolve(audioContext.createBuffer(1, 44100, 44100))
      );

      try {
        const result = await service.processFile(file);
        expect(result.name).toBe('test.wav');
        expect(result.buffer).toBeDefined();
      } finally {
        audioContext.decodeAudioData = originalDecode;
      }
    });

    it('should throw error for invalid file', async () => {
      const file = new File(['invalid'], 'test.txt', { type: 'text/plain' });

      await expect(service.processFile(file)).rejects.toThrow(FileLoadError);
    });
  });

  describe('processFiles', () => {
    it('should process multiple files', async () => {
      const wavHeader = new ArrayBuffer(44);
      const file1 = new File([wavHeader], 'test1.wav', { type: 'audio/wav' });
      const file2 = new File([wavHeader], 'test2.wav', { type: 'audio/wav' });

      // Mock decodeAudioData
      const originalDecode = audioContext.decodeAudioData;
      audioContext.decodeAudioData = jest.fn(() =>
        Promise.resolve(audioContext.createBuffer(1, 44100, 44100))
      );

      try {
        const results = await service.processFiles([file1, file2]);
        expect(results.length).toBe(2);
      } finally {
        audioContext.decodeAudioData = originalDecode;
      }
    });
  });
});

