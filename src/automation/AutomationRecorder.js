/**
 * AutomationRecorder - Records automation in real-time
 * Captures parameter changes during playback
 */
class AutomationRecorder {
  constructor() {
    this.isRecording = false;
    this.recordingLanes = new Map(); // parameterId -> AutomationLane
    this.startTime = null;
    this.currentTime = 0;
    this.bpm = 120;
    this.callbacks = new Map(); // parameterId -> callback function
  }

  /**
   * Start recording automation
   * @param {Array} lanes - Array of automation lanes to record
   * @param {number} startTime - Start time in beats
   */
  startRecording(lanes, startTime = 0) {
    this.isRecording = true;
    this.startTime = startTime;
    this.currentTime = startTime;
    this.recordingLanes.clear();

    lanes.forEach(lane => {
      this.recordingLanes.set(this._getParameterId(lane), lane);
    });
  }

  /**
   * Stop recording
   */
  stopRecording() {
    this.isRecording = false;
    this.recordingLanes.clear();
  }

  /**
   * Record parameter value
   * @param {AutomationLane} lane - Automation lane
   * @param {number} value - Parameter value
   * @param {number} time - Time in beats (optional, uses current time if not provided)
   */
  recordValue(lane, value, time = null) {
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
  updateTime(time) {
    this.currentTime = time;
  }

  /**
   * Register parameter callback
   * @param {AutomationLane} lane - Automation lane
   * @param {Function} callback - Callback function(value, time)
   */
  registerParameter(lane, callback) {
    const parameterId = this._getParameterId(lane);
    this.callbacks.set(parameterId, callback);
  }

  /**
   * Unregister parameter
   * @param {AutomationLane} lane - Automation lane
   */
  unregisterParameter(lane) {
    const parameterId = this._getParameterId(lane);
    this.callbacks.delete(parameterId);
  }

  /**
   * Get parameter ID
   * @private
   */
  _getParameterId(lane) {
    return `${lane.trackId}_${lane.parameterName}`;
  }

  /**
   * Set BPM
   * @param {number} bpm - BPM
   */
  setBPM(bpm) {
    this.bpm = bpm;
  }

  /**
   * Get recording state
   * @returns {Object} Recording state
   */
  getState() {
    return {
      isRecording: this.isRecording,
      startTime: this.startTime,
      currentTime: this.currentTime,
      recordingParameters: Array.from(this.recordingLanes.keys())
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AutomationRecorder };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.AutomationRecorder = AutomationRecorder;
}

