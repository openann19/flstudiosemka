/**
 * ToolbarExample - Example toolbar with tool switching
 * Demonstrates tool management and visual feedback
 * @module components/examples/ToolbarExample
 */

import { useTools } from '../../hooks/useTools';
import { Button } from '../ui/Button';
import type { ToolType } from '../../types/FLStudio.types';

/**
 * Toolbar Example component
 */
export function ToolbarExample(): JSX.Element {
  const tools = useTools();

  const toolTypes: ToolType[] = ['draw', 'paint', 'select', 'slip', 'delete', 'mute', 'slice'];

  return (
    <div
      className="toolbar-example"
      style={{
        display: 'flex',
        gap: 'var(--spacing-small)',
        padding: 'var(--spacing-small)',
        background: 'var(--fl-bg-dark)',
        borderBottom: '1px solid var(--fl-border)',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--fl-text-secondary)', padding: '4px 8px' }}>
        Tools:
      </div>
      {toolTypes.map((tool) => (
        <Button
          key={tool}
          variant={tools.currentTool === tool ? 'primary' : 'default'}
          active={tools.currentTool === tool}
          size="small"
          onClick={() => tools.setTool(tool)}
          title={`${tools.getToolName(tool)} - ${tools.getToolDescription(tool)} (${tools.getToolShortcut(tool) || 'N/A'})`}
        >
          {tools.getToolName(tool)}
        </Button>
      ))}
      <div
        style={{
          marginLeft: 'auto',
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Current: <strong style={{ marginLeft: '4px' }}>{tools.getToolName(tools.currentTool)}</strong>
      </div>
    </div>
  );
}

