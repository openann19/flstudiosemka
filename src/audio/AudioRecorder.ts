/**
 * AudioRecorder - Multi-track audio recording system
 * Records audio to timeline/playlist with input monitoring
 * @module audio/AudioRecorder
 */

import {
  AudioContextError,
  StateError,
  ValidationUtils,
} from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Recorded buffer metadata
 */
interface RecordedBufferData {
  buffer: AudioBuffer;
  startTime: number;
  duration: number;
}

/**
 * Recording completion callback
 */
export type RecordingCompleteCallback = (trackId: string, buffer: AudioBuffer) => void;

/**
 * Multi-track audio recording system with input monitoring
 */
export class AudioRecorder {
  private audioContext: AudioContext;

  private mediaStream: MediaStream | null;

  private mediaSource: MediaStreamAudioSourceNode | null;

  private mediaRecorder: MediaRecorder | null;

  private recordingChunks: Blob[];

  private isRecording: boolean;

  private isArmed: boolean;

  private monitoring: boolean;

  private recordStartTime: number | null;

  private recordedBuffers: Map<string, RecordedBufferData>;

  private monitorGain: GainNode | null;

  private inputGain: GainNode | null;

  private recorderDestination: MediaStreamAudioDestinationNode | null;

  public onRecordingComplete?: RecordingCompleteCallback;

  /**
   * Create a new AudioRecorder instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.mediaStream = null;
    this.mediaSource = null;
    this.mediaRecorder = null;
    this.recordingChunks = [];
    this.isRecording = false;
    this.isArmed = false;
    this.monitoring = false;
    this.recordStartTime = null;
    this.recordedBuffers = new Map<string, RecordedBufferData>();
    this.monitorGain = null;
    this.inputGain = null;
    this.recorderDestination = null;
  }

  /**
   * Initialize recording with user media
   * @param constraints - Media constraints (optional)
   * @returns Promise resolving to true if successful
   * @throws AudioContextError if initialization fails
   */
  async initialize(constraints: MediaStreamConstraints = {}): Promise<boolean> {
    try {
      const defaultConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
      };

      const mergedConstraints: MediaStreamConstraints = {
        ...defaultConstraints,
        ...constraints,
        audio: constraints.audio && typeof constraints.audio === 'object'
          ? { ...(defaultConstraints.audio as MediaTrackConstraints), ...constraints.audio }
          : defaultConstraints.audio,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(mergedConstraints);

      this.mediaSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create gain nodes for monitoring and recording
      this.inputGain = this.audioContext.createGain();
      this.monitorGain = this.audioContext.createGain();
      this.monitorGain.gain.value = 0; // Start muted

      this.mediaSource.connect(this.inputGain);

      return true;
    } catch (error) {
      logger.error('AudioRecorder: Failed to initialize', error);
      throw new AudioContextError('Failed to initialize audio recording', { error });
    }
  }

  /**
   * Arm track for recording
   * @param trackId - Track ID
   * @param arm - Whether to arm (default: true)
   * @throws InvalidParameterError if trackId is invalid
   */
  armTrack(trackId: string, arm: boolean = true): void {
    try {
      ValidationUtils.validateString(trackId, 'trackId');

      this.isArmed = arm;
      if (arm && !this.mediaSource) {
        this.initialize().catch((err) => {
          logger.error('AudioRecorder: Failed to initialize for arming', err);
        });
      }
    } catch (error) {
      logger.error('AudioRecorder.armTrack error:', error);
      throw error;
    }
  }

  /**
   * Enable/disable input monitoring
   * @param enable - Whether to enable monitoring
   * @param volume - Monitor volume 0-1 (default: 0.5)
   * @throws InvalidParameterError if volume is invalid
   */
  setMonitoring(enable: boolean, volume: number = 0.5): void {
    try {
      ValidationUtils.validateGain(volume, 'volume');

      this.monitoring = enable;
      if (this.monitorGain) {
        this.monitorGain.gain.value = enable ? volume : 0;
      }

      // Connect/disconnect monitor
      if (enable && this.inputGain && this.monitorGain) {
        try {
          this.inputGain.connect(this.monitorGain);
          this.monitorGain.connect(this.audioContext.destination);
        } catch {
          // Already connected - ignore
          logger.debug('AudioRecorder: Monitor already connected');
        }
      } else if (this.monitorGain) {
        try {
          this.monitorGain.disconnect();
        } catch {
          // Already disconnected - ignore
          logger.debug('AudioRecorder: Monitor already disconnected');
        }
      }
    } catch (error) {
      logger.error('AudioRecorder.setMonitoring error:', error);
      throw error;
    }
  }

