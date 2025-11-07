/**
 * EffectEditor - Full effect editor window
 * Complete effect editing interface with parameters, presets, and bypass
 * @module components/effects/EffectEditor
 */

import { useState, useCallback } from 'react';
import { EffectParameterPanel } from './EffectParameterPanel';
import type { EffectSlot } from '../../types/effectSlot.types';

/**
 * EffectEditor component props
 */
export interface EffectEditorProps {
  slot: EffectSlot | null;
  onUpdateParameters: (parameters: Record<string, number>) => void;
  onToggleEnabled: (enabled: boolean) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Effect editor component
 */
export function EffectEditor({
  slot,
  onUpdateParameters,
  onToggleEnabled,
  onRemove,
  onClose,
}: EffectEditorProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'parameters' | 'presets'>('parameters');

  /**
   * Handle bypass toggle
   */
  const handleBypassToggle = useCallback((): void => {
    if (slot) {
      onToggleEnabled(!slot.enabled);
    }
  }, [slot, onToggleEnabled]);

  if (!slot) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--fl-text-disabled)',
          fontSize: '10px',
        }}
      >
        No effect selected
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--spacing-medium)',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: 'var(--fl-text-primary)',
            fontWeight: 600,
          }}
        >
          EFFECT EDITOR
        </div>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-small)',
          }}
        >
          <button
            onClick={handleBypassToggle}
            style={{
              padding: 'var(--spacing-small) var(--spacing-medium)',
              background: slot.enabled ? 'var(--fl-green)' : 'var(--fl-bg-dark)',
              border: `1px solid ${slot.enabled ? 'var(--fl-green)' : 'var(--fl-border-dark)'}`,
              borderRadius: 'var(--radius-sm)',
              color: slot.enabled ? 'var(--fl-text-inverted)' : 'var(--fl-text-secondary)',
              fontSize: '9px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title={slot.enabled ? 'Disable effect' : 'Enable effect'}
          >
            {slot.enabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onRemove}
            style={{
              padding: 'var(--spacing-small) var(--spacing-medium)',
              background: 'var(--fl-red)',
              border: '1px solid var(--fl-red)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--fl-text-inverted)',
              fontSize: '9px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="Remove effect"
          >
            Remove
          </button>
          <button
            onClick={onClose}
            style={{
              padding: 'var(--spacing-small) var(--spacing-medium)',
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border-dark)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--fl-text-secondary)',
              fontSize: '9px',
              cursor: 'pointer',
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        <button
          onClick={() => setActiveTab('parameters')}
          style={{
            padding: 'var(--spacing-small) var(--spacing-medium)',
            background: activeTab === 'parameters' ? 'var(--fl-bg-dark)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'parameters' ? '2px solid var(--fl-orange)' : '2px solid transparent',
            color: activeTab === 'parameters' ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
            fontSize: '9px',
            fontWeight: activeTab === 'parameters' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Parameters
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          style={{
            padding: 'var(--spacing-small) var(--spacing-medium)',
            background: activeTab === 'presets' ? 'var(--fl-bg-dark)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'presets' ? '2px solid var(--fl-orange)' : '2px solid transparent',
            color: activeTab === 'presets' ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
            fontSize: '9px',
            fontWeight: activeTab === 'presets' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Presets
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
        }}
      >
        {activeTab === 'parameters' ? (
          <EffectParameterPanel slot={slot} onUpdateParameters={onUpdateParameters} />
        ) : (
          <div
            style={{
              padding: 'var(--spacing-large)',
              textAlign: 'center',
              color: 'var(--fl-text-disabled)',
              fontSize: '9px',
            }}
          >
            Presets coming soon
          </div>
        )}
      </div>
    </div>
  );
}

