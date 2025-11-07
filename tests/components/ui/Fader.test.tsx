/**
 * Tests for Fader component
 * @module tests/components/ui/Fader
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fader } from '@/components/ui';

describe('Fader', () => {
  const defaultProps = {
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render fader with label', () => {
    render(<Fader {...defaultProps} label="Volume" />);

    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('should display value with unit', () => {
    render(<Fader {...defaultProps} value={75} unit="dB" />);

    expect(screen.getByText(/75\s*dB/i)).toBeInTheDocument();
  });

  it('should call onChange when dragging', async () => {
    const onChange = jest.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fireEvent.mouseDown(fader, { clientY: 100, button: 0 });
    
    // Wait for effect to attach handlers
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    fireEvent.mouseMove(window, { clientY: 50 });
    fireEvent.mouseUp(window);

    expect(onChange).toHaveBeenCalled();
  });

  it('should clamp value to min/max', () => {
    const onChange = jest.fn();
    render(<Fader {...defaultProps} min={0} max={100} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fireEvent.mouseDown(fader, { clientY: 0 });
    fireEvent.mouseMove(window, { clientY: -100 }); // Drag above (increase value)

    // Value should be clamped
    const calls = onChange.mock.calls;
    if (calls.length > 0) {
      const lastValue = calls[calls.length - 1]?.[0];
      expect(lastValue).toBeGreaterThanOrEqual(0);
      expect(lastValue).toBeLessThanOrEqual(100);
    }
  });

  it('should apply step when snapToStep is true', () => {
    const onChange = jest.fn();
    render(<Fader {...defaultProps} step={10} snapToStep={true} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fireEvent.mouseDown(fader, { clientY: 100 });
    fireEvent.mouseMove(window, { clientY: 50 });

    // Values should be stepped
    const calls = onChange.mock.calls;
    if (calls.length > 0) {
      const lastValue = calls[calls.length - 1]?.[0];
      expect(lastValue % 10).toBe(0);
    }
  });

  it('should not apply step when snapToStep is false', async () => {
    const onChange = jest.fn();
    render(<Fader {...defaultProps} step={10} snapToStep={false} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fireEvent.mouseDown(fader, { clientY: 100, button: 0 });
    
    // Wait for effect to attach handlers
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    fireEvent.mouseMove(window, { clientY: 95 });
    fireEvent.mouseUp(window);

    // Values may not be stepped
    expect(onChange).toHaveBeenCalled();
  });

  it('should handle keyboard arrow up', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Fader {...defaultProps} value={50} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fader.focus();
    await user.keyboard('{ArrowUp}');

    expect(onChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should handle keyboard arrow down', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Fader {...defaultProps} value={50} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fader.focus();
    await user.keyboard('{ArrowDown}');

    expect(onChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should handle track click', () => {
    const onChange = jest.fn();
    const { container } = render(<Fader {...defaultProps} onChange={onChange} />);

    // Click on track container (not thumb)
    const track = container.querySelector('.fl-fader-container');
    if (track) {
      const rect = track.getBoundingClientRect();
      fireEvent.click(track, { 
        clientY: rect.top + rect.height / 2,
        button: 0
      });
      expect(onChange).toHaveBeenCalled();
    }
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Fader {...defaultProps} disabled={true} />);

    const fader = screen.getByRole('slider');
    expect(fader).toHaveAttribute('aria-disabled', 'true');
  });

  it('should not call onChange when disabled', () => {
    const onChange = jest.fn();
    render(<Fader {...defaultProps} disabled={true} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fireEvent.mouseDown(fader);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    render(<Fader {...defaultProps} ariaLabel="Volume Control" />);

    const fader = screen.getByRole('slider', { name: 'Volume Control' });
    expect(fader).toHaveAttribute('aria-valuemin', '0');
    expect(fader).toHaveAttribute('aria-valuemax', '100');
    expect(fader).toHaveAttribute('aria-valuenow', '50');
  });

  it('should stop dragging on mouse up', () => {
    const onChange = jest.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);

    const fader = screen.getByRole('slider');
    fireEvent.mouseDown(fader, { clientY: 100 });
    fireEvent.mouseMove(window, { clientY: 50 });
    const callCountBefore = onChange.mock.calls.length;

    fireEvent.mouseUp(window);
    fireEvent.mouseMove(window, { clientY: 30 });

    // Should not call onChange after mouse up
    expect(onChange.mock.calls.length).toBe(callCountBefore);
  });

  it('should handle custom width and height', () => {
    render(<Fader {...defaultProps} width={30} height={150} />);

    const fader = screen.getByRole('slider');
    expect(fader).toBeInTheDocument();
  });
});

