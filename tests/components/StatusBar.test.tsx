/**
 * Tests for StatusBar component
 * @module tests/components/StatusBar
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../../src/components/StatusBar';

describe('StatusBar', () => {
  describe('rendering', () => {
    it('should render status bar', () => {
      render(<StatusBar />);

      // StatusBar has role="status", and LED components also have role="status"
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      // The main status bar should be the first one
      expect(statusElements[0]).toHaveClass('fl-status-bar');
    });

    it('should display audio engine status', () => {
      render(<StatusBar audioEngineStatus="running" />);

      expect(screen.getByText(/Audio Engine/i)).toBeInTheDocument();
    });

    it('should display CPU usage', () => {
      render(<StatusBar cpuUsage={45.5} />);

      expect(screen.getByText(/CPU:/i)).toBeInTheDocument();
      expect(screen.getByText(/45\.5%/i)).toBeInTheDocument();
    });

    it('should display memory usage', () => {
      render(<StatusBar memoryUsage={128.3} />);

      expect(screen.getByText(/Memory:/i)).toBeInTheDocument();
      expect(screen.getByText(/128\.3 MB/i)).toBeInTheDocument();
    });

    it('should display project status', () => {
      render(<StatusBar projectStatus="saved" />);

      expect(screen.getByText(/Saved/i)).toBeInTheDocument();
    });

    it('should display unsaved status', () => {
      render(<StatusBar projectStatus="unsaved" />);

      expect(screen.getByText(/Unsaved/i)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onAudioEngineClick when clicked', () => {
      const onAudioEngineClick = jest.fn();

      render(<StatusBar onAudioEngineClick={onAudioEngineClick} />);

      const audioEngineSection = screen.getByText(/Audio Engine/i).closest('div');
      audioEngineSection?.click();

      expect(onAudioEngineClick).toHaveBeenCalled();
    });

    it('should call onProjectStatusClick when clicked', () => {
      const onProjectStatusClick = jest.fn();

      render(<StatusBar onProjectStatusClick={onProjectStatusClick} />);

      const projectStatusSection = screen.getByText(/Saved|Unsaved/i).closest('div');
      projectStatusSection?.click();

      expect(onProjectStatusClick).toHaveBeenCalled();
    });
  });
});
