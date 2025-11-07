/**
 * Tests for ToolManagerService
 * @module tests/services/ToolManagerService
 */

import { ToolManagerService } from '../../src/services/ToolManagerService';
import { InvalidParameterError } from '../../src/utils/errors';
import type { ToolType } from '../../src/types/FLStudio.types';

describe('ToolManagerService', () => {
  let service: ToolManagerService;

  beforeEach(() => {
    service = new ToolManagerService();
  });

  describe('initialization', () => {
    it('should initialize with draw tool', () => {
      expect(service.getCurrentTool()).toBe('draw');
    });
  });

  describe('tool switching', () => {
    it('should change current tool', () => {
      service.setTool('paint');
      expect(service.getCurrentTool()).toBe('paint');
    });

    it('should switch to select tool', () => {
      service.setTool('select');
      expect(service.getCurrentTool()).toBe('select');
    });

    it('should switch to delete tool', () => {
      service.setTool('delete');
      expect(service.getCurrentTool()).toBe('delete');
    });

    it('should throw error for invalid tool', () => {
      expect(() => {
        service.setTool('invalid' as ToolType);
      }).toThrow(InvalidParameterError);
    });
  });

  describe('tool change handlers', () => {
    it('should register tool change handler', () => {
      const handler = jest.fn();
      const unregister = service.onToolChange(handler);

      service.setTool('paint');

      expect(handler).toHaveBeenCalledWith('paint');
      expect(handler).toHaveBeenCalledTimes(1);

      unregister();
    });

    it('should unregister tool change handler', () => {
      const handler = jest.fn();
      const unregister = service.onToolChange(handler);

      unregister();
      service.setTool('paint');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should notify multiple handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      service.onToolChange(handler1);
      service.onToolChange(handler2);

      service.setTool('select');

      expect(handler1).toHaveBeenCalledWith('select');
      expect(handler2).toHaveBeenCalledWith('select');
    });
  });

  describe('tool information', () => {
    it('should get tool name', () => {
      const name = service.getToolName('draw');
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should get tool description', () => {
      const description = service.getToolDescription('draw');
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('should get tool shortcut', () => {
      const shortcut = service.getToolShortcut('draw');
      // Shortcut may be null or a string
      expect(shortcut === null || typeof shortcut === 'string').toBe(true);
    });
  });

  describe('all tool types', () => {
    const toolTypes: ToolType[] = ['draw', 'paint', 'select', 'slip', 'delete', 'mute', 'slice'];

    it.each(toolTypes)('should switch to %s tool', (toolType) => {
      service.setTool(toolType);
      expect(service.getCurrentTool()).toBe(toolType);
    });

    it.each(toolTypes)('should get name for %s tool', (toolType) => {
      const name = service.getToolName(toolType);
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    it.each(toolTypes)('should get description for %s tool', (toolType) => {
      const description = service.getToolDescription(toolType);
      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(0);
    });
  });
});

