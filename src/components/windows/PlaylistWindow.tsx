/**
 * PlaylistWindow - Full playlist window with timeline, tracks, and clips
 * Implements FL Studio-style playlist with drag & drop, clip editing, and timeline controls
 * @module components/windows/PlaylistWindow
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useHintPanel } from '../ui/HintPanel';
import { contextMenuService } from '../../services/ContextMenuService';
import { clipboardService } from '../../services/ClipboardService';
import { automationService } from '../../services/AutomationService';
import type { Arrangement, Clip, ArrangementTrack, SnapSetting } from '../../types/FLStudio.types';
import type { TimelineUtils } from '../../types/FLStudio.types';

/**
 * PlaylistWindow component props
 */
export interface PlaylistWindowProps {
  arrangement: Arrangement | null;
  beatsPerBar: number;
  stepsPerBeat: number;
  basePixelsPerBeat: number;
  zoomLevel: number;
  snapSetting: SnapSetting;
  songPositionBeats: number;
  isPlaying: boolean;
  timelineUtils: TimelineUtils | null;
  onAddClip: (trackId: string, clipData: Partial<Clip>) => Clip | null;
  onRemoveClip: (clipId: string) => boolean;
  onUpdateClip: (clipId: string, updates: { start?: number; length?: number }) => Clip | null;
  onDuplicateClip: (clipId: string, offsetBeats: number) => Clip | null;
  onSetSnap: (snap: SnapSetting) => void;
  onAdjustZoom: (delta: number) => void;
  onTrackMute?: (trackId: string) => void;
  onTrackSolo?: (trackId: string) => void;
  onCopyClips?: (clipIds: string[]) => boolean;
  onCutClips?: (clipIds: string[]) => boolean;
  onPasteClips?: (targetTrackId: string, targetBeat: number) => Clip[];
  selectedTool?: 'draw' | 'paint' | 'select' | 'slip' | 'delete' | 'mute' | 'slice';
}

/**
 * Playlist window component
 */
