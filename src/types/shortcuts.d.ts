/**
 * Type definitions for keyboard shortcuts system
 * @module types/shortcuts
 */

/**
 * Modifier keys
 */
export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

/**
 * Keyboard key code
 */
export type KeyCode = string;

/**
 * Shortcut combination
 */
export interface ShortcutCombination {
  key: KeyCode;
  modifiers?: ModifierKey[];
}

/**
 * Shortcut context (where the shortcut is active)
 */
export type ShortcutContext =
  | 'global'
  | 'channel-rack'
  | 'piano-roll'
  | 'playlist'
  | 'mixer'
  | 'browser';

/**
 * Shortcut action handler
 */
export type ShortcutHandler = (event: KeyboardEvent) => void | boolean;

/**
 * Shortcut definition
 */
export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  combination: ShortcutCombination;
  handler: ShortcutHandler;
  context?: ShortcutContext | ShortcutContext[];
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Shortcut conflict information
 */
export interface ShortcutConflict {
  shortcutId: string;
  conflictingShortcutId: string;
  combination: ShortcutCombination;
}

/**
 * User shortcut preferences
 */
export interface ShortcutPreferences {
  [shortcutId: string]: ShortcutCombination;
}

/**
 * Shortcut registration options
 */
export interface ShortcutRegistrationOptions {
  context?: ShortcutContext | ShortcutContext[];
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

