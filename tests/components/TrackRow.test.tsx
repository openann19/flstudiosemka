/**
 * Tests for TrackRow component
 * @module tests/components/TrackRow
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackRow } from '../../src/components/TrackRow';
import { createTrack } from '../factories/track-factory';

describe('TrackRow', () => {
  const defaultProps = {
    track: createTrack({ id: 0, name: 'Test Track', type: 'drum' }),
    currentStep: 0,
    isPlaying: false,
    onToggleStep: jest.fn(),
    onToggleMute: jest.fn(),
    onToggleSolo: jest.fn(),
    onRename: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
    onOpenPianoRoll: jest.fn(),
    getTrackColor: jest.fn(() => '#FF0000'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render track name', () => {
      render(<TrackRow {...defaultProps} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should render step buttons', () => {
      render(<TrackRow {...defaultProps} />);

      const stepButtons = screen.getAllByRole('button');
      expect(stepButtons.length).toBeGreaterThan(0);
    });
  });

  describe('interactions', () => {
    it('should call onToggleStep when step is clicked', () => {
      render(<TrackRow {...defaultProps} />);

      // Find step buttons by aria-label (they have "Step X" labels)
      const stepButton = screen.getByLabelText(/Step 1/i);
      fireEvent.click(stepButton);
      expect(defaultProps.onToggleStep).toHaveBeenCalledWith(0);
    });

    it('should call onToggleMute when mute button is clicked', () => {
      render(<TrackRow {...defaultProps} />);

      const muteButton = screen.getByTitle(/mute/i);
      if (muteButton) {
        fireEvent.click(muteButton);
        expect(defaultProps.onToggleMute).toHaveBeenCalled();
      }
    });
  });
});

