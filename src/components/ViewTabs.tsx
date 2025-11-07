/**
 * ViewTabs - View tab navigation component
 * Enhanced with smooth transitions, keyboard navigation, and professional styling
 * @module components/ViewTabs
 */

import React, { useCallback, useState } from 'react';
import { useWindowManager } from '../hooks/useWindowManager';
import { useHintPanel } from './ui/HintPanel';

/**
 * View type
 */
export type ViewType = 'browser' | 'mixer' | 'channel-rack' | 'playlist' | 'piano-roll' | 'effects';

/**
 * ViewTabs component props
 */
export interface ViewTabsProps {
  activeView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

/**
 * View tabs component
 */
export const ViewTabs = React.memo<ViewTabsProps>(function ViewTabs({
  activeView,
  onViewChange,
}: ViewTabsProps): JSX.Element {
  const windowManager = useWindowManager();
  const hintPanel = useHintPanel();
  const [hoveredTab, setHoveredTab] = useState<ViewType | null>(null);

  const views: Array<{ id: ViewType; label: string; shortcut: string }> = [
    { id: 'browser', label: 'BROWSER', shortcut: 'F5' },
    { id: 'channel-rack', label: 'CHANNEL RACK', shortcut: 'F6' },
    { id: 'playlist', label: 'PLAYLIST', shortcut: 'F7' },
    { id: 'mixer', label: 'MIXER', shortcut: 'F8' },
    { id: 'piano-roll', label: 'PIANO ROLL', shortcut: 'F9' },
    { id: 'effects', label: 'EFFECTS', shortcut: 'F10' },
  ];

  /**
   * Handle view click
   */
  const handleViewClick = useCallback(
    (viewId: ViewType): void => {
      windowManager.toggleWindowByType(viewId);
      if (onViewChange) {
        onViewChange(viewId);
      }
    },
    [windowManager, onViewChange]
  );

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, viewId: ViewType, index: number): void => {
      let targetIndex = index;

      switch (e.key) {
        case 'ArrowLeft':
          targetIndex = index > 0 ? index - 1 : views.length - 1;
          break;
        case 'ArrowRight':
          targetIndex = index < views.length - 1 ? index + 1 : 0;
          break;
        case 'Home':
          targetIndex = 0;
          break;
        case 'End':
          targetIndex = views.length - 1;
          break;
        case 'Enter':
        case ' ':
          handleViewClick(viewId);
          return;
        default:
          return;
      }

      e.preventDefault();
      const targetView = views[targetIndex];
      if (targetView) {
        handleViewClick(targetView.id);
        // Focus the target tab
        const targetElement = document.querySelector(`[data-view-tab="${targetView.id}"]`) as HTMLElement;
        targetElement?.focus();
      }
    },
    [views, handleViewClick]
  );

  return (
    <div
      className="view-tabs"
      style={{
        display: 'flex',
        height: '100%',
        marginLeft: 'auto',
        gap: 0,
      }}
    >
      {views.map((view, index) => {
        const isActive = activeView === view.id;
        const window = windowManager.windows.find((w) => w.type === view.id);
        const isVisible = window?.isVisible ?? false;

        const isHovered = hoveredTab === view.id;

        return (
          <button
            key={view.id}
            data-view-tab={view.id}
            className={`view-tab ${isActive || isVisible ? 'active' : ''}`}
            onClick={() => handleViewClick(view.id)}
            onKeyDown={(e) => handleKeyDown(e, view.id, index)}
            onMouseEnter={(e) => {
              setHoveredTab(view.id);
              hintPanel.showHint(
                {
                  name: view.label,
                  description: `Open ${view.label} window`,
                  shortcut: view.shortcut,
                },
                e.clientX + 10,
                e.clientY - 30
              );
            }}
            onMouseLeave={() => {
              setHoveredTab(null);
              hintPanel.hideHint();
            }}
            aria-label={`${view.label} window (${view.shortcut})`}
            aria-pressed={isActive || isVisible ? 'true' : 'false'}
            role="tab"
            tabIndex={isActive || isVisible ? 0 : -1}
            title={`${view.label} (${view.shortcut})`}
            style={{
              background:
                isActive || isVisible
                  ? 'linear-gradient(180deg, var(--fl-orange) 0%, var(--fl-orange-dark) 100%)'
                  : isHovered
                    ? 'var(--fl-bg-hover)'
                    : 'transparent',
              border: 'none',
              color: isActive || isVisible ? 'var(--fl-text-inverted)' : isHovered ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
              padding: '0 16px',
              fontSize: '11px',
              fontWeight: isActive || isVisible ? 600 : 500,
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
              position: 'relative',
              borderLeft: `1px solid ${isActive || isVisible ? 'var(--fl-orange-dark)' : 'transparent'}`,
              borderRight: `1px solid ${isActive || isVisible ? 'var(--fl-orange-dark)' : 'transparent'}`,
              boxShadow:
                isActive || isVisible
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.3)'
                  : 'none',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--fl-orange)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
});