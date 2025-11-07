/**
 * ZoomControls - Zoom controls component
 * Provides zoom sliders, zoom to fit, and mouse wheel zoom
 * @module components/ZoomControls
 */

import React, { useCallback } from 'react';
import { useHintPanel } from './ui/HintPanel';

/**
 * ZoomControls component props
 */
export interface ZoomControlsProps {
  zoomLevel: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange: (zoom: number) => void;
  onZoomToFit?: () => void;
  onZoomToSelection?: () => void;
  label?: string;
}

/**
 * Zoom controls component
 */
export function ZoomControls({
  zoomLevel,
  minZoom = 0.1,
  maxZoom = 4,
  onZoomChange,
  onZoomToFit,
  onZoomToSelection,
  label = 'Zoom',
}: ZoomControlsProps): JSX.Element {
  const hintPanel = useHintPanel();

  /**
   * Handle zoom slider change
   */
  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newZoom = parseFloat(e.target.value);
      if (!Number.isNaN(newZoom)) {
        onZoomChange(Math.max(minZoom, Math.min(maxZoom, newZoom)));
      }
    },
    [minZoom, maxZoom, onZoomChange]
  );

  /**
   * Handle zoom button click
   */
  const handleZoomButton = useCallback(
    (delta: number): void => {
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));
      onZoomChange(newZoom);
    },
    [zoomLevel, minZoom, maxZoom, onZoomChange]
  );

  return (
    <div
      className="zoom-controls"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
      }}
    >
      {/* Zoom Label */}
      <span
        style={{
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
        }}
      >
        {label}:
      </span>

      {/* Zoom Out Button */}
      <button
        onClick={() => handleZoomButton(-0.1)}
        style={{
          width: '24px',
          height: '24px',
          background: 'var(--fl-bg-dark)',
          border: '1px solid var(--fl-border)',
          color: 'var(--fl-text-primary)',
          cursor: 'pointer',
          fontSize: '12px',
        }}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Zoom Out',
              description: 'Decrease zoom level',
            },
            e.clientX + 10,
            e.clientY + 10
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
        title="Zoom Out"
      >
        −
      </button>

      {/* Zoom Slider */}
      <input
        type="range"
        min={minZoom}
        max={maxZoom}
        step={0.1}
        value={zoomLevel}
        onChange={handleZoomChange}
        style={{
          width: '100px',
        }}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Zoom Level',
              description: 'Adjust zoom level',
              value: `${Math.round(zoomLevel * 100)}%`,
              min: minZoom,
              max: maxZoom,
            },
            e.clientX + 10,
            e.clientY + 10
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
      />

      {/* Zoom Display */}
      <span
        style={{
          fontSize: '10px',
          color: 'var(--fl-text-primary)',
          minWidth: '40px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {Math.round(zoomLevel * 100)}%
      </span>

      {/* Zoom In Button */}
      <button
        onClick={() => handleZoomButton(0.1)}
        style={{
          width: '24px',
          height: '24px',
          background: 'var(--fl-bg-dark)',
          border: '1px solid var(--fl-border)',
          color: 'var(--fl-text-primary)',
          cursor: 'pointer',
          fontSize: '12px',
        }}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Zoom In',
              description: 'Increase zoom level',
            },
            e.clientX + 10,
            e.clientY + 10
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
        title="Zoom In"
      >
        +
      </button>

      {/* Zoom To Fit */}
      {onZoomToFit && (
        <button
          onClick={onZoomToFit}
          style={{
            padding: '4px 8px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '10px',
            cursor: 'pointer',
            marginLeft: '8px',
          }}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Zoom To Fit',
                description: 'Zoom to fit all content',
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
          title="Zoom To Fit"
        >
          Fit
        </button>
      )}

      {/* Zoom To Selection */}
      {onZoomToSelection && (
        <button
          onClick={onZoomToSelection}
          style={{
            padding: '4px 8px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '10px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Zoom To Selection',
                description: 'Zoom to fit selected content',
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
          title="Zoom To Selection"
        >
          Selection
        </button>
      )}
    </div>
  );
}

