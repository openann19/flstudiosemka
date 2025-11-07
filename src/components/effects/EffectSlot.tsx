/**
 * EffectSlot - Individual effect slot component
 * Displays effect slot with drag-and-drop, enable/disable, and remove functionality
 * @module components/effects/EffectSlot
 */

import React, { useCallback, useState, useEffect } from 'react';
import type { EffectSlot, EffectDragData } from '../../types/effectSlot.types';
import type { EffectType } from '../../types/synthesizer.types';
import { effectRegistry } from '../../services/EffectRegistry';
import { useHintPanel } from '../ui/HintPanel';
import { useContextMenu } from '../../hooks/useContextMenu';
import { contextMenuService } from '../../services/ContextMenuService';

/**
 * EffectSlot component props
 */
export interface EffectSlotProps {
  slot: EffectSlot;
  position: number;
  onAddEffect?: (position: number, effectType: EffectType) => void;
  onRemoveEffect?: (position: number) => void;
  onToggleEnabled?: (position: number, enabled: boolean) => void;
  onSelect?: (position: number) => void;
  onDragStart?: (position: number, event: React.MouseEvent) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

/**
 * Effect slot component
 */
export function EffectSlotComponent({
  slot,
  position,
  onAddEffect,
  onRemoveEffect,
  onToggleEnabled,
  onSelect,
  onDragStart,
  isSelected = false,
  isDragging = false,
  isDropTarget = false,
}: EffectSlotProps): JSX.Element {
  const hintPanel = useHintPanel();
  const contextMenu = useContextMenu();
  const slotRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const hasEffect = slot.effectType !== null && slot.effectInstance !== null;
  const metadata = hasEffect && slot.effectType ? effectRegistry.getEffectMetadata(slot.effectType) : null;

  // Setup context menu
  useEffect(() => {
    const element = slotRef.current;
    if (!element) {
      return;
    }

    const menuItems = contextMenuService.getEffectSlotMenu({
      onEdit: () => {
        if (onSelect) {
          onSelect(position);
        }
      },
      onRemove: () => {
        if (onRemoveEffect) {
          onRemoveEffect(position);
        }
      },
      onToggleEnabled: () => {
        if (onToggleEnabled) {
          onToggleEnabled(position, !slot.enabled);
        }
      },
      hasEffect,
      isEnabled: slot.enabled,
      canMoveUp: position > 0,
      canMoveDown: position < 9,
    });

    contextMenu.attach(element, menuItems);

    return () => {
      contextMenu.detach(element);
    };
  }, [slot, position, hasEffect, contextMenu, onSelect, onRemoveEffect, onToggleEnabled]);

  /**
   * Handle click
   */
  const handleClick = useCallback(
    (event: React.MouseEvent): void => {
      event.stopPropagation();

      if (hasEffect) {
        if (onSelect) {
          onSelect(position);
        }
      } else if (onAddEffect) {
        // Show effect picker or add default effect
        // For now, just trigger add with first available effect
        const allEffects = effectRegistry.getAllEffects();
        const firstEffect = allEffects[0];
        if (firstEffect !== undefined) {
          onAddEffect(position, firstEffect.type);
        }
      }
    },
    [hasEffect, position, onAddEffect, onSelect]
  );

  /**
   * Handle remove
   */
  const handleRemove = useCallback(
    (event: React.MouseEvent): void => {
      event.stopPropagation();
      if (onRemoveEffect) {
        onRemoveEffect(position);
      }
    },
    [position, onRemoveEffect]
  );

  /**
   * Handle toggle enabled
   */
  const handleToggleEnabled = useCallback(
    (event: React.MouseEvent): void => {
      event.stopPropagation();
      if (onToggleEnabled) {
        onToggleEnabled(position, !slot.enabled);
      }
    },
    [position, slot.enabled, onToggleEnabled]
  );

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.DragEvent): void => {
      if (hasEffect && onDragStart && 'clientX' in event) {
        onDragStart(position, event as React.MouseEvent);
      } else if (hasEffect && slot.effectType) {
        // HTML5 drag and drop
        const dragEvent = event as React.DragEvent;
        const dragData: EffectDragData = {
          type: 'effect-slot',
          effectType: slot.effectType,
          sourceTrackId: undefined, // Will be set by parent
          sourceSlotIndex: position,
          parameters: slot.parameters,
          slotId: slot.id,
        };
        dragEvent.dataTransfer.effectAllowed = 'move';
        dragEvent.dataTransfer.setData('application/json', JSON.stringify(dragData));
      }
    },
    [hasEffect, position, onDragStart, slot]
  );

  return (
    <div
      ref={slotRef}
      data-slot-index={position}
      data-effect-slot={position}
      draggable={hasEffect}
      onDragStart={handleDragStart}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (hasEffect && metadata) {
          hintPanel.showHint(
            {
              name: metadata.name,
              description: metadata.description,
            },
            e.clientX + 10,
            e.clientY + 10
          );
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        hintPanel.hideHint();
      }}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '24px',
        minHeight: '24px',
        background: hasEffect
          ? slot.enabled
            ? 'var(--fl-bg-medium)'
            : 'var(--fl-bg-dark)'
          : 'var(--fl-bg-darkest)',
        border: `1px solid ${
          isSelected
            ? 'var(--fl-orange)'
            : isDropTarget
              ? 'var(--fl-blue)'
              : hasEffect && slot.enabled
                ? 'var(--fl-border-light)'
                : 'var(--fl-border-dark)'
        }`,
        borderRadius: 'var(--radius-sm)',
        cursor: hasEffect ? 'grab' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-small)',
        gap: 'var(--spacing-small)',
        transition: 'all var(--transition-normal)',
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isSelected
          ? 'var(--shadow-glow)'
          : hasEffect && slot.enabled
            ? 'var(--shadow-sm)'
            : 'none',
      }}
    >
      {/* Effect Icon/Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-small)',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {hasEffect && metadata ? (
          <>
            <span
              style={{
                fontSize: '12px',
                opacity: slot.enabled ? 1 : 0.5,
              }}
            >
              {metadata.icon}
            </span>
            <span
              style={{
                fontSize: '9px',
                color: slot.enabled ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
                fontWeight: slot.enabled ? 600 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {metadata.name}
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: '8px',
              color: 'var(--fl-text-disabled)',
              fontStyle: 'italic',
            }}
          >
            Empty
          </span>
        )}
      </div>

      {/* Controls */}
      {hasEffect && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-minimal)',
            opacity: isHovered ? 1 : 0.7,
            transition: 'opacity var(--transition-fast)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enable/Disable Toggle */}
          <button
            onClick={handleToggleEnabled}
            style={{
              width: '16px',
              height: '16px',
              background: slot.enabled
                ? 'var(--fl-green)'
                : 'var(--fl-bg-dark)',
              border: `1px solid ${slot.enabled ? 'var(--fl-green)' : 'var(--fl-border-dark)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'all var(--transition-fast)',
            }}
            title={slot.enabled ? 'Disable effect' : 'Enable effect'}
            aria-label={slot.enabled ? 'Disable effect' : 'Enable effect'}
          >
            {slot.enabled && (
              <span
                style={{
                  fontSize: '8px',
                  color: 'var(--fl-text-inverted)',
                }}
              >
                ✓
              </span>
            )}
          </button>

          {/* Remove Button */}
          {isHovered && (
            <button
              onClick={handleRemove}
              style={{
                width: '16px',
                height: '16px',
                background: 'var(--fl-red)',
                border: '1px solid var(--fl-red)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all var(--transition-fast)',
              }}
              title="Remove effect"
              aria-label="Remove effect"
            >
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--fl-text-inverted)',
                  lineHeight: 1,
                }}
              >
                ×
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Export with original name for compatibility
export { EffectSlotComponent as EffectSlot };

