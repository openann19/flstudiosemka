/**
 * Tests for usePatterns hook
 * @module tests/hooks/usePatterns
 */

import { renderHook, act } from '@testing-library/react';
import { usePatterns } from '../../src/hooks/usePatterns';
import { createPattern, createPatterns } from '../factories/pattern-factory';

describe('usePatterns', () => {
  describe('initialization', () => {
    it('should initialize with default pattern when no initial patterns provided', () => {
      const { result } = renderHook(() => usePatterns());

      expect(result.current.patterns).toHaveLength(1);
      expect(result.current.patterns[0]).toMatchObject({
        id: 1,
        name: 'Pattern 1',
        steps: 16,
      });
      expect(result.current.currentPattern).toBe(1);
    });

    it('should initialize with provided initial patterns', () => {
      const initialPatterns = createPatterns(3);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      expect(result.current.patterns).toHaveLength(3);
      expect(result.current.patterns).toEqual(initialPatterns);
      expect(result.current.currentPattern).toBe(1);
    });

    it('should use custom default steps', () => {
      const { result } = renderHook(() => usePatterns({ defaultSteps: 32 }));

      expect(result.current.patterns[0].steps).toBe(32);
    });
  });

  describe('pattern creation', () => {
    it('should create a new pattern with default name', () => {
      const { result } = renderHook(() => usePatterns());

      act(() => {
        const newPattern = result.current.createPattern();
        expect(newPattern.name).toBe('Pattern 2');
        expect(newPattern.id).toBe(2);
      });

      expect(result.current.patterns).toHaveLength(2);
    });

    it('should create a new pattern with custom name', () => {
      const { result } = renderHook(() => usePatterns());

      act(() => {
        const newPattern = result.current.createPattern('My Custom Pattern');
        expect(newPattern.name).toBe('My Custom Pattern');
      });

      expect(result.current.patterns).toHaveLength(2);
    });

    it('should assign unique IDs to new patterns', () => {
      const { result } = renderHook(() => usePatterns());

      act(() => {
        result.current.createPattern();
        result.current.createPattern();
      });

      const ids = result.current.patterns.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('pattern switching', () => {
    it('should switch to a different pattern', () => {
      const initialPatterns = createPatterns(3);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        result.current.setCurrentPattern(2);
      });

      expect(result.current.currentPattern).toBe(2);
    });

    it('should not switch to non-existent pattern', () => {
      const initialPatterns = createPatterns(2);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        result.current.setCurrentPattern(999);
      });

      expect(result.current.currentPattern).toBe(1);
    });
  });

  describe('pattern updates', () => {
    it('should update pattern name', () => {
      const initialPatterns = createPatterns(2);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        result.current.updatePattern(1, { name: 'Updated Name' });
      });

      const pattern = result.current.getPattern(1);
      expect(pattern?.name).toBe('Updated Name');
    });

    it('should update pattern color', () => {
      const initialPatterns = createPatterns(2);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        result.current.updatePattern(1, { color: '#FF0000' });
      });

      const pattern = result.current.getPattern(1);
      expect(pattern?.color).toBe('#FF0000');
    });

    it('should return null when updating non-existent pattern', () => {
      const { result } = renderHook(() => usePatterns());

      act(() => {
        const updated = result.current.updatePattern(999, { name: 'Test' });
        expect(updated).toBeNull();
      });
    });
  });

  describe('pattern deletion', () => {
    it('should delete a pattern', () => {
      const initialPatterns = createPatterns(3);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        const deleted = result.current.deletePattern(2);
        expect(deleted).toBe(true);
      });

      expect(result.current.patterns).toHaveLength(2);
      expect(result.current.patterns.find((p) => p.id === 2)).toBeUndefined();
    });

    it('should not delete the last pattern', () => {
      const { result } = renderHook(() => usePatterns());

      act(() => {
        const deleted = result.current.deletePattern(1);
        expect(deleted).toBe(false);
      });

      expect(result.current.patterns).toHaveLength(1);
    });

    it('should switch to first available pattern when current is deleted', () => {
      const initialPatterns = createPatterns(3);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        result.current.setCurrentPattern(2);
        result.current.deletePattern(2);
      });

      expect(result.current.currentPattern).not.toBe(2);
      expect(result.current.patterns.find((p) => p.id === result.current.currentPattern)).toBeDefined();
    });
  });

  describe('pattern duplication', () => {
    it('should duplicate a pattern', () => {
      const initialPatterns = createPatterns(2);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        const duplicated = result.current.duplicatePattern(1);
        expect(duplicated).not.toBeNull();
        expect(duplicated?.name).toContain('(Copy)');
        expect(duplicated?.id).not.toBe(1);
      });

      expect(result.current.patterns).toHaveLength(3);
    });

    it('should return null when duplicating non-existent pattern', () => {
      const { result } = renderHook(() => usePatterns());

      act(() => {
        const duplicated = result.current.duplicatePattern(999);
        expect(duplicated).toBeNull();
      });
    });
  });

  describe('pattern clearing', () => {
    it('should clear a pattern', () => {
      const initialPatterns = createPatterns(2);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      act(() => {
        const cleared = result.current.clearPattern(1);
        expect(cleared).toBe(true);
      });
    });

    it('should return false when clearing non-existent pattern', () => {
      const { result } = renderHook(() => usePatterns());

      act(() => {
        const cleared = result.current.clearPattern(999);
        expect(cleared).toBe(false);
      });
    });
  });

  describe('pattern retrieval', () => {
    it('should get pattern by ID', () => {
      const initialPatterns = createPatterns(3);
      const { result } = renderHook(() => usePatterns({ initialPatterns }));

      const pattern = result.current.getPattern(2);
      expect(pattern).toBeDefined();
      expect(pattern?.id).toBe(2);
    });

    it('should return null for non-existent pattern', () => {
      const { result } = renderHook(() => usePatterns());

      const pattern = result.current.getPattern(999);
      expect(pattern).toBeNull();
    });
  });
});

