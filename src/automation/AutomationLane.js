/**
 * AutomationLane - Automation lane for a track parameter
 * Stores automation points and curves
 */
class AutomationLane {
  constructor(trackId, parameterName) {
    this.trackId = trackId;
    this.parameterName = parameterName;
    this.points = []; // Array of {time, value, curve}
    this.enabled = true;
    this.recording = false;
    this.minValue = 0;
    this.maxValue = 1;
  }

  /**
   * Add automation point
   * @param {number} time - Time in beats
   * @param {number} value - Value (0-1 normalized)
   * @param {string} curve - Curve type ('linear', 'step', 'smooth')
   * @returns {Object} Added point
   */
  addPoint(time, value, curve = 'linear') {
    const point = {
      time: Math.max(0, time),
      value: Math.max(this.minValue, Math.min(this.maxValue, value)),
      curve
    };

    // Insert point in sorted order
    const index = this._findInsertIndex(time);
    this.points.splice(index, 0, point);

    return point;
  }

  /**
   * Remove automation point
   * @param {number} time - Time of point to remove
   * @returns {boolean} Success status
   */
  removePoint(time) {
    const index = this.points.findIndex(p => Math.abs(p.time - time) < 0.001);
    if (index !== -1) {
      this.points.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update automation point
   * @param {number} oldTime - Old time
   * @param {number} newTime - New time
   * @param {number} newValue - New value
   * @returns {boolean} Success status
   */
  updatePoint(oldTime, newTime, newValue) {
    const index = this.points.findIndex(p => Math.abs(p.time - oldTime) < 0.001);
    if (index === -1) return false;

    // Remove old point
    this.points.splice(index, 1);

    // Add new point
    this.addPoint(newTime, newValue, this.points[index]?.curve || 'linear');

    return true;
  }

  /**
   * Get value at time
   * @param {number} time - Time in beats
   * @returns {number} Interpolated value
   */
  getValueAtTime(time) {
    if (this.points.length === 0) {
      return this.minValue;
    }

    if (this.points.length === 1) {
      return this.points[0].value;
    }

    // Find surrounding points
    let before = null;
    let after = null;

    for (let i = 0; i < this.points.length; i++) {
      if (this.points[i].time <= time) {
        before = this.points[i];
      }
      if (this.points[i].time >= time && !after) {
        after = this.points[i];
        break;
      }
    }

    // Before first point
    if (!before) {
      return this.points[0].value;
    }

    // After last point
    if (!after) {
      return this.points[this.points.length - 1].value;
    }

    // Exact match
    if (Math.abs(before.time - time) < 0.001) {
      return before.value;
    }

    // Interpolate
    return this._interpolate(before, after, time);
  }

  /**
   * Interpolate between two points
   * @private
   */
  _interpolate(before, after, time) {
    const t = (time - before.time) / (after.time - before.time);

    switch (before.curve) {
      case 'step':
        return before.value;

      case 'smooth': {
        // Smooth curve (ease in/out)
        const smoothT = t * t * (3 - 2 * t);
        return before.value + (after.value - before.value) * smoothT;
      }

      case 'linear':
      default:
        return before.value + (after.value - before.value) * t;
    }
  }

  /**
   * Find insert index for sorted array
   * @private
   */
  _findInsertIndex(time) {
    for (let i = 0; i < this.points.length; i++) {
      if (this.points[i].time > time) {
        return i;
      }
    }
    return this.points.length;
  }

  /**
   * Get all points in time range
   * @param {number} startTime - Start time
   * @param {number} endTime - End time
   * @returns {Array} Points in range
   */
  getPointsInRange(startTime, endTime) {
    return this.points.filter(p => p.time >= startTime && p.time <= endTime);
  }

  /**
   * Clear all points
   */
  clear() {
    this.points = [];
  }

  /**
   * Set value range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   */
  setValueRange(min, max) {
    this.minValue = min;
    this.maxValue = max;
    
    // Clamp existing points
    this.points.forEach(point => {
      point.value = Math.max(min, Math.min(max, point.value));
    });
  }

  /**
   * Export automation data
   * @returns {Object} Automation data
   */
  export() {
    return {
      trackId: this.trackId,
      parameterName: this.parameterName,
      enabled: this.enabled,
      minValue: this.minValue,
      maxValue: this.maxValue,
      points: this.points
    };
  }

  /**
   * Import automation data
   * @param {Object} data - Automation data
   */
  import(data) {
    this.trackId = data.trackId;
    this.parameterName = data.parameterName;
    this.enabled = data.enabled !== false;
    this.minValue = data.minValue || 0;
    this.maxValue = data.maxValue || 1;
    this.points = data.points || [];
  }
}

// Export for module systems
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = { AutomationLane };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  window.AutomationLane = AutomationLane;
}

