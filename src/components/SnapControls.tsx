/**
 * SnapControls - Snap and grid controls component
 * Provides UI for snap settings, grid visibility, and grid size
 * @module components/SnapControls
 */

import { useHintPanel } from './ui/HintPanel';
import type { SnapSetting } from '../types/FLStudio.types';

/**
 * SnapControls component props
 */
export interface SnapControlsProps {
  snapSetting: SnapSetting;
  gridVisible: boolean;
  gridSize: number;
  onSnapChange: (snap: SnapSetting) => void;
  onGridVisibilityToggle: () => void;
  onGridSizeChange: (size: number) => void;
}

/**
 * Snap controls component
 */
export function SnapControls({
  snapSetting,
  gridVisible,
  gridSize,
  onSnapChange,
  onGridVisibilityToggle,
  onGridSizeChange,
}: SnapControlsProps): JSX.Element {
  const hintPanel = useHintPanel();

  return (
    <div
      className="snap-controls"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
      }}
    >
      {/* Snap Dropdown */}
      <label
        style={{
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        Snap:
        <select
          value={snapSetting}
          onChange={(e) => onSnapChange(e.target.value as SnapSetting)}
          style={{
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '10px',
            padding: '2px 4px',
          }}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Snap Setting',
                description: 'Snap clips to grid',
                value: snapSetting,
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
        >
          <option value="bar">Bar</option>
          <option value="beat">Beat</option>
          <option value="step">Step</option>
          <option value="none">None</option>
        </select>
      </label>

      {/* Grid Visibility Toggle */}
      <button
        onClick={onGridVisibilityToggle}
        style={{
          padding: '4px 8px',
          background: gridVisible ? 'var(--fl-orange)' : 'var(--fl-bg-dark)',
          border: '1px solid var(--fl-border)',
          color: gridVisible ? '#000' : 'var(--fl-text-primary)',
          fontSize: '10px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Grid Visibility',
              description: 'Show/hide grid lines',
              value: gridVisible ? 'Visible' : 'Hidden',
            },
            e.clientX + 10,
            e.clientY + 10
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
        title="Toggle Grid"
      >
        Grid
      </button>

      {/* Grid Size */}
      <label
        style={{
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        Size:
        <input
          type="number"
          value={gridSize}
          min="1"
          max="32"
          onChange={(e) => {
            const size = parseInt(e.target.value, 10);
            if (!Number.isNaN(size)) {
              onGridSizeChange(Math.max(1, Math.min(32, size)));
            }
          }}
          style={{
            width: '40px',
            padding: '2px 4px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '10px',
            textAlign: 'center',
          }}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Grid Size',
                description: 'Grid subdivision size',
                value: `${gridSize} steps`,
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
        />
      </label>
    </div>
  );
}

