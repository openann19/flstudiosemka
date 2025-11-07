/**
 * Tests for ViewTabs component
 * @module tests/components/ViewTabs
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewTabs } from '../../src/components/ViewTabs';

// Mock useWindowManager
jest.mock('../../src/hooks/useWindowManager', () => ({
  useWindowManager: () => ({
    windows: [],
    toggleWindowByType: jest.fn(),
  }),
}));

describe('ViewTabs', () => {
  describe('rendering', () => {
    it('should render all view tabs', () => {
      render(<ViewTabs />);

      expect(screen.getByText('BROWSER')).toBeInTheDocument();
      expect(screen.getByText('CHANNEL RACK')).toBeInTheDocument();
      expect(screen.getByText('PLAYLIST')).toBeInTheDocument();
      expect(screen.getByText('MIXER')).toBeInTheDocument();
      expect(screen.getByText('PIANO ROLL')).toBeInTheDocument();
      expect(screen.getByText('EFFECTS')).toBeInTheDocument();
    });

    it('should highlight active view', () => {
      render(<ViewTabs activeView="playlist" />);

      const playlistTab = screen.getByText('PLAYLIST');
      expect(playlistTab).toHaveClass('active');
    });
  });

  describe('interactions', () => {
    it('should call onViewChange when tab is clicked', () => {
      const onViewChange = jest.fn();

      render(<ViewTabs onViewChange={onViewChange} />);

      const browserTab = screen.getByText('BROWSER');
      fireEvent.click(browserTab);

      expect(onViewChange).toHaveBeenCalledWith('browser');
    });

    it('should handle keyboard navigation', () => {
      const onViewChange = jest.fn();

      render(<ViewTabs activeView="browser" onViewChange={onViewChange} />);

      const browserTab = screen.getByText('BROWSER');
      fireEvent.keyDown(browserTab, { key: 'ArrowRight' });

      expect(onViewChange).toHaveBeenCalled();
    });
  });
});
