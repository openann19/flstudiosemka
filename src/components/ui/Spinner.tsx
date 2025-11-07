/**
 * Spinner - Spinner button component
 * Enhanced with keyboard control, fine/coarse modes, and accessibility
 * @module components/ui/Spinner
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Button } from './Button';

/**
 * Spinner component props
 */
export interface SpinnerProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Spinner button component with enhanced controls
 */
export const Spinner = React.memo<SpinnerProps>(function Spinner({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = '',
  size = 'medium',
  disabled = false,
  ariaLabel,
}: SpinnerProps): JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const repeatTimeoutRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  /**
   * Clamp value
   */
  const clampValue = useCallback(
    (val: number): number => {
      return Math.max(min, Math.min(max, val));
    },
    [min, max]
  );

  /**
   * Update value
   */
  const updateValue = useCallback(
    (newValue: number): void => {
      const clamped = clampValue(newValue);
      if (Math.abs(clamped - value) > 0.001) {
        onChange(clamped);
      }
    },
    [value, onChange, clampValue]
  );

  /**
   * Handle decrement
   */
  const handleDecrement = useCallback((): void => {
    if (disabled) {
      return;
    }
    updateValue(value - step);
  }, [disabled, value, step, updateValue]);

  /**
   * Handle increment
   */
  const handleIncrement = useCallback((): void => {
    if (disabled) {
      return;
    }
    updateValue(value + step);
  }, [disabled, value, step, updateValue]);

  /**
   * Handle repeat start
   */
  const handleRepeatStart = useCallback(
    (direction: 'up' | 'down'): void => {
      if (disabled) {
        return;
      }

      const repeat = (): void => {
        if (direction === 'up') {
          handleIncrement();
        } else {
          handleDecrement();
        }
      };

      repeat();
      repeatTimeoutRef.current = window.setTimeout(() => {
        repeatIntervalRef.current = window.setInterval(repeat, 50);
      }, 500);
    },
    [disabled, handleIncrement, handleDecrement]
  );

  /**
   * Handle repeat stop
   */
  const handleRepeatStop = useCallback((): void => {
    if (repeatTimeoutRef.current !== null) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    if (repeatIntervalRef.current !== null) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      handleRepeatStop();
    };
  }, [handleRepeatStop]);

  /**
   * Handle keyboard
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (disabled) {
        return;
      }

      const isShift = e.shiftKey;
      const isCtrl = e.ctrlKey || e.metaKey;
      const fineStep = step * 0.1;
      const coarseStep = step * 10;
      let stepSize = step;

      if (isShift || isCtrl) {
        stepSize = fineStep;
      } else if (e.key === 'PageUp' || e.key === 'PageDown') {
        stepSize = coarseStep;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          updateValue(value + stepSize);
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateValue(value - stepSize);
          break;
        case 'PageUp':
          e.preventDefault();
          updateValue(value + stepSize);
          break;
        case 'PageDown':
          e.preventDefault();
          updateValue(value - stepSize);
          break;
        case 'Home':
          e.preventDefault();
          updateValue(max);
          break;
        case 'End':
          e.preventDefault();
          updateValue(min);
          break;
      }
    },
    [disabled, value, min, max, step, updateValue]
  );

  const accessibleLabel = ariaLabel || label || 'Spinner control';

  return (
    <div
      role="group"
      aria-label={accessibleLabel}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label && (
        <label
          htmlFor={`spinner-${label}`}
          style={{
            fontSize: '10px',
            color: disabled ? 'var(--fl-text-disabled)' : 'var(--fl-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </label>
      )}
      <Button
        variant="default"
        size="small"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        onMouseDown={() => handleRepeatStart('down')}
        onMouseUp={handleRepeatStop}
        onMouseLeave={handleRepeatStop}
        ariaLabel={`Decrement ${label || 'value'}`}
      >
        −
      </Button>
      <input
        ref={inputRef}
        id={label ? `spinner-${label}` : undefined}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const newValue = clampValue(parseFloat(e.target.value) || min);
          updateValue(newValue);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={accessibleLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{
          width: '60px',
          height: size === 'small' ? '20px' : size === 'large' ? '32px' : 'var(--button-height)',
          background: disabled ? 'var(--fl-bg-darkest)' : 'var(--fl-bg-input)',
          border: `1px solid ${isFocused ? 'var(--fl-orange)' : 'var(--fl-border)'}`,
          borderRadius: 'var(--radius-sm)',
          color: disabled ? 'var(--fl-text-disabled)' : 'var(--fl-text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          textAlign: 'center',
          padding: '0 4px',
          outline: 'none',
          transition: 'border-color 0.1s ease',
        }}
      />
      <Button
        variant="default"
        size="small"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        onMouseDown={() => handleRepeatStart('up')}
        onMouseUp={handleRepeatStop}
        onMouseLeave={handleRepeatStop}
        ariaLabel={`Increment ${label || 'value'}`}
      >
        +
      </Button>
      {unit && (
        <span
          style={{
            fontSize: '10px',
            color: disabled ? 'var(--fl-text-disabled)' : 'var(--fl-text-secondary)',
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
});

