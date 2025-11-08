/**
 * AutomationRecorder - Records automation in real-time
 * Captures parameter changes during playback
 * @module automation/AutomationRecorder
 */

import type { AutomationLane } from './AutomationLane';

/**
 * Recording state
 */
export interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  currentTime: number;
  recordingParameters: string[];
}

/**
 * AutomationRecorder - Records automation in real-time
 * Captures parameter changes during playback
 */
export class AutomationRecorder {
  private isRecording: boolean;
  private recordingLanes: Map<string, AutomationLane>;
  private startTime: number | null;
  private currentTime: number;
  private callbacks: Map<string, (value: number, time: number) => void>;

  constructor() {
    this.isRecording = false;
    this.recordingLanes = new Map();
    this.startTime = null;
    this.currentTime = 0;
    this.callbacks = new Map();
  }

  /**
   * Start recording automation
   * @param {AutomationLane[]} lanes - Array of automation lanes to record
   * @param {number} startTime - Start time in beats
   */
  startRecording(lanes: AutomationLane[], startTime: number = 0): void {
    this.isRecording = true;
    this.startTime = startTime;
    this.currentTime = startTime;
    this.recordingLanes.clear();

    lanes.forEach((lane) => {
      this.recordingLanes.set(this._getParameterId(lane), lane);
    });
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    this.isRecording = false;
    this.recordingLanes.clear();
  }

  /**
   * Record parameter value
   * @param {AutomationLane} lane - Automation lane
   * @param {number} value - Parameter value
   * @param {number} time - Time in beats (optional, uses current time if not provided)
   */
  recordValue(lane: AutomationLane, value: number, time: number | null = null): void {
    if (!this.isRecording) return;

    const parameterId = this._getParameterId(lane);
    if (!this.recordingLanes.has(parameterId)) return;

    const recordTime = time !== null ? time : this.currentTime;
    lane.addPoint(recordTime, value, 'smooth');
  }

  /**
   * Update current time
   * @param {number} time - Current time in beats
   */
  updateTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * Register parameter callback
   * @param {AutomationLane} lane - Automation lane
   * @param {Function} callback - Callback function(value, time)
   */
  registerParameter(
    lane: AutomationLane,
    callback: (value: number, time: number) => void
  ): void {
    const parameterId = this._getParameterId(lane);
    this.callbacks.set(parameterId, callback);
  }

  /**
   * Unregister parameter
   * @param {AutomationLane} lane - Automation lane
   */
  unregisterParameter(lane: AutomationLane): void {
    const parameterId = this._getParameterId(lane);
    this.callbacks.delete(parameterId);
  }

  /**
   * Get parameter ID
   * @private
   */
  private _getParameterId(lane: AutomationLane): string {
    return `${lane.trackId}_${lane.parameterName}`;
  }

  /**
   * Set BPM (stored for future use)
   * @param {number} _bpm - BPM
   */
  setBPM(_bpm: number): void {
    // BPM is stored for future tempo-synced automation features
  }

  /**
   * Get recording state
   * @returns {RecordingState} Recording state
   */
  getState(): RecordingState {
    return {
      isRecording: this.isRecording,
      startTime: this.startTime,
      currentTime: this.currentTime,
      recordingParameters: Array.from(this.recordingLanes.keys()),
    };
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  const windowWithAutomation = window as unknown as {
    AutomationRecorder?: typeof AutomationRecorder;
  };
  if (!windowWithAutomation.AutomationRecorder) {
    windowWithAutomation.AutomationRecorder = AutomationRecorder;
  }
}

