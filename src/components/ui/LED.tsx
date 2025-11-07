/**
 * LED - LED indicator component
 * Enhanced with pulse animations, color transitions, size variants, and accessibility
 * @module components/ui/LED
 */

import React, { useState, useEffect } from 'react';

/**
 * LED component props
 */
export interface LEDProps {
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'orange';
  active?: boolean;
  size?: 'small' | 'medium' | 'large' | number;
  label?: string;
  pulse?: boolean;
  ariaLabel?: string;
}

/**
 * LED indicator component with enhanced animations
 */
export const LED = React.memo<LEDProps>(function LED({
  color = 'green',
  active = false,
  size = 'medium',
  label,
  pulse = false,
  ariaLabel,
}: LEDProps): JSX.Element {
  const [isAnimating, setIsAnimating] = useState(false);

  const colorMap: Record<string, string> = {
    green: 'var(--fl-green)',
    red: 'var(--fl-red)',
    blue: 'var(--fl-blue)',
    yellow: 'var(--fl-yellow)',
    orange: 'var(--fl-orange)',
  };

  const sizeMap: Record<string, number> = {
    small: 8,
    medium: 12,
    large: 16,
  };

  const ledColor = colorMap[color] || colorMap.green;
  const ledSize: number =
    typeof size === 'number'
      ? size
      : (sizeMap[size] !== undefined
          ? sizeMap[size]
          : sizeMap.medium !== undefined
            ? sizeMap.medium
            : 12);

  /**
   * Handle pulse animation
   */
  useEffect(() => {
    if (pulse && active) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setIsAnimating((prev) => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
    setIsAnimating(false);
    return undefined;
  }, [pulse, active]);

  const shouldPulse = pulse && active && isAnimating;
  const accessibleLabel = ariaLabel || label || `${color} LED indicator`;

  return (
    <div
      className="fl-led"
      role="status"
      aria-label={accessibleLabel}
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <div
        className={`fl-led-indicator ${active ? 'active' : ''} ${shouldPulse ? 'pulsing' : ''}`}
        style={{
          width: `${ledSize}px`,
          height: `${ledSize}px`,
          borderRadius: '50%',
          background: active
            ? `radial-gradient(circle at 30% 30%, ${ledColor}, ${ledColor}88)`
            : 'var(--fl-bg-darkest)',
          border: `1px solid ${active ? ledColor : 'var(--fl-border-dark)'}`,
          boxShadow: active
            ? shouldPulse
              ? `0 0 ${ledSize}px ${ledColor}88, inset 0 0 ${ledSize / 4}px ${ledColor}`
              : `0 0 ${ledSize / 2}px ${ledColor}88, inset 0 0 ${ledSize / 4}px ${ledColor}`
            : 'var(--shadow-inset)',
          transition: 'all 0.3s ease',
          animation: shouldPulse ? 'pulse 1s ease-in-out infinite' : undefined,
          opacity: active ? 1 : 0.3,
        }}
      />
      {label && (
        <div
          style={{
            fontSize: '9px',
            color: active ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
            textAlign: 'center',
            transition: 'color 0.3s ease',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
});

