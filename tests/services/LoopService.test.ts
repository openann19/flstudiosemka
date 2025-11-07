/**
 * LoopService unit tests
 * Tests loop region management
 */

import { LoopService } from '../../src/services/LoopService';
import { InvalidParameterError } from '../../src/utils/errors';

describe('LoopService', () => {
  let service: LoopService;

  beforeEach(() => {
    service = new LoopService();
  });

  describe('setLoopRegion', () => {
    it('should set loop region', () => {
      service.setLoopRegion(0, 16);
      const region = service.getLoopRegion();

      expect(region).not.toBeNull();
      if (region) {
        expect(region.start).toBe(0);
        expect(region.end).toBe(16);
        expect(region.enabled).toBe(true);
      }
    });

    it('should throw error if start >= end', () => {
      expect(() => {
        service.setLoopRegion(10, 10);
      }).toThrow(InvalidParameterError);

      expect(() => {
        service.setLoopRegion(10, 5);
      }).toThrow(InvalidParameterError);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => {
        service.setLoopRegion(-1, 10);
      }).toThrow(InvalidParameterError);
    });
  });

  describe('enableLoop / disableLoop', () => {
    it('should enable and disable loop', () => {
      service.setLoopRegion(0, 16);
      service.disableLoop();
      expect(service.isLoopEnabled()).toBe(false);

      service.enableLoop();
      expect(service.isLoopEnabled()).toBe(true);
    });
  });

  describe('isInLoopRegion', () => {
    it('should check if position is in loop region', () => {
      service.setLoopRegion(4, 8);

      expect(service.isInLoopRegion(5)).toBe(true);
      expect(service.isInLoopRegion(4)).toBe(true);
      expect(service.isInLoopRegion(8)).toBe(false);
      expect(service.isInLoopRegion(3)).toBe(false);
    });

    it('should return false if loop is disabled', () => {
      service.setLoopRegion(4, 8);
      service.disableLoop();

      expect(service.isInLoopRegion(5)).toBe(false);
    });
  });

  describe('wrapToLoop', () => {
    it('should wrap position to loop start', () => {
      service.setLoopRegion(4, 8);
      service.enableLoop();

      expect(service.wrapToLoop(10)).toBe(4);
      expect(service.wrapToLoop(3)).toBe(4);
      expect(service.wrapToLoop(5)).toBe(5);
    });
  });

  describe('addListener', () => {
    it('should notify listeners on changes', () => {
      const listener = jest.fn();
      const unsubscribe = service.addListener(listener);

      service.setLoopRegion(0, 16);
      expect(listener).toHaveBeenCalled();

      unsubscribe();
      service.setLoopRegion(0, 32);
      // Listener should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});

