/**
 * ToolManagerService - Tool switching and management
 * Handles tool selection and tool-specific behaviors
 * @module services/ToolManagerService
 */

import type { ToolType } from '../types/FLStudio.types';
import { InvalidParameterError } from '../utils/errors';

/**
 * Tool change handler
 */
export type ToolChangeHandler = (tool: ToolType) => void;

/**
 * Tool manager service
 */
export class ToolManagerService {
  private currentTool: ToolType;

  private handlers: Set<ToolChangeHandler>;

  /**
   * Create a new ToolManagerService instance
   */
  constructor() {
    this.currentTool = 'draw';
    this.handlers = new Set<ToolChangeHandler>();
  }

  /**
   * Get current tool
   * @returns Current tool
   */
  getCurrentTool(): ToolType {
    return this.currentTool;
  }

  /**
   * Set current tool
   * @param tool - Tool to set
   * @throws InvalidParameterError if tool is invalid
   */
  setTool(tool: ToolType): void {
    const validTools: ToolType[] = ['draw', 'paint', 'select', 'slip', 'delete', 'mute', 'slice'];
    if (!validTools.includes(tool)) {
      throw new InvalidParameterError('tool', tool, 'valid ToolType');
    }

    if (this.currentTool !== tool) {
      this.currentTool = tool;
      this.notifyHandlers();
    }
  }

  /**
   * Register tool change handler
   * @param handler - Handler function
   * @returns Unregister function
   */
  onToolChange(handler: ToolChangeHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Notify all handlers of tool change
   * @private
   */
  private notifyHandlers(): void {
    this.handlers.forEach((handler) => {
      try {
        handler(this.currentTool);
      } catch {
        // Silent error handling
      }
    });
  }

  /**
   * Get tool name
   * @param tool - Tool type
   * @returns Human-readable tool name
   */
  getToolName(tool: ToolType): string {
    const names: Record<ToolType, string> = {
      draw: 'Draw',
      paint: 'Paint',
      select: 'Select',
      slip: 'Slip',
      delete: 'Delete',
      mute: 'Mute',
      slice: 'Slice',
    };
    return names[tool] || tool;
  }

  /**
   * Get tool description
   * @param tool - Tool type
   * @returns Tool description
   */
  getToolDescription(tool: ToolType): string {
    const descriptions: Record<ToolType, string> = {
      draw: 'Draw notes and clips',
      paint: 'Paint mode for rapid editing',
      select: 'Select and move items',
      slip: 'Time-stretch and slip edit',
      delete: 'Delete items',
      mute: 'Mute items',
      slice: 'Slice audio clips',
    };
    return descriptions[tool] || '';
  }

  /**
   * Get tool keyboard shortcut
   * @param tool - Tool type
   * @returns Keyboard shortcut key (1-9)
   */
  getToolShortcut(tool: ToolType): string | null {
    const shortcuts: Record<ToolType, string> = {
      draw: '1',
      paint: '2',
      select: '3',
      slip: '4',
      delete: '5',
      mute: '6',
      slice: '7',
    };
    return shortcuts[tool] || null;
  }
}

// Export singleton instance
export const toolManagerService = new ToolManagerService();

