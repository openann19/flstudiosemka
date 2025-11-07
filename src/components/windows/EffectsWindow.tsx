/**
 * EffectsWindow - Effects rack window with effect slots, presets, and routing
 * Implements FL Studio-style effects window with insert effects, sends, and master effects
 * @module components/windows/EffectsWindow
 */

import { useState, useCallback } from 'react';
import { useHintPanel } from '../ui/HintPanel';
import { Knob } from '../ui/Knob';
import type { EffectType } from '../../types/synthesizer.types';

/**
 * Effect definition
 */
export interface Effect {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

/**
 * EffectsWindow component props
 */
export interface EffectsWindowProps {
  masterEffects?: Effect[];
  onAddEffect?: (type: EffectType, slot: number) => void;
  onRemoveEffect?: (effectId: string) => void;
  onToggleEffect?: (effectId: string) => void;
  onUpdateParameter?: (effectId: string, parameter: string, value: number) => void;
}

/**
 * Available effect types
 */
const EFFECT_TYPES: Array<{ type: EffectType; name: string; icon: string }> = [
  { type: 'reverb', name: 'Reverb', icon: '🌊' },
  { type: 'delay', name: 'Delay', icon: '⏱️' },
  { type: 'distortion', name: 'Distortion', icon: '🔊' },
  { type: 'chorus', name: 'Chorus', icon: '🎵' },
  { type: 'phaser', name: 'Phaser', icon: '🌀' },
  { type: 'bitcrusher', name: 'Bitcrusher', icon: '💥' },
  { type: 'analogChorus', name: 'Analog Chorus', icon: '🎛️' },
  { type: 'convolutionReverb', name: 'Convolution Reverb', icon: '🏛️' },
  { type: 'bbdDelay', name: 'BBD Delay', icon: '⏱️' },
  { type: 'tapeDelay', name: 'Tape Delay', icon: '⏱️' },
];

/**
 * Effects window component
 */
export function EffectsWindow({
  masterEffects = [],
  onAddEffect,
  onRemoveEffect,
  onToggleEffect,
  onUpdateParameter,
}: EffectsWindowProps): JSX.Element {
  const hintPanel = useHintPanel();
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);

  /**
   * Handle add effect
   */
  const handleAddEffect = useCallback(
    (type: EffectType, slot: number): void => {
      if (onAddEffect) {
        onAddEffect(type, slot);
      }
    },
    [onAddEffect]
  );

  /**
   * Handle remove effect
   */
  const handleRemoveEffect = useCallback(
    (effectId: string): void => {
      if (onRemoveEffect) {
        onRemoveEffect(effectId);
      }
    },
    [onRemoveEffect]
  );

  /**
   * Handle toggle effect
   */
  const handleToggleEffect = useCallback(
    (effectId: string): void => {
      if (onToggleEffect) {
        onToggleEffect(effectId);
      }
    },
    [onToggleEffect]
  );

  /**
   * Handle parameter change
   */
  const handleParameterChange = useCallback(
    (effectId: string, parameter: string, value: number): void => {
      if (onUpdateParameter) {
        onUpdateParameter(effectId, parameter, value);
      }
    },
    [onUpdateParameter]
  );

  return (
    <div
      className="effects-window"
      style={{
        display: 'flex',
        height: '100%',
        background: 'var(--fl-bg-dark)',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel - Effect Library */}
      <div
        style={{
          width: '250px',
          borderRight: '1px solid var(--fl-border-dark)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--fl-bg-darker)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid var(--fl-border-dark)',
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
            fontWeight: 600,
          }}
        >
          EFFECTS
        </div>

        {/* Effect List */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {EFFECT_TYPES.map((effectType) => (
            <button
              key={effectType.type}
              onClick={() => setSelectedEffect(null)}
              onMouseEnter={(e) =>
                hintPanel.showHint(
                  {
                    name: effectType.name,
                    description: `Add ${effectType.name} effect`,
                  },
                  e.clientX + 10,
                  e.clientY + 10
                )
              }
              onMouseLeave={() => hintPanel.hideHint()}
              style={{
                padding: '8px',
                background: 'var(--fl-bg-dark)',
                border: '1px solid var(--fl-border-dark)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '20px' }}>{effectType.icon}</span>
              <span style={{ fontSize: '10px', color: 'var(--fl-text-primary)' }}>{effectType.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Middle Panel - Effect Slots */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid var(--fl-border-dark)',
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
            fontWeight: 600,
          }}
        >
          MASTER EFFECTS
        </div>

        {/* Effect Slots */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
            const effect = masterEffects.find((e) => e.id === `master-${slot}`);
            return (
              <div
                key={slot}
                style={{
                  padding: '8px',
                  background: effect ? 'var(--fl-bg-darker)' : 'var(--fl-bg-dark)',
                  border: `1px solid ${effect ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
                  borderRadius: '4px',
                  minHeight: '60px',
                }}
              >
                {effect ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', color: 'var(--fl-text-primary)', fontWeight: 600 }}>
                        {effect.name}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleToggleEffect(effect.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            background: effect.enabled ? 'var(--fl-green)' : 'var(--fl-bg-dark)',
                            border: '1px solid var(--fl-border)',
                            color: effect.enabled ? '#000' : 'var(--fl-text-secondary)',
                            fontSize: '8px',
                            cursor: 'pointer',
                          }}
                          title={effect.enabled ? 'Disable' : 'Enable'}
                        >
                          {effect.enabled ? '✓' : '✗'}
                        </button>
                        <button
                          onClick={() => handleRemoveEffect(effect.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            background: 'var(--fl-red)',
                            border: '1px solid var(--fl-border)',
                            color: '#000',
                            fontSize: '8px',
                            cursor: 'pointer',
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {/* Effect Parameters */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(effect.parameters).map(([param, value]) => (
                        <div key={param} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Knob
                            value={value}
                            min={0}
                            max={100}
                            onChange={(val) => handleParameterChange(effect.id, param, val)}
                            label={param}
                            size={40}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--fl-text-secondary)',
                      fontSize: '9px',
                    }}
                  >
                    <button
                      onClick={() => {
                        const firstEffect = EFFECT_TYPES[0];
                        if (firstEffect) {
                          handleAddEffect(firstEffect.type, slot);
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--fl-bg-dark)',
                        border: '1px solid var(--fl-border)',
                        color: 'var(--fl-text-primary)',
                        fontSize: '9px',
                        cursor: 'pointer',
                      }}
                    >
                      Add Effect
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Effect Presets */}
      {selectedEffect && (
        <div
          style={{
            width: '200px',
            borderLeft: '1px solid var(--fl-border-dark)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--fl-bg-darker)',
          }}
        >
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid var(--fl-border-dark)',
              fontSize: '10px',
              color: 'var(--fl-text-secondary)',
              fontWeight: 600,
            }}
          >
            PRESETS
          </div>
          <div style={{ flex: 1, padding: '8px', fontSize: '9px', color: 'var(--fl-text-secondary)' }}>
            No presets available
          </div>
        </div>
      )}
    </div>
  );
}

