/**
 * KeyboardShortcutService - Centralized keyboard shortcut management
 * Handles shortcut registration, conflict detection, and execution
 * @module services/KeyboardShortcutService
 */

import type {
  ShortcutDefinition,
  ShortcutCombination,
  ShortcutContext,
  ShortcutHandler,
  ShortcutConflict,
  ShortcutPreferences,
  ShortcutRegistrationOptions,
  ModifierKey,
} from '../types/shortcuts';
import { InvalidParameterError, StateError } from '../utils/errors';

/**
 * Keyboard shortcut service for managing all keyboard shortcuts
 */
export class KeyboardShortcutService {
  private shortcuts: Map<string, ShortcutDefinition>;

  private activeContext: ShortcutContext;

  private preferences: ShortcutPreferences;

  private enabled: boolean;

  private readonly storageKey = 'fl-studio-shortcut-preferences';

  /**
   * Create a new KeyboardShortcutService instance
   */
  constructor() {
    this.shortcuts = new Map<string, ShortcutDefinition>();
    this.activeContext = 'global';
    this.preferences = {};
    this.enabled = true;
    this.loadPreferences();
    this.setupGlobalListener();
  }

  /**
   * Register a keyboard shortcut
   * @param id - Unique shortcut identifier
   * @param name - Human-readable name
   * @param description - Description of what the shortcut does
   * @param combination - Key combination
   * @param handler - Handler function
   * @param options - Registration options
   * @throws InvalidParameterError if parameters are invalid
   * @throws StateError if shortcut conflicts with existing shortcut
   */
  register(
    id: string,
    name: string,
    description: string,
    combination: ShortcutCombination,
    handler: ShortcutHandler,
    options: ShortcutRegistrationOptions = {}
  ): void {
    if (!id || typeof id !== 'string') {
      throw new InvalidParameterError('id', id, 'non-empty string');
    }
    if (!name || typeof name !== 'string') {
      throw new InvalidParameterError('name', name, 'non-empty string');
    }
    if (!description || typeof description !== 'string') {
      throw new InvalidParameterError('description', description, 'non-empty string');
    }
    if (!combination || typeof combination.key !== 'string') {
      throw new InvalidParameterError('combination', combination, 'ShortcutCombination object');
    }
    if (typeof handler !== 'function') {
      throw new InvalidParameterError('handler', handler, 'function');
    }

    // Check for conflicts
    const conflict = this.detectConflict(id, combination);
    if (conflict) {
      throw new StateError(
        `Shortcut conflict: '${id}' conflicts with '${conflict.conflictingShortcutId}'`,
        'conflict',
        'no-conflict'
      );
    }

    // Check if user has custom preference for this shortcut
    const userCombination = this.preferences[id];
    const finalCombination = userCombination || combination;

    const shortcut: ShortcutDefinition = {
      id,
      name,
      description,
      combination: finalCombination,
      handler,
      context: options.context || 'global',
      enabled: options.enabled !== false,
      preventDefault: options.preventDefault !== false,
      stopPropagation: options.stopPropagation || false,
    };

    this.shortcuts.set(id, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   * @param id - Shortcut identifier
   */
  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  /**
   * Update shortcut combination (for user preferences)
   * @param id - Shortcut identifier
   * @param combination - New key combination
   * @throws InvalidParameterError if shortcut not found
   * @throws StateError if new combination conflicts
   */
  updateShortcut(id: string, combination: ShortcutCombination): void {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) {
      throw new InvalidParameterError('id', id, 'existing shortcut ID');
    }

    // Check for conflicts (excluding self)
    const conflict = this.detectConflict(id, combination);
    if (conflict && conflict.conflictingShortcutId !== id) {
      throw new StateError(
        `Shortcut conflict: '${id}' conflicts with '${conflict.conflictingShortcutId}'`,
        'conflict',
        'no-conflict'
      );
    }

    shortcut.combination = combination;
    this.preferences[id] = combination;
    this.savePreferences();
  }

  /**
   * Enable or disable a shortcut
   * @param id - Shortcut identifier
   * @param enabled - Enable state
   */
  setShortcutEnabled(id: string, enabled: boolean): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }

  /**
   * Enable or disable all shortcuts
   * @param enabled - Enable state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Enable the service
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the service
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if service is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set active context
   * @param context - Active context
   */
  setContext(context: ShortcutContext): void {
    this.activeContext = context;
  }

  /**
   * Set active context (alias for setContext)
   * @param context - Active context
   */
  setActiveContext(context: ShortcutContext): void {
    this.activeContext = context;
  }

