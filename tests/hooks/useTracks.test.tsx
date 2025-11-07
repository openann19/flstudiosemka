/**
 * Tests for useTracks hook
 * @module tests/hooks/useTracks
 */

import { renderHook, act } from '@testing-library/react';
import { useTracks } from '../../src/hooks/useTracks';
import { createTrack, createTracks } from '../factories/track-factory';

describe('useTracks', () => {
  describe('initialization', () => {
    it('should initialize with empty tracks array', () => {
      const { result } = renderHook(() => useTracks());

      expect(result.current.tracks).toEqual([]);
    });

    it('should initialize with provided initial tracks', () => {
      const initialTracks = createTracks(3);
      const { result } = renderHook(() => useTracks(initialTracks));

      expect(result.current.tracks).toHaveLength(3);
      expect(result.current.tracks).toEqual(initialTracks);
    });
  });

  describe('track addition', () => {
    it('should add a new track', () => {
      const { result } = renderHook(() => useTracks());

      act(() => {
        result.current.addTrack('New Track', 'drum');
      });

      expect(result.current.tracks).toHaveLength(1);
      expect(result.current.tracks[0]).toMatchObject({
        name: 'New Track',
        type: 'drum',
        muted: false,
        solo: false,
      });
      expect(result.current.tracks[0].steps).toHaveLength(16);
    });

    it('should assign sequential IDs to tracks', () => {
      const { result } = renderHook(() => useTracks());

      act(() => {
        result.current.addTrack('Track 1', 'drum');
        result.current.addTrack('Track 2', 'synth');
      });

      expect(result.current.tracks[0].id).toBe(0);
      expect(result.current.tracks[1].id).toBe(1);
    });

    it('should assign color based on track type and ID', () => {
      const { result } = renderHook(() => useTracks());

      act(() => {
        result.current.addTrack('Drum Track', 'drum');
        result.current.addTrack('Synth Track', 'synth');
      });

      expect(result.current.tracks[0].color).toBeDefined();
      expect(result.current.tracks[1].color).toBeDefined();
      expect(result.current.tracks[0].color).not.toBe(result.current.tracks[1].color);
    });

    it('should create basic pattern for kick drum', () => {
      const { result } = renderHook(() => useTracks());

      act(() => {
        result.current.addTrack('Kick', 'drum');
      });

      const track = result.current.tracks[0];
      expect(track.steps[0]).toBe(true);
      expect(track.steps[8]).toBe(true);
    });

    it('should create basic pattern for snare drum', () => {
      const { result } = renderHook(() => useTracks());

      act(() => {
        result.current.addTrack('Snare', 'drum');
      });

      const track = result.current.tracks[0];
      expect(track.steps[4]).toBe(true);
      expect(track.steps[12]).toBe(true);
    });
  });

  describe('track deletion', () => {
    it('should delete a track', () => {
      const initialTracks = createTracks(3);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.deleteTrack(1);
      });

      expect(result.current.tracks).toHaveLength(2);
      // After deletion and reindexing, tracks should have sequential IDs starting from 0
      expect(result.current.tracks[0].id).toBe(0);
      expect(result.current.tracks[1].id).toBe(1);
      // Verify the original track with ID 1 (before deletion) is gone by checking names
      // The deleted track was "Track 1", so it should not exist
      const deletedTrackName = initialTracks.find((t) => t.id === 1)?.name;
      expect(result.current.tracks.find((t) => t.name === deletedTrackName)).toBeUndefined();
    });

    it('should not delete the last track', () => {
      const initialTracks = createTracks(1);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.deleteTrack(0);
      });

      expect(result.current.tracks).toHaveLength(1);
    });

    it('should reindex tracks after deletion', () => {
      const initialTracks = createTracks(3);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.deleteTrack(1);
      });

      expect(result.current.tracks[0].id).toBe(0);
      expect(result.current.tracks[1].id).toBe(1);
    });
  });

  describe('step toggling', () => {
    it('should toggle a step on', () => {
      const initialTracks = createTracks(1);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.toggleStep(0, 5);
      });

      expect(result.current.tracks[0].steps[5]).toBe(true);
    });

    it('should toggle a step off', () => {
      const track = createTrack({ id: 0, steps: [false, false, true, false] });
      const { result } = renderHook(() => useTracks([track]));

      act(() => {
        result.current.toggleStep(0, 2);
      });

      expect(result.current.tracks[0].steps[2]).toBe(false);
    });

    it('should not affect other tracks when toggling', () => {
      const initialTracks = createTracks(2);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.toggleStep(0, 5);
      });

      expect(result.current.tracks[0].steps[5]).toBe(true);
      expect(result.current.tracks[1].steps[5]).toBe(false);
    });
  });

  describe('mute/solo', () => {
    it('should toggle mute', () => {
      const initialTracks = createTracks(1);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.toggleMute(0);
      });

      expect(result.current.tracks[0].muted).toBe(true);

      act(() => {
        result.current.toggleMute(0);
      });

      expect(result.current.tracks[0].muted).toBe(false);
    });

    it('should toggle solo', () => {
      const initialTracks = createTracks(1);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.toggleSolo(0);
      });

      expect(result.current.tracks[0].solo).toBe(true);

      act(() => {
        result.current.toggleSolo(0);
      });

      expect(result.current.tracks[0].solo).toBe(false);
    });
  });

  describe('track duplication', () => {
    it('should duplicate a track', () => {
      const initialTracks = createTracks(1);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.duplicateTrack(0);
      });

      expect(result.current.tracks).toHaveLength(2);
      expect(result.current.tracks[1].name).toContain('(Copy)');
      expect(result.current.tracks[1].id).toBe(1);
    });

    it('should not duplicate non-existent track', () => {
      const initialTracks = createTracks(1);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.duplicateTrack(999);
      });

      expect(result.current.tracks).toHaveLength(1);
    });
  });

  describe('pattern clearing', () => {
    it('should clear all steps in a track', () => {
      const track = createTrackWithPattern([0, 4, 8, 12], { id: 0 });
      const { result } = renderHook(() => useTracks([track]));

      act(() => {
        result.current.clearPattern(0);
      });

      expect(result.current.tracks[0].steps.every((step) => step === false)).toBe(true);
    });
  });

  describe('AI pattern generation', () => {
    it('should generate pattern for kick drum', () => {
      const track = createTrack({ id: 0, name: 'Kick', type: 'drum' });
      const { result } = renderHook(() => useTracks([track]));

      act(() => {
        result.current.generateAIPattern(0);
      });

      const steps = result.current.tracks[0].steps;
      expect(steps[0]).toBe(true);
      expect(steps[8]).toBe(true);
    });

    it('should generate pattern for snare drum', () => {
      const track = createTrack({ id: 0, name: 'Snare', type: 'drum' });
      const { result } = renderHook(() => useTracks([track]));

      act(() => {
        result.current.generateAIPattern(0);
      });

      const steps = result.current.tracks[0].steps;
      expect(steps[4]).toBe(true);
      expect(steps[12]).toBe(true);
    });
  });

  describe('track name updates', () => {
    it('should update track name', () => {
      const initialTracks = createTracks(1);
      const { result } = renderHook(() => useTracks(initialTracks));

      act(() => {
        result.current.updateTrackName(0, 'Updated Name');
      });

      expect(result.current.tracks[0].name).toBe('Updated Name');
    });
  });

  describe('track color', () => {
    it('should return color for track type and ID', () => {
      const { result } = renderHook(() => useTracks());

      const color1 = result.current.getTrackColor('drum', 0);
      const color2 = result.current.getTrackColor('drum', 1);
      const color3 = result.current.getTrackColor('synth', 0);

      expect(color1).toBeDefined();
      expect(color2).toBeDefined();
      expect(color3).toBeDefined();
    });
  });
});

// Helper function for creating track with pattern
function createTrackWithPattern(
  enabledSteps: number[],
  options: { id?: number; name?: string; type?: 'drum' | 'synth' | 'sample' | 'effect' | 'plugin' } = {}
): ReturnType<typeof createTrack> {
  const steps = new Array(16).fill(false);
  enabledSteps.forEach((step) => {
    if (step >= 0 && step < 16) {
      steps[step] = true;
    }
  });
  return createTrack({ ...options, steps });
}

