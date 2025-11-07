/**
 * Integration tests for pattern creation workflow
 * @module tests/integration/pattern-creation
 */

import { renderHook, act } from '@testing-library/react';
import { usePatterns } from '../../src/hooks/usePatterns';
import { createPatterns } from '../factories/pattern-factory';

describe('Pattern Creation Workflow', () => {
  it('should create a new pattern', () => {
    const { result } = renderHook(() => usePatterns());

    act(() => {
      const pattern = result.current.createPattern('New Pattern');
      expect(pattern).toBeDefined();
      expect(pattern.name).toBe('New Pattern');
    });

    expect(result.current.patterns.length).toBeGreaterThan(0);
  });

  it('should create pattern, edit it, and verify state', () => {
    const { result } = renderHook(() => usePatterns());

    let patternId: number;

    act(() => {
      const pattern = result.current.createPattern('Test Pattern');
      patternId = pattern.id;
    });

    act(() => {
      const updated = result.current.updatePattern(patternId, { name: 'Updated Pattern' });
      expect(updated?.name).toBe('Updated Pattern');
    });

    const pattern = result.current.getPattern(patternId);
    expect(pattern?.name).toBe('Updated Pattern');
  });

  it('should create pattern, duplicate it, and verify both exist', () => {
    const { result } = renderHook(() => usePatterns());

    let originalId: number;

    act(() => {
      const pattern = result.current.createPattern('Original');
      originalId = pattern.id;
    });

    act(() => {
      const duplicated = result.current.duplicatePattern(originalId);
      expect(duplicated).not.toBeNull();
      expect(duplicated?.name).toContain('Copy');
    });

    const original = result.current.getPattern(originalId);
    expect(original).not.toBeNull();

    expect(result.current.patterns.length).toBeGreaterThan(1);
  });

  it('should create pattern, clear it, and verify it is empty', () => {
    const { result } = renderHook(() => usePatterns());

    let patternId: number;

    act(() => {
      const pattern = result.current.createPattern('Pattern to Clear');
      patternId = pattern.id;
    });

    act(() => {
      const cleared = result.current.clearPattern(patternId);
      expect(cleared).toBe(true);
    });

    const pattern = result.current.getPattern(patternId);
    expect(pattern).not.toBeNull();
  });

  it('should create pattern, switch to it, and verify current pattern', () => {
    const { result } = renderHook(() => usePatterns());

    let patternId: number;

    act(() => {
      const pattern = result.current.createPattern('Pattern 1');
      patternId = pattern.id;
    });

    act(() => {
      result.current.setCurrentPattern(patternId);
    });

    expect(result.current.currentPattern).toBe(patternId);
  });

  it('should create multiple patterns and manage them', () => {
    const { result } = renderHook(() => usePatterns());

    const patternIds: number[] = [];

    act(() => {
      for (let i = 0; i < 5; i++) {
        const pattern = result.current.createPattern(`Pattern ${i}`);
        patternIds.push(pattern.id);
      }
    });

    expect(result.current.patterns.length).toBe(5);

    act(() => {
      result.current.deletePattern(patternIds[2] ?? 0);
    });

    expect(result.current.patterns.length).toBe(4);
    expect(result.current.getPattern(patternIds[2] ?? 0)).toBeNull();
  });
});

