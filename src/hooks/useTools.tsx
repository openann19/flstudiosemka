/**
 * useTools - Tool state management hook
 * Integrates ToolManagerService with React components
 * @module hooks/useTools
 */

import { useState, useEffect, useCallback } from 'react';
import { toolManagerService, ToolManagerService } from '../services/ToolManagerService';
import type { ToolType } from '../types/FLStudio.types';

/**
 * Return type for useTools hook
 */
export interface UseToolsReturn {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  getToolName: (tool: ToolType) => string;
  getToolDescription: (tool: ToolType) => string;
  getToolShortcut: (tool: ToolType) => string | null;
  service: ToolManagerService;
}

/**
 * React hook for managing tools
 * @returns Tool management functions
 */
export function useTools(): UseToolsReturn {
  const [currentTool, setCurrentToolState] = useState<ToolType>(
    toolManagerService.getCurrentTool()
  );

  /**
   * Update tool state when service changes
   */
  useEffect(() => {
    const unregister = toolManagerService.onToolChange((tool) => {
      setCurrentToolState(tool);
    });

    return unregister;
  }, []);

  /**
   * Set tool
   */
  const setTool = useCallback((tool: ToolType): void => {
    toolManagerService.setTool(tool);
  }, []);

  /**
   * Get tool name
   */
  const getToolName = useCallback((tool: ToolType): string => {
    return toolManagerService.getToolName(tool);
  }, []);

  /**
   * Get tool description
   */
  const getToolDescription = useCallback((tool: ToolType): string => {
    return toolManagerService.getToolDescription(tool);
  }, []);

  /**
   * Get tool shortcut
   */
  const getToolShortcut = useCallback((tool: ToolType): string | null => {
    return toolManagerService.getToolShortcut(tool);
  }, []);

  return {
    currentTool,
    setTool,
    getToolName,
    getToolDescription,
    getToolShortcut,
    service: toolManagerService,
  };
}

