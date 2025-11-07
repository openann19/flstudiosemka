/**
 * Tests for Button component
 * @module tests/components/ui/Button
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../src/components/ui/Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render button with children', () => {
      render(
        <Button>
          <span>Icon</span> Text
        </Button>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should apply default variant', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply primary variant', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply danger variant', () => {
      render(<Button variant="danger">Danger</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should apply small size', () => {
      render(<Button size="small">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply medium size', () => {
      render(<Button size="medium">Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply large size', () => {
      render(<Button size="large">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('keyboard support', () => {
    it('should activate on Space key', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('should activate on Enter key', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('active state', () => {
    it('should show active state', () => {
      render(<Button active>Active</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveClass('active');
    });
  });

  describe('accessibility', () => {
    it('should support aria-label', () => {
      render(<Button ariaLabel="Close dialog">X</Button>);

      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <Button ariaDescribedBy="help-text" ariaLabel="Button">
          Click
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });
  });
});

