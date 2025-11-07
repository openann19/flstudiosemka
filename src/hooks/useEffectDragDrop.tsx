/**
 * useEffectDragDrop - React hook for effect drag and drop
 * Provides drag and drop functionality for effects
 * @module hooks/useEffectDragDrop
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EffectDragData } from '../types/effectSlot.types';
import { effectDragDropService } from '../services/EffectDragDropService';

/**
 * Hook return type
 */
export interface UseEffectDragDropReturn {
  isDragging: boolean;
  dragData: EffectDragData | null;
  startDrag: (dragData: EffectDragData, event: MouseEvent | React.MouseEvent) => void;
  handleDrag: (event: MouseEvent | React.MouseEvent) => void;
  handleDragEnd: () => EffectDragData | null;
  handleDrop: (event: React.DragEvent, onDrop: (data: EffectDragData, trackId: number, slotIndex: number) => void) => void;
  cancelDrag: () => void;
}

/**
 * React hook for effect drag and drop
 * @returns Drag and drop functions and state
 */
export function useEffectDragDrop(): UseEffectDragDropReturn {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragData, setDragData] = useState<EffectDragData | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Update drag state from service
   */
  const updateDragState = useCallback(() => {
    setIsDragging(effectDragDropService.isDragging());
    setDragData(effectDragDropService.getDragData());
  }, []);

  /**
   * Start drag operation
   */
  const startDrag = useCallback(
    (data: EffectDragData, event: MouseEvent | React.MouseEvent): void => {
      const clientX = 'clientX' in event ? event.clientX : ('pageX' in event ? event.pageX : 0);
      const clientY = 'clientY' in event ? event.clientY : ('pageY' in event ? event.pageY : 0);

      dragStartRef.current = { x: clientX, y: clientY };
      effectDragDropService.startDrag(data, clientX, clientY);
      updateDragState();
    },
    [updateDragState]
  );

  /**
   * Handle drag movement
   */
  const handleDrag = useCallback(
    (event: MouseEvent | React.MouseEvent): void => {
      if (!effectDragDropService.isDragging()) {
        return;
      }

      const clientX = 'clientX' in event ? event.clientX : ('pageX' in event ? event.pageX : 0);
      const clientY = 'clientY' in event ? event.clientY : ('pageY' in event ? event.pageY : 0);

      effectDragDropService.updateDragPosition(clientX, clientY);

      // Update target element
      const target = event.target as HTMLElement;
      if (target) {
        const dropTarget = target.closest('[data-slot-index], [data-effect-slot], [data-track-id]') as HTMLElement;
        effectDragDropService.setTargetElement(dropTarget || null);
      }

      updateDragState();
    },
    [updateDragState]
  );

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback((): EffectDragData | null => {
    const data = effectDragDropService.endDrag();
    dragStartRef.current = null;
    updateDragState();
    return data;
  }, [updateDragState]);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent, onDrop: (data: EffectDragData, trackId: number, slotIndex: number) => void): void => {
      event.preventDefault();
      event.stopPropagation();

      if (!effectDragDropService.isDragging()) {
        return;
      }

      const target = event.currentTarget as HTMLElement;
      const dropInfo = effectDragDropService.getDropTargetInfo(target);

      if (!dropInfo) {
        effectDragDropService.cancelDrag();
        updateDragState();
        return;
      }

      const data = effectDragDropService.endDrag();
      if (data) {
        onDrop(data, dropInfo.trackId, dropInfo.slotIndex);
      }

      updateDragState();
    },
    [updateDragState]
  );

  /**
   * Cancel drag
   */
  const cancelDrag = useCallback(() => {
    effectDragDropService.cancelDrag();
    dragStartRef.current = null;
    updateDragState();
  }, [updateDragState]);

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent): void => {
      if (effectDragDropService.isDragging()) {
        handleDrag(event);
      }
    };

    const handleMouseUp = (): void => {
      if (effectDragDropService.isDragging()) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  return {
    isDragging,
    dragData,
    startDrag,
    handleDrag,
    handleDragEnd,
    handleDrop,
    cancelDrag,
  };
}

