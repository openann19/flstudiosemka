/**
 * EffectDragDropService - Service for effect drag and drop operations
 * Manages drag state and drop validation
 * @module services/EffectDragDropService
 */

import type { EffectDragData } from '../types/effectSlot.types';
import { logger } from '../utils/logger';

/**
 * Drag state
 */
interface DragState {
  isDragging: boolean;
  dragData: EffectDragData | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetElement: HTMLElement | null;
}

/**
 * Service for managing effect drag and drop
 */
export class EffectDragDropService {
  private dragState: DragState = {
    isDragging: false,
    dragData: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    targetElement: null,
  };

  /**
   * Start drag operation
   * @param dragData - Drag data
   * @param startX - Start X coordinate
   * @param startY - Start Y coordinate
   */
  startDrag(dragData: EffectDragData, startX: number, startY: number): void {
    this.dragState = {
      isDragging: true,
      dragData,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      targetElement: null,
    };
  }

  /**
   * Update drag position
   * @param x - Current X coordinate
   * @param y - Current Y coordinate
   */
  updateDragPosition(x: number, y: number): void {
    if (this.dragState.isDragging) {
      this.dragState.currentX = x;
      this.dragState.currentY = y;
    }
  }

  /**
   * Set target element for drop
   * @param element - Target element or null
   */
  setTargetElement(element: HTMLElement | null): void {
    if (this.dragState.isDragging) {
      this.dragState.targetElement = element;
    }
  }

  /**
   * End drag operation
   * @returns Drag data if drag was successful, null otherwise
   */
  endDrag(): EffectDragData | null {
    if (!this.dragState.isDragging || !this.dragState.dragData) {
      return null;
    }

    const dragData = this.dragState.dragData;
    this.dragState = {
      isDragging: false,
      dragData: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      targetElement: null,
    };

    return dragData;
  }

  /**
   * Cancel drag operation
   */
  cancelDrag(): void {
    this.dragState = {
      isDragging: false,
      dragData: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      targetElement: null,
    };
  }

  /**
   * Get current drag state
   * @returns Current drag state
   */
  getDragState(): Readonly<DragState> {
    return { ...this.dragState };
  }

  /**
   * Check if dragging
   * @returns True if currently dragging
   */
  isDragging(): boolean {
    return this.dragState.isDragging;
  }

  /**
   * Get drag data
   * @returns Current drag data or null
   */
  getDragData(): EffectDragData | null {
    return this.dragState.dragData ? { ...this.dragState.dragData } : null;
  }

  /**
   * Validate drop target
   * @param element - Target element
   * @returns True if valid drop target
   */
  validateDropTarget(element: HTMLElement): boolean {
    if (!this.dragState.isDragging || !this.dragState.dragData) {
      return false;
    }

    // Check if element has data-slot-index or data-effect-slot attribute
    const hasSlotIndex = element.hasAttribute('data-slot-index') || element.closest('[data-effect-slot]') !== null;
    const hasTrackId = element.hasAttribute('data-track-id') || element.closest('[data-track-id]') !== null;

    return hasSlotIndex || hasTrackId;
  }

  /**
   * Get drop target info
   * @param element - Target element
   * @returns Drop target info or null
   */
  getDropTargetInfo(element: HTMLElement): { trackId: number; slotIndex: number } | null {
    if (!this.validateDropTarget(element)) {
      return null;
    }

    try {
      // Find closest element with track-id
      const trackElement = element.closest('[data-track-id]');
      const slotElement = element.closest('[data-slot-index]') || element.closest('[data-effect-slot]');

      if (!trackElement) {
        return null;
      }

      const trackId = parseInt(trackElement.getAttribute('data-track-id') || '0', 10);
      let slotIndex = -1;

      if (slotElement) {
        const slotAttr = slotElement.getAttribute('data-slot-index') || slotElement.getAttribute('data-effect-slot');
        if (slotAttr) {
          slotIndex = parseInt(slotAttr, 10);
        }
      } else {
        // Try to find slot index from element
        const slotAttr = element.getAttribute('data-slot-index') || element.getAttribute('data-effect-slot');
        if (slotAttr) {
          slotIndex = parseInt(slotAttr, 10);
        }
      }

      if (isNaN(trackId) || trackId < 0) {
        return null;
      }

      return {
        trackId,
        slotIndex: slotIndex >= 0 ? slotIndex : -1,
      };
    } catch (error) {
      logger.error('EffectDragDropService: Error getting drop target info', { error });
      return null;
    }
  }
}

/**
 * Singleton instance
 */
export const effectDragDropService = new EffectDragDropService();