  /**
   * Start recording
   * @param trackId - Track ID to record to
   * @returns Promise resolving when recording starts
   * @throws StateError if already recording or track not armed
   * @throws AudioContextError if initialization fails
   */
  async startRecording(trackId: string): Promise<void> {
    try {
      ValidationUtils.validateString(trackId, 'trackId');

      if (this.isRecording) {
        throw new StateError('Already recording', 'recording', 'idle');
      }

      if (!this.isArmed) {
        throw new StateError('Track not armed', 'idle', 'armed');
      }

      if (!this.mediaSource) {
        await this.initialize();
      }

      if (!this.mediaStream) {
        throw new AudioContextError('Media stream not available');
      }

      // Create MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      };

      // Fallback to default if codec not supported
      if (options.mimeType && !MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = '';
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.recordingChunks = [];
      this.recordStartTime = this.audioContext.currentTime;

      this.mediaRecorder.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async (): Promise<void> => {
        try {
          const blob = new Blob(this.recordingChunks, {
            type: options.mimeType || 'audio/webm',
          });
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

          this.recordedBuffers.set(trackId, {
            buffer: audioBuffer,
            startTime: this.recordStartTime || 0,
            duration: audioBuffer.duration,
          });

          // Trigger event
          if (this.onRecordingComplete) {
            this.onRecordingComplete(trackId, audioBuffer);
          }
        } catch (error) {
          logger.error('AudioRecorder: Failed to process recording', error);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;

      // Connect input to recording destination
      if (this.inputGain) {
        const recorderDestination = this.audioContext.createMediaStreamDestination();
        this.inputGain.connect(recorderDestination);
        this.recorderDestination = recorderDestination;
      }
    } catch (error) {
      logger.error('AudioRecorder: Failed to start recording', error);
      throw error;
    }
  }

  /**
   * Stop recording
   * @returns Promise resolving to recorded AudioBuffer or null if not recording
   */
  async stopRecording(): Promise<AudioBuffer | null> {
    if (!this.isRecording || !this.mediaRecorder) {
      return null;
    }

    return new Promise<AudioBuffer | null>((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async (): Promise<void> => {
        try {
          const blob = new Blob(this.recordingChunks, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

          this.isRecording = false;
          this.recordStartTime = null;

          // Disconnect recorder destination
          if (this.recorderDestination && this.inputGain) {
            this.inputGain.disconnect(this.recorderDestination);
            this.recorderDestination = null;
          }

          resolve(audioBuffer);
        } catch (error) {
          logger.error('AudioRecorder: Failed to process recording', error);
          resolve(null);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get recorded buffer for a track
   * @param trackId - Track ID
   * @returns Recorded AudioBuffer or null if not found
   */
  getRecordedBuffer(trackId: string): AudioBuffer | null {
    const record = this.recordedBuffers.get(trackId);
    return record ? record.buffer : null;
  }

  /**
   * Clear recorded buffer for a track
   * @param trackId - Track ID
   */
  clearRecordedBuffer(trackId: string): void {
    this.recordedBuffers.delete(trackId);
  }

  /**
   * Set input gain
   * @param gain - Gain value 0-1
   * @throws InvalidParameterError if gain is invalid
   */
  setInputGain(gain: number): void {
    try {
      ValidationUtils.validateGain(gain, 'gain');
      if (this.inputGain) {
        this.inputGain.gain.value = gain;
      }
    } catch (error) {
      logger.error('AudioRecorder.setInputGain error:', error);
      throw error;
    }
  }

  /**
   * Get recording state
   * @returns Recording state object
   */
  getState(): {
    isRecording: boolean;
    isArmed: boolean;
    monitoring: boolean;
    recordStartTime: number | null;
    recordedTracks: string[];
  } {
    return {
      isRecording: this.isRecording,
      isArmed: this.isArmed,
      monitoring: this.monitoring,
      recordStartTime: this.recordStartTime,
      recordedTracks: Array.from(this.recordedBuffers.keys()),
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputGain) {
      try {
        this.inputGain.disconnect();
      } catch (error) {
        // Already disconnected - ignore
      }
    }

    if (this.monitorGain) {
      try {
        this.monitorGain.disconnect();
      } catch (error) {
        // Already disconnected - ignore
      }
    }

    this.mediaSource = null;
    this.isRecording = false;
    this.isArmed = false;
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.AudioRecorder = AudioRecorder;
}

