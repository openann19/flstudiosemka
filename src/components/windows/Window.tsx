/**
 * Window - Detachable window component
 * Enhanced with snap-to-grid, window presets, smooth animations, and keyboard shortcuts
 * @module components/windows/Window
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { WindowState } from '../../types/windows';

/**
 * Window component props
 */
export interface WindowProps {
  window: WindowState;
  onUpdate: (id: string, updates: Partial<WindowState>) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onBringToFront: (id: string) => void;
  children: React.ReactNode;
  title?: string;
}

/**
 * Detachable window component
 */
const SNAP_GRID_SIZE = 20;

/**
 * Get window presets
 */
const getWindowPresets = (): {
  quarter: { width: number; height: number };
  half: { width: number; height: number };
  threeQuarter: { width: number; height: number };
  full: { width: number; height: number };
} => {
  if (typeof window === 'undefined') {
    return {
      quarter: { width: 400, height: 300 },
      half: { width: 800, height: 600 },
      threeQuarter: { width: 1200, height: 900 },
      full: { width: 1600, height: 1200 },
    };
  }
  return {
    quarter: { width: window.innerWidth / 4, height: window.innerHeight / 4 },
    half: { width: window.innerWidth / 2, height: window.innerHeight / 2 },
    threeQuarter: { width: (window.innerWidth * 3) / 4, height: (window.innerHeight * 3) / 4 },
    full: { width: window.innerWidth, height: window.innerHeight },
  };
};

export const Window = React.memo<WindowProps>(function Window({
  window: windowState,
  onUpdate,
  onClose,
  onMinimize,
  onMaximize,
  onBringToFront,
  children,
  title,
}: WindowProps): JSX.Element {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [snapToGrid, _setSnapToGrid] = useState(true);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Snap position to grid
   */
  const snapToGridPosition = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      if (!snapToGrid) {
        return { x, y };
      }
      return {
        x: Math.round(x / SNAP_GRID_SIZE) * SNAP_GRID_SIZE,
        y: Math.round(y / SNAP_GRID_SIZE) * SNAP_GRID_SIZE,
      };
    },
    [snapToGrid]
  );

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.target !== windowRef.current && !windowRef.current?.contains(e.target as Node)) {
        return;
      }

      // Ctrl/Cmd + Arrow keys for window presets
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const presets = getWindowPresets();
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onUpdate(windowState.id, presets.quarter);
            break;
          case 'ArrowRight':
            e.preventDefault();
            onUpdate(windowState.id, presets.half);
            break;
          case 'ArrowUp':
            e.preventDefault();
            onUpdate(windowState.id, presets.threeQuarter);
            break;
          case 'ArrowDown':
            e.preventDefault();
            onUpdate(windowState.id, presets.full);
            break;
        }
      }

      // Escape to close
      if (e.key === 'Escape' && e.ctrlKey) {
        e.preventDefault();
        onClose(windowState.id);
      }
    },
    [windowState.id, onUpdate, onClose]
  );

  /**
   * Setup keyboard shortcuts
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  /**
   * Handle mouse down on title bar (start drag)
   */
  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      if (e.button !== 0) {
        return;
      }
      setIsDragging(true);
      setDragStart({
        x: e.clientX - windowState.x,
        y: e.clientY - windowState.y,
      });
      onBringToFront(windowState.id);
      e.preventDefault();
    },
    [windowState.x, windowState.y, windowState.id, onBringToFront]
  );

  /**
   * Handle mouse down on resize handle
   */
  const handleResizeMouseDown = (e: React.MouseEvent): void => {
    if (e.button !== 0) {
      return;
    }
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: windowState.width,
      height: windowState.height,
    });
    onBringToFront(windowState.id);
  };

  /**
   * Handle global mouse move for drag with snap-to-grid
   */
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent): void => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        const snapped = snapToGridPosition(newX, newY);

        onUpdate(windowState.id, {
          x: snapped.x,
          y: snapped.y,
        });
      });
    };

    const handleMouseUp = (): void => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, dragStart, windowState.id, onUpdate, snapToGridPosition]);

  /**
   * Handle global mouse move for resize with snap-to-grid
   */
  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handleMouseMove = (e: MouseEvent): void => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = Math.max(200, resizeStart.width + deltaX);
        let newHeight = Math.max(100, resizeStart.height + deltaY);

        if (snapToGrid) {
          newWidth = Math.round(newWidth / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
          newHeight = Math.round(newHeight / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
        }

        onUpdate(windowState.id, {
          width: newWidth,
          height: newHeight,
        });
      });
    };

    const handleMouseUp = (): void => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing, resizeStart, windowState.id, onUpdate, snapToGrid]);

  if (!windowState.isVisible) {
    return <></>;
  }

  if (windowState.isMinimized) {
    return (
      <div
        className="fl-window-minimized"
        style={{
          position: 'fixed',
          left: windowState.x,
          top: windowState.y,
          width: 200,
          height: 30,
          zIndex: windowState.zIndex,
          background: 'var(--fl-bg-dark)',
          border: '1px solid var(--fl-border-dark)',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
        }}
        onClick={() => onUpdate(windowState.id, { isMinimized: false })}
      >
        <div style={{ padding: '4px 8px', fontSize: '11px' }}>
          {title || windowState.type}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="fl-window"
      style={{
        position: 'fixed',
        left: windowState.x,
        top: windowState.y,
        width: windowState.isMaximized ? '100%' : windowState.width,
        height: windowState.isMaximized ? '100%' : windowState.height,
        zIndex: windowState.zIndex,
        background: 'var(--fl-bg-dark)',
        border: '1px solid var(--fl-border-dark)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 153, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
        transform: 'translateZ(0)',
        willChange: isDragging || isResizing ? 'transform, left, top, width, height' : 'auto',
      }}
    >
      {/* Title bar */}
      <div
        className="fl-window-titlebar"
        onMouseDown={handleTitleMouseDown}
        style={{
          height: '28px',
          background: 'linear-gradient(180deg, var(--fl-bg-medium) 0%, var(--fl-bg-dark) 100%)',
          borderBottom: '1px solid var(--fl-border-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          cursor: isDragging ? 'grabbing' : 'move',
          userSelect: 'none',
          transition: 'background 0.1s ease',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--fl-text-primary)', fontWeight: 500 }}>
          {title || windowState.type}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onMinimize(windowState.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMinimize(windowState.id);
              }
            }}
            aria-label="Minimize window"
            style={{
              width: '20px',
              height: '20px',
              border: 'none',
              background: 'transparent',
              color: 'var(--fl-text-primary)',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--fl-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Minimize"
          >
            −
          </button>
          <button
            onClick={() => onMaximize(windowState.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMaximize(windowState.id);
              }
            }}
            aria-label="Maximize window"
            style={{
              width: '20px',
              height: '20px',
              border: 'none',
              background: 'transparent',
              color: 'var(--fl-text-primary)',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--fl-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Maximize"
          >
            □
          </button>
          <button
            onClick={() => onClose(windowState.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose(windowState.id);
              }
            }}
            aria-label="Close window"
            style={{
              width: '20px',
              height: '20px',
              border: 'none',
              background: 'transparent',
              color: 'var(--fl-text-primary)',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--fl-red)';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--fl-text-primary)';
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="fl-window-content"
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--fl-bg-darkest)',
        }}
      >
        {children}
      </div>

      {/* Resize handle */}
      {!windowState.isMaximized && (
        <div
          className="fl-window-resize-handle"
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '16px',
            height: '16px',
            cursor: 'nwse-resize',
            background: 'transparent',
          }}
        />
      )}
    </div>
  );
});