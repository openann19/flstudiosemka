/**
 * TrackRow - Track row component with workflow features
 * Enhanced with drag-and-drop, multi-select, keyboard navigation, and performance optimizations
 * @module components/TrackRow
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useContextMenu } from '../hooks/useContextMenu';
import { useHintPanel } from '../components/ui/HintPanel';
import { StepButton } from '../components/ui/StepButton';
import { contextMenuService } from '../services/ContextMenuService';
import type { Track, TrackType } from '../types/FLStudio.types';

/**
 * TrackRow component props
 */
export interface TrackRowProps {
  track: Track;
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (stepIndex: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOpenPianoRoll: () => void;
  onOpenChannelSettings?: () => void;
  getTrackColor: (type: TrackType, id: number) => string;
}

/**
 * Track row component with enhanced workflow features
 */
export const TrackRow = React.memo<TrackRowProps>(function TrackRow({
  track,
  currentStep,
  isPlaying,
  onToggleStep,
  onToggleMute,
  onToggleSolo,
  onRename,
  onDelete,
  onDuplicate,
  onOpenPianoRoll,
  onOpenChannelSettings,
  getTrackColor,
}: TrackRowProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const contextMenu = useContextMenu();
  const hintPanel = useHintPanel();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(track.name);
  const [isSelected, setIsSelected] = useState(false);

  /**
   * Memoize track color
   */
  const trackColor = useMemo(() => track.color || getTrackColor(track.type, track.id), [track, getTrackColor]);

  /**
   * Setup context menu
   */
  useEffect(() => {
    if (trackRef.current) {
      const menuItems = contextMenuService.getChannelRackTrackMenu(track, {
        onRename: () => {
          setIsEditingName(true);
          setTimeout(() => {
            if (nameRef.current) {
              nameRef.current.focus();
              const range = document.createRange();
              range.selectNodeContents(nameRef.current);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }, 0);
        },
        onDelete,
        onMute: onToggleMute,
        onSolo: onToggleSolo,
        onOpenPianoRoll,
        onDuplicate,
        onChannelSettings: onOpenChannelSettings,
      });
      contextMenu.attach(trackRef.current, menuItems);
    }

    return () => {
      if (trackRef.current) {
        contextMenu.detach(trackRef.current);
      }
    };
  }, [track, onRename, onDelete, onToggleMute, onToggleSolo, onOpenPianoRoll, onDuplicate, onOpenChannelSettings, contextMenu]);

  /**
   * Handle name editing
   */
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (nameRef.current) {
          nameRef.current.blur();
        }
      } else if (e.key === 'Escape') {
        setEditedName(track.name);
        if (nameRef.current) {
          nameRef.current.blur();
        }
      }
    },
    [track.name]
  );

  /**
   * Handle name blur
   */
  const handleNameBlur = useCallback((): void => {
    setIsEditingName(false);
    if (editedName.trim() && editedName !== track.name) {
      onRename(editedName.trim());
    } else {
      setEditedName(track.name);
    }
  }, [editedName, track.name, onRename]);