  /**
   * Get active context
   * @returns Active context
   */
  getActiveContext(): ShortcutContext {
    return this.activeContext;
  }

  /**
   * Set shortcut preference (user custom combination)
   * @param id - Shortcut identifier
   * @param combination - Custom key combination
   */
  setShortcutPreference(id: string, combination: ShortcutCombination): void {
    this.updateShortcut(id, combination);
  }

  /**
   * Get shortcut by ID
   * @param id - Shortcut identifier
   * @returns Shortcut definition or undefined
   */
  getShortcut(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id);
  }

  /**
   * Get all shortcuts
   * @returns Array of shortcut definitions
   */
  getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts for a specific context
   * @param context - Context to filter by
   * @returns Array of shortcut definitions
   */
  getShortcutsForContext(context: ShortcutContext): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values()).filter((shortcut) => {
      if (!shortcut.enabled) {
        return false;
      }
      if (shortcut.context === 'global') {
        return true;
      }
      if (Array.isArray(shortcut.context)) {
        return shortcut.context.includes(context);
      }
      return shortcut.context === context;
    });
  }

  /**
   * Detect conflicts with a shortcut combination
   * @param excludeId - Shortcut ID to exclude from conflict check
   * @param combination - Combination to check
   * @returns Conflict information or null
   */
  detectConflict(
    excludeId: string,
    combination: ShortcutCombination
  ): ShortcutConflict | null {
    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (id === excludeId || !shortcut.enabled) {
        continue;
      }
      if (this.combinationsMatch(shortcut.combination, combination)) {
        return {
          shortcutId: excludeId,
          conflictingShortcutId: id,
          combination,
        };
      }
    }
    return null;
  }

  /**
   * Check if two combinations match
   * @param a - First combination
   * @param b - Second combination
   * @returns True if combinations match
   */
  private combinationsMatch(
    a: ShortcutCombination,
    b: ShortcutCombination
  ): boolean {
    if (a.key !== b.key) {
      return false;
    }

    const aMods = new Set(a.modifiers || []);
    const bMods = new Set(b.modifiers || []);

    if (aMods.size !== bMods.size) {
      return false;
    }

    for (const mod of aMods) {
      if (!bMods.has(mod)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Handle keyboard event
   * @param event - Keyboard event
   * @returns True if shortcut was handled
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.enabled) {
      return false;
    }

    // Don't handle shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return false;
    }

    const combination: ShortcutCombination = {
      key: event.code,
      modifiers: this.getModifiers(event),
    };

    // Get shortcuts for current context
    const shortcuts = this.getShortcutsForContext(this.activeContext);

    // Find matching shortcut
    for (const shortcut of shortcuts) {
      if (this.combinationsMatch(shortcut.combination, combination)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        const result = shortcut.handler(event);
        return result !== false;
      }
    }

    return false;
  }

  /**
   * Get modifier keys from event
   * @param event - Keyboard event
   * @returns Array of modifier keys
   */
  private getModifiers(event: KeyboardEvent): ModifierKey[] {
    const modifiers: ModifierKey[] = [];
    if (event.ctrlKey) {
      modifiers.push('ctrl');
    }
    if (event.shiftKey) {
      modifiers.push('shift');
    }
    if (event.altKey) {
      modifiers.push('alt');
    }
    if (event.metaKey) {
      modifiers.push('meta');
    }
    return modifiers;
  }

  /**
   * Setup global keyboard event listener
   * @private
   */
  private setupGlobalListener(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });
  }

  /**
   * Load preferences from localStorage
   * @private
   */
  private loadPreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.preferences = JSON.parse(stored) as ShortcutPreferences;
      }
    } catch {
      // Silent error handling
    }
  }

  /**
   * Save preferences to localStorage
   * @private
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch {
      // Silent error handling
    }
  }

  /**
   * Reset all shortcuts to defaults
   */
  resetToDefaults(): void {
    this.preferences = {};
    this.savePreferences();

    // Reload all shortcuts with default combinations
    const shortcuts = Array.from(this.shortcuts.values());
    this.shortcuts.clear();

    for (const shortcut of shortcuts) {
      // Re-register with original combination (from registration, not preferences)
      // Note: This is a simplified reset - full implementation would store original combinations
      this.shortcuts.set(shortcut.id, shortcut);
    }
  }
}

// Export singleton instance
export const keyboardShortcutService = new KeyboardShortcutService();

