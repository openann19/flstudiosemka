/**
 * AutomationCurve - Curve editor for automation lanes
 * Provides drawing and editing capabilities
 * @module automation/AutomationCurve
 */

// AutomationLane is a class used for both type annotations and runtime, so it must be a value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AutomationLane } from './AutomationLane';
import type { AutomationPoint } from './AutomationLane';

/**
 * Draw options for automation curve
 */
interface DrawOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  pixelsPerBeat: number;
}

/**
 * AutomationCurve - Curve editor for automation lanes
 * Provides drawing and editing capabilities
 */
export class AutomationCurve {
  private lane: AutomationLane;
  private selectedPointTimes: Set<number>;
  public snapToGrid: boolean;
  private snapInterval: number;

  constructor(automationLane: AutomationLane) {
    this.lane = automationLane;
    this.selectedPointTimes = new Set();
    this.snapToGrid = true;
    this.snapInterval = 0.25; // Beats
  }

  /**
   * Get point key for identification (time-based)
   * @private
   */
  private _getPointKey(point: AutomationPoint): number {
    return point.time;
  }

  /**
   * Get CSS variable value from computed styles
   * @private
   */
  private _getCSSVariable(name: string): string {
    // Fallback values for SSR or non-browser environments
    const fallbacks: Record<string, string> = {
      '--fl-automation-curve': '#FF0080',
      '--fl-automation-selected': '#FFD700',
      '--fl-automation-outline': '#FFFFFF',
      '--fl-automation-grid': 'rgba(255, 255, 255, 0.1)',
    };

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return fallbacks[name] ?? '#000000';
    }

    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || (fallbacks[name] ?? '#000000');
  }

  /**
   * Draw curve on canvas
   * @param {DrawOptions} options - Draw options
   */
  draw(options: DrawOptions): void {
    const { ctx, width, height } = options;
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    this._drawGrid(options);

    // Draw curve
    this._drawCurve(options);

    // Draw points
    this._drawPoints(options);
  }

  /**
   * Draw grid
   * @private
   */
  private _drawGrid(options: DrawOptions): void {
    const { ctx, width, height, startTime, endTime, pixelsPerBeat } = options;
    ctx.strokeStyle = this._getCSSVariable('--fl-automation-grid') || 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines (beats)
    const startBeat = Math.floor(startTime);
    const endBeat = Math.ceil(endTime);

    for (let beat = startBeat; beat <= endBeat; beat++) {
      const x = (beat - startTime) * pixelsPerBeat;
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // Horizontal lines (value)
    const valueSteps = 10;
    for (let i = 0; i <= valueSteps; i++) {
      const y = (height / valueSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  /**
   * Draw curve
   * @private
   */
  private _drawCurve(options: DrawOptions): void {
    const { ctx, width, height, startTime, pixelsPerBeat } = options;
    if (this.lane.points.length === 0) return;

    ctx.strokeStyle = this._getCSSVariable('--fl-automation-curve') || '#FF0080';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const valueRange = this.lane.maxValue - this.lane.minValue;

    // Guard against division by zero when value range is 0
    if (Math.abs(valueRange) < Number.EPSILON) {
      // Draw horizontal line at middle when range is zero
      const y = height / 2;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      return;
    }

    // Draw curve
    for (let x = 0; x < width; x++) {
      const time = startTime + x / pixelsPerBeat;
      const value = this.lane.getValueAtTime(time);
      const normalizedValue = (value - this.lane.minValue) / valueRange;
      const y = height - normalizedValue * height;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  /**
   * Draw points
   * @private
   */
  private _drawPoints(options: DrawOptions): void {
    const { ctx, height, startTime, endTime, pixelsPerBeat } = options;
    const valueRange = this.lane.maxValue - this.lane.minValue;
    const pointRadius = 4;

    // Guard against division by zero
    const hasValidRange = Math.abs(valueRange) >= Number.EPSILON;

    this.lane.points.forEach((point) => {
      if (point.time < startTime || point.time > endTime) return;

      const x = (point.time - startTime) * pixelsPerBeat;
      const normalizedValue = hasValidRange
        ? (point.value - this.lane.minValue) / valueRange
        : 0.5; // Center when range is zero
      const y = height - normalizedValue * height;

      const isSelected = this.selectedPointTimes.has(this._getPointKey(point));

      // Draw point
      const pointColor = isSelected
        ? (this._getCSSVariable('--fl-automation-selected') || '#FFD700')
        : (this._getCSSVariable('--fl-automation-curve') || '#FF0080');
      ctx.fillStyle = pointColor;
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = this._getCSSVariable('--fl-automation-outline') || '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  /**
   * Find point at coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} startTime - Start time in beats
   * @param {number} pixelsPerBeat - Pixels per beat
   * @param {number} height - Canvas height
   * @returns {AutomationPoint | null} Point or null
   */
  findPointAt(
    x: number,
    y: number,
    startTime: number,
    pixelsPerBeat: number,
    height: number
  ): AutomationPoint | null {
    const valueRange = this.lane.maxValue - this.lane.minValue;
    const hasValidRange = Math.abs(valueRange) >= Number.EPSILON;

    // Find closest point
    let closestPoint: AutomationPoint | null = null;
    let closestDistance = Infinity;
    const threshold = 10; // pixels

    this.lane.points.forEach((point) => {
      const pointX = (point.time - startTime) * pixelsPerBeat;
      const normalizedValue = hasValidRange
        ? (point.value - this.lane.minValue) / valueRange
        : 0.5; // Center when range is zero
      const pointY = height - normalizedValue * height;

      const distance = Math.sqrt(
        Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2)
      );

      if (distance < threshold && distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    });

    return closestPoint;
  }

  /**
   * Add point at coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} startTime - Start time in beats
   * @param {number} pixelsPerBeat - Pixels per beat
   * @param {number} height - Canvas height
   * @returns {AutomationPoint} Added point
   */
  addPointAt(
    x: number,
    y: number,
    startTime: number,
    pixelsPerBeat: number,
    height: number
  ): AutomationPoint {
    // Validate inputs
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(startTime) || !Number.isFinite(pixelsPerBeat) || !Number.isFinite(height)) {
      throw new Error('AutomationCurve.addPointAt: Invalid input parameters');
    }
    if (pixelsPerBeat <= 0 || height <= 0) {
      throw new Error('AutomationCurve.addPointAt: pixelsPerBeat and height must be positive');
    }

    let time = startTime + x / pixelsPerBeat;
    // Ensure time is non-negative
    time = Math.max(0, time);

    const valueRange = this.lane.maxValue - this.lane.minValue;
    const normalizedValue = Math.max(0, Math.min(1, 1 - y / height));
    // Guard against division by zero - when range is zero, use minValue
    const value = Math.abs(valueRange) >= Number.EPSILON
      ? this.lane.minValue + normalizedValue * valueRange
      : this.lane.minValue;

    // Clamp value to valid range
    const clampedValue = Math.max(this.lane.minValue, Math.min(this.lane.maxValue, value));

    // Snap to grid
    if (this.snapToGrid && this.snapInterval > 0) {
      time = Math.round(time / this.snapInterval) * this.snapInterval;
      // Ensure snapped time is still non-negative
      time = Math.max(0, time);
    }

    return this.lane.addPoint(time, clampedValue);
  }

  /**
   * Select point
   * @param {AutomationPoint} point - Point to select
   */
  selectPoint(point: AutomationPoint): void {
    this.selectedPointTimes.add(this._getPointKey(point));
  }

  /**
   * Deselect point
   * @param {AutomationPoint} point - Point to deselect
   */
  deselectPoint(point: AutomationPoint): void {
    this.selectedPointTimes.delete(this._getPointKey(point));
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedPointTimes.clear();
  }

  /**
   * Delete selected points
   */
  deleteSelected(): void {
    this.selectedPointTimes.forEach((time) => {
      this.lane.removePoint(time);
    });
    this.selectedPointTimes.clear();
  }

  /**
   * Set snap to grid
   * @param {boolean} snap - Whether to snap
   * @param {number} interval - Snap interval in beats (must be positive)
   */
  setSnapToGrid(snap: boolean, interval: number = 0.25): void {
    this.snapToGrid = snap;
    // Validate interval is positive
    if (interval <= 0 || !Number.isFinite(interval)) {
      throw new Error('AutomationCurve.setSnapToGrid: interval must be a positive finite number');
    }
    this.snapInterval = interval;
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  const windowWithAutomation = window as unknown as {
    AutomationCurve?: typeof AutomationCurve;
  };
  if (!windowWithAutomation.AutomationCurve) {
    windowWithAutomation.AutomationCurve = AutomationCurve;
  }
}

