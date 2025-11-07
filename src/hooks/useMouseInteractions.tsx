/**
 * useMouseInteractions - React hook for mouse interactions
 * Integrates MouseInteractionService with React components
 * @module hooks/useMouseInteractions
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  mouseInteractionService,
  MouseInteractionService,
} from '../services/MouseInteractionService';
import type {
  ScrollHandler,
  PanHandler,
  DragStartHandler,
  DropHandler,
  DragHandler,
} from '../services/MouseInteractionService';
import type { ScrollInteractionOptions } from '../types/mouse';

/**
 * Options for useMouseInteractions hook
 */
export interface UseMouseInteractionsOptions {
  enabled?: boolean;
}

/**
 * Return type for useMouseInteractions hook
 */
export interface UseMouseInteractionsReturn {
  registerScrollZoom: (
    element: HTMLElement | null,
    handler: ScrollHandler,
    options?: ScrollInteractionOptions
  ) => void;
  registerScrollParameter: (
    element: HTMLElement | null,
    handler: ScrollHandler,
    options?: ScrollInteractionOptions
  ) => void;
  registerScrollTimeline: (
    element: HTMLElement | null,
    handler: ScrollHandler,
    options?: ScrollInteractionOptions
  ) => void;
  registerMiddleMousePan: (element: HTMLElement | null, handler: PanHandler) => void;
  registerDragStart: (element: HTMLElement | null, handler: DragStartHandler) => void;
  registerDrop: (element: HTMLElement | null, handler: DropHandler) => void;
  registerDrag: (element: HTMLElement | null, handler: DragHandler) => void;
  unregister: (element: HTMLElement | null) => void;
  setEnabled: (enabled: boolean) => void;
  service: MouseInteractionService;
}

/**
 * React hook for managing mouse interactions
 * @param options - Hook options
 * @returns Mouse interaction management functions
 */
export function useMouseInteractions(
  options: UseMouseInteractionsOptions = {}
): UseMouseInteractionsReturn {
  const { enabled = true } = options;
  const registeredElementsRef = useRef<Set<HTMLElement>>(new Set());

  /**
   * Enable/disable service
   */
  useEffect(() => {
    mouseInteractionService.setEnabled(enabled);
  }, [enabled]);

  /**
   * Register scroll zoom
   */
  const registerScrollZoom = useCallback(
    (
      element: HTMLElement | null,
      handler: ScrollHandler,
      scrollOptions?: ScrollInteractionOptions
    ): void => {
      if (!element) {
        return;
      }
      try {
        mouseInteractionService.registerScrollZoom(element, handler, scrollOptions);
        registeredElementsRef.current.add(element);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Register scroll parameter
   */
  const registerScrollParameter = useCallback(
    (
      element: HTMLElement | null,
      handler: ScrollHandler,
      scrollOptions?: ScrollInteractionOptions
    ): void => {
      if (!element) {
        return;
      }
      try {
        mouseInteractionService.registerScrollParameter(element, handler, scrollOptions);
        registeredElementsRef.current.add(element);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Register scroll timeline
   */
  const registerScrollTimeline = useCallback(
    (
      element: HTMLElement | null,
      handler: ScrollHandler,
      scrollOptions?: ScrollInteractionOptions
    ): void => {
      if (!element) {
        return;
      }
      try {
        mouseInteractionService.registerScrollTimeline(element, handler, scrollOptions);
        registeredElementsRef.current.add(element);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Register middle mouse pan
   */
  const registerMiddleMousePan = useCallback(
    (element: HTMLElement | null, handler: PanHandler): void => {
      if (!element) {
        return;
      }
      try {
        mouseInteractionService.registerMiddleMousePan(element, handler);
        registeredElementsRef.current.add(element);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Register drag start
   */
  const registerDragStart = useCallback(
    (element: HTMLElement | null, handler: DragStartHandler): void => {
      if (!element) {
        return;
      }
      try {
        mouseInteractionService.registerDragStart(element, handler);
        registeredElementsRef.current.add(element);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Register drop
   */
  const registerDrop = useCallback(
    (element: HTMLElement | null, handler: DropHandler): void => {
      if (!element) {
        return;
      }
      try {
        mouseInteractionService.registerDrop(element, handler);
        registeredElementsRef.current.add(element);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Register drag
   */
  const registerDrag = useCallback(
    (element: HTMLElement | null, handler: DragHandler): void => {
      if (!element) {
        return;
      }
      try {
        mouseInteractionService.registerDrag(element, handler);
        registeredElementsRef.current.add(element);
      } catch {
        // Silent error handling
      }
    },
    []
  );

  /**
   * Unregister element
   */
  const unregister = useCallback((element: HTMLElement | null): void => {
    if (!element) {
      return;
    }
    mouseInteractionService.unregister(element);
    registeredElementsRef.current.delete(element);
  }, []);

  /**
   * Set enabled
   */
  const setEnabled = useCallback((newEnabled: boolean): void => {
    mouseInteractionService.setEnabled(newEnabled);
  }, []);

  /**
   * Cleanup: unregister all elements
   */
  useEffect(() => {
    return () => {
      for (const element of registeredElementsRef.current) {
        mouseInteractionService.unregister(element);
      }
      registeredElementsRef.current.clear();
    };
  }, []);

  return {
    registerScrollZoom,
    registerScrollParameter,
    registerScrollTimeline,
    registerMiddleMousePan,
    registerDragStart,
    registerDrop,
    registerDrag,
    unregister,
    setEnabled,
    service: mouseInteractionService,
  };
}

