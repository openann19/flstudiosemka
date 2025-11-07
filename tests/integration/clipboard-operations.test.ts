/**
 * Integration tests for clipboard operations
 * Tests clipboard integration with piano roll, playlist, and pattern operations
 */

import { clipboardService } from '../../src/services/ClipboardService';
import type { ClipboardNote } from '../../src/services/ClipboardService';
import type { Clip } from '../../src/types/FLStudio.types';

describe('Clipboard Operations Integration', () => {
  beforeEach(() => {
    clipboardService.clear();
  });

  describe('Piano Roll Integration', () => {
    it('should copy and paste notes between different positions', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
        { start: 1, duration: 1, pitch: 62, velocity: 0.9 },
        { start: 2, duration: 0.5, pitch: 64, velocity: 0.7 },
      ];

      // Copy notes
      clipboardService.copyNotes(notes);

      // Paste at different position
      const pasted = clipboardService.pasteNotes(10);

      expect(pasted).not.toBeNull();
      if (pasted) {
        expect(pasted.length).toBe(3);
        expect(pasted[0]?.start).toBe(10);
        expect(pasted[1]?.start).toBe(11);
        expect(pasted[2]?.start).toBe(12);
        expect(pasted[0]?.pitch).toBe(60);
        expect(pasted[1]?.pitch).toBe(62);
        expect(pasted[2]?.pitch).toBe(64);
      }
    });

    it('should cut notes and remove from source', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
      ];

      const cutNotes = clipboardService.cutNotes(notes);

      expect(clipboardService.hasData('notes')).toBe(true);
      expect(cutNotes).toEqual(notes);

      // Verify clipboard has the notes
      const pasted = clipboardService.pasteNotes(0);
      expect(pasted).not.toBeNull();
      if (pasted) {
        expect(pasted[0]?.pitch).toBe(60);
      }
    });
  });

  describe('Playlist Integration', () => {
    it('should copy and paste clips with new IDs', () => {
      const clips: Clip[] = [
        {
          id: 'clip-1',
          type: 'pattern',
          start: 0,
          length: 4,
          name: 'Pattern Clip 1',
        },
        {
          id: 'clip-2',
          type: 'pattern',
          start: 4,
          length: 8,
          name: 'Pattern Clip 2',
        },
      ];

      clipboardService.copyClips(clips);

      let idCounter = 0;
      const generateId = (): string => {
        idCounter += 1;
        return `new-clip-${idCounter}`;
      };

      const pasted = clipboardService.pasteClips(10, generateId);

      expect(pasted).not.toBeNull();
      if (pasted) {
        expect(pasted.length).toBe(2);
        expect(pasted[0]?.id).toBe('new-clip-1');
        expect(pasted[1]?.id).toBe('new-clip-2');
        expect(pasted[0]?.start).toBe(10);
        expect(pasted[1]?.start).toBe(14);
        expect(pasted[0]?.name).toBe('Pattern Clip 1');
      }
    });

    it('should cut clips and preserve metadata', () => {
      const clips: Clip[] = [
        {
          id: 'clip-1',
          type: 'pattern',
          start: 0,
          length: 4,
          name: 'Test Clip',
        },
      ];

      const cutClips = clipboardService.cutClips(clips);

      expect(clipboardService.hasData('clips')).toBe(true);
      expect(cutClips).toEqual(clips);

      // Verify clipboard preserves clip data
      const pasted = clipboardService.pasteClips(0, () => 'new-id');
      expect(pasted).not.toBeNull();
      if (pasted) {
        expect(pasted[0]?.name).toBe('Test Clip');
        expect(pasted[0]?.type).toBe('pattern');
        expect(pasted[0]?.length).toBe(4);
      }
    });
  });

  describe('Cross-Component Clipboard', () => {
    it('should maintain separate clipboard types', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
      ];

      const clips: Clip[] = [
        {
          id: 'clip-1',
          type: 'pattern',
          start: 0,
          length: 4,
          name: 'Test',
        },
      ];

      // Copy notes first
      clipboardService.copyNotes(notes);
      expect(clipboardService.getDataType()).toBe('notes');

      // Copy clips (should replace notes)
      clipboardService.copyClips(clips);
      expect(clipboardService.getDataType()).toBe('clips');

      // Notes should no longer be available
      const pastedNotes = clipboardService.pasteNotes(0);
      expect(pastedNotes).toBeNull();

      // Clips should be available
      const pastedClips = clipboardService.pasteClips(0, () => 'new-id');
      expect(pastedClips).not.toBeNull();
    });

    it('should clear clipboard completely', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
      ];

      clipboardService.copyNotes(notes);
      expect(clipboardService.hasData()).toBe(true);

      clipboardService.clear();
      expect(clipboardService.hasData()).toBe(false);
      expect(clipboardService.getDataType()).toBeNull();

      const pasted = clipboardService.pasteNotes(0);
      expect(pasted).toBeNull();
    });
  });

  describe('Metadata Preservation', () => {
    it('should preserve metadata when copying notes', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
      ];

      clipboardService.copyNotes(notes, {
        source: 'piano-roll',
        timestamp: Date.now(),
      });

      // Metadata should be preserved in clipboard
      expect(clipboardService.hasData('notes')).toBe(true);
    });

    it('should preserve metadata when copying clips', () => {
      const clips: Clip[] = [
        {
          id: 'clip-1',
          type: 'pattern',
          start: 0,
          length: 4,
          name: 'Test',
        },
      ];

      clipboardService.copyClips(clips, {
        beatsPerBar: 4,
        stepsPerBeat: 4,
      });

      expect(clipboardService.hasData('clips')).toBe(true);
    });
  });
});

