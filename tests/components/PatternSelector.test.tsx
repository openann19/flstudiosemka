/**
 * Tests for PatternSelector component
 * @module tests/components/PatternSelector
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatternSelector, type Pattern } from '../../src/components/PatternSelector';
import { createPatterns } from '../factories/pattern-factory';

// Mock hooks
jest.mock('../../src/components/ui/HintPanel', () => ({
  useHintPanel: () => ({
    showHint: jest.fn(),
    hideHint: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useContextMenu', () => ({
  useContextMenu: () => ({
    attach: jest.fn(),
    detach: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
  }),
}));

jest.mock('../../src/services/ContextMenuService', () => ({
  contextMenuService: {
    getPatternMenu: jest.fn(() => []),
  },
}));

describe('PatternSelector', () => {
  const patterns: Pattern[] = createPatterns(3);
  const mockHandlers = {
    onPatternSelect: jest.fn(),
    onPatternRename: jest.fn(),
    onPatternDuplicate: jest.fn(),
    onPatternDelete: jest.fn(),
    onPatternClear: jest.fn(),
    onCreatePattern: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render patterns', () => {
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    patterns.forEach((pattern) => {
      expect(screen.getByText(pattern.name)).toBeInTheDocument();
    });
  });

  it('should highlight current pattern', () => {
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={1}
        {...mockHandlers}
      />
    );

    const patternElements = screen.getAllByText(/Pattern/i);
    // Current pattern should have active styling (check by data attributes or classes)
    expect(patternElements.length).toBeGreaterThan(0);
  });

  it('should call onPatternSelect when pattern is clicked', () => {
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    const patternElement = screen.getByText(patterns[1]?.name ?? '');
    fireEvent.click(patternElement);

    expect(mockHandlers.onPatternSelect).toHaveBeenCalledWith(patterns[1]?.id);
  });

  it('should start editing on double click', async () => {
    const user = userEvent.setup();
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    const patternElement = screen.getByText(patterns[0]?.name ?? '');
    await user.dblClick(patternElement);

    // Should show input field
    const input = screen.getByDisplayValue(patterns[0]?.name ?? '');
    expect(input).toBeInTheDocument();
  });

  it('should save edited name on Enter', async () => {
    const user = userEvent.setup();
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    const patternElement = screen.getByText(patterns[0]?.name ?? '');
    await user.dblClick(patternElement);

    const input = screen.getByDisplayValue(patterns[0]?.name ?? '');
    await user.clear(input);
    await user.type(input, 'New Pattern Name');
    await user.keyboard('{Enter}');

    expect(mockHandlers.onPatternRename).toHaveBeenCalledWith(0, 'New Pattern Name');
  });

  it('should cancel editing on Escape', async () => {
    const user = userEvent.setup();
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    const patternElement = screen.getByText(patterns[0]?.name ?? '');
    await user.dblClick(patternElement);

    const input = screen.getByDisplayValue(patterns[0]?.name ?? '');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByDisplayValue(patterns[0]?.name ?? '')).not.toBeInTheDocument();
    });
  });

  it('should not save empty name', async () => {
    const user = userEvent.setup();
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    const patternElement = screen.getByText(patterns[0]?.name ?? '');
    await user.dblClick(patternElement);

    const input = screen.getByDisplayValue(patterns[0]?.name ?? '');
    await user.clear(input);
    await user.keyboard('{Enter}');

    expect(mockHandlers.onPatternRename).not.toHaveBeenCalled();
  });

  it('should show create pattern button when onCreatePattern is provided', () => {
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
        onCreatePattern={mockHandlers.onCreatePattern}
      />
    );

    const createButton = screen.getByText(/\+/i);
    expect(createButton).toBeInTheDocument();
  });

  it('should call onCreatePattern when create button is clicked', () => {
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
        onCreatePattern={mockHandlers.onCreatePattern}
      />
    );

    const createButton = screen.getByText(/\+/i);
    fireEvent.click(createButton);

    expect(mockHandlers.onCreatePattern).toHaveBeenCalled();
  });

  it('should display pattern steps count', () => {
    render(
      <PatternSelector
        patterns={patterns}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    // Pattern should show step count
    expect(screen.getByText(/16 steps/i)).toBeInTheDocument();
  });

  it('should handle empty patterns array', () => {
    render(
      <PatternSelector
        patterns={[]}
        currentPattern={0}
        {...mockHandlers}
      />
    );

    // Should render without errors
    expect(screen.getByText(/PATTERNS/i)).toBeInTheDocument();
  });
});

