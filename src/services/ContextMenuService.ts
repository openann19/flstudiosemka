/**
 * ContextMenuService - Context-aware menu service
 * Provides context-specific menu items for different panels
 * @module services/ContextMenuService
 */

import type { ContextMenuItem } from '../ui/ContextMenu';
import type { Track } from '../types/FLStudio.types';

/**
 * Context menu service for generating context-aware menus
 */
export class ContextMenuService {
  /**
   * Get context menu items for Channel Rack track
   * @param track - Track data
   * @param options - Additional options
   * @returns Menu items
   */
  getChannelRackTrackMenu(
    track: Track,
    options: {
      onRename?: () => void;
      onDelete?: () => void;
      onDuplicate?: () => void;
      onMute?: () => void;
      onSolo?: () => void;
      onOpenPianoRoll?: () => void;
      onChannelSettings?: () => void;
    } = {}
  ): ContextMenuItem[] {
    return [
      {
        label: 'Rename',
        action: options.onRename,
        shortcut: 'F2',
      },
      {
        label: 'Open Piano Roll',
        action: options.onOpenPianoRoll,
        shortcut: 'F7',
      },
      {
        separator: true,
      },
      {
        label: 'Mute',
        action: options.onMute,
        shortcut: 'M',
      },
      {
        label: 'Solo',
        action: options.onSolo,
        shortcut: 'S',
      },
      {
        separator: true,
      },
      {
        label: 'Duplicate',
        action: options.onDuplicate,
        shortcut: 'Ctrl+D',
      },
      {
        label: 'Channel Settings',
        action: options.onChannelSettings,
      },
      {
        separator: true,
      },
      {
        label: 'Delete',
        action: options.onDelete,
        shortcut: 'Del',
      },
    ];
  }

  /**
   * Get context menu items for Piano Roll
   * @param options - Menu options
   * @returns Menu items
   */
  getPianoRollMenu(options: {
    onQuantize?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onCut?: () => void;
    onDelete?: () => void;
    onSelectAll?: () => void;
    onVelocity?: () => void;
  } = {}): ContextMenuItem[] {
    return [
      {
        label: 'Cut',
        action: options.onCut,
        shortcut: 'Ctrl+X',
      },
      {
        label: 'Copy',
        action: options.onCopy,
        shortcut: 'Ctrl+C',
      },
      {
        label: 'Paste',
        action: options.onPaste,
        shortcut: 'Ctrl+V',
      },
      {
        separator: true,
      },
      {
        label: 'Delete',
        action: options.onDelete,
        shortcut: 'Del',
      },
      {
        label: 'Select All',
        action: options.onSelectAll,
        shortcut: 'Ctrl+A',
      },
      {
        separator: true,
      },
      {
        label: 'Quantize',
        action: options.onQuantize,
        shortcut: 'Ctrl+Q',
      },
      {
        label: 'Edit Velocity',
        action: options.onVelocity,
      },
    ];
  }

  /**
   * Get context menu items for Playlist clip
   * @param options - Menu options
   * @returns Menu items
   */
  getPlaylistClipMenu(options: {
    onCut?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onMute?: () => void;
    onCreateAutomation?: () => void;
  } = {}): ContextMenuItem[] {
    return [
      {
        label: 'Cut',
        action: options.onCut,
        shortcut: 'Ctrl+X',
      },
      {
        label: 'Copy',
        action: options.onCopy,
        shortcut: 'Ctrl+C',
      },
      {
        label: 'Paste',
        action: options.onPaste,
        shortcut: 'Ctrl+V',
      },
      {
        separator: true,
      },
      {
        label: 'Duplicate',
        action: options.onDuplicate,
        shortcut: 'Ctrl+D',
      },
      {
        label: 'Delete',
        action: options.onDelete,
        shortcut: 'Del',
      },
      {
        separator: true,
      },
      {
        label: 'Mute',
        action: options.onMute,
      },
      {
        label: 'Create Automation Clip',
        action: options.onCreateAutomation,
      },
    ];
  }

