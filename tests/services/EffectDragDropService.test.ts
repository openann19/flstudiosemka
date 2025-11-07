/**
 * Tests for EffectDragDropService
 * @module tests/services/EffectDragDropService
 */

import { effectDragDropService } from '../../src/services/EffectDragDropService';
import type { EffectDragData } from '../../src/types/effectSlot.types';

describe('EffectDragDropService', () => {
  beforeEach(() => {
    effectDragDropService.cancelDrag();
  });

  describe('drag operations', () => {
    it('should start drag', () => {
      const dragData: EffectDragData = {
        type: 'effect-library',
        effectType: 'reverb',
      };

      effectDragDropService.startDrag(dragData, 100, 200);

      expect(effectDragDropService.isDragging()).toBe(true);
      expect(effectDragDropService.getDragData()).toEqual(dragData);
    });

    it('should update drag position', () => {
      const dragData: EffectDragData = {
        type: 'effect-library',
        effectType: 'reverb',
      };

      effectDragDropService.startDrag(dragData, 100, 200);
      effectDragDropService.updateDragPosition(150, 250);

      expect(effectDragDropService.isDragging()).toBe(true);
    });

    it('should end drag', () => {
      const dragData: EffectDragData = {
        type: 'effect-library',
        effectType: 'reverb',
      };

      effectDragDropService.startDrag(dragData, 100, 200);
      const result = effectDragDropService.endDrag();

      expect(effectDragDropService.isDragging()).toBe(false);
      expect(result).toEqual(dragData);
    });

    it('should cancel drag', () => {
      const dragData: EffectDragData = {
        type: 'effect-library',
        effectType: 'reverb',
      };

      effectDragDropService.startDrag(dragData, 100, 200);
      effectDragDropService.cancelDrag();

      expect(effectDragDropService.isDragging()).toBe(false);
      expect(effectDragDropService.getDragData()).toBeNull();
    });
  });

  describe('drop validation', () => {
    it('should validate drop target', () => {
      const dragData: EffectDragData = {
        type: 'effect-library',
        effectType: 'reverb',
      };
      const element = document.createElement('div');
      element.dataset.trackId = '1';
      element.dataset.slotIndex = '0';

      effectDragDropService.startDrag(dragData, 100, 200);
      const isValid = effectDragDropService.validateDropTarget(element);

      expect(typeof isValid).toBe('boolean');
    });
  });
});

