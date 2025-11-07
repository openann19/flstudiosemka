/**
 * Knob - Realistic knob component with rotation
 * Enhanced with fine/coarse modes, center detent, keyboard control, and accessibility
 * @module components/ui/Knob
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { HintPanelData } from './HintPanel';

/**
 * Knob component props
 */
export interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
  centerDetent?: boolean;
  centerValue?: number;
  ariaLabel?: string;
  onHint?: (hint: HintPanelData) => void;
  onHintClear?: () => void;
}

/**
 * Realistic knob component with enhanced controls
 */
export const Knob = React.memo<KnobProps>(function Knob({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  onChange,
  size = 48,
  disabled = false,
  centerDetent = false,
  centerValue,
  ariaLabel,
  onHint,
  onHintClear,
}: KnobProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);

  const detentValue = centerValue ?? (min + max) / 2;
  const normalizedValue = (value - min) / (max - min);
  const rotation = normalizedValue * 270 - 135; // -135 to 135 degrees

  /**
   * Clamp and step value with center detent
   */
  const clampAndStep = useCallback(
    (val: number): number => {
      let clamped = Math.max(min, Math.min(max, val));
      
      // Apply center detent
      if (centerDetent) {
        const detentRange = step * 2;
        if (Math.abs(clamped - detentValue) < detentRange) {
          clamped = detentValue;
        }
      }
      
      // Step value
      if (step > 0) {
        clamped = Math.round(clamped / step) * step;
      }
      
      return clamped;
    },
    [min, max, step, centerDetent, detentValue]
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
        case 'ArrowRight':
          newValue = value + stepSize;
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
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
      const sensitivity = (max - min) / 200;
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
  }, [isDragging, startY, startValue, min, max, updateValue]);

  const accessibleLabel = ariaLabel || label || 'Knob';
  const isAtCenter = centerDetent && Math.abs(value - detentValue) < step;

  return (
    <div
      className="fl-knob"
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
      onMouseEnter={() => {
        setShowTooltip(true);
        if (onHint && label) {
          onHint({
            name: label,
            value,
            unit,
            min,
            max,
            step,
          });
        }
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        if (onHintClear) {
          onHintClear();
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        outline: isFocused ? '2px solid var(--fl-orange)' : 'none',
        outlineOffset: '2px',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
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
        ref={knobRef}
        className="fl-knob-container"
        onMouseDown={handleMouseDown}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <div
          className="fl-knob-body"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: disabled
              ? 'radial-gradient(circle at 30% 30%, #2a2a2a, #1a1a1a)'
              : isDragging
                ? 'radial-gradient(circle at 30% 30%, #4a4a4a, #2a2a2a)'
                : 'radial-gradient(circle at 30% 30%, #3a3a3a, #252525)',
            border: `2px solid ${isFocused ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
            boxShadow: isDragging
              ? 'var(--shadow-inset), var(--shadow-lg), var(--shadow-glow)'
              : 'var(--shadow-inset), var(--shadow-md)',
            position: 'relative',
            transform: `rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease, box-shadow 0.1s ease',
          }}
        >
          <div
            className="fl-knob-indicator"
            style={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '3px',
              height: '20%',
              background: isAtCenter ? 'var(--fl-green)' : 'var(--fl-orange)',
              borderRadius: '2px',
              boxShadow: isAtCenter
                ? '0 0 4px rgba(63, 181, 63, 0.5)'
                : '0 0 4px rgba(255, 153, 0, 0.5)',
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
          position: 'relative',
        }}
      >
        {value.toFixed(step < 1 ? 1 : 0)}
        {unit}
        {showTooltip && !disabled && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '4px',
              padding: '2px 6px',
              background: 'var(--fl-bg-darkest)',
              border: '1px solid var(--fl-border)',
              borderRadius: '2px',
              fontSize: '9px',
              color: 'var(--fl-text-primary)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {value.toFixed(step < 1 ? 2 : 1)}
            {unit}
          </div>
        )}
      </div>
    </div>
  );
});

