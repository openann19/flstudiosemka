/**
 * Fader - Vertical fader with track and thumb
 * Enhanced with fine/coarse modes, keyboard control, and full accessibility
 * @module components/ui/Fader
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Fader component props
 */
export interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  onChange: (value: number) => void;
  width?: number;
  height?: number;
  disabled?: boolean;
  ariaLabel?: string;
  snapToStep?: boolean;
}

/**
 * Vertical fader component with enhanced controls
 */
export const Fader = React.memo<FaderProps>(function Fader({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  onChange,
  width = 24,
  height = 120,
  disabled = false,
  ariaLabel,
  snapToStep = true,
}: FaderProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const thumbPosition = (1 - normalizedValue) * (height - width);

  /**
   * Clamp and step value
   */
  const clampAndStep = useCallback(
    (val: number): number => {
      const clamped = Math.max(min, Math.min(max, val));
      if (snapToStep && step > 0) {
        return Math.round(clamped / step) * step;
      }
      return clamped;
    },
    [min, max, step, snapToStep]
  );

  /**
   * Update value
   */
  const updateValue = useCallback(
    (newValue: number): void => {
      const steppedValue = clampAndStep(newValue);
      if (Math.abs(steppedValue - value) > 0.001) {
        onChange(steppedValue);
      }
    },
    [value, onChange, clampAndStep]
  );

  /**
   * Handle mouse down
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      if (e.button !== 0 || disabled) {
        return;
      }
      setIsDragging(true);
      setStartY(e.clientY);
      setStartValue(value);
      e.preventDefault();
      e.stopPropagation();
    },
    [disabled, value]
  );

  /**
   * Handle track click
   */
  const handleTrackClick = useCallback(
    (e: React.MouseEvent): void => {
      if (disabled || isDragging || e.button !== 0) {
        return;
      }
      const rect = faderRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const clickY = e.clientY - rect.top;
      const normalizedClick = 1 - clickY / height;
      const newValue = min + normalizedClick * (max - min);
      updateValue(newValue);
    },
    [disabled, isDragging, height, min, max, updateValue]
  );

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

      let newValue = value;

      switch (e.key) {
        case 'ArrowUp':
          newValue = value + stepSize;
          break;
        case 'ArrowDown':
          newValue = value - stepSize;
          break;
        case 'PageUp':
          newValue = value + stepSize;
          break;
        case 'PageDown':
          newValue = value - stepSize;
          break;
        case 'Home':
          newValue = max;
          break;
        case 'End':
          newValue = min;
          break;
        default:
          return;
      }

      e.preventDefault();
      updateValue(newValue);
    },
    [disabled, value, min, max, step, updateValue]
  );

  /**
   * Mouse move handler
   */
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent): void => {
      const isShift = e.shiftKey;
      const isCtrl = e.ctrlKey || e.metaKey;
      const fineMultiplier = isShift || isCtrl ? 0.1 : 1;

      const deltaY = (startY - e.clientY) * fineMultiplier;
      const sensitivity = (max - min) / height;
      const newValue = startValue + deltaY * sensitivity;
      updateValue(newValue);
    };

    const handleMouseUp = (): void => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startValue, min, max, height, updateValue]);

  const accessibleLabel = ariaLabel || label || 'Fader';

  return (
    <div
      className="fl-fader"
      role="slider"
      aria-label={accessibleLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value.toFixed(step < 1 ? 1 : 0)}${unit}`}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        outline: isFocused ? '2px solid var(--fl-orange)' : 'none',
        outlineOffset: '2px',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label && (
        <div
          style={{
            fontSize: '10px',
            color: disabled ? 'var(--fl-text-disabled)' : 'var(--fl-text-secondary)',
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      )}
      <div
        ref={faderRef}
        className="fl-fader-container"
        onClick={handleTrackClick}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          background: 'linear-gradient(180deg, var(--fl-bg-darkest) 0%, var(--fl-bg-dark) 100%)',
          border: `1px solid ${isFocused ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-inset)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.1s ease',
        }}
      >
        <div
          className="fl-fader-track"
          style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            transform: 'translateX(-50%)',
            width: '2px',
            height: '100%',
            background: 'linear-gradient(180deg, var(--fl-green) 0%, var(--fl-yellow) 50%, var(--fl-red) 100%)',
            borderRadius: '1px',
            pointerEvents: 'none',
          }}
        />
        <div
          ref={thumbRef}
          className="fl-fader-thumb"
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            left: '0',
            top: `${thumbPosition}px`,
            width: `${width}px`,
            height: `${width}px`,
            background: disabled
              ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
              : isDragging
                ? 'linear-gradient(135deg, #5a5a5a 0%, #3a3a3a 100%)'
                : 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
            border: `1px solid ${isFocused ? 'var(--fl-orange)' : 'var(--fl-border)'}`,
            borderRadius: 'var(--radius-sm)',
            boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-md)',
            cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            zIndex: 1,
            transition: isDragging ? 'none' : 'all 0.1s ease',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '2px',
              background: disabled ? 'var(--fl-text-disabled)' : 'var(--fl-text-secondary)',
              borderRadius: '1px',
            }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: '10px',
          color: disabled ? 'var(--fl-text-disabled)' : 'var(--fl-text-primary)',
          fontFamily: 'var(--font-mono)',
          textAlign: 'center',
          minWidth: '40px',
        }}
      >
        {value.toFixed(step < 1 ? 1 : 0)}
        {unit}
      </div>
    </div>
  );
});