export function PlaylistWindow({
  arrangement,
  beatsPerBar,
  stepsPerBeat,
  basePixelsPerBeat,
  zoomLevel,
  snapSetting,
  songPositionBeats,
  isPlaying,
  timelineUtils,
  onAddClip,
  onRemoveClip,
  onUpdateClip,
  onDuplicateClip,
  onSetSnap,
  onAdjustZoom,
  onTrackMute,
  onTrackSolo,
  onCopyClips: _onCopyClips,
  onCutClips: _onCutClips,
  onPasteClips: _onPasteClips,
  selectedTool = 'draw',
}: PlaylistWindowProps): JSX.Element {
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);
  const contextMenu = useContextMenu();
  const hintPanel = useHintPanel();

  const [draggedClip, setDraggedClip] = useState<{ clipId: string; trackId: string; startX: number; startBeat: number } | null>(null);
  const [resizedClip, setResizedClip] = useState<{ clipId: string; startX: number; startBeat: number; length: number; side: 'left' | 'right' } | null>(null);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  const pixelsPerBeat = basePixelsPerBeat * zoomLevel;
  const totalBeats = arrangement
    ? timelineUtils?.barsToBeats(arrangement.lengthBars, beatsPerBar) ?? arrangement.lengthBars * beatsPerBar
    : 0;

  /**
   * Convert pixel X to beat position
   */
  const pixelToBeat = useCallback(
    (pixelX: number): number => {
      return Math.max(0, pixelX / pixelsPerBeat);
    },
    [pixelsPerBeat]
  );

  /**
   * Convert beat position to pixel X
   */
  const beatToPixel = useCallback(
    (beat: number): number => {
      return beat * pixelsPerBeat;
    },
    [pixelsPerBeat]
  );

  /**
   * Get snap interval
   */
  const getSnapInterval = useCallback((): number => {
    switch (snapSetting) {
      case 'bar':
        return beatsPerBar;
      case 'beat':
        return 1;
      case 'step':
        return 1 / stepsPerBeat;
      case 'none':
      default:
        return 0;
    }
  }, [snapSetting, beatsPerBar, stepsPerBeat]);

  /**
   * Quantize beat to snap grid
   */
  const quantizeBeat = useCallback(
    (beat: number): number => {
      const interval = getSnapInterval();
      if (!interval) {
        return beat;
      }
      return Math.round(beat / interval) * interval;
    },
    [getSnapInterval]
  );

  /**
   * Build ruler ticks
   */
  const buildRulerTicks = useCallback((): Array<{ beat: number; label: string; isMajor: boolean }> => {
    if (!timelineUtils) {
      return [];
    }
    return timelineUtils.buildRulerTicks({ totalBeats, beatsPerBar });
  }, [timelineUtils, totalBeats, beatsPerBar]);

  /**
   * Build grid lines
   */
  const buildGridLines = useCallback((): Array<{ beat: number; type: 'bar' | 'beat' | 'step' }> => {
    if (!timelineUtils) {
      return [];
    }
    return timelineUtils.buildGridLines({
      totalBeats,
      beatsPerBar,
      stepsPerBeat,
      snapSetting,
    });
  }, [timelineUtils, totalBeats, beatsPerBar, stepsPerBeat, snapSetting]);

  /**
   * Handle clip drag start
   */
  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent, clip: Clip, trackId: string): void => {
      if (e.button !== 0) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const clipX = e.clientX - rect.left;
      const isResizeLeft = clipX < 8;
      const isResizeRight = clipX > rect.width - 8;

      if (isResizeLeft || isResizeRight) {
        setResizedClip({
          clipId: clip.id,
          startX: e.clientX,
          startBeat: clip.start,
          length: clip.length,
          side: isResizeLeft ? 'left' : 'right',
        });
      } else {
        setDraggedClip({
          clipId: clip.id,
          trackId,
          startX: e.clientX,
          startBeat: clip.start,
        });
      }
      e.preventDefault();
    },
    []
  );

  /**
   * Handle timeline click (add clip or start selection box)
   */
  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent, trackId: string): void => {
      if (e.button !== 0 || draggedClip || resizedClip) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Start selection box if clicking on empty area
      if (selectedTool === 'select' || e.shiftKey) {
        setSelectionBox({
          startX: x,
          startY: y,
          endX: x,
          endY: y,
        });
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          setSelectedClips(new Set());
        }
      } else {
        // Add clip in draw mode
        const beat = quantizeBeat(pixelToBeat(x));
        onAddClip(trackId, {
          start: beat,
          length: beatsPerBar,
          name: 'Pattern Clip',
        });
      }
    },
    [draggedClip, resizedClip, selectedTool, quantizeBeat, pixelToBeat, beatsPerBar, onAddClip]
  );

  /**
   * Handle global mouse move for drag/resize/selection box
   */
  useEffect(() => {
    if (!draggedClip && !resizedClip && !selectionBox) {
      return;
    }

    const handleMouseMove = (e: MouseEvent): void => {
      if (selectionBox && tracksRef.current) {
        const rect = tracksRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSelectionBox((prev) => {
          if (!prev) return null;
          return { ...prev, endX: x, endY: y };
        });

        // Update selected clips based on selection box
        if (arrangement) {
          const minX = Math.min(selectionBox.startX, x);
          const maxX = Math.max(selectionBox.startX, x);
          const minY = Math.min(selectionBox.startY, y);
          const maxY = Math.max(selectionBox.startY, y);

          const newSelected = new Set<string>();
          arrangement.tracks.forEach((track, trackIdx) => {
            const trackTop = trackIdx * 40;
            const trackBottom = trackTop + 40;
            if (trackBottom >= minY && trackTop <= maxY) {
              track.clips.forEach((clip) => {
                const clipLeft = beatToPixel(clip.start);
                const clipRight = clipLeft + beatToPixel(clip.length);
                if (clipRight >= minX && clipLeft <= maxX) {
                  newSelected.add(clip.id);
                }
              });
            }
          });

          setSelectedClips((prev) => {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
              // Add to existing selection
              return new Set([...prev, ...newSelected]);
            }
            return newSelected;
          });
        }
      } else if (draggedClip) {
        const deltaX = e.clientX - draggedClip.startX;
        const deltaBeat = pixelToBeat(deltaX);
        const newBeat = quantizeBeat(Math.max(0, draggedClip.startBeat + deltaBeat));
        onUpdateClip(draggedClip.clipId, { start: newBeat });
      } else if (resizedClip) {
        const deltaX = e.clientX - resizedClip.startX;
        const deltaBeat = pixelToBeat(deltaX);

        if (resizedClip.side === 'left') {
          const newStart = quantizeBeat(Math.max(0, resizedClip.startBeat + deltaBeat));
          const newLength = resizedClip.length - (newStart - resizedClip.startBeat);
          if (newLength > 0) {
            onUpdateClip(resizedClip.clipId, { start: newStart, length: newLength });
          }
        } else {
          const newLength = quantizeBeat(Math.max(1 / stepsPerBeat, resizedClip.length + deltaBeat));
          onUpdateClip(resizedClip.clipId, { length: newLength });
        }
      }
    };

    const handleMouseUp = (): void => {
      setDraggedClip(null);
      setResizedClip(null);
      setSelectionBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedClip, resizedClip, selectionBox, arrangement, pixelToBeat, quantizeBeat, stepsPerBeat, onUpdateClip, beatToPixel]);

  /**
   * Find clip by ID
   */
  const findClipById = useCallback(
    (clipId: string): { clip: Clip; track: ArrangementTrack } | null => {
      if (!arrangement) {
        return null;
      }

      for (const track of arrangement.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          return { clip, track };
        }
      }

      return null;
    },
    [arrangement]
  );

  /**
   * Generate clip ID
   */
  const generateClipId = useCallback((): string => {
    return `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Handle cut clip
   */
  const handleCutClip = useCallback(
    (clipId: string): void => {
      const result = findClipById(clipId);
      if (!result) {
        return;
      }

      clipboardService.copyClips([result.clip], {
        beatsPerBar,
        stepsPerBeat,
      });

      onRemoveClip(clipId);
    },
    [findClipById, beatsPerBar, stepsPerBeat, onRemoveClip]
  );

  /**
   * Handle copy clip
   */
  const handleCopyClip = useCallback(
    (clipId: string): void => {
      const result = findClipById(clipId);
      if (!result) {
        return;
      }

      clipboardService.copyClips([result.clip], {
        beatsPerBar,
        stepsPerBeat,
      });
    },
    [findClipById, beatsPerBar, stepsPerBeat]
  );

  /**
   * Handle paste clip
   */
  const handlePasteClip = useCallback(
    (trackId: string, targetBeat: number): void => {
      const pastedClips = clipboardService.pasteClips(targetBeat, generateClipId);
      if (!pastedClips || pastedClips.length === 0) {
        return;
      }

      pastedClips.forEach((clip) => {
        onAddClip(trackId, clip);
      });
    },
    [generateClipId, onAddClip]
  );

  /**
   * Handle mute clip
   */
  const handleMuteClip = useCallback(
    (clipId: string): void => {
      const result = findClipById(clipId);
      if (!result) {
        return;
      }

      // Toggle mute state
      const updatedClip: Clip = {
        ...result.clip,
        muted: !result.clip.muted,
      };

      // Update clip in arrangement
      if (arrangement) {
        // Update tracks (unused but kept for future use)
        void arrangement.tracks.map((track) => {
          if (track.id === result.track.id) {
            return {
              ...track,
              clips: track.clips.map((c) => (c.id === clipId ? updatedClip : c)),
            };
          }
          return track;
        });

        // Note: This would need to be passed up to parent component to update state
        // For now, we'll just update the clip's muted property
        result.clip.muted = updatedClip.muted;
      }
    },
    [findClipById, arrangement]
  );

  /**
   * Handle create automation
   */
  const handleCreateAutomation = useCallback(
    (clipId: string): void => {
      const result = findClipById(clipId);
      if (!result || !arrangement) {
        return;
      }

      // Create automation target based on clip type
      let automationTarget;
      if (result.clip.type === 'pattern' && result.clip.patternId) {
        automationTarget = automationService.createAutomationClip(
          {
            type: 'parameter',
            id: `track-${result.track.id}`,
            parameter: 'volume',
            name: `${result.track.name} Volume`,
            min: 0,
            max: 1,
            defaultValue: 0.8,
          },
          result.clip.length
        );
      } else if (result.clip.automationTarget) {
        // Use existing automation target
        automationTarget = result.clip.automationTarget;
      } else {
        // Create new automation clip
        automationTarget = automationService.createAutomationClip(
          {
            type: 'parameter',
            id: `clip-${clipId}`,
            parameter: 'volume',
            name: `${result.clip.name} Automation`,
            min: 0,
            max: 1,
            defaultValue: 0.8,
          },
          result.clip.length
        );
      }

      // Create automation clip in playlist
      const automationClip: Clip = {
        id: generateClipId(),
        type: 'automation',
        start: result.clip.start,
        length: result.clip.length,
        name: `${result.clip.name} Automation`,
        automationTarget: automationTarget,
      };

      onAddClip(result.track.id, automationClip);
    },
    [findClipById, arrangement, generateClipId, onAddClip]
  );

  /**
   * Setup clip context menu
   */
  useEffect(() => {
    const clips = timelineRef.current?.querySelectorAll('.playlist-clip');
    clips?.forEach((clipEl) => {
      const clipId = clipEl.getAttribute('data-clip-id');
      const trackId = clipEl.getAttribute('data-track-id');
      if (!clipId || !trackId) {
        return;
      }

      const menuItems = contextMenuService.getPlaylistClipMenu({
        onCut: () => {
          handleCutClip(clipId);
        },
        onCopy: () => {
          handleCopyClip(clipId);
        },
        onPaste: () => {
          handlePasteClip(trackId, songPositionBeats);
        },
        onDelete: () => {
          onRemoveClip(clipId);
        },
        onDuplicate: () => {
          onDuplicateClip(clipId, beatsPerBar);
        },
        onMute: () => {
          handleMuteClip(clipId);
        },
        onCreateAutomation: () => {
          handleCreateAutomation(clipId);
        },
      });

      contextMenu.attach(clipEl as HTMLElement, menuItems);
    });

    return () => {
      clips?.forEach((clipEl) => {
        contextMenu.detach(clipEl as HTMLElement);
      });
    };
  }, [
    arrangement,
    contextMenu,
    onRemoveClip,
    onDuplicateClip,
    beatsPerBar,
    songPositionBeats,
    handleCutClip,
    handleCopyClip,
    handlePasteClip,
    handleMuteClip,
    handleCreateAutomation,
  ]);

  if (!arrangement) {
    return (
      <div style={{ padding: '16px', color: 'var(--fl-text-secondary)' }}>
        No arrangement loaded
      </div>
    );
  }

  const rulerTicks = buildRulerTicks();
  const gridLines = buildGridLines();
  const playheadX = beatToPixel(songPositionBeats);

  return (
    <div
      className="playlist-window"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        <label style={{ fontSize: '10px', color: 'var(--fl-text-secondary)' }}>
          Snap:
        </label>
        <select
          value={snapSetting}
          onChange={(e) => onSetSnap(e.target.value as SnapSetting)}
          style={{
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '10px',
            padding: '2px 4px',
          }}
        >
          <option value="bar">Bar</option>
          <option value="beat">Beat</option>
          <option value="step">Step</option>
          <option value="none">None</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={() => onAdjustZoom(-0.1)}
            style={{
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            −
          </button>
          <span style={{ fontSize: '10px', color: 'var(--fl-text-secondary)', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => onAdjustZoom(0.1)}
            style={{
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Timeline Header */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        {/* Track List Header */}
        <div
          style={{
            width: '200px',
            borderRight: '1px solid var(--fl-border-dark)',
            padding: '4px 8px',
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
            fontWeight: 600,
          }}
        >
          TRACKS
        </div>

        {/* Time Ruler */}
        <div
          ref={timelineRef}
          style={{
            flex: 1,
            position: 'relative',
            height: '24px',
            overflow: 'hidden',
            background: 'var(--fl-bg-dark)',
          }}
        >
          {/* Grid Lines */}
          {gridLines.map((line, idx) => (
            <div
              key={`grid-${idx}`}
              style={{
                position: 'absolute',
                left: `${beatToPixel(line.beat)}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                background:
                  line.type === 'bar'
                    ? 'rgba(255, 153, 0, 0.3)'
                    : line.type === 'beat'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Ruler Ticks */}
          {rulerTicks.map((tick, idx) => (
            <div
              key={`tick-${idx}`}
              style={{
                position: 'absolute',
                left: `${beatToPixel(tick.beat)}px`,
                top: 0,
                height: '24px',
                width: '1px',
                background: tick.isMajor ? 'rgba(255, 153, 0, 0.6)' : 'rgba(255, 255, 255, 0.15)',
              }}
            >
              {tick.isMajor && (
                <span
                  style={{
                    position: 'absolute',
                    left: '4px',
                    top: '2px',
                    fontSize: '9px',
                    color: 'var(--fl-text-secondary)',
                  }}
                >
                  {tick.label}
                </span>
              )}
            </div>
          ))}

          {/* Playhead */}
          {isPlaying && (
            <div
              style={{
                position: 'absolute',
                left: `${playheadX}px`,
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#FF9900',
                boxShadow: '0 0 4px rgba(255, 153, 0, 0.8)',
                zIndex: 100,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* Tracks and Timeline */}
      <div
        ref={tracksRef}
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'auto',
        }}
      >
        {/* Track List */}
        <div
          style={{
            width: '200px',
            borderRight: '1px solid var(--fl-border-dark)',
            background: 'var(--fl-bg-darker)',
          }}
        >
          {arrangement.tracks.map((track) => (
            <div
              key={track.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderBottom: '1px solid var(--fl-border-dark)',
                minHeight: '40px',
                background: 'var(--fl-bg-dark)',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '100%',
                  background: track.color,
                  marginRight: '8px',
                }}
              />
              <div style={{ flex: 1, fontSize: '10px', color: 'var(--fl-text-primary)' }}>
                {track.name}
              </div>
              <button
                onClick={() => onTrackMute?.(track.id)}
                style={{
                  width: '18px',
                  height: '18px',
                  background: 'var(--fl-bg-dark)',
                  border: '1px solid var(--fl-border)',
                  color: 'var(--fl-text-secondary)',
                  fontSize: '8px',
                  cursor: 'pointer',
                  marginRight: '2px',
                }}
                title="Mute"
              >
                M
              </button>
              <button
                onClick={() => onTrackSolo?.(track.id)}
                style={{
                  width: '18px',
                  height: '18px',
                  background: 'var(--fl-bg-dark)',
                  border: '1px solid var(--fl-border)',
                  color: 'var(--fl-text-secondary)',
                  fontSize: '8px',
                  cursor: 'pointer',
                }}
                title="Solo"
              >
                S
              </button>
            </div>
          ))}
        </div>

        {/* Timeline Tracks */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: 'var(--fl-bg-dark)',
          }}
        >
          {arrangement.tracks.map((track) => (
            <div
              key={track.id}
              style={{
                position: 'relative',
                minHeight: '40px',
                borderBottom: '1px solid var(--fl-border-dark)',
              }}
            >
              {/* Grid Lines */}
              {gridLines.map((line, idx) => (
                <div
                  key={`track-grid-${track.id}-${idx}`}
                  style={{
                    position: 'absolute',
                    left: `${beatToPixel(line.beat)}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background:
                      line.type === 'bar'
                        ? 'rgba(255, 153, 0, 0.2)'
                        : line.type === 'beat'
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Clips */}
              {track.clips.map((clip) => (
                <div
                  key={clip.id}
                  className="playlist-clip"
                  data-clip-id={clip.id}
                  onMouseDown={(e) => handleClipMouseDown(e, clip, track.id)}
                  style={{
                    position: 'absolute',
                    left: `${beatToPixel(clip.start)}px`,
                    top: '4px',
                    width: `${beatToPixel(clip.length)}px`,
                    height: '32px',
                    background: track.color || '#FF9933',
                    border: '1px solid rgba(0, 0, 0, 0.3)',
                    borderRadius: '2px',
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 4px',
                    fontSize: '9px',
                    color: '#000',
                    fontWeight: 500,
                    overflow: 'hidden',
                    boxShadow: selectedClips.has(clip.id) ? '0 0 0 2px #FF9900' : 'none',
                  }}
                  onMouseEnter={(e) =>
                    hintPanel.showHint(
                      {
                        name: clip.name,
                        description: `${clip.type} clip`,
                        value: `${timelineUtils?.formatBeatPosition(clip.start, beatsPerBar, stepsPerBeat) ?? ''} - ${timelineUtils?.formatBeatPosition(clip.start + clip.length, beatsPerBar, stepsPerBeat) ?? ''}`,
                      },
                      e.clientX + 10,
                      e.clientY + 10
                    )
                  }
                  onMouseLeave={() => hintPanel.hideHint()}
                >
                  {clip.name}
                </div>
              ))}

              {/* Timeline Click Area */}
              <div
                onMouseDown={(e) => handleTimelineMouseDown(e, track.id)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  cursor: 'crosshair',
                }}
              />
            </div>
          ))}

          {/* Playhead Line */}
          {isPlaying && (
            <div
              style={{
                position: 'absolute',
                left: `${playheadX}px`,
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#FF9900',
                boxShadow: '0 0 4px rgba(255, 153, 0, 0.8)',
                zIndex: 100,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Selection Box */}
          {selectionBox && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
                top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
                width: `${Math.abs(selectionBox.endX - selectionBox.startX)}px`,
                height: `${Math.abs(selectionBox.endY - selectionBox.startY)}px`,
                border: '1px dashed rgba(255, 153, 0, 0.8)',
                background: 'rgba(255, 153, 0, 0.1)',
                pointerEvents: 'none',
                zIndex: 50,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

