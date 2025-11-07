/**
 * AutomationLane - Automation lane for a track parameter
 * Stores automation points and curves
 * @module automation/AutomationLane
 */

import type { AutomationPoint, AutomationCurveType, AutomationData } from '../types/automation.types';

// Re-export for backward compatibility
export type { AutomationPoint, AutomationCurveType, AutomationData };

/**
 * AutomationLane - Automation lane for a track parameter
 * Stores automation points and curves
 */
export class AutomationLane {
  public trackId: string;
  public parameterName: string;
  public points: AutomationPoint[];
  public enabled: boolean;
  public recording: boolean;
  public minValue: number;
  public maxValue: number;

  constructor(trackId: string, parameterName: string) {
    this.trackId = trackId;
    this.parameterName = parameterName;
    this.points = [];
    this.enabled = true;
    this.recording = false;
    this.minValue = 0;
    this.maxValue = 1;
  }

  /**
   * Add automation point
   * @param {number} time - Time in beats
   * @param {number} value - Value (0-1 normalized)
   * @param {AutomationCurveType} curve - Curve type
   * @returns {AutomationPoint} Added point
   */
  addPoint(
    time: number,
    value: number,
    curve: AutomationCurveType = 'linear'
  ): AutomationPoint {
    const point: AutomationPoint = {
      time: Math.max(0, time),
      value: Math.max(this.minValue, Math.min(this.maxValue, value)),
      curve,
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
  removePoint(time: number): boolean {
    const index = this.points.findIndex(
      (p) => Math.abs(p.time - time) < 0.001
    );
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
  updatePoint(oldTime: number, newTime: number, newValue: number): boolean {
    const index = this.points.findIndex(
      (p) => Math.abs(p.time - oldTime) < 0.001
    );
    if (index === -1) return false;

    // Remove old point
    const oldPoint = this.points[index];
    if (!oldPoint) {
      return false;
    }
    this.points.splice(index, 1);

    // Add new point
    this.addPoint(newTime, newValue, oldPoint.curve);

    return true;
  }

  /**
   * Get value at time
   * @param {number} time - Time in beats
   * @returns {number} Interpolated value
   */
  getValueAtTime(time: number): number {
    if (this.points.length === 0) {
      return this.minValue;
    }

    if (this.points.length === 1) {
      const firstPoint = this.points[0];
      return firstPoint?.value ?? this.minValue;
    }

    // Find surrounding points
    let before: AutomationPoint | null = null;
    let after: AutomationPoint | null = null;

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (!point) {
        continue;
      }
      if (point.time <= time) {
        before = point;
      }
      if (point.time >= time && !after) {
        after = point;
        break;
      }
    }

    // Before first point
    if (!before) {
      const firstPoint = this.points[0];
      return firstPoint?.value ?? this.minValue;
    }

    // After last point
    if (!after) {
      const lastPoint = this.points[this.points.length - 1];
      return lastPoint?.value ?? this.minValue;
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
  private _interpolate(
    before: AutomationPoint,
    after: AutomationPoint,
    time: number
  ): number {
    const timeDiff = after.time - before.time;
    
    // Guard against division by zero when times are equal
    if (Math.abs(timeDiff) < Number.EPSILON) {
      // If times are equal, return the average value or the before value
      return before.value;
    }

    const t = (time - before.time) / timeDiff;

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
  private _findInsertIndex(time: number): number {
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (point && point.time > time) {
        return i;
      }
    }
    return this.points.length;
  }

  /**
   * Get all points in time range
   * @param {number} startTime - Start time
   * @param {number} endTime - End time
   * @returns {AutomationPoint[]} Points in range
   */
  getPointsInRange(startTime: number, endTime: number): AutomationPoint[] {
    return this.points.filter(
      (p) => p.time >= startTime && p.time <= endTime
    );
  }

  /**
   * Clear all points
   */
  clear(): void {
    this.points = [];
  }

  /**
   * Set value range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   */
  setValueRange(min: number, max: number): void {
    this.minValue = min;
    this.maxValue = max;

    // Clamp existing points
    this.points.forEach((point) => {
      point.value = Math.max(min, Math.min(max, point.value));
    });
  }

  /**
   * Export automation data
   * @returns {AutomationData} Automation data
   */
  export(): AutomationData {
    return {
      trackId: this.trackId,
      parameterName: this.parameterName,
      enabled: this.enabled,
      minValue: this.minValue,
      maxValue: this.maxValue,
      points: this.points,
    };
  }

  /**
   * Import automation data
   * @param {AutomationData} data - Automation data
   */
  import(data: AutomationData): void {
    this.trackId = data.trackId;
    this.parameterName = data.parameterName;
    this.enabled = data.enabled !== false;
    this.minValue = data.minValue || 0;
    this.maxValue = data.maxValue || 1;
    this.points = data.points || [];
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  const windowWithAutomation = window as unknown as {
    AutomationLane?: typeof AutomationLane;
  };
  if (!windowWithAutomation.AutomationLane) {
    windowWithAutomation.AutomationLane = AutomationLane;
  }
}

