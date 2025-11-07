/**
 * Tests for Toolbar component
 * @module tests/components/Toolbar
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Toolbar } from '../../src/components/Toolbar';
import type { ToolType } from '../../src/types/FLStudio.types';

// Mock useTools
const mockSetTool = jest.fn();
const mockGetToolName = jest.fn((tool: ToolType): string => tool.charAt(0).toUpperCase() + tool.slice(1));
const mockGetToolDescription = jest.fn((tool: ToolType): string => `${tool} tool description`);
const mockGetToolShortcut = jest.fn((tool: ToolType): string | null => {
  const shortcuts: Record<ToolType, string | null> = {
    draw: '1',
    paint: '2',
    select: '3',
    slip: null,
    delete: null,
    mute: null,
    slice: null,
  };
  return shortcuts[tool] ?? null;
});

jest.mock('../../src/hooks/useTools', () => ({
  useTools: jest.fn(() => ({
    currentTool: 'draw' as ToolType,
    setTool: mockSetTool,
    getToolName: mockGetToolName,
    getToolDescription: mockGetToolDescription,
    getToolShortcut: mockGetToolShortcut,
  })),
}));

// Mock useHintPanel
const mockShowHint = jest.fn();
const mockHideHint = jest.fn();

jest.mock('../../src/components/ui/HintPanel', () => ({
  useHintPanel: jest.fn(() => ({
    showHint: mockShowHint,
    hideHint: mockHideHint,
    hintData: null,
    hintPosition: { x: 0, y: 0 },
  })),
}));

describe('Toolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockGetToolName.mockImplementation((tool: ToolType): string => tool.charAt(0).toUpperCase() + tool.slice(1));
    mockGetToolDescription.mockImplementation((tool: ToolType): string => `${tool} tool description`);
    mockGetToolShortcut.mockImplementation((tool: ToolType): string | null => {
      const shortcuts: Record<ToolType, string | null> = {
        draw: '1',
        paint: '2',
        select: '3',
        slip: null,
        delete: null,
        mute: null,
        slice: null,
      };
      return shortcuts[tool] ?? null;
    });
    // Reset useTools mock to default
    const { useTools } = require('../../src/hooks/useTools');
    (useTools as jest.Mock).mockReturnValue({
      currentTool: 'draw' as ToolType,
      setTool: mockSetTool,
      getToolName: mockGetToolName,
      getToolDescription: mockGetToolDescription,
      getToolShortcut: mockGetToolShortcut,
    });
  });

  describe('rendering', () => {
    it('should render toolbar', () => {
      render(<Toolbar />);

      expect(screen.getByText(/Tools:/i)).toBeInTheDocument();
    });

    it('should render all 7 tools', () => {
      render(<Toolbar />);

      expect(screen.getByRole('button', { name: /Draw tool/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Paint tool/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select tool/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Slip tool/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete tool/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mute tool/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Slice tool/i })).toBeInTheDocument();
    });

    it('should display current tool', () => {
      render(<Toolbar />);

      expect(screen.getByText(/Current:/i)).toBeInTheDocument();
      const currentToolSection = screen.getByText(/Current:/i).parentElement;
      expect(currentToolSection).toBeInTheDocument();
      expect(currentToolSection?.querySelector('strong')).toHaveTextContent('Draw');
    });

    it('should render tool icons', () => {
      render(<Toolbar />);

      // Check for emoji icons (they should be in the DOM)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Each tool button should contain an icon span
      const drawButton = screen.getByRole('button', { name: /Draw tool/i });
      expect(drawButton).toBeInTheDocument();
    });

    it('should apply className prop', () => {
      const { container } = render(<Toolbar className="custom-class" />);

      const toolbar = container.querySelector('.fl-toolbar');
      expect(toolbar).toHaveClass('custom-class');
    });
  });

  describe('interactions', () => {
    it('should call setTool when tool button is clicked', () => {
      render(<Toolbar />);

      const paintButton = screen.getByRole('button', { name: /Paint tool/i });
      fireEvent.click(paintButton);

      expect(mockSetTool).toHaveBeenCalledWith('paint');
      expect(mockSetTool).toHaveBeenCalledTimes(1);
    });

    it('should call setTool for each tool when clicked', () => {
      render(<Toolbar />);

      const tools: ToolType[] = ['draw', 'paint', 'select', 'slip', 'delete', 'mute', 'slice'];
      
      tools.forEach((tool) => {
        const toolName = mockGetToolName(tool);
        const button = screen.getByRole('button', { name: new RegExp(`${toolName} tool`, 'i') });
        fireEvent.click(button);
      });

      expect(mockSetTool).toHaveBeenCalledTimes(7);
      tools.forEach((tool) => {
        expect(mockSetTool).toHaveBeenCalledWith(tool);
      });
    });

    it('should show hint on tool button hover', () => {
      render(<Toolbar />);

      const drawButton = screen.getByRole('button', { name: /Draw tool/i });
      const mouseEvent = {
        clientX: 100,
        clientY: 200,
      } as React.MouseEvent<HTMLButtonElement>;

      fireEvent.mouseEnter(drawButton, mouseEvent);

      expect(mockShowHint).toHaveBeenCalledWith(
        {
          name: 'Draw',
          description: 'draw tool description',
          shortcut: '1',
        },
        110, // clientX + 10
        170 // clientY - 30
      );
    });

    it('should hide hint on tool button mouse leave', () => {
      render(<Toolbar />);

      const drawButton = screen.getByRole('button', { name: /Draw tool/i });
      fireEvent.mouseEnter(drawButton);
      fireEvent.mouseLeave(drawButton);

      expect(mockHideHint).toHaveBeenCalled();
    });

    it('should highlight active tool', () => {
      render(<Toolbar />);

      const drawButton = screen.getByRole('button', { name: /Draw tool/i });
      
      // Active tool should have primary variant and active prop
      expect(drawButton).toHaveClass('fl-button-primary');
      expect(drawButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not highlight inactive tools', () => {
      render(<Toolbar />);

      const paintButton = screen.getByRole('button', { name: /Paint tool/i });
      
      // Inactive tool should not have primary variant
      expect(paintButton).not.toHaveClass('fl-button-primary');
      expect(paintButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('accessibility', () => {
    it('should have ARIA labels on all tool buttons', () => {
      render(<Toolbar />);

      const tools: ToolType[] = ['draw', 'paint', 'select', 'slip', 'delete', 'mute', 'slice'];
      
      tools.forEach((tool) => {
        const toolName = mockGetToolName(tool);
        const button = screen.getByRole('button', { name: new RegExp(`${toolName} tool`, 'i') });
        expect(button).toHaveAttribute('aria-label', `${toolName} tool`);
      });
    });

    it('should support keyboard activation with Space key', () => {
      render(<Toolbar />);

      const paintButton = screen.getByRole('button', { name: /Paint tool/i });
      fireEvent.keyDown(paintButton, { key: ' ' });

      expect(mockSetTool).toHaveBeenCalledWith('paint');
    });

    it('should support keyboard activation with Enter key', () => {
      render(<Toolbar />);

      const selectButton = screen.getByRole('button', { name: /Select tool/i });
      fireEvent.keyDown(selectButton, { key: 'Enter' });

      expect(mockSetTool).toHaveBeenCalledWith('select');
    });

    it('should have proper title attributes with shortcuts', () => {
      render(<Toolbar />);

      const drawButton = screen.getByRole('button', { name: /Draw tool/i });
      expect(drawButton).toHaveAttribute('title', 'Draw - draw tool description (1)');
    });

    it('should have proper title attributes without shortcuts', () => {
      render(<Toolbar />);

      const slipButton = screen.getByRole('button', { name: /Slip tool/i });
      expect(slipButton).toHaveAttribute('title', 'Slip - slip tool description');
    });
  });

  describe('edge cases', () => {
    it('should handle different currentTool states', () => {
      const { useTools } = require('../../src/hooks/useTools');
      
      (useTools as jest.Mock).mockReturnValueOnce({
        currentTool: 'paint' as ToolType,
        setTool: mockSetTool,
        getToolName: mockGetToolName,
        getToolDescription: mockGetToolDescription,
        getToolShortcut: mockGetToolShortcut,
      });

      render(<Toolbar />);

      expect(screen.getByText(/Current:/i)).toBeInTheDocument();
      const currentToolSection = screen.getByText(/Current:/i).parentElement;
      expect(currentToolSection?.querySelector('strong')).toHaveTextContent('Paint');
      
      const paintButton = screen.getByRole('button', { name: /Paint tool/i });
      expect(paintButton).toHaveClass('fl-button-primary');
      expect(paintButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should handle tools with shortcuts', () => {
      render(<Toolbar />);

      const drawButton = screen.getByRole('button', { name: /Draw tool/i });
      const mouseEvent = {
        clientX: 50,
        clientY: 100,
      } as React.MouseEvent<HTMLButtonElement>;

      fireEvent.mouseEnter(drawButton, mouseEvent);

      expect(mockShowHint).toHaveBeenCalledWith(
        expect.objectContaining({
          shortcut: '1',
        }),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle tools without shortcuts', () => {
      render(<Toolbar />);

      const slipButton = screen.getByRole('button', { name: /Slip tool/i });
      const mouseEvent = {
        clientX: 50,
        clientY: 100,
      } as React.MouseEvent<HTMLButtonElement>;

      fireEvent.mouseEnter(slipButton, mouseEvent);

      expect(mockShowHint).toHaveBeenCalledWith(
        expect.objectContaining({
          shortcut: undefined,
        }),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should update current tool display when currentTool changes', () => {
      const { useTools } = require('../../src/hooks/useTools');
      
      // First render with 'select' tool
      (useTools as jest.Mock).mockReturnValueOnce({
        currentTool: 'select' as ToolType,
        setTool: mockSetTool,
        getToolName: mockGetToolName,
        getToolDescription: mockGetToolDescription,
        getToolShortcut: mockGetToolShortcut,
      });

      const { unmount } = render(<Toolbar />);

      const currentToolSection1 = screen.getByText(/Current:/i).parentElement;
      expect(currentToolSection1?.querySelector('strong')).toHaveTextContent('Select');

      // Unmount and render again with different tool
      unmount();

      (useTools as jest.Mock).mockReturnValueOnce({
        currentTool: 'slice' as ToolType,
        setTool: mockSetTool,
        getToolName: mockGetToolName,
        getToolDescription: mockGetToolDescription,
        getToolShortcut: mockGetToolShortcut,
      });

      render(<Toolbar />);

      const currentToolSection2 = screen.getByText(/Current:/i).parentElement;
      expect(currentToolSection2?.querySelector('strong')).toHaveTextContent('Slice');
    });
  });

  describe('visual elements', () => {
    it('should display "Current:" label', () => {
      render(<Toolbar />);

      expect(screen.getByText(/Current:/i)).toBeInTheDocument();
    });

    it('should display current tool name in strong element', () => {
      render(<Toolbar />);

      const currentToolSection = screen.getByText(/Current:/i).parentElement;
      const strongElement = currentToolSection?.querySelector('strong');
      expect(strongElement).toBeInTheDocument();
      expect(strongElement).toHaveTextContent('Draw');
    });

    it('should render tooltip titles with shortcuts when available', () => {
      render(<Toolbar />);

      const drawButton = screen.getByRole('button', { name: /Draw tool/i });
      expect(drawButton).toHaveAttribute('title', 'Draw - draw tool description (1)');
    });

    it('should render tooltip titles without shortcuts when not available', () => {
      render(<Toolbar />);

      const deleteButton = screen.getByRole('button', { name: /Delete tool/i });
      expect(deleteButton).toHaveAttribute('title', 'Delete - delete tool description');
    });
  });
});