  /**
   * Get context menu items for Mixer track
   * @param options - Menu options
   * @returns Menu items
   */
  getMixerTrackMenu(options: {
    onRename?: () => void;
    onMute?: () => void;
    onSolo?: () => void;
    onAddEffect?: () => void;
    onCreateAutomation?: () => void;
    onRouting?: () => void;
  } = {}): ContextMenuItem[] {
    return [
      {
        label: 'Rename',
        action: options.onRename,
        shortcut: 'F2',
      },
      {
        separator: true,
      },
      {
        label: 'Mute',
        action: options.onMute,
        shortcut: 'M',
      },
      {
        label: 'Solo',
        action: options.onSolo,
        shortcut: 'S',
      },
      {
        separator: true,
      },
      {
        label: 'Add Effect',
        action: options.onAddEffect,
      },
      {
        label: 'Create Automation Clip',
        action: options.onCreateAutomation,
      },
      {
        label: 'Routing',
        action: options.onRouting,
      },
    ];
  }

  /**
   * Get context menu items for parameter/knob
   * @param options - Menu options
   * @returns Menu items
   */
  getParameterMenu(options: {
    onCreateAutomation?: () => void;
    onReset?: () => void;
    onLinkToController?: () => void;
  } = {}): ContextMenuItem[] {
    return [
      {
        label: 'Create Automation Clip',
        action: options.onCreateAutomation,
      },
      {
        label: 'Reset to Default',
        action: options.onReset,
      },
      {
        label: 'Link to Controller',
        action: options.onLinkToController,
      },
    ];
  }

  /**
   * Get context menu items for browser sound item
   * @param options - Menu options
   * @returns Menu items
   */
  getBrowserSoundMenu(options: {
    onEdit?: () => void;
    onPreview?: () => void;
    onAddToFavorites?: () => void;
    onRemoveFromFavorites?: () => void;
    isFavorite?: boolean;
  } = {}): ContextMenuItem[] {
    return [
      {
        label: 'Edit',
        action: options.onEdit,
      },
      {
        label: 'Preview',
        action: options.onPreview,
        shortcut: 'Space',
      },
      {
        separator: true,
      },
      {
        label: options.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
        action: options.isFavorite ? options.onRemoveFromFavorites : options.onAddToFavorites,
      },
    ];
  }

  /**
   * Get context menu items for effect slot
   * @param options - Menu options
   * @returns Menu items
   */
  getEffectSlotMenu(options: {
    onEdit?: () => void;
    onRemove?: () => void;
    onDuplicate?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onToggleEnabled?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    hasEffect?: boolean;
    isEnabled?: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
  } = {}): ContextMenuItem[] {
    if (!options.hasEffect) {
      return [
        {
          label: 'Add Effect',
          action: options.onEdit,
        },
        {
          separator: true,
        },
        {
          label: 'Paste',
          action: options.onPaste,
          shortcut: 'Ctrl+V',
        },
      ];
    }

    return [
      {
        label: 'Edit',
        action: options.onEdit,
        shortcut: 'Enter',
      },
      {
        separator: true,
      },
      {
        label: options.isEnabled ? 'Disable' : 'Enable',
        action: options.onToggleEnabled,
        shortcut: 'Space',
      },
      {
        separator: true,
      },
      {
        label: 'Copy',
        action: options.onCopy,
        shortcut: 'Ctrl+C',
      },
      {
        label: 'Paste',
        action: options.onPaste,
        shortcut: 'Ctrl+V',
      },
      {
        label: 'Duplicate',
        action: options.onDuplicate,
        shortcut: 'Ctrl+D',
      },
      {
        separator: true,
      },
      {
        label: 'Move Up',
        action: options.onMoveUp,
        shortcut: 'Ctrl+Up',
        disabled: !options.canMoveUp,
      },
      {
        label: 'Move Down',
        action: options.onMoveDown,
        shortcut: 'Ctrl+Down',
        disabled: !options.canMoveDown,
      },
      {
        separator: true,
      },
      {
        label: 'Remove',
        action: options.onRemove,
        shortcut: 'Del',
      },
    ];
  }
}

// Export singleton instance
export const contextMenuService = new ContextMenuService();

