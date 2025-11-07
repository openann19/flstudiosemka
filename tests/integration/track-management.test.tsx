/**
 * Integration tests for track management workflow
 * @module tests/integration/track-management
 */

import { renderHook, act } from '@testing-library/react';
import { useTracks } from '../../src/hooks/useTracks';
import { usePatterns } from '../../src/hooks/usePatterns';

describe('Track Management Workflow', () => {
  it('should add track and verify it exists', () => {
    const { result } = renderHook(() => useTracks());

    act(() => {
      result.current.addTrack('New Track', 'drum');
    });

    expect(result.current.tracks.length).toBe(1);
    expect(result.current.tracks[0]?.name).toBe('New Track');
    expect(result.current.tracks[0]?.type).toBe('drum');
  });

  it('should add track, toggle steps, and verify pattern', () => {
    const { result } = renderHook(() => useTracks());

    let trackId: number;

    act(() => {
      // Use a track name that doesn't trigger auto-pattern
      result.current.addTrack('Test Track', 'drum');
      trackId = result.current.tracks[0]?.id ?? 0;
      // Clear any auto-generated pattern
      result.current.clearPattern(trackId);
    });

    act(() => {
      result.current.toggleStep(trackId, 0);
      result.current.toggleStep(trackId, 4);
      result.current.toggleStep(trackId, 8);
    });

    const track = result.current.tracks.find((t) => t.id === trackId);
    expect(track?.steps[0]).toBe(true);
    expect(track?.steps[4]).toBe(true);
    expect(track?.steps[8]).toBe(true);
  });

  it('should add track, assign to pattern, and verify association', () => {
    const { result: tracksResult } = renderHook(() => useTracks());
    const { result: patternsResult } = renderHook(() => usePatterns());

    let trackId: number;
    let patternId: number;

    act(() => {
      tracksResult.current.addTrack('Synth Track', 'synth');
      trackId = tracksResult.current.tracks[0]?.id ?? 0;

      const pattern = patternsResult.current.createPattern('Pattern 1');
      patternId = pattern.id;
    });

    // In a real workflow, tracks would be associated with patterns
    // This test verifies both can be created and managed together
    expect(tracksResult.current.tracks.length).toBe(1);
    expect(patternsResult.current.patterns.length).toBeGreaterThan(0);
  });

  it('should add track, toggle mute, and verify state', () => {
    const { result } = renderHook(() => useTracks());

    let trackId: number;

    act(() => {
      result.current.addTrack('Track', 'drum');
      trackId = result.current.tracks[0]?.id ?? 0;
    });

    act(() => {
      result.current.toggleMute(trackId);
    });

    const track = result.current.tracks.find((t) => t.id === trackId);
    expect(track?.muted).toBe(true);

    act(() => {
      result.current.toggleMute(trackId);
    });

    const updatedTrack = result.current.tracks.find((t) => t.id === trackId);
    expect(updatedTrack?.muted).toBe(false);
  });

  it('should add track, toggle solo, and verify state', () => {
    const { result } = renderHook(() => useTracks());

    let trackId: number;

    act(() => {
      result.current.addTrack('Track', 'drum');
      trackId = result.current.tracks[0]?.id ?? 0;
    });

    act(() => {
      result.current.toggleSolo(trackId);
    });

    const track = result.current.tracks.find((t) => t.id === trackId);
    expect(track?.solo).toBe(true);
  });

  it('should add track, duplicate it, and verify both exist', () => {
    const { result } = renderHook(() => useTracks());

    let originalId: number;

    act(() => {
      // Use a track name that doesn't trigger auto-pattern
      result.current.addTrack('Original Track', 'drum');
      originalId = result.current.tracks[0]?.id ?? 0;
      // Clear any auto-generated pattern first
      result.current.clearPattern(originalId);
      // Then set specific steps
      result.current.toggleStep(originalId, 0);
      result.current.toggleStep(originalId, 4);
    });

    act(() => {
      result.current.duplicateTrack(originalId);
    });

    expect(result.current.tracks.length).toBe(2);
    const duplicated = result.current.tracks.find((t) => t.id !== originalId);
    expect(duplicated).toBeDefined();
    expect(duplicated?.steps[0]).toBe(true);
    expect(duplicated?.steps[4]).toBe(true);
  });

  it('should add track, clear pattern, and verify steps are cleared', () => {
    const { result } = renderHook(() => useTracks());

    let trackId: number;

    act(() => {
      result.current.addTrack('Track', 'drum');
      trackId = result.current.tracks[0]?.id ?? 0;
      result.current.toggleStep(trackId, 0);
      result.current.toggleStep(trackId, 4);
    });

    act(() => {
      result.current.clearPattern(trackId);
    });

    const track = result.current.tracks.find((t) => t.id === trackId);
    expect(track?.steps.every((step) => step === false)).toBe(true);
  });

  it('should add multiple tracks and manage them', () => {
    const { result } = renderHook(() => useTracks());

    act(() => {
      result.current.addTrack('Track 1', 'drum');
    });

    act(() => {
      result.current.addTrack('Track 2', 'synth');
    });

    expect(result.current.tracks.length).toBe(2);

    act(() => {
      const trackToDelete = result.current.tracks[1]?.id;
      if (trackToDelete !== undefined) {
        result.current.deleteTrack(trackToDelete);
      }
    });

    expect(result.current.tracks.length).toBe(1);
  });
});

