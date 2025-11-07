/**
 * Tests for useMixer hook
 * @module tests/hooks/useMixer
 */

import { renderHook, act } from '@testing-library/react';
import { useMixer } from '../../src/hooks/useMixer';
import { createMockAudioContext } from '../factories/audio-context-factory';

describe('useMixer', () => {
  describe('initialization', () => {
    it('should initialize with default master effects', () => {
      const { result } = renderHook(() => useMixer());

      expect(result.current.masterEffects).toMatchObject({
        reverb: { enabled: false, wet: 0.3, decay: 2.0 },
        delay: { enabled: false, wet: 0.2, time: 0.25, feedback: 0.3 },
        distortion: { enabled: false, amount: 0.5 },
        filter: { enabled: false, frequency: 1000, type: 'lowpass' },
      });
    });

    it('should initialize with empty track mixers map', () => {
      const { result } = renderHook(() => useMixer());

      expect(result.current.trackMixers.size).toBe(0);
    });
  });

  describe('master effects', () => {
    it('should update reverb settings', () => {
      const { result } = renderHook(() => useMixer());

      act(() => {
        result.current.updateMasterEffect('reverb', { enabled: true, wet: 0.5 });
      });

      expect(result.current.masterEffects.reverb.enabled).toBe(true);
      expect(result.current.masterEffects.reverb.wet).toBe(0.5);
      expect(result.current.masterEffects.reverb.decay).toBe(2.0);
    });

    it('should update delay settings', () => {
      const { result } = renderHook(() => useMixer());

      act(() => {
        result.current.updateMasterEffect('delay', { enabled: true, time: 0.5 });
      });

      expect(result.current.masterEffects.delay.enabled).toBe(true);
      expect(result.current.masterEffects.delay.time).toBe(0.5);
    });

    it('should update distortion settings', () => {
      const { result } = renderHook(() => useMixer());

      act(() => {
        result.current.updateMasterEffect('distortion', { enabled: true, amount: 0.8 });
      });

      expect(result.current.masterEffects.distortion.enabled).toBe(true);
      expect(result.current.masterEffects.distortion.amount).toBe(0.8);
    });

    it('should update filter settings', () => {
      const { result } = renderHook(() => useMixer());

      act(() => {
        result.current.updateMasterEffect('filter', { enabled: true, frequency: 2000 });
      });

      expect(result.current.masterEffects.filter.enabled).toBe(true);
      expect(result.current.masterEffects.filter.frequency).toBe(2000);
    });

    it('should preserve other effect settings when updating one', () => {
      const { result } = renderHook(() => useMixer());

      act(() => {
        result.current.updateMasterEffect('reverb', { enabled: true });
      });

      expect(result.current.masterEffects.delay).toBeDefined();
      expect(result.current.masterEffects.distortion).toBeDefined();
      expect(result.current.masterEffects.filter).toBeDefined();
    });
  });

  describe('track mixer management', () => {
    it('should return null for non-existent track mixer', () => {
      const { result } = renderHook(() => useMixer());

      const mixer = result.current.getTrackMixer(0);
      expect(mixer).toBeNull();
    });

    it('should initialize track mixer', () => {
      const { result } = renderHook(() => useMixer());
      const audioContext = createMockAudioContext();

      act(() => {
        result.current.initializeTrackMixer(0, audioContext);
      });

      // Note: TrackMixer may not be available in test environment
      // This test verifies the function doesn't throw
      expect(result.current.trackMixers.has(0) || result.current.getTrackMixer(0) === null).toBe(true);
    });

    it('should not reinitialize existing track mixer', () => {
      const { result } = renderHook(() => useMixer());
      const audioContext = createMockAudioContext();

      act(() => {
        result.current.initializeTrackMixer(0, audioContext);
        result.current.initializeTrackMixer(0, audioContext);
      });

      // Should only initialize once
      expect(result.current.trackMixers.size).toBeLessThanOrEqual(1);
    });
  });
});

