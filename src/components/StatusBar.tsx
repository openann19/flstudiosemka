/**
 * StatusBar - Status bar component
 * Enhanced with real-time metrics, clickable status indicators, and tooltips
 * @module components/StatusBar
 */

import React, { useState, useCallback } from 'react';
import { LED } from './ui/LED';
import { useHintPanel } from './ui/HintPanel';

/**
 * StatusBar component props
 */
export interface StatusBarProps {
  audioEngineStatus?: 'running' | 'suspended' | 'closed';
  cpuUsage?: number;
  memoryUsage?: number;
  projectStatus?: 'saved' | 'unsaved';
  onAudioEngineClick?: () => void;
  onProjectStatusClick?: () => void;
}

/**
 * Status bar component with enhanced interactivity
 */
export const StatusBar = React.memo<StatusBarProps>(function StatusBar({
  audioEngineStatus = 'running',
  cpuUsage = 0,
  memoryUsage = 0,
  projectStatus = 'saved',
  onAudioEngineClick,
  onProjectStatusClick,
}: StatusBarProps): JSX.Element {
  const hintPanel = useHintPanel();
  const [cpuColor, setCpuColor] = useState<'green' | 'yellow' | 'red'>('green');

  /**
   * Update CPU color based on usage
   */
  React.useEffect(() => {
    if (cpuUsage > 80) {
      setCpuColor('red');
    } else if (cpuUsage > 50) {
      setCpuColor('yellow');
    } else {
      setCpuColor('green');
    }
  }, [cpuUsage]);

  /**
   * Handle audio engine click
   */
  const handleAudioEngineClick = useCallback((): void => {
    if (onAudioEngineClick) {
      onAudioEngineClick();
    }
  }, [onAudioEngineClick]);

  /**
   * Handle project status click
   */
  const handleProjectStatusClick = useCallback((): void => {
    if (onProjectStatusClick) {
      onProjectStatusClick();
    }
  }, [onProjectStatusClick]);

  return (
    <div
      className="fl-status-bar"
      role="status"
      aria-live="polite"
      style={{
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--spacing-medium)',
        background: 'linear-gradient(180deg, #2A2A2A 0%, #232323 100%)',
        borderTop: '1px solid var(--fl-border-dark)',
        fontSize: '10px',
        color: 'var(--fl-text-secondary)',
        gap: 'var(--spacing-large)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-small)',
          cursor: onAudioEngineClick ? 'pointer' : 'default',
        }}
        onClick={handleAudioEngineClick}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Audio Engine',
              description: `Status: ${audioEngineStatus}`,
              value: audioEngineStatus === 'running' ? 'Running' : 'Suspended',
            },
            e.clientX + 10,
            e.clientY - 30
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
      >
        <LED
          color={audioEngineStatus === 'running' ? 'green' : 'red'}
          active={audioEngineStatus === 'running'}
          size={6}
          pulse={audioEngineStatus === 'running'}
        />
        <span>Audio Engine</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-small)',
        }}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'CPU Usage',
              description: 'Current CPU usage',
              value: `${cpuUsage.toFixed(1)}%`,
              unit: '%',
              min: 0,
              max: 100,
            },
            e.clientX + 10,
            e.clientY - 30
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
      >
        <LED color={cpuColor} active={cpuUsage > 0} size={6} />
        <span>CPU:</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            color: cpuColor === 'red' ? 'var(--fl-red)' : cpuColor === 'yellow' ? 'var(--fl-yellow)' : 'var(--fl-text-primary)',
            fontWeight: cpuUsage > 80 ? 600 : 400,
          }}
        >
          {cpuUsage.toFixed(1)}%
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-small)',
        }}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Memory Usage',
              description: 'Current memory usage',
              value: `${memoryUsage.toFixed(1)}`,
              unit: 'MB',
            },
            e.clientX + 10,
            e.clientY - 30
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
      >
        <span>Memory:</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fl-text-primary)' }}>
          {memoryUsage.toFixed(1)} MB
        </span>
      </div>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-small)',
          cursor: onProjectStatusClick ? 'pointer' : 'default',
        }}
        onClick={handleProjectStatusClick}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Project Status',
              description: projectStatus === 'saved' ? 'Project is saved' : 'Project has unsaved changes',
              value: projectStatus === 'saved' ? 'Saved' : 'Unsaved',
            },
            e.clientX + 10,
            e.clientY - 30
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
      >
        <LED
          color={projectStatus === 'saved' ? 'green' : 'yellow'}
          active={true}
          size={6}
          pulse={projectStatus === 'unsaved'}
        />
        <span>{projectStatus === 'saved' ? 'Saved' : 'Unsaved'}</span>
      </div>
    </div>
  );
});

