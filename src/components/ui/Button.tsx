/**
 * Button - Styled button component with FL Studio styling
 * Enhanced with full accessibility, keyboard support, and professional UX
 * @module components/ui/Button
 */

import React, { useCallback, useRef } from 'react';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

/**
 * Styled button component with enhanced accessibility and keyboard support
 */
export const Button = React.memo<ButtonProps>(function Button({
  variant = 'default',
  size = 'medium',
  active = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ariaLabel,
  ariaDescribedBy,
  onClick,
  onKeyDown,
  ...props
}: ButtonProps): JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (disabled || loading) {
        return;
      }

      // Space or Enter to activate
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsPressed(true);
        if (onClick) {
          onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }
      }

      if (onKeyDown) {
        onKeyDown(e);
      }
    },
    [disabled, loading, onClick, onKeyDown]
  );

  /**
   * Handle key up
   */
  const handleKeyUp = useCallback((): void => {
    setIsPressed(false);
  }, []);

  /**
   * Handle click
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    },
    [disabled, loading, onClick]
  );

  /**
   * Handle mouse down
   */
  const handleMouseDown = useCallback((): void => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  }, [disabled, loading]);

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback((): void => {
    setIsPressed(false);
  }, []);

  /**
   * Handle focus
   */
  const handleFocus = useCallback((): void => {
    setIsFocused(true);
  }, []);

  /**
   * Handle blur
   */
  const handleBlur = useCallback((): void => {
    setIsFocused(false);
    setIsPressed(false);
  }, []);

  const baseStyles: React.CSSProperties = {
    background: disabled
      ? 'var(--fl-bg-darkest)'
      : active
        ? 'linear-gradient(180deg, var(--fl-orange) 0%, var(--fl-orange-dark) 100%)'
        : 'linear-gradient(180deg, #2E2E2E 0%, #262626 100%)',
    border: `1px solid ${disabled ? 'var(--fl-border-dark)' : active ? 'var(--fl-orange-dark)' : 'var(--fl-border-dark)'}`,
    borderRadius: 'var(--radius-md)',
    color: disabled
      ? 'var(--fl-text-disabled)'
      : active
        ? 'var(--fl-text-inverted)'
        : 'var(--fl-text-primary)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-ui)',
    fontSize: '11px',
    fontWeight: active ? 600 : 500,
    padding: size === 'small' ? '2px 8px' : size === 'large' ? '6px 16px' : '4px 12px',
    height: size === 'small' ? '20px' : size === 'large' ? '32px' : 'var(--button-height)',
    transition: 'var(--transition-normal)',
    boxShadow: isPressed
      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
      : active
        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.3)'
        : 'var(--shadow-inset)',
    userSelect: 'none',
    opacity: disabled ? 0.5 : loading ? 0.7 : 1,
    position: 'relative',
    outline: isFocused ? '2px solid var(--fl-orange)' : 'none',
    outlineOffset: '2px',
    transform: isPressed ? 'translateY(1px)' : 'translateY(0)',
  };

  const hoverStyles: React.CSSProperties = {
    background: disabled
      ? undefined
      : active
        ? 'linear-gradient(180deg, var(--fl-orange-hover) 0%, var(--fl-orange) 100%)'
        : 'linear-gradient(180deg, var(--fl-bg-hover) 0%, var(--fl-bg-medium) 100%)',
  };

  // Get accessible label
  const accessibleLabel = ariaLabel || (typeof children === 'string' ? children : props.title || 'Button');

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`fl-button fl-button-${variant} ${active ? 'active' : ''} ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''} ${className}`}
      style={{
        ...baseStyles,
        ...(isHovered && !disabled && !loading ? hoverStyles : {}),
      }}
      disabled={disabled || loading}
      aria-label={accessibleLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={active ? 'true' : 'false'}
      aria-busy={loading ? 'true' : 'false'}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
            aria-hidden="true"
          />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});

