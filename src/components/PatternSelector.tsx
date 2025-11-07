/**
 * PatternSelector - Pattern selection and management component
 * Implements FL Studio-style pattern selector with naming, colors, and pattern library
 * @module components/PatternSelector
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useHintPanel } from './ui/HintPanel';
import { useContextMenu } from '../hooks/useContextMenu';
import { contextMenuService } from '../services/ContextMenuService';
import type { Track } from '../types/FLStudio.types';

/**
 * Pattern data
 */
export interface Pattern {
  id: number;
  name: string;
  color: string;
  steps: number;
}

/**
 * PatternSelector component props
 */
export interface PatternSelectorProps {
  patterns: Pattern[];
  currentPattern: number;
  onPatternSelect: (patternId: number) => void;
  onPatternRename: (patternId: number, name: string) => void;
  onPatternDuplicate: (patternId: number) => void;
  onPatternDelete: (patternId: number) => void;
  onPatternClear: (patternId: number) => void;
  onCreatePattern?: () => void;
}


/**
 * Pattern selector component
 */
export function PatternSelector({
  patterns,
  currentPattern,
  onPatternSelect,
  onPatternRename,
  onPatternDuplicate,
  onPatternDelete,
  onPatternClear: _onPatternClear,
  onCreatePattern,
}: PatternSelectorProps): JSX.Element {
  const [editingPattern, setEditingPattern] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const hintPanel = useHintPanel();
  const contextMenu = useContextMenu();
  const patternButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map());

  /**
   * Cleanup context menus on unmount
   */
  useEffect(() => {
    return () => {
      patternButtonsRef.current.forEach((el) => {
        contextMenu.detach(el);
      });
    };
  }, [contextMenu]);

  /**
   * Start editing pattern name
   */
  const handleStartEdit = useCallback(
    (pattern: Pattern, e: React.MouseEvent): void => {
      e.stopPropagation();
      setEditingPattern(pattern.id);
      setEditName(pattern.name);
    },
    []
  );

  /**
   * Finish editing pattern name
   */
  const handleFinishEdit = useCallback((): void => {
    if (editingPattern !== null && editName.trim()) {
      onPatternRename(editingPattern, editName.trim());
    }
    setEditingPattern(null);
    setEditName('');
  }, [editingPattern, editName, onPatternRename]);

  /**
   * Handle key down in edit input
   */
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        handleFinishEdit();
      } else if (e.key === 'Escape') {
        setEditingPattern(null);
        setEditName('');
      }
    },
    [handleFinishEdit]
  );


  return (
    <div
      className="pattern-selector"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
        borderRight: '1px solid var(--fl-border-dark)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          fontWeight: 600,
        }}
      >
        PATTERNS
      </div>

      {/* Pattern List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '4px',
        }}
      >
        {patterns.map((pattern) => {
          const isActive = pattern.id === currentPattern;
          const isEditing = editingPattern === pattern.id;

          return (
            <div
              key={pattern.id}
              onClick={() => onPatternSelect(pattern.id)}
              onDoubleClick={(e) => handleStartEdit(pattern, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 8px',
                marginBottom: '2px',
                background: isActive
                  ? 'linear-gradient(90deg, var(--fl-orange) 0%, var(--fl-orange-dark) 100%)'
                  : 'var(--fl-bg-darker)',
                border: `1px solid ${isActive ? 'var(--fl-orange-dark)' : 'var(--fl-border-dark)'}`,
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={(e) =>
                hintPanel.showHint(
                  {
                    name: `Pattern ${pattern.id}`,
                    description: pattern.name,
                    value: `${pattern.steps} steps`,
                  },
                  e.clientX + 10,
                  e.clientY + 10
                )
              }
              onMouseLeave={() => hintPanel.hideHint()}
            >
              {/* Color Indicator */}
              <div
                style={{
                  width: '4px',
                  height: '100%',
                  background: pattern.color,
                  marginRight: '8px',
                  borderRadius: '2px',
                }}
              />

              {/* Pattern Number */}
              <div
                style={{
                  width: '24px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: isActive ? '#000' : 'var(--fl-text-primary)',
                  textAlign: 'center',
                }}
              >
                {pattern.id}
              </div>

              {/* Pattern Name */}
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={handleEditKeyDown}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'var(--fl-bg-dark)',
                    border: '1px solid var(--fl-orange)',
                    color: 'var(--fl-text-primary)',
                    fontSize: '10px',
                    padding: '2px 4px',
                    margin: '0 4px',
                  }}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    fontSize: '10px',
                    color: isActive ? '#000' : 'var(--fl-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={pattern.name}
                >
                  {pattern.name}
                </div>
              )}

              {/* Context Menu Button */}
              <button
                ref={(el) => {
                  if (el) {
                    patternButtonsRef.current.set(pattern.id, el);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const menuItems = contextMenuService.getChannelRackTrackMenu(
                    {
                      id: pattern.id,
                      name: pattern.name,
                      type: 'drum',
                      steps: new Array(pattern.steps).fill(false),
                      muted: false,
                      solo: false,
                    } as Track,
                    {
                      onRename: () => {
                        onPatternRename(pattern.id, pattern.name);
                      },
                      onDelete: () => {
                        onPatternDelete(pattern.id);
                      },
                      onDuplicate: () => {
                        onPatternDuplicate(pattern.id);
                      },
                    }
                  );
                  contextMenu.show(e.clientX, e.clientY, menuItems);
                }}
                style={{
                  width: '16px',
                  height: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#000' : 'var(--fl-text-secondary)',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Pattern options"
              >
                ⋮
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer - Create Pattern */}
      {onCreatePattern && (
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid var(--fl-border-dark)',
          }}
        >
          <button
            onClick={onCreatePattern}
            style={{
              width: '100%',
              padding: '6px',
              background: 'var(--fl-bg-darker)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            + New Pattern
          </button>
        </div>
      )}
    </div>
  );
}

