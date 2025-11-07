/**
 * Tests for Transport component
 * @module tests/components/Transport
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Transport } from '../../src/components/Transport';

describe('Transport', () => {
  const defaultProps = {
    isPlaying: false,
    isRecording: false,
    playbackMode: 'pattern' as const,
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    currentTime: 0,
    totalTime: 120,
    loopEnabled: false,
    loopStart: 0,
    loopEnd: 16,
    metronomeEnabled: false,
    metronomeVolume: 0.5,
    onPlay: jest.fn(),
    onStop: jest.fn(),
    onRecord: jest.fn(),
    onTogglePlaybackMode: jest.fn(),
    onBPMChange: jest.fn(),
    onTimeSignatureChange: jest.fn(),
    onLoopToggle: jest.fn(),
    onLoopSet: jest.fn(),
    onMetronomeToggle: jest.fn(),
    onMetronomeVolumeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render transport controls', () => {
      render(<Transport {...defaultProps} />);

      expect(screen.getByTitle('Stop')).toBeInTheDocument();
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });

    it('should display BPM', () => {
      render(<Transport {...defaultProps} bpm={140} />);

      expect(screen.getByDisplayValue('140')).toBeInTheDocument();
    });

    it('should display time signature', () => {
      render(<Transport {...defaultProps} timeSignature={{ numerator: 3, denominator: 4 }} />);

      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    });
  });

  describe('playback controls', () => {
    it('should call onPlay when play button is clicked', () => {
      render(<Transport {...defaultProps} />);

      const playButton = screen.getByTitle('Play');
      fireEvent.click(playButton);

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    });

    it('should call onStop when stop button is clicked', () => {
      render(<Transport {...defaultProps} />);

      const stopButton = screen.getByTitle('Stop');
      fireEvent.click(stopButton);

      expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
    });

    it('should call onRecord when record button is clicked', () => {
      render(<Transport {...defaultProps} />);

      const recordButton = screen.getByTitle('Record');
      fireEvent.click(recordButton);

      expect(defaultProps.onRecord).toHaveBeenCalledTimes(1);
    });

    it('should show active state when playing', () => {
      render(<Transport {...defaultProps} isPlaying={true} />);

      const playButton = screen.getByTitle('Play');
      expect(playButton).toHaveClass('fl-button-primary');
    });

    it('should show active state when recording', () => {
      render(<Transport {...defaultProps} isRecording={true} />);

      const recordButton = screen.getByTitle('Record');
      expect(recordButton).toHaveClass('fl-button-primary');
    });
  });

  describe('BPM control', () => {
    it('should call onBPMChange when BPM is changed', () => {
      render(<Transport {...defaultProps} />);

      // Find BPM input and change it
      const bpmInput = screen.getByDisplayValue('120');
      fireEvent.change(bpmInput, { target: { value: '140' } });

      expect(defaultProps.onBPMChange).toHaveBeenCalled();
    });
  });

  describe('time signature', () => {
    it('should call onTimeSignatureChange when time signature changes', () => {
      render(<Transport {...defaultProps} />);

      // Find time signature controls and interact
      const numeratorInput = screen.getByLabelText('Time signature numerator');
      fireEvent.change(numeratorInput, { target: { value: '3' } });

      expect(defaultProps.onTimeSignatureChange).toHaveBeenCalled();
    });
  });

  describe('loop controls', () => {
    it('should call onLoopToggle when loop is toggled', () => {
      render(<Transport {...defaultProps} />);

      // Find loop toggle button
      const loopButton = screen.getByRole('button', { name: /loop/i });
      if (loopButton) {
        fireEvent.click(loopButton);
        expect(defaultProps.onLoopToggle).toHaveBeenCalled();
      }
    });
  });

  describe('metronome controls', () => {
    it('should call onMetronomeToggle when metronome is toggled', () => {
      render(<Transport {...defaultProps} />);

      // Find metronome toggle button
      const metronomeButton = screen.getByRole('button', { name: /metronome/i });
      if (metronomeButton) {
        fireEvent.click(metronomeButton);
        expect(defaultProps.onMetronomeToggle).toHaveBeenCalled();
      }
    });
  });

  describe('playback mode', () => {
    it('should call onTogglePlaybackMode when mode is toggled', () => {
      render(<Transport {...defaultProps} />);

      // Find playback mode toggle (PAT button)
      const modeButton = screen.getByTitle('Mode: Pattern');
      fireEvent.click(modeButton);
      expect(defaultProps.onTogglePlaybackMode).toHaveBeenCalled();
    });
  });
});

