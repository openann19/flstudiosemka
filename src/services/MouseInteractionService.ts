/**
 * MouseInteractionService - Mouse gesture and interaction handler
 * Handles scroll wheel, middle mouse, and drag & drop interactions
 * @module services/MouseInteractionService
 */

import type {
  ScrollInteractionOptions,
  PanState,
  DragDropState,
  DragDropData,
} from '../types/mouse';
import { InvalidParameterError } from '../utils/errors';

/**
 * Scroll handler function
 */
export type ScrollHandler = (delta: number, event: WheelEvent) => void;

/**
 * Pan handler function
 */
export type PanHandler = (state: PanState, event: MouseEvent) => void;

/**
 * Drag start handler - returns drag data or false to cancel
 */
export type DragStartHandler = (event: MouseEvent) => DragDropData | false;

/**
 * Drag handler
 */
export type DragHandler = (state: DragDropState, event: MouseEvent) => void;

/**
 * Drop handler
 */
export type DropHandler = (data: DragDropData, target: HTMLElement, event: MouseEvent) => boolean;

/**
 * Mouse interaction service for handling mouse gestures
 */
export class MouseInteractionService {
  private scrollHandlers: Map<HTMLElement, ScrollHandler>;

  private panHandlers: Map<HTMLElement, PanHandler>;

  private panStates: Map<HTMLElement, PanState>;

  private dragDropState: DragDropState;

  private dragStartHandlers: Map<HTMLElement, DragStartHandler>;

  private dropHandlers: Map<HTMLElement, DropHandler>;

  private dragHandlers: Map<HTMLElement, DragHandler>;

  private isEnabled: boolean;

  /**
   * Create a new MouseInteractionService instance
   */
  constructor() {
    this.scrollHandlers = new Map<HTMLElement, ScrollHandler>();
    this.panHandlers = new Map<HTMLElement, PanHandler>();
    this.panStates = new Map<HTMLElement, PanState>();
    this.dragDropState = {
      isDragging: false,
      dragData: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      targetElement: null,
    };
    this.dragStartHandlers = new Map<HTMLElement, DragStartHandler>();
    this.dropHandlers = new Map<HTMLElement, DropHandler>();
    this.dragHandlers = new Map<HTMLElement, DragHandler>();
    this.isEnabled = true;
    this.setupGlobalListeners();
  }

