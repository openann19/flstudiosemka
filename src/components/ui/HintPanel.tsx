/**
 * HintPanel - Hint panel component
 * Shows control information on hover with current values
 * @module components/ui/HintPanel
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hint panel data
 */
export interface HintPanelData {
  name: string;
  description?: string;
  value?: string | number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  shortcut?: string;
}

/**
 * HintPanel component props
 */
export interface HintPanelProps {
  data: HintPanelData | null;
  x: number;
  y: number;
}

/**
 * Hint panel component
 */
export function HintPanel({ data, x, y }: HintPanelProps): JSX.Element | null {
  const [position, setPosition] = useState({ x, y });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  useEffect(() => {
    if (!panelRef.current || !data) {
      return;
    }

    const rect = panelRef.current.getBoundingClientRect();
    let newX = position.x;
    let newY = position.y;

    // Adjust position to keep within viewport
    if (newX + rect.width > window.innerWidth) {
      newX = window.innerWidth - rect.width - 8;
    }
    if (newY + rect.height > window.innerHeight) {
      newY = window.innerHeight - rect.height - 8;
    }
    if (newX < 8) {
      newX = 8;
    }
    if (newY < 8) {
      newY = 8;
    }

    if (newX !== position.x || newY !== position.y) {
      setPosition({ x: newX, y: newY });
    }
  }, [position, data]);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (data) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [data]);

  if (!data) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="fl-hint-panel"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'var(--fl-bg-darkest)',
        border: '1px solid var(--fl-border)',
        borderRadius: '4px',
        padding: '8px 12px',
        minWidth: '200px',
        maxWidth: '300px',
        zIndex: 10000,
        fontSize: '11px',
        fontFamily: 'var(--font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 153, 0, 0.1)',
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--fl-text-primary)', marginBottom: '4px' }}>
        {data.name}
      </div>
      {data.description && (
        <div style={{ color: 'var(--fl-text-secondary)', marginBottom: '4px', fontSize: '10px', lineHeight: '1.4' }}>
          {data.description}
        </div>
      )}
      {data.value !== undefined && (
        <div
          style={{
            color: 'var(--fl-orange)',
            marginTop: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {data.value}
          {data.unit && ` ${data.unit}`}
        </div>
      )}
      {data.shortcut && (
        <div
          style={{
            color: 'var(--fl-text-secondary)',
            marginTop: '4px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>Shortcut:</span>
          <kbd
            style={{
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border-dark)',
              borderRadius: '2px',
              padding: '2px 4px',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fl-orange)',
            }}
          >
            {data.shortcut}
          </kbd>
        </div>
      )}
      {(data.min !== undefined || data.max !== undefined) && (
        <div style={{ color: 'var(--fl-text-secondary)', marginTop: '4px', fontSize: '9px', opacity: 0.8 }}>
          Range: {data.min ?? '—'} - {data.max ?? '—'}
          {data.step !== undefined && ` (step: ${data.step})`}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing hint panel
 */
export function useHintPanel(): {
  showHint: (data: HintPanelData, x: number, y: number) => void;
  hideHint: () => void;
  hintData: HintPanelData | null;
  hintPosition: { x: number; y: number };
} {
  const [hintData, setHintData] = useState<HintPanelData | null>(null);
  const [hintPosition, setHintPosition] = useState({ x: 0, y: 0 });

  const showHint = (data: HintPanelData, x: number, y: number): void => {
    setHintData(data);
    setHintPosition({ x, y });
  };

  const hideHint = (): void => {
    setHintData(null);
  };

  return {
    showHint,
    hideHint,
    hintData,
    hintPosition,
  };
}

