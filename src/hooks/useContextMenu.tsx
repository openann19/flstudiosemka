/**
 * useContextMenu - React hook for context menus
 * Integrates ContextMenu with React components
 * @module hooks/useContextMenu
 */

import { useCallback, useRef, useEffect } from 'react';
import { contextMenu } from '../ui/ContextMenu';
import type { ContextMenuItem, ContextMenuItems } from '../ui/ContextMenu';

/**
 * Return type for useContextMenu hook
 */
export interface UseContextMenuReturn {
  attach: (element: HTMLElement | null, items: ContextMenuItems) => void;
  detach: (element: HTMLElement | null) => void;
  show: (x: number, y: number, items: ContextMenuItem[]) => void;
  hide: () => void;
  isVisible: boolean;
}

/**
 * React hook for managing context menus
 * @returns Context menu management functions
 */
export function useContextMenu(): UseContextMenuReturn {
  const attachedElementsRef = useRef<Map<HTMLElement, (e: MouseEvent) => void>>(new Map());

  /**
   * Attach context menu to element
   */
  const attach = useCallback((element: HTMLElement | null, items: ContextMenuItems): void => {
    if (!element) {
      return;
    }

    // Remove existing handler if any
    const existingHandler = attachedElementsRef.current.get(element);
    if (existingHandler) {
      element.removeEventListener('contextmenu', existingHandler);
    }

    // Create new handler
    const handler = (e: MouseEvent): void => {
      e.preventDefault();
      const menuItems = typeof items === 'function' ? items(e) : items;
      contextMenu.show(e.clientX, e.clientY, menuItems);
    };

    element.addEventListener('contextmenu', handler);
    attachedElementsRef.current.set(element, handler);
  }, []);

  /**
   * Detach context menu from element
   */
  const detach = useCallback((element: HTMLElement | null): void => {
    if (!element) {
      return;
    }

    const handler = attachedElementsRef.current.get(element);
    if (handler) {
      element.removeEventListener('contextmenu', handler);
      attachedElementsRef.current.delete(element);
    }
  }, []);

  /**
   * Show context menu
   */
  const show = useCallback((x: number, y: number, items: ContextMenuItem[]): void => {
    contextMenu.show(x, y, items);
  }, []);

  /**
   * Hide context menu
   */
  const hide = useCallback((): void => {
    contextMenu.hide();
  }, []);

  /**
   * Check if menu is visible
   */
  const isVisible = contextMenu.getIsVisible();

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Cleanup all attached elements
      for (const [element, handler] of attachedElementsRef.current.entries()) {
        element.removeEventListener('contextmenu', handler);
      }
      attachedElementsRef.current.clear();
    };
  }, []);

  return {
    attach,
    detach,
    show,
    hide,
    isVisible,
  };
}

