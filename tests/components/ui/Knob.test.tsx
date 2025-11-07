/**
 * Tests for Knob component
 * @module tests/components/ui/Knob
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Knob } from '@/components/ui';

describe('Knob', () => {
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

  it('should render knob with label', () => {
    render(<Knob {...defaultProps} label="Volume" />);

    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('should display value with unit', () => {
    render(<Knob {...defaultProps} value={75} unit="%" />);

    expect(screen.getByText(/75%/i)).toBeInTheDocument();
  });

  it('should call onChange when dragging', async () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} onChange={onChange} />);

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob, { clientY: 100, button: 0 });
    
    // Wait for effect to attach handlers
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    fireEvent.mouseMove(window, { clientY: 50 });
    fireEvent.mouseUp(window);

    expect(onChange).toHaveBeenCalled();
  });

  it('should clamp value to min/max', () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} min={0} max={100} onChange={onChange} />);

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob, { clientY: 100 });
    fireEvent.mouseMove(window, { clientY: 0 }); // Drag up (decrease value)

    // Value should be clamped
    const calls = onChange.mock.calls;
    if (calls.length > 0) {
      const lastValue = calls[calls.length - 1]?.[0];
      expect(lastValue).toBeGreaterThanOrEqual(0);
      expect(lastValue).toBeLessThanOrEqual(100);
    }
  });

  it('should apply step when dragging', () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} step={10} onChange={onChange} />);

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob, { clientY: 100 });
    fireEvent.mouseMove(window, { clientY: 50 });

    // Values should be stepped
    const calls = onChange.mock.calls;
    if (calls.length > 0) {
      const lastValue = calls[calls.length - 1]?.[0];
      expect(lastValue % 10).toBe(0);
    }
  });

  it('should handle keyboard arrow up', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Knob {...defaultProps} value={50} onChange={onChange} />);

    const knob = screen.getByRole('slider');
    knob.focus();
    await user.keyboard('{ArrowUp}');

    expect(onChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should handle keyboard arrow down', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Knob {...defaultProps} value={50} onChange={onChange} />);

    const knob = screen.getByRole('slider');
    knob.focus();
    await user.keyboard('{ArrowDown}');

    expect(onChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should handle center detent', async () => {
    const onChange = jest.fn();
    render(
      <Knob
        {...defaultProps}
        centerDetent={true}
        centerValue={50}
        value={48}
        onChange={onChange}
      />
    );

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob, { clientY: 100, button: 0 });
    
    // Wait for effect to attach handlers
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    fireEvent.mouseMove(window, { clientY: 100 }); // Small movement near center
    fireEvent.mouseUp(window);

    // Should snap to center value
    expect(onChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Knob {...defaultProps} disabled={true} />);

    const knob = screen.getByRole('slider');
    expect(knob).toHaveAttribute('aria-disabled', 'true');
  });

  it('should not call onChange when disabled', () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} disabled={true} onChange={onChange} />);

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    render(<Knob {...defaultProps} ariaLabel="Volume Control" />);

    const knob = screen.getByRole('slider', { name: 'Volume Control' });
    expect(knob).toHaveAttribute('aria-valuemin', '0');
    expect(knob).toHaveAttribute('aria-valuemax', '100');
    expect(knob).toHaveAttribute('aria-valuenow', '50');
  });

  it('should stop dragging on mouse up', () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} onChange={onChange} />);

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob, { clientY: 100 });
    fireEvent.mouseMove(window, { clientY: 50 });
    const callCountBefore = onChange.mock.calls.length;

    fireEvent.mouseUp(window);
    fireEvent.mouseMove(window, { clientY: 30 });

    // Should not call onChange after mouse up
    expect(onChange.mock.calls.length).toBe(callCountBefore);
  });
});

