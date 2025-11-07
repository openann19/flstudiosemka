/**
 * AutomationLane - Automation lane component for playlist
 * Implements automation keyframes, curves, and recording
 * @module components/automation/AutomationLane
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useHintPanel } from '../ui/HintPanel';
import type { SnapSetting } from '../../types/FLStudio.types';

/**
 * Automation point
 */
export interface AutomationPoint {
  id: string;
  beat: number;
  value: number;
  curve?: number; // Bezier curve handle (-1 to 1)
}

/**
 * AutomationLane component props
 */
export interface AutomationLaneProps {
  trackId: string;
  parameterName: string;
  min: number;
  max: number;
  points: AutomationPoint[];
  beatsPerBar: number;
  stepsPerBeat: number;
  pixelsPerBeat: number;
  snapSetting: SnapSetting;
  onPointsChange: (points: AutomationPoint[]) => void;
  onRecord?: (beat: number, value: number) => void;
}

/**
 * Automation lane component
 */
export function AutomationLane({
  trackId: _trackId,
  parameterName,
  min,
  max,
  points,
  beatsPerBar,
  stepsPerBeat,
  pixelsPerBeat,
  snapSetting,
  onPointsChange,
  onRecord: _onRecord,
}: AutomationLaneProps): JSX.Element {
  const laneRef = useRef<HTMLDivElement>(null);
  const hintPanel = useHintPanel();

  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; beat: number; value: number } | null>(null);
  const [_isRecording, _setIsRecording] = useState<boolean>(false);

  /**
   * Convert pixel X to beat
   */
  const pixelToBeat = useCallback(
    (pixelX: number): number => {
      return Math.max(0, pixelX / pixelsPerBeat);
    },
    [pixelsPerBeat]
  );

  /**
   * Convert beat to pixel X
   */
  const beatToPixel = useCallback(
    (beat: number): number => {
      return beat * pixelsPerBeat;
    },
    [pixelsPerBeat]
  );

  /**
   * Convert pixel Y to value
   */
  const pixelToValue = useCallback(
    (pixelY: number, height: number): number => {
      const normalized = 1 - pixelY / height;
      return min + normalized * (max - min);
    },
    [min, max]
  );

  /**
   * Convert value to pixel Y
   */
  const valueToPixel = useCallback(
    (value: number, height: number): number => {
      const normalized = (value - min) / (max - min);
      return (1 - normalized) * height;
    },
    [min, max]
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
   * Quantize beat
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
   * Handle point drag start
   */
  const handlePointMouseDown = useCallback(
    (e: React.MouseEvent, point: AutomationPoint): void => {
      if (e.button !== 0) {
        return;
      }

      const rect = laneRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setDraggedPoint(point.id);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        beat: point.beat,
        value: point.value,
      });
      e.preventDefault();
    },
    []
  );

  /**
   * Handle lane click (add point)
   */
  const handleLaneClick = useCallback(
    (e: React.MouseEvent): void => {
      if (e.button !== 0 || draggedPoint || !laneRef.current) {
        return;
      }

      const rect = laneRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const beat = quantizeBeat(pixelToBeat(x));
      const value = pixelToValue(y, rect.height);

      const newPoint: AutomationPoint = {
        id: `point-${Date.now()}-${Math.random()}`,
        beat,
        value,
      };

      onPointsChange([...points, newPoint].sort((a, b) => a.beat - b.beat));
    },
    [draggedPoint, quantizeBeat, pixelToBeat, pixelToValue, points, onPointsChange]
  );

  /**
   * Handle global mouse move for drag
   */
  useEffect(() => {
    if (!draggedPoint || !dragStart || !laneRef.current) {
      return;
    }

    const handleMouseMove = (e: MouseEvent): void => {
      const rect = laneRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const deltaBeat = pixelToBeat(deltaX);
      const newBeat = quantizeBeat(Math.max(0, dragStart.beat + deltaBeat));
      const newValue = Math.max(
        min,
        Math.min(max, dragStart.value - (deltaY / rect.height) * (max - min))
      );

      onPointsChange(
        points.map((p) => (p.id === draggedPoint ? { ...p, beat: newBeat, value: newValue } : p))
      );
    };

    const handleMouseUp = (): void => {
      setDraggedPoint(null);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPoint, dragStart, pixelToBeat, quantizeBeat, min, max, points, onPointsChange]);

  const sortedPoints = [...points].sort((a, b) => a.beat - b.beat);

  return (
    <div
      ref={laneRef}
      className="automation-lane"
      onClick={handleLaneClick}
      style={{
        position: 'relative',
        height: '60px',
        background: 'var(--fl-bg-dark)',
        borderBottom: '1px solid var(--fl-border-dark)',
        cursor: 'crosshair',
      }}
    >
      {/* Grid Lines */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'var(--fl-border)',
          opacity: 0.3,
        }}
      />

      {/* Automation Curve */}
      {sortedPoints.length > 1 && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
          }}
        >
          <polyline
            points={sortedPoints
              .map((p) => {
                const x = beatToPixel(p.beat);
                const y = valueToPixel(p.value, 60);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="var(--fl-orange)"
            strokeWidth="2"
          />
        </svg>
      )}

      {/* Automation Points */}
      {sortedPoints.map((point) => {
        const x = beatToPixel(point.beat);
        const y = valueToPixel(point.value, 60);

        return (
          <div
            key={point.id}
            onMouseDown={(e) => handlePointMouseDown(e, point)}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              background: 'var(--fl-orange)',
              border: '2px solid #000',
              borderRadius: '50%',
              cursor: 'move',
              zIndex: 10,
            }}
            onMouseEnter={(e) =>
              hintPanel.showHint(
                {
                  name: parameterName,
                  description: `Beat: ${point.beat.toFixed(2)}, Value: ${point.value.toFixed(2)}`,
                },
                e.clientX + 10,
                e.clientY + 10
              )
            }
            onMouseLeave={() => hintPanel.hideHint()}
          />
        );
      })}

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          left: '4px',
          top: '4px',
          fontSize: '9px',
          color: 'var(--fl-text-secondary)',
          background: 'var(--fl-bg-darker)',
          padding: '2px 4px',
          borderRadius: '2px',
        }}
      >
        {parameterName}
      </div>
    </div>
  );
}

