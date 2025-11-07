/**
 * ModulationMatrix tests
 * @module audio/synthesizer/__tests__/ModulationMatrix.test
 */

import { ModulationMatrix } from '../core/ModulationMatrix';
import type { ModulationSlot } from '../../../types/synthesizer.types';

describe('ModulationMatrix', () => {
  let matrix: ModulationMatrix;

  beforeEach(() => {
    matrix = new ModulationMatrix();
  });

  test('should create modulation matrix', () => {
    expect(matrix).toBeDefined();
  });

  test('should get all slots', () => {
    const slots = matrix.getSlots();
    expect(slots.length).toBe(16);
  });

  test('should set and get slot', () => {
    const slot: ModulationSlot = {
      enabled: true,
      source: 'lfo1',
      destination: 'osc1Pitch',
      depth: 0.5,
      bipolar: true,
    };
    matrix.setSlot(0, slot);
    const retrieved = matrix.getSlot(0);
    expect(retrieved?.enabled).toBe(true);
    expect(retrieved?.source).toBe('lfo1');
  });

  test('should clear all slots', () => {
    const slot: ModulationSlot = {
      enabled: true,
      source: 'lfo1',
      destination: 'osc1Pitch',
      depth: 0.5,
      bipolar: true,
    };
    matrix.setSlot(0, slot);
    matrix.clearAll();
    const retrieved = matrix.getSlot(0);
    expect(retrieved?.enabled).toBe(false);
  });

  test('should get active slot count', () => {
    const slot: ModulationSlot = {
      enabled: true,
      source: 'lfo1',
      destination: 'osc1Pitch',
      depth: 0.5,
      bipolar: true,
    };
    matrix.setSlot(0, slot);
    expect(matrix.getActiveSlotCount()).toBe(1);
  });
});

