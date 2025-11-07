/**
 * Panel - Panel container with proper gradients and borders
 * Enhanced with accessibility, focus management, and professional styling
 * @module components/ui/Panel
 */

import React, { useMemo } from 'react';

/**
 * Panel component props
 */
export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'inset';
  title?: string;
  ariaLabel?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Panel container component with enhanced features
 */
export const Panel = React.memo<PanelProps>(function Panel({
  variant = 'default',
  title,
  className = '',
  children,
  ariaLabel,
  collapsible = false,
  defaultCollapsed = false,
  ...props
}: PanelProps): JSX.Element {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  /**
   * Get background style
   */
  const background = useMemo((): string => {
    switch (variant) {
      case 'raised':
        return 'linear-gradient(180deg, var(--fl-bg-medium) 0%, var(--fl-bg-dark) 100%)';
      case 'inset':
        return 'linear-gradient(180deg, var(--fl-bg-darkest) 0%, var(--fl-bg-dark) 100%)';
      default:
        return 'var(--fl-bg-dark)';
    }
  }, [variant]);

  /**
   * Get border style
   */
  const border = useMemo((): string => {
    switch (variant) {
      case 'raised':
        return '1px solid var(--fl-border-light)';
      case 'inset':
        return '1px solid var(--fl-border-dark)';
      default:
        return '1px solid var(--fl-border)';
    }
  }, [variant]);

  /**
   * Get box shadow style
   */
  const boxShadow = useMemo((): string => {
    switch (variant) {
      case 'raised':
        return 'var(--shadow-md)';
      case 'inset':
        return 'var(--shadow-inset)';
      default:
        return 'none';
    }
  }, [variant]);

  /**
   * Handle toggle collapse
   */
  const handleToggleCollapse = React.useCallback((): void => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const accessibleLabel = ariaLabel || title || 'Panel';

  return (
    <div
      className={`fl-panel fl-panel-${variant} ${isCollapsed ? 'collapsed' : ''} ${className}`}
      role="region"
      aria-label={accessibleLabel}
      aria-expanded={collapsible ? !isCollapsed : undefined}
      style={{
        background,
        border,
        borderRadius: 'var(--radius-md)',
        boxShadow,
        padding: isCollapsed ? 'var(--spacing-small)' : 'var(--spacing-medium)',
        transition: 'all 0.2s ease',
        ...props.style,
      }}
      {...props}
    >
      {title && (
        <div
          className="fl-panel-title"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--fl-text-primary)',
            marginBottom: isCollapsed ? '0' : 'var(--spacing-small)',
            paddingBottom: isCollapsed ? '0' : 'var(--spacing-small)',
            borderBottom: isCollapsed ? 'none' : '1px solid var(--fl-border-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: collapsible ? 'pointer' : 'default',
            userSelect: 'none',
          }}
          onClick={collapsible ? handleToggleCollapse : undefined}
          onKeyDown={
            collapsible
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleCollapse();
                  }
                }
              : undefined
          }
          tabIndex={collapsible ? 0 : undefined}
          role={collapsible ? 'button' : undefined}
          aria-label={collapsible ? `${title} panel, ${isCollapsed ? 'collapsed' : 'expanded'}` : undefined}
        >
          <span>{title}</span>
          {collapsible && (
            <span
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              ▼
            </span>
          )}
        </div>
      )}
      {!isCollapsed && (
        <div
          style={{
            overflow: 'hidden',
            animation: isCollapsed ? undefined : 'fadeInUp 0.2s ease',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
});

