/**
 * FileUploadService - Process and validate uploaded audio files
 * Decodes audio files to AudioBuffer and manages sound library additions
 * @module services/FileUploadService
 */

import { FileLoadError, InvalidParameterError, AudioContextError } from '../utils/errors';

/**
 * Uploaded file result
 */
export interface UploadedFileResult {
  name: string;
  buffer: AudioBuffer;
  type: string;
  size: number;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  maxFileSize?: number; // Max file size in bytes (default: 50MB)
  allowedTypes?: string[]; // Allowed MIME types
  audioContext: AudioContext;
}

/**
 * File upload service
 * Handles audio file upload, validation, and decoding
 */
export class FileUploadService {
  private audioContext: AudioContext;
  private maxFileSize: number;
  private allowedTypes: string[];

  /**
   * Create a new FileUploadService instance
   * @param options - Upload options
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(options: FileUploadOptions) {
    if (!options.audioContext || !(options.audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext: options.audioContext });
    }

    this.audioContext = options.audioContext;
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB default
    this.allowedTypes = options.allowedTypes || [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mpeg3',
      'audio/x-mpeg-3',
      'audio/ogg',
      'audio/oga',
      'audio/opus',
      'audio/flac',
      'audio/aac',
      'audio/mp4',
      'audio/x-m4a',
      'audio/webm',
    ];
  }

  /**
   * Validate file before processing
   * @param file - File to validate
   * @throws FileLoadError if file is invalid
   */
  validateFile(file: File): void {
    if (!(file instanceof File)) {
      throw new InvalidParameterError('file', file, 'File object');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new FileLoadError(
        file.name,
        `File size (${this._formatBytes(file.size)}) exceeds maximum allowed size (${this._formatBytes(this.maxFileSize)})`,
        { size: file.size, maxSize: this.maxFileSize }
      );
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type) && file.type !== '') {
      throw new FileLoadError(
        file.name,
        `File type '${file.type}' is not supported. Allowed types: ${this.allowedTypes.join(', ')}`,
        { type: file.type, allowedTypes: this.allowedTypes }
      );
    }

    // Check file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['wav', 'mp3', 'ogg', 'flac', 'aac', 'm4a', 'webm'];
    if (file.type === '' && extension && !allowedExtensions.includes(extension)) {
      throw new FileLoadError(
        file.name,
        `File extension '.${extension}' is not supported`,
        { extension, allowedExtensions }
      );
    }
  }

  /**
   * Process single file
   * @param file - File to process
   * @returns Promise resolving to uploaded file result
   * @throws FileLoadError if file cannot be processed
   */
  async processFile(file: File): Promise<UploadedFileResult> {
    try {
      this.validateFile(file);

      // Decode audio file
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));

      return {
        name: file.name,
        buffer: audioBuffer,
        type: file.type || 'audio/wav',
        size: file.size,
      };
    } catch (error) {
      if (error instanceof FileLoadError || error instanceof InvalidParameterError) {
        throw error;
      }

      // Handle decode errors
      if (error instanceof Error) {
        throw new FileLoadError(file.name, `Failed to decode audio: ${error.message}`, { originalError: error });
      }

      throw new FileLoadError(file.name, 'Unknown error processing file', { error });
    }
  }

  /**
   * Process multiple files
   * @param files - Array of files to process
   * @returns Promise resolving to array of uploaded file results
   */
  async processFiles(files: File[]): Promise<UploadedFileResult[]> {
    if (!Array.isArray(files)) {
      throw new InvalidParameterError('files', files, 'array');
    }

    const results: UploadedFileResult[] = [];
    const errors: Array<{ fileName: string; error: Error }> = [];

    // Process files sequentially to avoid overwhelming the audio context
    for (const file of files) {
      try {
        const result = await this.processFile(file);
        results.push(result);
      } catch (error) {
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    // If all files failed, throw error
    if (results.length === 0 && errors.length > 0) {
      throw new FileLoadError(
        'Multiple files',
        `Failed to process all files: ${errors.map((e) => e.fileName).join(', ')}`,
        { errors }
      );
    }

    // Log errors but continue with successful files
    if (errors.length > 0) {
      // In production, you might want to notify the user about failed files
      // For now, we'll just include successful files
    }

    return results;
  }

  /**
   * Format bytes to human-readable string
   * @private
   */
  private _formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i] ?? 'Bytes'}`;
  }

  /**
   * Update max file size
   * @param maxSize - Maximum file size in bytes
   */
  setMaxFileSize(maxSize: number): void {
    if (typeof maxSize !== 'number' || maxSize <= 0) {
      throw new InvalidParameterError('maxSize', maxSize, 'positive number');
    }

    this.maxFileSize = maxSize;
  }

  /**
   * Update allowed file types
   * @param types - Array of allowed MIME types
   */
  setAllowedTypes(types: string[]): void {
    if (!Array.isArray(types)) {
      throw new InvalidParameterError('types', types, 'array');
    }

    this.allowedTypes = [...types];
  }

  /**
   * Get current max file size
   * @returns Max file size in bytes
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Get allowed file types
   * @returns Array of allowed MIME types
   */
  getAllowedTypes(): string[] {
    return [...this.allowedTypes];
  }
}

