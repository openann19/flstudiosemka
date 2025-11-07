/**
 * AutomationService - Automation clip creation workflow
 * Handles automation clip creation and management
 * @module services/AutomationService
 */

import type { AutomationPointOptional } from '../types/automation.types';

/**
 * Automation target
 */
export interface AutomationTarget {
  type: 'parameter' | 'effect' | 'mixer';
  id: string;
  parameter: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
}

/**
 * Automation point (using optional curve for service compatibility)
 */
export type AutomationPoint = AutomationPointOptional;

/**
 * Automation clip
 */
export interface AutomationClip {
  id: string;
  target: AutomationTarget;
  points: AutomationPoint[];
  length: number;
  name: string;
}

/**
 * Automation service
 */
export class AutomationService {
  private clips: Map<string, AutomationClip>;

  /**
   * Create a new AutomationService instance
   */
  constructor() {
    this.clips = new Map<string, AutomationClip>();
  }

  /**
   * Create automation clip from target
   * @param target - Automation target
   * @param length - Clip length in beats
   * @returns Automation clip ID
   */
  createAutomationClip(target: AutomationTarget, length: number = 4): string {
    const id = `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const clip: AutomationClip = {
      id,
      target,
      points: [
        { time: 0, value: target.defaultValue, curve: 'linear' as const },
        { time: length, value: target.defaultValue, curve: 'linear' as const },
      ],
      length,
      name: `${target.name} Automation`,
    };

    this.clips.set(id, clip);
    return id;
  }

  /**
   * Get automation clip
   * @param id - Clip ID
   * @returns Automation clip or undefined
   */
  getAutomationClip(id: string): AutomationClip | undefined {
    return this.clips.get(id);
  }

  /**
   * Get all automation clips
   * @returns Array of automation clips
   */
  getAllAutomationClips(): AutomationClip[] {
    return Array.from(this.clips.values());
  }

  /**
   * Get automation clips for target
   * @param targetId - Target ID
   * @returns Array of automation clips
   */
  getAutomationClipsForTarget(targetId: string): AutomationClip[] {
    return Array.from(this.clips.values()).filter((clip) => clip.target.id === targetId);
  }

  /**
   * Update automation clip
   * @param id - Clip ID
   * @param updates - Partial clip updates
   */
  updateAutomationClip(id: string, updates: Partial<AutomationClip>): void {
    const clip = this.clips.get(id);
    if (clip) {
      Object.assign(clip, updates);
    }
  }

  /**
   * Add automation point
   * @param clipId - Clip ID
   * @param point - Automation point
   */
  addAutomationPoint(clipId: string, point: AutomationPoint): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      clip.points.push(point);
      clip.points.sort((a, b) => a.time - b.time);
    }
  }

  /**
   * Remove automation point
   * @param clipId - Clip ID
   * @param pointIndex - Point index
   */
  removeAutomationPoint(clipId: string, pointIndex: number): void {
    const clip = this.clips.get(clipId);
    if (clip && pointIndex >= 0 && pointIndex < clip.points.length) {
      clip.points.splice(pointIndex, 1);
    }
  }

  /**
   * Delete automation clip
   * @param id - Clip ID
   */
  deleteAutomationClip(id: string): void {
    this.clips.delete(id);
  }

  /**
   * Get automation value at time
   * @param clipId - Clip ID
   * @param time - Time in beats
   * @returns Automation value
   */
  getAutomationValue(clipId: string, time: number): number {
    const clip = this.clips.get(clipId);
    if (!clip || clip.points.length === 0) {
      return 0;
    }

    const firstPoint = clip.points[0];
    const lastPoint = clip.points[clip.points.length - 1];
    
    if (!firstPoint || !lastPoint) {
      return 0;
    }

    if (time <= firstPoint.time) {
      return firstPoint.value;
    }
    if (time >= lastPoint.time) {
      return lastPoint.value;
    }

    // Find surrounding points
    for (let i = 0; i < clip.points.length - 1; i += 1) {
      const p1 = clip.points[i];
      const p2 = clip.points[i + 1];

      if (!p1 || !p2) {
        continue;
      }

      if (time >= p1.time && time <= p2.time) {
        const timeDiff = p2.time - p1.time;
        
        // Guard against division by zero when times are equal
        if (Math.abs(timeDiff) < Number.EPSILON) {
          return p1.value;
        }

        // Interpolate
        const t = (time - p1.time) / timeDiff;
        const p1Curve = p1.curve ?? 'linear';
        const p2Curve = p2.curve ?? 'linear';
        
        if (p1Curve === 'step' || p2Curve === 'step') {
          return p1.value;
        }
        if (p1Curve === 'smooth' || p2Curve === 'smooth') {
          // Smooth interpolation (ease in/out)
          const smoothT = t * t * (3 - 2 * t);
          return p1.value + (p2.value - p1.value) * smoothT;
        }
        // Linear interpolation
        return p1.value + (p2.value - p1.value) * t;
      }
    }

    return 0;
  }
}

// Export singleton instance
export const automationService = new AutomationService();

