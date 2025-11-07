/**
 * Type definitions for mouse interactions
 * @module types/mouse
 */

/**
 * Mouse interaction type
 */
export type MouseInteractionType =
  | 'scroll-zoom'
  | 'scroll-parameter'
  | 'scroll-timeline'
  | 'middle-pan'
  | 'middle-tool-menu'
  | 'drag-drop';

/**
 * Drag and drop data
 */
export interface DragDropData {
  type: string;
  source: string;
  data: unknown;
}

/**
 * Scroll interaction options
 */
export interface ScrollInteractionOptions {
  sensitivity?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  invert?: boolean;
}

/**
 * Pan interaction state
 */
export interface PanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
}

/**
 * Drag and drop state
 */
export interface DragDropState {
  isDragging: boolean;
  dragData: DragDropData | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetElement: HTMLElement | null;
}