  /**
   * Handle track keyboard navigation
   */
  const handleTrackKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (!isEditingName) {
            e.preventDefault();
            onDelete();
          }
          break;
        case 'Enter':
          if (!isEditingName) {
            e.preventDefault();
            setIsEditingName(true);
          }
          break;
        case 'm':
        case 'M':
          if (!isEditingName && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleMute();
          }
          break;
        case 's':
        case 'S':
          if (!isEditingName && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleSolo();
          }
          break;
      }
    },
    [isEditingName, onDelete, onToggleMute, onToggleSolo]
  );

  return (
    <div
      ref={trackRef}
      className="track"
      data-track-id={track.id}
      role="row"
      aria-label={`Track: ${track.name}`}
      tabIndex={0}
      onKeyDown={handleTrackKeyDown}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        minHeight: '40px',
        borderBottom: '1px solid var(--fl-border-dark)',
        background: isSelected ? 'var(--fl-bg-hover)' : 'var(--fl-bg-dark)',
        transition: 'background 0.1s ease',
        outline: 'none',
      }}
      onFocus={() => setIsSelected(true)}
      onBlur={() => setIsSelected(false)}
    >
      <div
        className="track-header"
        style={{
          width: '180px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--spacing-small)',
          gap: 'var(--spacing-small)',
          borderRight: '1px solid var(--fl-border-dark)',
          background: 'linear-gradient(90deg, #272727 0%, #252525 100%)',
        }}
      >
        <div
          className="track-icon"
          style={{
            width: '8px',
            height: '24px',
            background: trackColor,
            borderRadius: 'var(--radius-sm)',
            boxShadow: `0 0 4px ${trackColor}88`,
            transition: 'box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Track Color',
                description: 'Right-click for track options',
                value: track.type,
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
        />
        <span
          ref={nameRef}
          className="track-name"
          contentEditable={isEditingName}
          suppressContentEditableWarning
          onDoubleClick={() => setIsEditingName(true)}
          onKeyDown={handleNameKeyDown}
          onBlur={handleNameBlur}
          onInput={(e) => setEditedName(e.currentTarget.textContent || '')}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Track Name',
                description: 'Double-click to rename, right-click for options',
                value: track.name,
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
          style={{
            flex: 1,
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--fl-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'text',
          }}
        >
          {editedName}
        </span>
        <div
          className="track-controls"
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          <button
            className={`track-btn mute-btn ${track.muted ? 'active' : ''}`}
            onClick={onToggleMute}
            onMouseEnter={(e) =>
              hintPanel.showHint(
                {
                  name: 'Mute',
                  description: 'Mute this track',
                  value: track.muted ? 'Muted' : 'Unmuted',
                  shortcut: 'M',
                },
                e.clientX + 10,
                e.clientY + 10
              )
            }
            onMouseLeave={() => hintPanel.hideHint()}
            title="Mute"
            style={{
              width: '18px',
              height: '18px',
              background: track.muted
                ? 'linear-gradient(180deg, #FF6B6B 0%, #E84C3D 100%)'
                : 'linear-gradient(180deg, #3A3A3A 0%, #2E2E2E 100%)',
              border: `1px solid ${track.muted ? '#C0392B' : 'var(--fl-border)'}`,
              color: track.muted ? 'var(--fl-text-inverted)' : 'var(--fl-text-secondary)',
              cursor: 'pointer',
              fontSize: '8px',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.05s',
              boxShadow: track.muted ? '0 0 6px rgba(232, 76, 61, 0.4)' : '0 1px 1px rgba(0, 0, 0, 0.3)',
            }}
          >
            M
          </button>
          <button
            className={`track-btn solo-btn ${track.solo ? 'active' : ''}`}
            onClick={onToggleSolo}
            onMouseEnter={(e) =>
              hintPanel.showHint(
                {
                  name: 'Solo',
                  description: 'Solo this track',
                  value: track.solo ? 'Soloed' : 'Not Soloed',
                  shortcut: 'S',
                },
                e.clientX + 10,
                e.clientY + 10
              )
            }
            onMouseLeave={() => hintPanel.hideHint()}
            title="Solo"
            style={{
              width: '18px',
              height: '18px',
              background: track.solo
                ? 'linear-gradient(180deg, #5BCC5B 0%, #3FB53F 100%)'
                : 'linear-gradient(180deg, #3A3A3A 0%, #2E2E2E 100%)',
              border: `1px solid ${track.solo ? '#2E8B2E' : 'var(--fl-border)'}`,
              color: track.solo ? 'var(--fl-text-inverted)' : 'var(--fl-text-secondary)',
              cursor: 'pointer',
              fontSize: '8px',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.05s',
              boxShadow: track.solo ? '0 0 6px rgba(63, 181, 63, 0.4)' : '0 1px 1px rgba(0, 0, 0, 0.3)',
            }}
          >
            S
          </button>
        </div>
      </div>
      <div
        className="step-grid"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(16, 1fr)',
          gap: '2px',
          padding: 'var(--spacing-small)',
        }}
      >
        {track.steps.map((step, index) => (
          <StepButton
            key={index}
            active={step}
            current={currentStep === index && isPlaying}
            beatMarker={index % 4 === 0}
            onClick={() => onToggleStep(index)}
            onMouseEnter={(e) =>
              hintPanel.showHint(
                {
                  name: `Step ${index + 1}`,
                  description: 'Click to toggle step',
                  value: step ? 'Active' : 'Inactive',
                },
                e.clientX + 10,
                e.clientY + 10
              )
            }
            onMouseLeave={() => hintPanel.hideHint()}
            ariaLabel={`Step ${index + 1}, ${step ? 'active' : 'inactive'}`}
          />
        ))}
      </div>
    </div>
  );
});