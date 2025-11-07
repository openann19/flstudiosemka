/**
 * Tests for ContextMenuService
 * @module tests/services/ContextMenuService
 */

import { ContextMenuService } from '../../src/services/ContextMenuService';
import { createTrack } from '../factories/track-factory';

describe('ContextMenuService', () => {
  let service: ContextMenuService;

  beforeEach(() => {
    service = new ContextMenuService();
  });

  describe('channel rack track menu', () => {
    it('should generate menu for track', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track);

      expect(menu).toBeDefined();
      expect(Array.isArray(menu)).toBe(true);
      expect(menu.length).toBeGreaterThan(0);
    });

    it('should include rename option', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track, {
        onRename: jest.fn(),
      });

      const renameItem = menu.find((item) => item.label === 'Rename');
      expect(renameItem).toBeDefined();
    });

    it('should include delete option', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track, {
        onDelete: jest.fn(),
      });

      const deleteItem = menu.find((item) => item.label === 'Delete');
      expect(deleteItem).toBeDefined();
    });

    it('should include mute option', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track, {
        onMute: jest.fn(),
      });

      const muteItem = menu.find((item) => item.label === 'Mute');
      expect(muteItem).toBeDefined();
    });

    it('should include solo option', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track, {
        onSolo: jest.fn(),
      });

      const soloItem = menu.find((item) => item.label === 'Solo');
      expect(soloItem).toBeDefined();
    });

    it('should include open piano roll option', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track, {
        onOpenPianoRoll: jest.fn(),
      });

      const pianoRollItem = menu.find((item) => item.label === 'Open Piano Roll');
      expect(pianoRollItem).toBeDefined();
    });

    it('should include channel settings option', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track, {
        onChannelSettings: jest.fn(),
      });

      const settingsItem = menu.find((item) => item.label === 'Channel Settings');
      expect(settingsItem).toBeDefined();
    });
  });

  describe('menu item actions', () => {
    it('should call onRename when rename is clicked', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const onRename = jest.fn();
      const menu = service.getChannelRackTrackMenu(track, { onRename });

      const renameItem = menu.find((item) => item.label === 'Rename');
      expect(renameItem).toBeDefined();
      if (renameItem?.action) {
        renameItem.action();
        expect(onRename).toHaveBeenCalled();
      }
    });

    it('should call onDelete when delete is clicked', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const onDelete = jest.fn();
      const menu = service.getChannelRackTrackMenu(track, { onDelete });

      const deleteItem = menu.find((item) => item.label === 'Delete');
      expect(deleteItem).toBeDefined();
      if (deleteItem?.action) {
        deleteItem.action();
        expect(onDelete).toHaveBeenCalled();
      }
    });
  });

  describe('menu structure', () => {
    it('should include separators', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track);

      const hasSeparator = menu.some((item) => item.separator === true);
      expect(hasSeparator).toBe(true);
    });

    it('should include shortcuts in menu items', () => {
      const track = createTrack({ id: 0, name: 'Test Track', type: 'drum' });
      const menu = service.getChannelRackTrackMenu(track, {
        onRename: jest.fn(),
      });

      const renameItem = menu.find((item) => item.label === 'Rename');
      expect(renameItem?.shortcut).toBeDefined();
    });
  });
});

