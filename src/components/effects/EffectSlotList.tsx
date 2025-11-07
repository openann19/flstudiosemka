/**
 * EffectSlotList - List of effect slots for a track
 * Displays all 10 effect slots with drag-and-drop support
 * @module components/effects/EffectSlotList
 */

import React, { useCallback } from 'react';
import type { EffectSlot } from '../../types/effectSlot.types';
import type { EffectType } from '../../types/synthesizer.types';
import { EffectSlot as EffectSlotComponent } from './EffectSlot';
import { useEffectDragDrop } from '../../hooks/useEffectDragDrop';
import type { EffectDragData } from '../../types/effectSlot.types';

/**
 * EffectSlotList component props
 */
export interface EffectSlotListProps {
  trackId: number;
  slots: EffectSlot[];
  selectedSlotIndex?: number | null;
  onAddEffect?: (position: number, effectType: EffectType) => void;
  onRemoveEffect?: (position: number) => void;
  onToggleEnabled?: (position: number, enabled: boolean) => void;
  onSelectSlot?: (position: number) => void;
  onReorderEffect?: (fromPosition: number, toPosition: number) => void;
  onDropEffect?: (data: EffectDragData, position: number) => void;
}

/**
 * Effect slot list component
 */
export function EffectSlotList({
  trackId,
  slots,
  selectedSlotIndex,
  onAddEffect,
  onRemoveEffect,
  onToggleEnabled,
  onSelectSlot,
  onReorderEffect,
  onDropEffect,
}: EffectSlotListProps): JSX.Element {
  const dragDrop = useEffectDragDrop();
  const [draggingSlotIndex, setDraggingSlotIndex] = React.useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(
    (position: number, event: React.MouseEvent): void => {
      const slot = slots[position];
      if (!slot || !slot.effectType) {
        return;
      }

      const dragData: EffectDragData = {
        type: 'effect-slot',
        effectType: slot.effectType,
        sourceTrackId: trackId,
        sourceSlotIndex: position,
        parameters: slot.parameters,
        slotId: slot.id,
      };

      dragDrop.startDrag(dragData, event);
      setDraggingSlotIndex(position);
    },
    [trackId, slots, dragDrop]
  );

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent, targetPosition: number): void => {
      event.preventDefault();
      event.stopPropagation();

      // Try to get data from dataTransfer (HTML5 drag and drop)
      let dragData: EffectDragData | null = null;
      try {
        const dataStr = event.dataTransfer.getData('application/json');
        if (dataStr) {
          dragData = JSON.parse(dataStr) as EffectDragData;
        }
      } catch {
        // Ignore parse errors
      }

      // Fallback to dragDrop hook
      if (!dragData && dragDrop.isDragging && dragDrop.dragData) {
        dragData = dragDrop.dragData;
      }

      if (dragData) {
        if (onDropEffect) {
          onDropEffect(dragData, targetPosition);
        } else if (onReorderEffect && draggingSlotIndex !== null) {
          // Reorder if dragging from same list
          if (dragData.type === 'effect-slot' && dragData.sourceTrackId === trackId) {
            onReorderEffect(draggingSlotIndex, targetPosition);
          }
        }
      }

      dragDrop.cancelDrag();
      setDraggingSlotIndex(null);
      setDropTargetIndex(null);
    },
    [dragDrop, onDropEffect, onReorderEffect, draggingSlotIndex, trackId]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent, position: number): void => {
      if (dragDrop.isDragging) {
        event.preventDefault();
        event.stopPropagation();
        setDropTargetIndex(position);
      }
    },
    [dragDrop.isDragging]
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((): void => {
    setDropTargetIndex(null);
  }, []);

  return (
    <div
      data-track-id={trackId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-minimal)',
        width: '100%',
      }}
    >
      {slots.map((slot, index) => (
        <div
          key={slot.id}
          data-slot-index={index}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          style={{
            position: 'relative',
          }}
        >
          <EffectSlotComponent
            slot={slot}
            position={index}
            onAddEffect={onAddEffect}
            onRemoveEffect={onRemoveEffect}
            onToggleEnabled={onToggleEnabled}
            onSelect={onSelectSlot}
            onDragStart={handleDragStart}
            isSelected={selectedSlotIndex === index}
            isDragging={draggingSlotIndex === index}
            isDropTarget={dropTargetIndex === index}
          />
        </div>
      ))}
    </div>
  );
}