  /**
   * Register scroll handler for zoom (Ctrl+Scroll)
   * @param element - Element to attach to
   * @param handler - Scroll handler function
   * @param options - Scroll options
   */
  registerScrollZoom(
    element: HTMLElement,
    handler: ScrollHandler,
    options: ScrollInteractionOptions = {}
  ): void {
    if (!element || !(element instanceof HTMLElement)) {
      throw new InvalidParameterError('element', element, 'HTMLElement');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    this.scrollHandlers.set(element, handler);

    element.addEventListener('wheel', (event) => {
      if (!this.isEnabled) {
        return;
      }

      // Only handle Ctrl+Scroll for zoom
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const delta = options.invert ? -event.deltaY : event.deltaY;
      const sensitivity = options.sensitivity || 1.0;
      handler(delta * sensitivity, event);
    });
  }

  /**
   * Register scroll handler for parameter adjustment
   * @param element - Element to attach to
   * @param handler - Scroll handler function
   * @param options - Scroll options
   */
  registerScrollParameter(
    element: HTMLElement,
    handler: ScrollHandler,
    options: ScrollInteractionOptions = {}
  ): void {
    if (!element || !(element instanceof HTMLElement)) {
      throw new InvalidParameterError('element', element, 'HTMLElement');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    this.scrollHandlers.set(element, handler);

    element.addEventListener('wheel', (event) => {
      if (!this.isEnabled) {
        return;
      }

      // Don't handle if Ctrl is pressed (that's for zoom)
      if (event.ctrlKey || event.metaKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const delta = options.invert ? -event.deltaY : event.deltaY;
      const sensitivity = options.sensitivity || 0.01;
      handler(delta * sensitivity, event);
    });
  }

  /**
   * Register scroll handler for timeline scrolling
   * @param element - Element to attach to
   * @param handler - Scroll handler function
   * @param options - Scroll options
   */
  registerScrollTimeline(
    element: HTMLElement,
    handler: ScrollHandler,
    options: ScrollInteractionOptions = {}
  ): void {
    if (!element || !(element instanceof HTMLElement)) {
      throw new InvalidParameterError('element', element, 'HTMLElement');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    this.scrollHandlers.set(element, handler);

    element.addEventListener('wheel', (event) => {
      if (!this.isEnabled) {
        return;
      }

      // Horizontal scrolling for timeline
      if (event.shiftKey) {
        // Shift+Scroll = horizontal scroll
        event.preventDefault();
        event.stopPropagation();
        const delta = options.invert ? -event.deltaY : event.deltaY;
        handler(delta, event);
      } else if (!event.ctrlKey && !event.metaKey) {
        // Normal scroll = vertical
        event.preventDefault();
        event.stopPropagation();
        const delta = options.invert ? -event.deltaY : event.deltaY;
        handler(delta, event);
      }
    });
  }

  /**
   * Register middle mouse pan handler
   * @param element - Element to attach to
   * @param handler - Pan handler function
   */
  registerMiddleMousePan(element: HTMLElement, handler: PanHandler): void {
    if (!element || !(element instanceof HTMLElement)) {
      throw new InvalidParameterError('element', element, 'HTMLElement');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    this.panHandlers.set(element, handler);

    const panState: PanState = {
      isPanning: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
    };
    this.panStates.set(element, panState);

    element.addEventListener('mousedown', (event) => {
      if (!this.isEnabled) {
        return;
      }

      // Middle mouse button
      if (event.button !== 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      panState.isPanning = true;
      panState.startX = event.clientX;
      panState.startY = event.clientY;
      panState.currentX = event.clientX;
      panState.currentY = event.clientY;
      panState.deltaX = 0;
      panState.deltaY = 0;

      // Change cursor
      element.style.cursor = 'grabbing';
    });

    element.addEventListener('mousemove', (event) => {
      if (!this.isEnabled || !panState.isPanning) {
        return;
      }

      panState.currentX = event.clientX;
      panState.currentY = event.clientY;
      panState.deltaX = event.clientX - panState.startX;
      panState.deltaY = event.clientY - panState.startY;

      handler(panState, event);
    });

    element.addEventListener('mouseup', (event) => {
      if (!this.isEnabled || !panState.isPanning) {
        return;
      }

      if (event.button === 1) {
        panState.isPanning = false;
        element.style.cursor = '';
      }
    });

    element.addEventListener('mouseleave', () => {
      if (panState.isPanning) {
        panState.isPanning = false;
        element.style.cursor = '';
      }
    });
  }

  /**
   * Register drag start handler
   * @param element - Element that can be dragged
   * @param handler - Drag start handler
   */
  registerDragStart(element: HTMLElement, handler: DragStartHandler): void {
    if (!element || !(element instanceof HTMLElement)) {
      throw new InvalidParameterError('element', element, 'HTMLElement');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    this.dragStartHandlers.set(element, handler);

    element.addEventListener('mousedown', (event) => {
      if (!this.isEnabled) {
        return;
      }

      // Only left mouse button
      if (event.button !== 0) {
        return;
      }

      const dragData = handler(event);
      if (dragData === false) {
        return;
      }

      this.dragDropState.isDragging = true;
      this.dragDropState.dragData = dragData;
      this.dragDropState.startX = event.clientX;
      this.dragDropState.startY = event.clientY;
      this.dragDropState.currentX = event.clientX;
      this.dragDropState.currentY = event.clientY;

      element.style.cursor = 'grabbing';
    });
  }

  /**
   * Register drop handler
   * @param element - Element that can receive drops
   * @param handler - Drop handler
   */
  registerDrop(element: HTMLElement, handler: DropHandler): void {
    if (!element || !(element instanceof HTMLElement)) {
      throw new InvalidParameterError('element', element, 'HTMLElement');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    this.dropHandlers.set(element, handler);

    element.addEventListener('dragover', (event) => {
      if (!this.isEnabled || !this.dragDropState.isDragging) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    });

    element.addEventListener('drop', (event) => {
      if (!this.isEnabled || !this.dragDropState.isDragging || !this.dragDropState.dragData) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const accepted = handler(this.dragDropState.dragData, element, event);
      if (accepted) {
        this.dragDropState.isDragging = false;
        this.dragDropState.dragData = null;
      }
    });
  }

  /**
   * Register drag handler (for visual feedback during drag)
   * @param element - Element to track drag on
   * @param handler - Drag handler
   */
  registerDrag(element: HTMLElement, handler: DragHandler): void {
    if (!element || !(element instanceof HTMLElement)) {
      throw new InvalidParameterError('element', element, 'HTMLElement');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    this.dragHandlers.set(element, handler);

    element.addEventListener('mousemove', (event) => {
      if (!this.isEnabled || !this.dragDropState.isDragging) {
        return;
      }

      this.dragDropState.currentX = event.clientX;
      this.dragDropState.currentY = event.clientY;
      this.dragDropState.targetElement =
        event.target instanceof HTMLElement ? event.target : null;

      handler(this.dragDropState, event);
    });
  }

  /**
   * Unregister all handlers for an element
   * @param element - Element to unregister
   */
  unregister(element: HTMLElement): void {
    this.scrollHandlers.delete(element);
    this.panHandlers.delete(element);
    this.panStates.delete(element);
    this.dragStartHandlers.delete(element);
    this.dropHandlers.delete(element);
    this.dragHandlers.delete(element);
  }

  /**
   * Enable or disable mouse interactions
   * @param enabled - Enable state
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if service is enabled
   * @returns True if enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get current drag state
   * @returns Current drag state
   */
  getDragState(): DragDropState {
    return { ...this.dragDropState };
  }

  /**
   * Setup global listeners
   * @private
   */
  private setupGlobalListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Global mouse up to end drag
    window.addEventListener('mouseup', () => {
      if (this.dragDropState.isDragging) {
        this.dragDropState.isDragging = false;
        this.dragDropState.dragData = null;
        this.dragDropState.targetElement = null;
      }
    });
  }
}

// Export singleton instance
export const mouseInteractionService = new MouseInteractionService();

