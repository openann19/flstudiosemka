/**
 * EffectWiringView - Visual wiring diagram for effect chain
 * Shows audio flow through effects with visual connections
 * @module components/effects/EffectWiringView
 */

import React from 'react';
import type { EffectSlot } from '../../types/effectSlot.types';
import { effectRegistry } from '../../services/EffectRegistry';

/**
 * EffectWiringView component props
 */
export interface EffectWiringViewProps {
  slots: EffectSlot[];
  trackId: number;
}

/**
 * Effect wiring view component
 * Visual representation of audio flow through effects
 */
export function EffectWiringView({ slots }: EffectWiringViewProps): JSX.Element {
  const activeSlots = slots.filter((slot) => slot.effectInstance && slot.enabled);

  return (
    <div
      style={{
        padding: 'var(--spacing-medium)',
        background: 'var(--fl-bg-dark)',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          fontWeight: 600,
          marginBottom: 'var(--spacing-medium)',
        }}
      >
        EFFECT CHAIN ROUTING
      </div>

      {/* Input Node */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-small)',
          marginBottom: 'var(--spacing-medium)',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '40px',
            background: 'var(--fl-bg-darker)',
            border: '1px solid var(--fl-border-dark)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'var(--fl-text-primary)',
            fontWeight: 600,
          }}
        >
          INPUT
        </div>
        <div
          style={{
            width: '20px',
            height: '2px',
            background: 'var(--fl-orange)',
          }}
        />
      </div>

      {/* Effect Nodes */}
      {activeSlots.length === 0 ? (
        <div
          style={{
            padding: 'var(--spacing-large)',
            textAlign: 'center',
            color: 'var(--fl-text-disabled)',
            fontSize: '9px',
          }}
        >
          No active effects
        </div>
      ) : (
        activeSlots.map((slot, index) => {
          const metadata = slot.effectType ? effectRegistry.getEffectMetadata(slot.effectType) : null;
          const isLast = index === activeSlots.length - 1;

          return (
            <React.Fragment key={slot.id}>
              {/* Connection Line */}
              {index > 0 && (
                <div
                  style={{
                    width: '2px',
                    height: '20px',
                    background: 'var(--fl-orange)',
                    marginLeft: '30px',
                  }}
                />
              )}

              {/* Effect Node */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-small)',
                  marginBottom: isLast ? 'var(--spacing-medium)' : 0,
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    background: slot.enabled
                      ? 'var(--fl-bg-medium)'
                      : 'var(--fl-bg-darker)',
                    border: `2px solid ${slot.enabled ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-minimal)',
                    boxShadow: slot.enabled ? 'var(--shadow-glow)' : 'none',
                    transition: 'all var(--transition-normal)',
                  }}
                >
                  {metadata && (
                    <>
                      <span
                        style={{
                          fontSize: '16px',
                          lineHeight: 1,
                        }}
                      >
                        {metadata.icon}
                      </span>
                      <div
                        style={{
                          fontSize: '7px',
                          color: slot.enabled ? 'var(--fl-text-primary)' : 'var(--fl-text-disabled)',
                          fontWeight: 600,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '50px',
                        }}
                      >
                        {metadata.name}
                      </div>
                    </>
                  )}
                </div>

                {/* Connection Arrow */}
                {!isLast && (
                  <div
                    style={{
                      width: '20px',
                      height: '2px',
                      background: 'var(--fl-orange)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: '-4px',
                        top: '-3px',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid var(--fl-orange)',
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                      }}
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })
      )}

      {/* Output Node */}
      {activeSlots.length > 0 && (
        <>
          <div
            style={{
              width: '2px',
              height: '20px',
              background: 'var(--fl-orange)',
              marginLeft: '30px',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-small)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '40px',
                background: 'var(--fl-bg-darker)',
                border: '1px solid var(--fl-border-dark)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                color: 'var(--fl-text-primary)',
                fontWeight: 600,
              }}
            >
              OUTPUT
            </div>
          </div>
        </>
      )}
    </div>
  );
}

