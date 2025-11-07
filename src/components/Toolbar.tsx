/**
 * Toolbar - Tool selection toolbar
 * Enhanced with tooltips, keyboard shortcuts display, and active tool highlighting
 * @module components/Toolbar
 */

import React, { useCallback } from 'react';
import { useTools } from '../hooks/useTools';
import { useHintPanel } from './ui/HintPanel';
import { Button } from './ui/Button';
import type { ToolType } from '../types/FLStudio.types';

/**
 * Toolbar component props
 */
export interface ToolbarProps {
  className?: string;
}

/**
 * Tool selection toolbar component with enhanced UX
 */
export const Toolbar = React.memo<ToolbarProps>(function Toolbar({ className = '' }: ToolbarProps): JSX.Element {
  const tools = useTools();
  const hintPanel = useHintPanel();

  const toolTypes: ToolType[] = ['draw', 'paint', 'select', 'slip', 'delete', 'mute', 'slice'];

  const toolIcons: Record<ToolType, string> = {
    draw: '✏️',
    paint: '🖌️',
    select: '⬜',
    slip: '↔️',
    delete: '🗑️',
    mute: '🔇',
    slice: '✂️',
  };

  /**
   * Handle tool button hover
   */
  const handleToolHover = useCallback(
    (e: React.MouseEvent, tool: ToolType): void => {
      const shortcut = tools.getToolShortcut(tool);
      hintPanel.showHint(
        {
          name: tools.getToolName(tool),
          description: tools.getToolDescription(tool),
          shortcut: shortcut || undefined,
        },
        e.clientX + 10,
        e.clientY - 30
      );
    },
    [tools, hintPanel]
  );

  return (
    <div
      className={`fl-toolbar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-small)',
        padding: 'var(--spacing-small) var(--spacing-medium)',
        background: 'var(--fl-bg-dark)',
        borderBottom: '1px solid var(--fl-border)',
        height: '32px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          padding: '0 var(--spacing-small)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Tools:
      </div>
      {toolTypes.map((tool) => {
        const isActive = tools.currentTool === tool;
        const shortcut = tools.getToolShortcut(tool);

        return (
          <Button
            key={tool}
            variant={isActive ? 'primary' : 'default'}
            size="small"
            active={isActive}
            onClick={() => tools.setTool(tool)}
            ariaLabel={`${tools.getToolName(tool)} tool`}
            onMouseEnter={(e) => handleToolHover(e, tool)}
            onMouseLeave={() => hintPanel.hideHint()}
            title={`${tools.getToolName(tool)} - ${tools.getToolDescription(tool)}${shortcut ? ` (${shortcut})` : ''}`}
          >
            <span style={{ marginRight: '4px' }}>{toolIcons[tool]}</span>
            {tools.getToolName(tool)}
          </Button>
        );
      })}
      <div
        style={{
          marginLeft: 'auto',
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          padding: '0 var(--spacing-small)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>Current:</span>
        <strong style={{ color: 'var(--fl-text-primary)' }}>
          {tools.getToolName(tools.currentTool)}
        </strong>
      </div>
    </div>
  );
});

