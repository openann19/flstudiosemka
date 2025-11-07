/**
 * StepButton - Step sequencer button with active states
 * Enhanced with velocity support, accent states, smooth transitions, and accessibility
 * @module components/ui/StepButton
 */

import React, { useCallback, useState } from 'react';

/**
 * StepButton component props
 */
export interface StepButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  current?: boolean;
  beatMarker?: boolean;
  velocity?: number; // 0-127 MIDI velocity
  accent?: boolean;
  ariaLabel?: string;
}

/**
 * Step sequencer button component with enhanced features
 */
export const StepButton = React.memo<StepButtonProps>(function StepButton({
  active = false,
  current = false,
  beatMarker = false,
  velocity = 127,
  accent = false,
  className = '',
  ariaLabel,
  onClick,
  onKeyDown,
  ...props
}: StepButtonProps): JSX.Element {
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Handle click
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 100);
      if (onClick) {
        onClick(e);
      }
    },
    [onClick]
  );

  /**
   * Handle keyboard
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);
        if (onClick) {
          onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    },
    [onClick, onKeyDown]
  );

  const velocityOpacity = active ? 0.5 + (velocity / 127) * 0.5 : 0.3;
  const accessibleLabel = ariaLabel || `Step button ${active ? 'active' : 'inactive'}`;

  return (
    <button
      type="button"
      className={`fl-step-button ${active ? 'active' : ''} ${current ? 'current' : ''} ${beatMarker ? 'beat-marker' : ''} ${accent ? 'accent' : ''} ${className}`}
      aria-label={accessibleLabel}
      aria-pressed={active ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        width: '32px',
        height: '32px',
        background: active
          ? accent
            ? 'linear-gradient(180deg, var(--fl-red) 0%, #C0392B 100%)'
            : 'linear-gradient(180deg, var(--fl-orange) 0%, var(--fl-orange-dark) 100%)'
          : 'linear-gradient(180deg, var(--fl-bg-medium) 0%, var(--fl-bg-dark) 100%)',
        border: `1px solid ${isFocused ? 'var(--fl-orange)' : active ? 'var(--fl-orange-dark)' : 'var(--fl-border-dark)'}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: isPressed
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
          : active
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.3)'
            : 'var(--shadow-inset)',
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        position: 'relative',
        outline: isFocused ? '2px solid var(--fl-orange)' : 'none',
        outlineOffset: '2px',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        opacity: velocityOpacity,
        ...(current && {
          boxShadow: '0 0 8px var(--fl-orange), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          animation: 'pulse 0.5s ease-in-out',
        }),
        ...(beatMarker && {
          borderLeft: '2px solid var(--fl-orange)',
        }),
      }}
      {...props}
    >
      {active && velocity < 127 && (
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${(velocity / 127) * 100}%`,
            height: '2px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1px',
          }}
        />
      )}
    </button>
  );
});

