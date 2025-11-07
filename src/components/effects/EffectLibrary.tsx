/**
 * EffectLibrary - Effect library browser component
 * Displays available effects with search and category filtering
 * @module components/effects/EffectLibrary
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { EffectMetadata, EffectCategory } from '../../types/effect.types';
import type { EffectType } from '../../types/synthesizer.types';
import { effectRegistry } from '../../services/EffectRegistry';
import { useEffectDragDrop } from '../../hooks/useEffectDragDrop';
import { useHintPanel } from '../ui/HintPanel';
import type { EffectDragData } from '../../types/effectSlot.types';

/**
 * EffectLibrary component props
 */
export interface EffectLibraryProps {
  onEffectSelect?: (effectType: EffectType) => void;
  onEffectDragStart?: (effectType: EffectType, event: React.MouseEvent) => void;
  searchQuery?: string;
  selectedCategory?: EffectCategory | null;
}

/**
 * Effect library component
 */
export function EffectLibrary({
  onEffectSelect,
  onEffectDragStart,
  searchQuery = '',
  selectedCategory = null,
}: EffectLibraryProps): JSX.Element {
  const [search, setSearch] = useState<string>(searchQuery);
  const [category, setCategory] = useState<EffectCategory | null>(selectedCategory);
  const dragDrop = useEffectDragDrop();
  const hintPanel = useHintPanel();

  /**
   * Get filtered effects
   */
  const filteredEffects = useMemo((): EffectMetadata[] => {
    let effects = effectRegistry.getAllEffects();

    // Filter by category
    if (category) {
      effects = effects.filter((effect) => effect.category === category);
    }

    // Filter by search query
    if (search.trim()) {
      effects = effectRegistry.searchEffects(search);
      if (category) {
        effects = effects.filter((effect) => effect.category === category);
      }
    }

    return effects;
  }, [search, category]);

  /**
   * Get categories
   */
  const categories = useMemo((): EffectCategory[] => {
    return effectRegistry.getCategories();
  }, []);

  /**
   * Handle effect click
   */
  const handleEffectClick = useCallback(
    (effectType: EffectType): void => {
      if (onEffectSelect) {
        onEffectSelect(effectType);
      }
    },
    [onEffectSelect]
  );

  /**
   * Handle effect drag start
   */
  const handleEffectDragStart = useCallback(
    (effectType: EffectType, event: React.MouseEvent): void => {
      const dragData: EffectDragData = {
        type: 'effect-library',
        effectType,
      };

      if (onEffectDragStart) {
        onEffectDragStart(effectType, event);
      } else {
        dragDrop.startDrag(dragData, event);
      }
    },
    [dragDrop, onEffectDragStart]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--spacing-medium)',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-small)',
          }}
        >
          EFFECTS
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search effects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--spacing-small) var(--spacing-medium)',
            background: 'var(--fl-bg-input)',
            border: '1px solid var(--fl-border-dark)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--fl-text-primary)',
            fontSize: '9px',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--fl-orange)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--fl-border-dark)';
          }}
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div
          style={{
            padding: 'var(--spacing-small) var(--spacing-medium)',
            borderBottom: '1px solid var(--fl-border-dark)',
            display: 'flex',
            gap: 'var(--spacing-small)',
            flexWrap: 'wrap',
            background: 'var(--fl-bg-darker)',
          }}
        >
          <button
            onClick={() => setCategory(null)}
            style={{
              padding: 'var(--spacing-minimal) var(--spacing-small)',
              background: category === null ? 'var(--fl-orange)' : 'var(--fl-bg-dark)',
              border: `1px solid ${category === null ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
              borderRadius: 'var(--radius-sm)',
              color: category === null ? 'var(--fl-text-inverted)' : 'var(--fl-text-secondary)',
              fontSize: '8px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: 'var(--spacing-minimal) var(--spacing-small)',
                background: category === cat ? 'var(--fl-orange)' : 'var(--fl-bg-dark)',
                border: `1px solid ${category === cat ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
                borderRadius: 'var(--radius-sm)',
                color: category === cat ? 'var(--fl-text-inverted)' : 'var(--fl-text-secondary)',
                fontSize: '8px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all var(--transition-fast)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Effect List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--spacing-medium)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-small)',
        }}
      >
        {filteredEffects.length === 0 ? (
          <div
            style={{
              padding: 'var(--spacing-large)',
              textAlign: 'center',
              color: 'var(--fl-text-disabled)',
              fontSize: '9px',
            }}
          >
            No effects found
          </div>
        ) : (
          filteredEffects.map((effect) => (
            <div
              key={effect.type}
              draggable
              onDragStart={(e) => {
                const dragData: EffectDragData = {
                  type: 'effect-library',
                  effectType: effect.type,
                };
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                handleEffectDragStart(effect.type, e as unknown as React.MouseEvent);
              }}
              onClick={() => handleEffectClick(effect.type)}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                target.style.background = 'var(--fl-bg-hover)';
                target.style.borderColor = 'var(--fl-border-light)';
                target.style.transform = 'translateY(-1px)';
                target.style.boxShadow = 'var(--shadow-md)';
                hintPanel.showHint(
                  {
                    name: effect.name,
                    description: effect.description,
                  },
                  e.clientX + 10,
                  e.clientY + 10
                );
              }}
              onMouseLeave={(e) => {
                hintPanel.hideHint();
                const target = e.currentTarget;
                target.style.background = 'var(--fl-bg-darker)';
                target.style.borderColor = 'var(--fl-border-dark)';
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = 'none';
              }}
            >
              {/* Icon */}
              <span
                style={{
                  fontSize: '20px',
                  lineHeight: 1,
                }}
              >
                {effect.icon}
              </span>

              {/* Info */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-minimal)',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--fl-text-primary)',
                    fontWeight: 600,
                  }}
                >
                  {effect.name}
                </div>
                <div
                  style={{
                    fontSize: '8px',
                    color: 'var(--fl-text-secondary)',
                  }}
                >
                  {effect.description}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

