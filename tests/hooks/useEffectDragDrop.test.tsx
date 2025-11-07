/**
 * Tests for useEffectDragDrop hook
 * @module tests/hooks/useEffectDragDrop
 */

import { renderHook, act } from '@testing-library/react';
import { useEffectDragDrop } from '../../src/hooks/useEffectDragDrop';
import { effectDragDropService } from '../../src/services/EffectDragDropService';
import type { EffectDragData } from '../../src/types/effectSlot.types';

// Mock the service
jest.mock('../../src/services/EffectDragDropService', () => ({
  effectDragDropService: {
    isDragging: jest.fn(() => false),
    getDragData: jest.fn(() => null),
    startDrag: jest.fn(),
    updateDragPosition: jest.fn(),
    setTargetElement: jest.fn(),
    endDrag: jest.fn(() => null),
    getDropTargetInfo: jest.fn(() => null),
    cancelDrag: jest.fn(),
  },
}));

describe('useEffectDragDrop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (effectDragDropService.isDragging as jest.Mock).mockReturnValue(false);
    (effectDragDropService.getDragData as jest.Mock).mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useEffectDragDrop());

      expect(result.current.isDragging).toBe(false);
      expect(result.current.dragData).toBeNull();
    });
  });

  describe('drag operations', () => {
    it('should start drag', () => {
      const { result } = renderHook(() => useEffectDragDrop());
      const dragData: EffectDragData = { type: 'effect-library', effectType: 'reverb' };
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });

      (effectDragDropService.isDragging as jest.Mock).mockReturnValue(true);
      (effectDragDropService.getDragData as jest.Mock).mockReturnValue(dragData);

      act(() => {
        result.current.startDrag(dragData, event);
      });

      expect(effectDragDropService.startDrag).toHaveBeenCalledWith(dragData, 100, 200);
    });

    it('should handle drag movement', () => {
      const { result } = renderHook(() => useEffectDragDrop());
      const event = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });

      (effectDragDropService.isDragging as jest.Mock).mockReturnValue(true);

      act(() => {
        result.current.handleDrag(event);
      });

      expect(effectDragDropService.updateDragPosition).toHaveBeenCalledWith(150, 250);
    });

    it('should handle drag end', () => {
      const { result } = renderHook(() => useEffectDragDrop());
      const dragData: EffectDragData = { type: 'effect-library', effectType: 'reverb' };

      (effectDragDropService.endDrag as jest.Mock).mockReturnValue(dragData);

      act(() => {
        const data = result.current.handleDragEnd();
        expect(data).toBe(dragData);
      });

      expect(effectDragDropService.endDrag).toHaveBeenCalled();
    });

    it('should cancel drag', () => {
      const { result } = renderHook(() => useEffectDragDrop());

      act(() => {
        result.current.cancelDrag();
      });

      expect(effectDragDropService.cancelDrag).toHaveBeenCalled();
    });
  });

  describe('drop operations', () => {
    it('should handle drop', () => {
      const { result } = renderHook(() => useEffectDragDrop());
      const dragData: EffectDragData = { type: 'effect-library', effectType: 'reverb' };
      const onDrop = jest.fn();

      (effectDragDropService.isDragging as jest.Mock).mockReturnValue(true);
      (effectDragDropService.getDropTargetInfo as jest.Mock).mockReturnValue({
        trackId: 1,
        slotIndex: 0,
      });
      (effectDragDropService.endDrag as jest.Mock).mockReturnValue(dragData);

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: document.createElement('div'),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDrop(dropEvent, onDrop);
      });

      expect(dropEvent.preventDefault).toHaveBeenCalled();
      expect(dropEvent.stopPropagation).toHaveBeenCalled();
      expect(onDrop).toHaveBeenCalledWith(dragData, 1, 0);
    });

    it('should not call onDrop if not dragging', () => {
      const { result } = renderHook(() => useEffectDragDrop());
      const onDrop = jest.fn();

      (effectDragDropService.isDragging as jest.Mock).mockReturnValue(false);

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: document.createElement('div'),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDrop(dropEvent, onDrop);
      });

      expect(onDrop).not.toHaveBeenCalled();
    });
  });
});
