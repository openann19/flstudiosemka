/**
 * ChannelRackExample - Example integration of workflow features
 * Demonstrates context menus, hint panels, and keyboard shortcuts
 * @module components/examples/ChannelRackExample
 */

import React, { useRef, useEffect } from 'react';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useHintPanel } from '../ui/HintPanel';
import { contextMenuService } from '../../services/ContextMenuService';
import { StepButton } from '../ui/StepButton';
import { LED } from '../ui/LED';
import type { Track } from '../../types/FLStudio.types';

/**
 * Channel Rack Example props
 */
export interface ChannelRackExampleProps {
  track: Track;
  onRename?: () => void;
  onDelete?: () => void;
  onMute?: () => void;
  onSolo?: () => void;
  onOpenPianoRoll?: () => void;
}

/**
 * Example Channel Rack track component with workflow features
 */
export function ChannelRackExample({
  track,
  onRename,
  onDelete,
  onMute,
  onSolo,
  onOpenPianoRoll,
}: ChannelRackExampleProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const contextMenu = useContextMenu();
  const hintPanel = useHintPanel();

  /**
   * Setup context menu
   */
  useEffect(() => {
    if (trackRef.current) {
      const menuItems = contextMenuService.getChannelRackTrackMenu(track, {
        onRename,
        onDelete,
        onMute,
        onSolo,
        onOpenPianoRoll,
      });
      contextMenu.attach(trackRef.current, menuItems);
    }

    return () => {
      if (trackRef.current) {
        contextMenu.detach(trackRef.current);
      }
    };
  }, [track, onRename, onDelete, onMute, onSolo, onOpenPianoRoll, contextMenu]);

  /**
   * Handle hint panel on hover
   */
  const handleMouseEnter = (e: React.MouseEvent, hintData: { name: string; description?: string; value?: string | number }): void => {
    hintPanel.showHint(hintData, e.clientX + 10, e.clientY + 10);
  };

  const handleMouseLeave = (): void => {
    hintPanel.hideHint();
  };

  return (
    <div
      ref={trackRef}
      className="channel-rack-track-example"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--spacing-small)',
        background: 'var(--fl-bg-dark)',
        border: '1px solid var(--fl-border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-small)',
      }}
    >
      {/* Track Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-small)',
          marginBottom: 'var(--spacing-small)',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            background: track.color || '#FF9900',
            borderRadius: 'var(--radius-sm)',
          }}
        />
        <span style={{ flex: 1, fontSize: '11px', color: 'var(--fl-text-primary)' }}>
          {track.name}
        </span>
        <LED
          color={track.muted ? 'red' : 'green'}
          active={!track.muted}
          size={8}
        />
        <button
          onClick={onMute}
          onMouseEnter={(e) =>
            handleMouseEnter(e, {
              name: 'Mute',
              description: 'Mute this track',
              value: track.muted ? 'Muted' : 'Unmuted',
            })
          }
          onMouseLeave={handleMouseLeave}
          style={{
            width: '24px',
            height: '24px',
            background: track.muted ? 'var(--fl-red)' : 'transparent',
            border: '1px solid var(--fl-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--fl-text-primary)',
            cursor: 'pointer',
          }}
        >
          M
        </button>
        <button
          onClick={onSolo}
          onMouseEnter={(e) =>
            handleMouseEnter(e, {
              name: 'Solo',
              description: 'Solo this track',
              value: track.solo ? 'Soloed' : 'Not Soloed',
            })
          }
          onMouseLeave={handleMouseLeave}
          style={{
            width: '24px',
            height: '24px',
            background: track.solo ? 'var(--fl-orange)' : 'transparent',
            border: '1px solid var(--fl-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--fl-text-primary)',
            cursor: 'pointer',
          }}
        >
          S
        </button>
      </div>

      {/* Step Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(16, 1fr)',
          gap: '2px',
        }}
      >
        {track.steps.map((step, index) => (
          <StepButton
            key={index}
            active={step}
            beatMarker={index % 4 === 0}
            onMouseEnter={(e) =>
              handleMouseEnter(e, {
                name: `Step ${index + 1}`,
                description: 'Click to toggle step',
                value: step ? 'Active' : 'Inactive',
              })
            }
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>
    </div>
  );
}

