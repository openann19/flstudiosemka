/**
 * Automation types - Unified type definitions for automation system
 * @module types/automation.types
 */

/**
 * Automation curve type
 */
export type AutomationCurveType = 'linear' | 'step' | 'smooth';

/**
 * Automation point - Unified definition for automation lanes
 * Used by AutomationLane class and AutomationService
 */
export interface AutomationPoint {
  time: number;
  value: number;
  curve: AutomationCurveType;
}

/**
 * Automation point with optional curve (for backward compatibility)
 */
export interface AutomationPointOptional {
  time: number;
  value: number;
  curve?: AutomationCurveType;
}

/**
 * Automation data export format
 */
export interface AutomationData {
  trackId: string;
  parameterName: string;
  enabled: boolean;
  minValue: number;
  maxValue: number;
  points: AutomationPoint[];
}

