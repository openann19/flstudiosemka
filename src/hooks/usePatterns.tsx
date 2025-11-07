/**
 * usePatterns - Pattern management hook
 * Handles pattern state, switching, and CRUD operations
 * @module hooks/usePatterns
 */

import { useState, useCallback } from 'react';
import type { Pattern } from '../components/PatternSelector';

/**
 * usePatterns hook props
 */
export interface UsePatternsProps {
  initialPatterns?: Pattern[];
  defaultSteps?: number;
}

/**
 * usePatterns hook return
 */
export interface UsePatternsReturn {
  patterns: Pattern[];
  currentPattern: number;
  setCurrentPattern: (patternId: number) => void;
  createPattern: (name?: string) => Pattern;
  updatePattern: (patternId: number, updates: Partial<Pattern>) => Pattern | null;
  deletePattern: (patternId: number) => boolean;
  duplicatePattern: (patternId: number) => Pattern | null;
  clearPattern: (patternId: number) => boolean;
  getPattern: (patternId: number) => Pattern | null;
}

/**
 * Pattern color palette
 */
const PATTERN_COLORS = [
  '#FF9933',
  '#FF5E57',
  '#00C5FF',
  '#8C5AFF',
  '#FFD166',
  '#6DD400',
  '#F6A6FF',
  '#4CD964',
  '#FF6B9D',
  '#5BC0EB',
];

/**
 * Pattern management hook
 */
export function usePatterns({ initialPatterns, defaultSteps = 16 }: UsePatternsProps = {}): UsePatternsReturn {
  const [patterns, setPatterns] = useState<Pattern[]>(
    initialPatterns || [
      {
        id: 1,
        name: 'Pattern 1',
        color: PATTERN_COLORS[0] ?? '#FF9933',
        steps: defaultSteps,
      },
    ]
  );
  const [currentPattern, setCurrentPatternState] = useState<number>(1);

  /**
   * Get next available pattern ID
   */
  const getNextPatternId = useCallback((): number => {
    let maxId = 0;
    patterns.forEach((p) => {
      if (p.id > maxId) {
        maxId = p.id;
      }
    });
    return maxId + 1;
  }, [patterns]);

  /**
   * Set current pattern
   */
  const setCurrentPattern = useCallback(
    (patternId: number): void => {
      const pattern = patterns.find((p) => p.id === patternId);
      if (pattern) {
        setCurrentPatternState(patternId);
      }
    },
    [patterns]
  );

  /**
   * Create new pattern
   */
  const createPattern = useCallback(
    (name?: string): Pattern => {
      let newPattern: Pattern | null = null;
      setPatterns((prev) => {
        // Calculate next ID from previous state
        let maxId = 0;
        prev.forEach((p) => {
          if (p.id > maxId) {
            maxId = p.id;
          }
        });
        const newId = maxId + 1;
        
        newPattern = {
          id: newId,
          name: name || `Pattern ${newId}`,
          color: PATTERN_COLORS[(newId - 1) % PATTERN_COLORS.length] ?? '#FF9933',
          steps: defaultSteps,
        };

        return [...prev, newPattern];
      });
      return newPattern!;
    },
    [defaultSteps]
  );

  /**
   * Update pattern
   */
  const updatePattern = useCallback(
    (patternId: number, updates: Partial<Pattern>): Pattern | null => {
      let updatedPattern: Pattern | null = null;
      setPatterns((prev) => {
        const index = prev.findIndex((p) => p.id === patternId);
        if (index === -1) {
          return prev;
        }

        const updated = [...prev];
        const existing = updated[index];
        if (!existing) {
          return prev;
        }
        updatedPattern = { ...existing, ...updates } as Pattern;
        updated[index] = updatedPattern;
        return updated;
      });

      return updatedPattern;
    },
    [patterns]
  );

  /**
   * Delete pattern
   */
  const deletePattern = useCallback(
    (patternId: number): boolean => {
      let deleted = false;
      let newCurrentPattern: number | null = null;
      
      setPatterns((prev) => {
        if (prev.length <= 1) {
          // Cannot delete last pattern
          return prev;
        }

        const remaining = prev.filter((p) => p.id !== patternId);
        deleted = remaining.length < prev.length;
        
        // If deleted pattern was current, switch to first available
        if (deleted && currentPattern === patternId && remaining.length > 0) {
          newCurrentPattern = remaining[0]?.id ?? 1;
        }

        return remaining;
      });

      // Update current pattern after patterns state update
      if (newCurrentPattern !== null) {
        setCurrentPatternState(newCurrentPattern);
      }

      return deleted;
    },
    [currentPattern]
  );

  /**
   * Duplicate pattern
   */
  const duplicatePattern = useCallback(
    (patternId: number): Pattern | null => {
      const pattern = patterns.find((p) => p.id === patternId);
      if (!pattern) {
        return null;
      }

      const newId = getNextPatternId();
      const duplicated: Pattern = {
        ...pattern,
        id: newId,
        name: `${pattern.name} (Copy)`,
        color: PATTERN_COLORS[(newId - 1) % PATTERN_COLORS.length] ?? '#FF9933',
      };

      setPatterns((prev) => [...prev, duplicated]);
      return duplicated;
    },
    [patterns, getNextPatternId]
  );

  /**
   * Clear pattern (reset steps but keep pattern)
   */
  const clearPattern = useCallback(
    (patternId: number): boolean => {
      const pattern = patterns.find((p) => p.id === patternId);
      if (!pattern) {
        return false;
      }

      // Pattern clearing logic would go here
      // For now, just return true
      return true;
    },
    [patterns]
  );

  /**
   * Get pattern by ID
   */
  const getPattern = useCallback(
    (patternId: number): Pattern | null => {
      return patterns.find((p) => p.id === patternId) || null;
    },
    [patterns]
  );

  return {
    patterns,
    currentPattern,
    setCurrentPattern,
    createPattern,
    updatePattern,
    deletePattern,
    duplicatePattern,
    clearPattern,
    getPattern,
  };
}

