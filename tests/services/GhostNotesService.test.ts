/**
 * Tests for GhostNotesService
 * @module tests/services/GhostNotesService
 */

import { GhostNotesService } from '../../src/services/GhostNotesService';
import type { GhostNote } from '../../src/services/GhostNotesService';

describe('GhostNotesService', () => {
  let service: GhostNotesService;

  beforeEach(() => {
    service = new GhostNotesService();
  });

  describe('initialization', () => {
    it('should create service with default state', () => {
      expect(service.isEnabled()).toBe(true);
      expect(service.getOpacity()).toBe(0.3);
    });
  });

  describe('ghost notes management', () => {
    it('should set ghost notes for channel', () => {
      const notes: GhostNote[] = [
        {
          start: 0,
          duration: 1,
          pitch: 60,
          velocity: 80,
          channelId: 'channel-1',
          channelName: 'Channel 1',
        },
      ];

      service.setGhostNotes('channel-1', notes);
      const retrieved = service.getGhostNotes('channel-1');

      expect(retrieved).toEqual(notes);
    });

    it('should get all ghost notes excluding channel', () => {
      const notes1: GhostNote[] = [
        {
          start: 0,
          duration: 1,
          pitch: 60,
          velocity: 80,
          channelId: 'channel-1',
          channelName: 'Channel 1',
        },
      ];
      const notes2: GhostNote[] = [
        {
          start: 1,
          duration: 1,
          pitch: 62,
          velocity: 80,
          channelId: 'channel-2',
          channelName: 'Channel 2',
        },
      ];

      service.setGhostNotes('channel-1', notes1);
      service.setGhostNotes('channel-2', notes2);

      const allNotes = service.getAllGhostNotes('channel-1');
      expect(allNotes.length).toBeGreaterThan(0);
      expect(allNotes.every((n) => n.channelId !== 'channel-1')).toBe(true);
    });

    it('should clear ghost notes for channel', () => {
      const notes: GhostNote[] = [
        {
          start: 0,
          duration: 1,
          pitch: 60,
          velocity: 80,
          channelId: 'channel-1',
          channelName: 'Channel 1',
        },
      ];

      service.setGhostNotes('channel-1', notes);
      service.clearGhostNotes('channel-1');

      const retrieved = service.getGhostNotes('channel-1');
      expect(retrieved).toEqual([]);
    });
  });

  describe('enable/disable', () => {
    it('should enable/disable ghost notes', () => {
      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('opacity', () => {
    it('should set opacity', () => {
      service.setOpacity(0.5);
      expect(service.getOpacity()).toBe(0.5);
    });

    it('should clamp opacity values', () => {
      service.setOpacity(-1);
      expect(service.getOpacity()).toBeGreaterThanOrEqual(0);

      service.setOpacity(2);
      expect(service.getOpacity()).toBeLessThanOrEqual(1);
    });
  });
});

