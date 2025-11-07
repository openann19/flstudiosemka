/**
 * ClipboardService unit tests
 * Tests clipboard operations for notes, clips, and patterns
 */

import { clipboardService } from '../../src/services/ClipboardService';
import type { ClipboardNote } from '../../src/services/ClipboardService';
import type { Clip } from '../../src/types/FLStudio.types';
import { InvalidParameterError } from '../../src/utils/errors';

describe('ClipboardService', () => {
  beforeEach(() => {
    clipboardService.clear();
  });

  describe('copyNotes', () => {
    it('should copy notes to clipboard', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
        { start: 1, duration: 1, pitch: 62, velocity: 0.9 },
      ];

      clipboardService.copyNotes(notes);

      expect(clipboardService.hasData('notes')).toBe(true);
      expect(clipboardService.getDataType()).toBe('notes');
    });

    it('should normalize note start times', () => {
      const notes: ClipboardNote[] = [
        { start: 5, duration: 1, pitch: 60, velocity: 0.8 },
        { start: 6, duration: 1, pitch: 62, velocity: 0.9 },
      ];

      clipboardService.copyNotes(notes);
      const pasted = clipboardService.pasteNotes(0);

      expect(pasted).not.toBeNull();
      if (pasted) {
        expect(pasted[0].start).toBe(0);
        expect(pasted[1].start).toBe(1);
      }
    });

    it('should throw error for invalid notes array', () => {
      expect(() => {
        clipboardService.copyNotes(null as unknown as ClipboardNote[]);
      }).toThrow(InvalidParameterError);
    });

    it('should throw error for invalid note structure', () => {
      expect(() => {
        clipboardService.copyNotes([
          { start: NaN, duration: 1, pitch: 60, velocity: 0.8 },
        ] as ClipboardNote[]);
      }).toThrow(InvalidParameterError);
    });
  });

  describe('pasteNotes', () => {
    it('should paste notes at target position', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
      ];

      clipboardService.copyNotes(notes);
      const pasted = clipboardService.pasteNotes(10);

      expect(pasted).not.toBeNull();
      if (pasted) {
        expect(pasted[0].start).toBe(10);
      }
    });

    it('should return null if clipboard is empty', () => {
      const pasted = clipboardService.pasteNotes(0);
      expect(pasted).toBeNull();
    });

    it('should return null if clipboard type is wrong', () => {
      clipboardService.copyClips([
        {
          id: 'clip-1',
          type: 'pattern',
          start: 0,
          length: 4,
          name: 'Test',
        },
      ]);

      const pasted = clipboardService.pasteNotes(0);
      expect(pasted).toBeNull();
    });
  });

  describe('copyClips', () => {
    it('should copy clips to clipboard', () => {
      const clips: Clip[] = [
        {
          id: 'clip-1',
          type: 'pattern',
          start: 0,
          length: 4,
          name: 'Test Clip',
        },
      ];

      clipboardService.copyClips(clips);

      expect(clipboardService.hasData('clips')).toBe(true);
      expect(clipboardService.getDataType()).toBe('clips');
    });

    it('should normalize clip start times', () => {
      const clips: Clip[] = [
        {
          id: 'clip-1',
          type: 'pattern',
          start: 10,
          length: 4,
          name: 'Test',
        },
      ];

      clipboardService.copyClips(clips);
      const pasted = clipboardService.pasteClips(0, () => 'new-id');

      expect(pasted).not.toBeNull();
      if (pasted) {
        expect(pasted[0].start).toBe(0);
      }
    });
  });

  describe('cutNotes', () => {
    it('should copy and return notes for deletion', () => {
      const notes: ClipboardNote[] = [
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
      ];

      const cutNotes = clipboardService.cutNotes(notes);

      expect(clipboardService.hasData('notes')).toBe(true);
      expect(cutNotes).toEqual(notes);
    });
  });

  describe('clear', () => {
    it('should clear clipboard', () => {
      clipboardService.copyNotes([
        { start: 0, duration: 1, pitch: 60, velocity: 0.8 },
      ]);

      clipboardService.clear();

      expect(clipboardService.hasData()).toBe(false);
    });
  });
});


