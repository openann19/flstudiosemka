/**
 * Tests for usePlaylist hook
 * @module tests/hooks/usePlaylist
 */

import { renderHook, act } from '@testing-library/react';
import { usePlaylist } from '../../src/hooks/usePlaylist';

describe('usePlaylist', () => {
  const defaultProps = {
    beatsPerBar: 4,
    stepsPerBeat: 4,
    basePixelsPerBeat: 20,
    timelineUtils: null,
  };

  describe('initialization', () => {
    it('should initialize with empty arrangements', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      expect(result.current.arrangements).toEqual([]);
      expect(result.current.currentArrangementId).toBeNull();
    });

    it('should initialize with default tool', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      expect(result.current.selectedTool).toBe('draw');
    });

    it('should initialize with default snap setting', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      expect(result.current.snapSetting).toBe('beat');
    });

    it('should initialize with default zoom level', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      expect(result.current.zoomLevel).toBe(1);
    });
  });

  describe('default arrangement', () => {
    it('should initialize default arrangement', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
      });

      expect(result.current.arrangements.length).toBe(1);
      expect(result.current.currentArrangementId).toBe('arrangement-1');
    });

    it('should not reinitialize if arrangement exists', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
        const initialCount = result.current.arrangements.length;
        result.current.initializeDefaultArrangement();
        expect(result.current.arrangements.length).toBe(initialCount);
      });
    });
  });

  describe('arrangement management', () => {
    it('should set current arrangement', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
        result.current.setCurrentArrangementId('arrangement-1');
      });

      expect(result.current.currentArrangementId).toBe('arrangement-1');
    });

    it('should get current arrangement', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
      });

      const arrangement = result.current.getCurrentArrangement();
      expect(arrangement).toBeDefined();
      expect(arrangement?.id).toBe('arrangement-1');
    });

    it('should return null for non-existent arrangement', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      const arrangement = result.current.getCurrentArrangement();
      expect(arrangement).toBeNull();
    });
  });

  describe('tool management', () => {
    it('should change selected tool', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.setSelectedTool('paint');
      });

      expect(result.current.selectedTool).toBe('paint');
    });
  });

  describe('snap settings', () => {
    it('should change snap setting', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.setSnapSetting('bar');
      });

      expect(result.current.snapSetting).toBe('bar');
    });
  });

  describe('zoom management', () => {
    it('should adjust zoom level', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.adjustZoom(0.5);
      });

      expect(result.current.zoomLevel).toBeGreaterThan(1);
    });

    it('should decrease zoom level', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.adjustZoom(-0.5);
      });

      expect(result.current.zoomLevel).toBeLessThan(1);
    });
  });

  describe('clip management', () => {
    beforeEach(() => {
      // Initialize default arrangement for clip tests
    });

    it('should add clip to track', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
        const clip = result.current.addClipToTrack('track-1', {
          type: 'pattern',
          start: 0,
          length: 4,
          name: 'Test Clip',
        });

        expect(clip).toBeDefined();
        expect(clip?.name).toBe('Test Clip');
      });
    });

    it('should return null when adding clip to non-existent track', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
        const clip = result.current.addClipToTrack('non-existent', {
          type: 'pattern',
          start: 0,
          length: 4,
        });

        expect(clip).toBeNull();
      });
    });

    it('should remove clip', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
        const arrangement = result.current.getCurrentArrangement();
        const clipId = arrangement?.tracks[0]?.clips[0]?.id;

        if (clipId) {
          const removed = result.current.removeClip(clipId);
          expect(removed).toBe(true);
        }
      });
    });

    it('should return false when removing non-existent clip', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        const removed = result.current.removeClip('non-existent');
        expect(removed).toBe(false);
      });
    });

    it('should update clip timing', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
        const arrangement = result.current.getCurrentArrangement();
        const clipId = arrangement?.tracks[0]?.clips[0]?.id;

        if (clipId) {
          const updated = result.current.updateClipTiming(clipId, { start: 8, length: 4 });
          expect(updated).toBeDefined();
          expect(updated?.start).toBe(8);
        }
      });
    });

    it('should duplicate clip', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        result.current.initializeDefaultArrangement();
        const arrangement = result.current.getCurrentArrangement();
        const clipId = arrangement?.tracks[0]?.clips[0]?.id;

        if (clipId) {
          const duplicated = result.current.duplicateClip(clipId, 8);
          expect(duplicated).toBeDefined();
          expect(duplicated?.id).not.toBe(clipId);
        }
      });
    });
  });

  describe('clip ID generation', () => {
    it('should generate unique clip IDs', () => {
      const { result } = renderHook(() => usePlaylist(defaultProps));

      act(() => {
        const id1 = result.current.generateClipId();
        const id2 = result.current.generateClipId();

        expect(id1).not.toBe(id2);
        expect(id1).toContain('clip-');
        expect(id2).toContain('clip-');
      });
    });
  });
});

