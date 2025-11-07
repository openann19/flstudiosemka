/**
 * Tests for useEffectSlots hook
 * @module tests/hooks/useEffectSlots
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useEffectSlots } from '../../src/hooks/useEffectSlots';
import { createMockAudioContext } from '../factories/audio-context-factory';
import { effectSlotService } from '../../src/services/EffectSlotService';
import { effectRegistry } from '../../src/services/EffectRegistry';

// Mock services
jest.mock('../../src/services/EffectSlotService');
jest.mock('../../src/services/EffectRegistry');

describe('useEffectSlots', () => {
  let mockAudioContext: AudioContext;
  const trackId = 1;
  const defaultChain = {
    trackId,
    slots: [],
    bypass: false,
  };

  beforeEach(() => {
    mockAudioContext = createMockAudioContext();
    jest.clearAllMocks();

    // Setup default mocks
    (effectSlotService.getChain as jest.Mock).mockReturnValue(defaultChain);

    (effectSlotService.initializeChain as jest.Mock).mockReturnValue(defaultChain);

    (effectRegistry.getDefaultParameters as jest.Mock).mockReturnValue({});

    (effectRegistry.createEffect as jest.Mock).mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
  });

  describe('initialization', () => {
    it('should initialize chain on mount', async () => {
      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      expect(effectSlotService.getChain).toHaveBeenCalledWith(trackId);
    });

    it('should initialize chain if not exists', async () => {
      const initializedChain = {
        trackId,
        slots: [],
        bypass: false,
      };

      (effectSlotService.getChain as jest.Mock)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(initializedChain);
      (effectSlotService.initializeChain as jest.Mock).mockReturnValue(initializedChain);

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(effectSlotService.initializeChain).toHaveBeenCalledWith(trackId);
      });

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      expect(result.current.chain).toEqual(initializedChain);
    });

    it('should handle initialization errors', async () => {
      (effectSlotService.getChain as jest.Mock).mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toContain('Initialization failed');
    });
  });

  describe('adding effects', () => {
    it('should add effect to slot', async () => {
      (effectSlotService.addEffect as jest.Mock).mockReturnValue({ success: true });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      await act(async () => {
        const added = await result.current.addEffect(0, 'delay', { time: 0.5 });
        expect(added).toBe(true);
      });

      expect(effectRegistry.createEffect).toHaveBeenCalled();
      expect(effectSlotService.addEffect).toHaveBeenCalled();
    });

    it('should return false when AudioContext is not available', async () => {
      const { result } = renderHook(() => useEffectSlots(trackId, null));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      await act(async () => {
        const added = await result.current.addEffect(0, 'delay');
        expect(added).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('AudioContext not available');
      });
    });

    it('should handle add effect errors', async () => {
      (effectSlotService.addEffect as jest.Mock).mockReturnValue({
        success: false,
        error: 'Slot already occupied',
      });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      await act(async () => {
        const added = await result.current.addEffect(0, 'delay');
        expect(added).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Slot already occupied');
      });
    });

    it('should merge default and custom parameters', async () => {
      (effectRegistry.getDefaultParameters as jest.Mock).mockReturnValue({
        time: 0.25,
        feedback: 0.3,
      });
      (effectSlotService.addEffect as jest.Mock).mockReturnValue({ success: true });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      await act(async () => {
        await result.current.addEffect(0, 'delay', { time: 0.5 });
      });

      expect(effectRegistry.createEffect).toHaveBeenCalledWith(
        expect.anything(),
        'delay',
        expect.objectContaining({ time: 0.5, feedback: 0.3 })
      );
    });
  });

  describe('removing effects', () => {
    it('should remove effect from slot', async () => {
      (effectSlotService.removeEffect as jest.Mock).mockReturnValue({ success: true });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        const removed = result.current.removeEffect(0);
        expect(removed).toBe(true);
      });

      expect(effectSlotService.removeEffect).toHaveBeenCalledWith(trackId, 0);
    });

    it('should handle remove effect errors', async () => {
      (effectSlotService.removeEffect as jest.Mock).mockReturnValue({
        success: false,
        error: 'Slot is empty',
      });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        const removed = result.current.removeEffect(0);
        expect(removed).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Slot is empty');
      });
    });
  });

  describe('enabling/disabling effects', () => {
    it('should enable effect', async () => {
      (effectSlotService.setEffectEnabled as jest.Mock).mockReturnValue({ success: true });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        const enabled = result.current.setEffectEnabled(0, true);
        expect(enabled).toBe(true);
      });

      expect(effectSlotService.setEffectEnabled).toHaveBeenCalledWith(trackId, 0, true);
    });

    it('should disable effect', async () => {
      (effectSlotService.setEffectEnabled as jest.Mock).mockReturnValue({ success: true });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        const disabled = result.current.setEffectEnabled(0, false);
        expect(disabled).toBe(true);
      });

      expect(effectSlotService.setEffectEnabled).toHaveBeenCalledWith(trackId, 0, false);
    });
  });

  describe('updating effect parameters', () => {
    it('should update effect parameters', async () => {
      (effectSlotService.updateEffectParameters as jest.Mock).mockReturnValue({ success: true });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        const updated = result.current.updateEffectParameters(0, { time: 0.75, feedback: 0.5 });
        expect(updated).toBe(true);
      });

      expect(effectSlotService.updateEffectParameters).toHaveBeenCalledWith(trackId, 0, {
        time: 0.75,
        feedback: 0.5,
      });
    });
  });

  describe('reordering effects', () => {
    it('should reorder effect', async () => {
      (effectSlotService.reorderEffect as jest.Mock).mockReturnValue({ success: true });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        const reordered = result.current.reorderEffect(0, 1);
        expect(reordered).toBe(true);
      });

      expect(effectSlotService.reorderEffect).toHaveBeenCalledWith(trackId, 0, 1);
    });
  });

  describe('chain bypass', () => {
    it('should set chain bypass', async () => {
      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        result.current.setChainBypass(true);
      });

      expect(effectSlotService.setChainBypass).toHaveBeenCalledWith(trackId, true);
    });
  });

  describe('refresh', () => {
    it('should refresh chain state', async () => {
      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.chain).not.toBeNull();
      });

      act(() => {
        result.current.refresh();
      });

      expect(effectSlotService.getChain).toHaveBeenCalledWith(trackId);
    });
  });

  describe('slots array', () => {
    it('should return slots array from chain', async () => {
      const mockSlots = [
        { position: 0, effect: null, enabled: false },
        { position: 1, effect: null, enabled: false },
      ];

      (effectSlotService.getChain as jest.Mock).mockReturnValue({
        trackId,
        slots: mockSlots,
        bypass: false,
      });

      const { result } = renderHook(() => useEffectSlots(trackId, mockAudioContext));

      await waitFor(() => {
        expect(result.current.slots).toEqual(mockSlots);
      });
    });
  });
});

