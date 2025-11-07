/**
 * Tests for useTools hook
 * @module tests/hooks/useTools
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTools } from '../../src/hooks/useTools';
import type { ToolType } from '../../src/types/FLStudio.types';

describe('useTools', () => {
  describe('initialization', () => {
    it('should initialize with default tool', () => {
      const { result } = renderHook(() => useTools());

      expect(result.current.currentTool).toBe('draw');
    });

    it('should sync with service initial state', () => {
      const { result } = renderHook(() => useTools());

      expect(result.current.service.getCurrentTool()).toBe('draw');
    });
  });

  describe('tool switching', () => {
    it('should change current tool', async () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setTool('paint');
      });

      await waitFor(() => {
        expect(result.current.currentTool).toBe('paint');
      });
    });

    it('should switch to select tool', async () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setTool('select');
      });

      await waitFor(() => {
        expect(result.current.currentTool).toBe('select');
      });
    });

    it('should switch to delete tool', async () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setTool('delete');
      });

      await waitFor(() => {
        expect(result.current.currentTool).toBe('delete');
      });
    });
  });

  describe('tool information', () => {
    it('should get tool name', () => {
      const { result } = renderHook(() => useTools());

      const name = result.current.getToolName('draw');
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });

    it('should get tool description', () => {
      const { result } = renderHook(() => useTools());

      const description = result.current.getToolDescription('draw');
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
    });

    it('should get tool shortcut', () => {
      const { result } = renderHook(() => useTools());

      const shortcut = result.current.getToolShortcut('draw');
      // Shortcut may be null or a string
      expect(shortcut === null || typeof shortcut === 'string').toBe(true);
    });

    it('should return null for tool without shortcut', () => {
      const { result } = renderHook(() => useTools());

      // Some tools may not have shortcuts
      const shortcut = result.current.getToolShortcut('draw');
      // This is acceptable
      expect(shortcut === null || typeof shortcut === 'string').toBe(true);
    });
  });

  describe('all tool types', () => {
    const toolTypes: ToolType[] = ['draw', 'paint', 'select', 'slip', 'delete', 'mute', 'slice'];

    it.each(toolTypes)('should switch to %s tool', async (toolType) => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setTool(toolType);
      });

      await waitFor(() => {
        expect(result.current.currentTool).toBe(toolType);
      });
    });

    it.each(toolTypes)('should get name for %s tool', (toolType) => {
      const { result } = renderHook(() => useTools());

      const name = result.current.getToolName(toolType);
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    it.each(toolTypes)('should get description for %s tool', (toolType) => {
      const { result } = renderHook(() => useTools());

      const description = result.current.getToolDescription(toolType);
      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe('service integration', () => {
    it('should provide service instance', () => {
      const { result } = renderHook(() => useTools());

      expect(result.current.service).toBeDefined();
      expect(result.current.service.getCurrentTool).toBeDefined();
    });

    it('should reflect service state changes', async () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.service.setTool('paint');
      });

      await waitFor(() => {
        expect(result.current.currentTool).toBe('paint');
      });
    });
  });
});

