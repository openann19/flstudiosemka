/**
 * Pattern factory for test data
 * Creates test Pattern objects with sensible defaults
 * @module tests/factories/pattern-factory
 */

import type { Pattern } from '../../src/components/PatternSelector';

/**
 * Pattern color palette (matching PatternSelector)
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
 * Pattern factory options
 */
export interface PatternFactoryOptions {
  id?: number;
  name?: string;
  color?: string;
  steps?: number;
}

/**
 * Create a test pattern with default values
 * @param options - Override default pattern properties
 * @returns Pattern object
 */
export function createPattern(options: PatternFactoryOptions = {}): Pattern {
  const { id = 0, name = `Pattern ${id + 1}`, color, steps = 16 } = options;

  return {
    id,
    name,
    color: color ?? PATTERN_COLORS[id % PATTERN_COLORS.length],
    steps,
  };
}

/**
 * Create multiple patterns
 * @param count - Number of patterns to create
 * @param baseOptions - Base options applied to all patterns
 * @returns Array of Pattern objects
 */
export function createPatterns(
  count: number,
  baseOptions: PatternFactoryOptions = {}
): Pattern[] {
  return Array.from({ length: count }, (_, index) =>
    createPattern({
      ...baseOptions,
      id: baseOptions.id !== undefined ? baseOptions.id + index : index,
      name: baseOptions.name
        ? `${baseOptions.name} ${index + 1}`
        : `Pattern ${index + 1}`,
    })
  );
}

