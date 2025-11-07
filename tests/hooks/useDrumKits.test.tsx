/**
 * Tests for useDrumKits hook
 * @module tests/hooks/useDrumKits
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDrumKits } from '../../src/hooks/useDrumKits';
import { createMockAudioContext } from '../factories/audio-context-factory';

// Mock SamplePackBank
jest.mock('../../src/audio/drums/SamplePackBank', () => {
  return {
    SamplePackBank: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      getCategories: jest.fn().mockReturnValue(['Kicks', 'Snares']),
      getSamplesByCategory: jest.fn().mockReturnValue([
        { name: 'Kick1', buffer: null },
        { name: 'Snare1', buffer: null },
      ]),
      getSample: jest.fn().mockReturnValue(null),
    })),
  };
});

describe('useDrumKits', () => {
  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDrumKits(null, null));

      expect(result.current.samplePackBank).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should auto-initialize when audio context is provided', async () => {
      const mockContext = createMockAudioContext();
      const { result } = renderHook(() => useDrumKits(mockContext, null));

      await waitFor(
        () => {
          expect(result.current.isInitialized || result.current.isLoading).toBe(true);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('manual initialization', () => {
    it('should initialize sample pack bank', async () => {
      const mockContext = createMockAudioContext();
      const { result } = renderHook(() => useDrumKits(mockContext, null));

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.samplePackBank).not.toBeNull();
    });

    it('should not initialize twice', async () => {
      const mockContext = createMockAudioContext();
      const { result } = renderHook(() => useDrumKits(mockContext, null));

      await act(async () => {
        await result.current.initialize();
      });

      const firstBank = result.current.samplePackBank;

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.samplePackBank).toBe(firstBank);
    });

    it('should handle initialization errors', async () => {
      const { SamplePackBank } = require('../../src/audio/drums/SamplePackBank');
      SamplePackBank.mockImplementationOnce(() => ({
        initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
        getCategories: jest.fn().mockReturnValue([]),
        getSamplesByCategory: jest.fn().mockReturnValue([]),
        getSample: jest.fn().mockReturnValue(null),
      }));

      const mockContext = createMockAudioContext();
      const { result } = renderHook(() => useDrumKits(mockContext, null));

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });
  });
});
