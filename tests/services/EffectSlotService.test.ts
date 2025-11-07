/**
 * Tests for EffectSlotService
 * @module tests/services/EffectSlotService
 */

import { EffectSlotService } from '../../src/services/EffectSlotService';
import { InvalidParameterError } from '../../src/utils/errors';

describe('EffectSlotService', () => {
  let service: EffectSlotService;
  const trackId = 1;

  beforeEach(() => {
    service = new EffectSlotService();
  });

  describe('chain initialization', () => {
    it('should initialize chain for track', () => {
      const chain = service.initializeChain(trackId);

      expect(chain).not.toBeNull();
      expect(chain.trackId).toBe(trackId);
      expect(chain.slots).toHaveLength(10);
      expect(chain.bypass).toBe(false);
    });

    it('should return existing chain if already initialized', () => {
      const chain1 = service.initializeChain(trackId);
      const chain2 = service.initializeChain(trackId);

      expect(chain1).toBe(chain2);
    });

    it('should throw InvalidParameterError for invalid trackId', () => {
      expect(() => {
        service.initializeChain(NaN);
      }).toThrow(InvalidParameterError);
    });
  });

  describe('chain retrieval', () => {
    it('should get chain for track', () => {
      service.initializeChain(trackId);
      const chain = service.getChain(trackId);

      expect(chain).not.toBeNull();
      expect(chain?.trackId).toBe(trackId);
    });

    it('should return null for non-existent chain', () => {
      const chain = service.getChain(999);

      expect(chain).toBeNull();
    });
  });

  describe('slot operations', () => {
    beforeEach(() => {
      service.initializeChain(trackId);
    });

    it('should get slot at position', () => {
      const slot = service.getSlot(trackId, 0);

      expect(slot).not.toBeNull();
      expect(slot?.position).toBe(0);
    });

    it('should return null for invalid position', () => {
      const slot = service.getSlot(trackId, 10);

      expect(slot).toBeNull();
    });

    it('should return null for negative position', () => {
      const slot = service.getSlot(trackId, -1);

      expect(slot).toBeNull();
    });
  });

  describe('adding effects', () => {
    const mockEffect = {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    beforeEach(() => {
      service.initializeChain(trackId);
    });

    it('should add effect to empty slot', () => {
      const result = service.addEffect(trackId, 0, mockEffect as any, { time: 0.5 });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      const slot = service.getSlot(trackId, 0);
      expect(slot?.effectInstance).toBe(mockEffect);
      expect(slot?.effectType).toBeDefined();
    });

    it('should fail when adding to occupied slot', () => {
      service.addEffect(trackId, 0, mockEffect as any);
      const result = service.addEffect(trackId, 0, mockEffect as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for invalid position', () => {
      const result = service.addEffect(trackId, 10, mockEffect as any);

      expect(result.success).toBe(false);
    });

    it('should store effect parameters', () => {
      const parameters = { time: 0.5, feedback: 0.3 };
      service.addEffect(trackId, 0, mockEffect as any, parameters);

      const slot = service.getSlot(trackId, 0);
      expect(slot?.parameters).toEqual(parameters);
    });
  });

  describe('removing effects', () => {
    const mockEffect = {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    beforeEach(() => {
      service.initializeChain(trackId);
      service.addEffect(trackId, 0, mockEffect as any);
    });

    it('should remove effect from slot', () => {
      const result = service.removeEffect(trackId, 0);

      expect(result.success).toBe(true);

      const slot = service.getSlot(trackId, 0);
      expect(slot?.effectInstance).toBeNull();
    });

    it('should fail when removing from empty slot', () => {
      service.removeEffect(trackId, 0);
      const result = service.removeEffect(trackId, 0);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should disconnect effect when removing', () => {
      service.removeEffect(trackId, 0);

      expect(mockEffect.disconnect).toHaveBeenCalled();
    });
  });

  describe('enabling/disabling effects', () => {
    const mockEffect = {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    beforeEach(() => {
      service.initializeChain(trackId);
      service.addEffect(trackId, 0, mockEffect as any);
    });

    it('should enable effect', () => {
      const result = service.setEffectEnabled(trackId, 0, true);

      expect(result.success).toBe(true);

      const slot = service.getSlot(trackId, 0);
      expect(slot?.enabled).toBe(true);
    });

    it('should disable effect', () => {
      service.setEffectEnabled(trackId, 0, true);
      const result = service.setEffectEnabled(trackId, 0, false);

      expect(result.success).toBe(true);

      const slot = service.getSlot(trackId, 0);
      expect(slot?.enabled).toBe(false);
    });

    it('should fail for empty slot', () => {
      service.removeEffect(trackId, 0);
      const result = service.setEffectEnabled(trackId, 0, true);

      expect(result.success).toBe(false);
    });
  });

  describe('updating effect parameters', () => {
    const mockEffect = {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    beforeEach(() => {
      service.initializeChain(trackId);
      service.addEffect(trackId, 0, mockEffect as any, { time: 0.5 });
    });

    it('should update effect parameters', () => {
      const result = service.updateEffectParameters(trackId, 0, { time: 0.75, feedback: 0.4 });

      expect(result.success).toBe(true);

      const slot = service.getSlot(trackId, 0);
      expect(slot?.parameters.time).toBe(0.75);
      expect(slot?.parameters.feedback).toBe(0.4);
    });

    it('should merge with existing parameters', () => {
      service.updateEffectParameters(trackId, 0, { feedback: 0.5 });

      const slot = service.getSlot(trackId, 0);
      expect(slot?.parameters.time).toBe(0.5); // Original value preserved
      expect(slot?.parameters.feedback).toBe(0.5); // New value set
    });

    it('should fail for empty slot', () => {
      service.removeEffect(trackId, 0);
      const result = service.updateEffectParameters(trackId, 0, { time: 0.5 });

      expect(result.success).toBe(false);
    });
  });

  describe('reordering effects', () => {
    const mockEffect1 = { connect: jest.fn(), disconnect: jest.fn() };
    const mockEffect2 = { connect: jest.fn(), disconnect: jest.fn() };

    beforeEach(() => {
      service.initializeChain(trackId);
      service.addEffect(trackId, 0, mockEffect1 as any);
      service.addEffect(trackId, 1, mockEffect2 as any);
    });

    it('should reorder effects', () => {
      const result = service.reorderEffect(trackId, 0, 2);

      expect(result.success).toBe(true);

      const slot0 = service.getSlot(trackId, 0);
      const slot2 = service.getSlot(trackId, 2);

      expect(slot0?.effectInstance).toBeNull();
      expect(slot2?.effectInstance).toBe(mockEffect1);
    });

    it('should fail when reordering from empty slot', () => {
      service.removeEffect(trackId, 0);
      const result = service.reorderEffect(trackId, 0, 2);

      expect(result.success).toBe(false);
    });

    it('should fail when reordering to occupied slot', () => {
      const result = service.reorderEffect(trackId, 0, 1);

      expect(result.success).toBe(false);
    });
  });

  describe('chain bypass', () => {
    beforeEach(() => {
      service.initializeChain(trackId);
    });

    it('should set chain bypass', () => {
      service.setChainBypass(trackId, true);

      const chain = service.getChain(trackId);
      expect(chain?.bypass).toBe(true);
    });

    it('should unset chain bypass', () => {
      service.setChainBypass(trackId, true);
      service.setChainBypass(trackId, false);

      const chain = service.getChain(trackId);
      expect(chain?.bypass).toBe(false);
    });
  });

  describe('serialization', () => {
    const mockEffect = {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    beforeEach(() => {
      service.initializeChain(trackId);
      service.addEffect(trackId, 0, mockEffect as any, { time: 0.5 });
    });

    it('should serialize chain', () => {
      const serialized = service.serializeChain(trackId);

      expect(serialized).not.toBeNull();
      if (!serialized) {
        return;
      }

      expect(serialized.trackId).toBe(trackId);
      expect(serialized.slots).toBeDefined();
    });

    it('should return null for non-existent chain', () => {
      const serialized = service.serializeChain(999);

      expect(serialized).toBeNull();
    });
  });
});

