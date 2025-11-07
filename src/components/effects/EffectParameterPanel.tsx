/**
 * EffectParameterPanel - Parameter controls for selected effect
 * Displays knobs and sliders for effect parameters
 * @module components/effects/EffectParameterPanel
 */

import { useCallback } from 'react';
import { Knob } from '../ui/Knob';
import type { EffectSlot } from '../../types/effectSlot.types';
import { effectRegistry } from '../../services/EffectRegistry';

/**
 * EffectParameterPanel component props
 */
export interface EffectParameterPanelProps {
  slot: EffectSlot | null;
  onUpdateParameters: (parameters: Record<string, number>) => void;
}

/**
 * Effect parameter panel component
 */
export function EffectParameterPanel({
  slot,
  onUpdateParameters,
}: EffectParameterPanelProps): JSX.Element {
  /**
   * Handle parameter change
   */
  const handleParameterChange = useCallback(
    (paramName: string, value: number): void => {
      onUpdateParameters({ [paramName]: value });
    },
    [onUpdateParameters]
  );

  if (!slot || !slot.effectType || !slot.effectInstance) {
    return (
      <div
        style={{
          padding: 'var(--spacing-large)',
          textAlign: 'center',
          color: 'var(--fl-text-disabled)',
          fontSize: '9px',
        }}
      >
        No effect selected
      </div>
    );
  }

  const metadata = effectRegistry.getEffectMetadata(slot.effectType);
  if (!metadata) {
    return (
      <div
        style={{
          padding: 'var(--spacing-large)',
          textAlign: 'center',
          color: 'var(--fl-text-disabled)',
          fontSize: '9px',
        }}
      >
        Effect metadata not found
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-medium)',
        padding: 'var(--spacing-medium)',
        background: 'var(--fl-bg-dark)',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Effect Header */}
      <div
        style={{
          padding: 'var(--spacing-medium)',
          background: 'var(--fl-bg-darker)',
          border: '1px solid var(--fl-border-dark)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-medium)',
        }}
      >
        <span
          style={{
            fontSize: '24px',
            lineHeight: 1,
          }}
        >
          {metadata.icon}
        </span>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-minimal)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--fl-text-primary)',
              fontWeight: 600,
            }}
          >
            {metadata.name}
          </div>
          <div
            style={{
              fontSize: '9px',
              color: 'var(--fl-text-secondary)',
            }}
          >
            {metadata.description}
          </div>
        </div>
        <div
          style={{
            fontSize: '8px',
            color: slot.enabled ? 'var(--fl-green)' : 'var(--fl-text-disabled)',
            fontWeight: 600,
          }}
        >
          {slot.enabled ? 'ON' : 'OFF'}
        </div>
      </div>

      {/* Parameters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: 'var(--spacing-medium)',
        }}
      >
        {metadata.parameters.map((param) => {
          const currentValue = slot.parameters[param.name] ?? param.defaultValue;
          const normalizedValue =
            typeof currentValue === 'number'
              ? currentValue
              : typeof param.defaultValue === 'number'
                ? param.defaultValue
                : 0;

          return (
            <div
              key={param.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-small)',
              }}
            >
              <Knob
                value={normalizedValue}
                min={param.min ?? 0}
                max={param.max ?? 100}
                step={param.step ?? 0.01}
                onChange={(value) => handleParameterChange(param.name, value)}
                label={param.label}
                size={60}
              />
              {param.unit && (
                <div
                  style={{
                    fontSize: '8px',
                    color: 'var(--fl-text-secondary)',
                  }}
                >
                  {param.unit}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

