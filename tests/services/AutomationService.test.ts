/**
 * AutomationService unit tests
 * Tests automation clip creation and management
 */

import { AutomationService } from '../../src/services/AutomationService';
import type { AutomationTarget } from '../../src/services/AutomationService';

describe('AutomationService', () => {
  let service: AutomationService;

  const createTarget = (overrides: Partial<AutomationTarget> = {}): AutomationTarget => ({
    type: 'parameter',
    id: 'track-1',
    parameter: 'volume',
    name: 'Volume',
    min: 0,
    max: 1,
    defaultValue: 0.5,
    ...overrides,
  });

  beforeEach(() => {
    service = new AutomationService();
  });

  describe('createAutomationClip', () => {
    it('should create automation clip with default points', () => {
      const target = createTarget({
        name: 'Track 1 Volume',
        defaultValue: 0.8,
      });

      const clipId = service.createAutomationClip(target, 4);
      const clip = service.getAutomationClip(clipId);

      expect(clip).toBeDefined();
      expect(clip?.target).toEqual(target);
      expect(clip?.length).toBe(4);
      expect(clip?.points.length).toBeGreaterThan(0);
      expect(clip?.points[0]?.value).toBe(0.8);
    });

    it('should create automation clip and update with custom points', () => {
      const target = createTarget({
        type: 'mixer',
        id: 'track-2',
        parameter: 'pan',
        name: 'Track 2 Pan',
        min: -1,
        max: 1,
        defaultValue: 0,
      });

      const customPoints = [
        { time: 0, value: -1 },
        { time: 2, value: 1 },
        { time: 4, value: 0 },
      ];

      const clipId = service.createAutomationClip(target, 4);
      service.updateAutomationClip(clipId, { points: customPoints });

      const clip = service.getAutomationClip(clipId);
      expect(clip?.points).toEqual(customPoints);
    });

    it('should throw error for invalid target', () => {
      expect(() => {
        service.createAutomationClip(null as unknown as AutomationTarget, 4);
      }).toThrow();
    });

    it('should throw error for invalid length', () => {
      const target = createTarget({ defaultValue: 0.8 });

      expect(() => {
        service.createAutomationClip(target, -1);
      }).toThrow();
    });
  });

  describe('getAutomationClip', () => {
    it('should retrieve automation clip by id', () => {
      const target = createTarget({ defaultValue: 0.8 });

      const clipId = service.createAutomationClip(target, 4);
      const clip = service.getAutomationClip(clipId);

      expect(clip).toBeDefined();
      expect(clip?.id).toBe(clipId);
    });

    it('should return null for non-existent clip', () => {
      const clip = service.getAutomationClip('non-existent');
      expect(clip).toBeUndefined();
    });
  });

  describe('updateAutomationClip', () => {
    it('should update automation clip points', () => {
      const target = createTarget({ defaultValue: 0.8 });

      const clipId = service.createAutomationClip(target, 4);
      const newPoints = [
        { time: 0, value: 0.5 },
        { time: 2, value: 1.0 },
      ];

      service.updateAutomationClip(clipId, { points: newPoints });

      const updated = service.getAutomationClip(clipId);
      expect(updated?.points).toEqual(newPoints);
    });

    it('should ignore updates for non-existent clip', () => {
      expect(() => {
        service.updateAutomationClip('non-existent', { points: [] });
      }).not.toThrow();
    });
  });

  describe('deleteAutomationClip', () => {
    it('should delete automation clip', () => {
      const target = createTarget({ defaultValue: 0.8 });

      const clipId = service.createAutomationClip(target, 4);
      service.deleteAutomationClip(clipId);

      const clip = service.getAutomationClip(clipId);
      expect(clip).toBeUndefined();
    });

    it('should not throw error for non-existent clip', () => {
      expect(() => {
        service.deleteAutomationClip('non-existent');
      }).not.toThrow();
    });
  });

  describe('getAutomationClipsForTarget', () => {
    it('should return all clips for a target', () => {
      const target = createTarget({ defaultValue: 0.8 });

      const clipId1 = service.createAutomationClip(target, 4);
      const clipId2 = service.createAutomationClip(target, 8);

      const clips = service.getAutomationClipsForTarget(target.id);
      expect(clips.length).toBe(2);
      expect(clips.some((clip) => clip.id === clipId1)).toBe(true);
      expect(clips.some((clip) => clip.id === clipId2)).toBe(true);
    });

    it('should return empty array for target with no clips', () => {
      const clips = service.getAutomationClipsForTarget('non-existent');
      expect(clips).toEqual([]);
    });
  });
});

