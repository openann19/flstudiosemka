/**
 * CommandPalette - Professional command palette for quick actions
 * Press Ctrl+K (or Cmd+K on Mac) to open
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommandPaletteFLStudioApp = any;

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void | Promise<void>;
}

class CommandPalette {
  private flStudio: CommandPaletteFLStudioApp;
  private isOpen = false;
  private commands: Command[] = [];
  private filteredCommands: Command[] = [];
  private selectedIndex = 0;
  private searchQuery = '';
  private overlay: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private list: HTMLElement | null = null;

  constructor(flStudio: CommandPaletteFLStudioApp) {
    this.flStudio = flStudio;
    this._registerDefaultCommands();
    this._setupKeyboardShortcut();
    this._installUI();
  }

  /**
   * Register default commands
   * @private
   */
  private _registerDefaultCommands(): void {
    this.commands = [
      {
        id: 'play',
        label: 'Play/Pause',
        category: 'Transport',
        shortcut: 'Space',
        action: () => this.flStudio.togglePlay?.()
      },
      {
        id: 'stop',
        label: 'Stop',
        category: 'Transport',
        shortcut: 'Space',
        action: () => this.flStudio.stop?.()
      },
      {
        id: 'save',
        label: 'Save Project',
        category: 'File',
        shortcut: 'Ctrl+S',
        action: () => this.flStudio.saveProject?.()
      },
      {
        id: 'export',
        label: 'Export Project',
        category: 'File',
        shortcut: 'Ctrl+E',
        action: () => this.flStudio.exportProject?.()
      },
      {
        id: 'new-project',
        label: 'New Project',
        category: 'File',
        shortcut: 'Ctrl+N',
        action: () => this.flStudio.newProject?.()
      },
      {
        id: 'browser',
        label: 'Open Browser',
        category: 'View',
        shortcut: 'F5',
        action: () => this.flStudio.switchView?.('browser')
      },
      {
        id: 'channel-rack',
        label: 'Open Channel Rack',
        category: 'View',
        shortcut: 'F6',
        action: () => this.flStudio.switchView?.('channel-rack')
      },
      {
        id: 'playlist',
        label: 'Open Playlist',
        category: 'View',
        shortcut: 'F7',
        action: () => this.flStudio.switchView?.('playlist')
      },
      {
        id: 'mixer',
        label: 'Open Mixer',
        category: 'View',
        shortcut: 'F8',
        action: () => this.flStudio.switchView?.('mixer')
      },
      {
        id: 'pattern-editor',
        label: 'Open Pattern Editor',
        category: 'View',
        shortcut: 'F9',
        action: () => this.flStudio.switchView?.('pattern')
      },
      {
        id: 'effects',
        label: 'Open Effects Panel',
        category: 'View',
        shortcut: 'F10',
        action: () => this.flStudio.switchView?.('effects')
      },
      {
        id: 'undo',
        label: 'Undo',
        category: 'Edit',
        shortcut: 'Ctrl+Z',
        action: () => this.flStudio.undo?.()
      },
      {
        id: 'redo',
        label: 'Redo',
        category: 'Edit',
        shortcut: 'Ctrl+Y',
        action: () => this.flStudio.redo?.()
      },
      {
        id: 'clear-pattern',
        label: 'Clear Pattern',
        category: 'Edit',
        shortcut: 'Delete',
        action: () => this.flStudio.clearCurrentPattern?.()
      },
      {
        id: 'record',
        label: 'Start Recording',
        category: 'Transport',
        shortcut: 'R',
        action: () => {
          if (this.flStudio.audioRecorder) {
            const activeTrack = this.flStudio.getActiveTrack?.();
            if (activeTrack) {
              this.flStudio.audioRecorder.startRecording?.(activeTrack.id);
            }
          }
        }
      },
      {
        id: 'export-audio',
        label: 'Export Audio (WAV)',
        category: 'File',
        shortcut: 'Ctrl+Shift+E',
        action: async () => {
          if (this.flStudio.audioRenderer) {
            try {
              const buffer = await this.flStudio.audioRenderer.renderProject?.(
                this.flStudio.getProjectData?.(),
                0,
                this.flStudio.getArrangementTotalBeats?.() * (60 / this.flStudio.bpm)
              );
              this.flStudio.audioRenderer.exportWAV?.(buffer, `${this.flStudio.projectName}.wav`);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Failed to export audio', error);
            }
          }
        }
      },
      {
        id: 'toggle-midi',
        label: 'Toggle MIDI Input',
        category: 'MIDI',
        shortcut: 'M',
        action: () => {
          if (this.flStudio.midiKeyboard) {
            if (this.flStudio.midiKeyboard.isEnabled) {
              this.flStudio.midiKeyboard.disable?.();
            } else {
              this.flStudio.midiKeyboard.enable?.();
            }
          }
        }
      },
      {
        id: 'open-vocal-studio',
        label: 'Open Vocal Studio',
        category: 'Tools',
        shortcut: 'V',
        action: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((window as any).vocalStudio) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).vocalStudio.open?.();
          }
        }
      },
      {
        id: 'open-drum-machine',
        label: 'Open Drum Machine',
        category: 'Tools',
        shortcut: 'D',
        action: () => {
          this.flStudio.toggleDrumMachineVisibility?.();
        }
      }
    ];
  }

  /**
   * Register a custom command
   */
  registerCommand(command: Command): void {
    const existingIndex = this.commands.findIndex(cmd => cmd.id === command.id);
    if (existingIndex !== -1) {
      this.commands[existingIndex] = command;
    } else {
      this.commands.push(command);
    }
    this._sortCommands();
  }

  /**
   * Unregister a command
   */
  unregisterCommand(commandId: string): void {
    this.commands = this.commands.filter(cmd => cmd.id !== commandId);
  }

  /**
   * Sort commands by category and label
   * @private
   */
  private _sortCommands(): void {
    this.commands.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.label.localeCompare(b.label);
    });
  }

  /**
   * Setup keyboard shortcut (Ctrl+K or Cmd+K)
   * @private
   */
  private _setupKeyboardShortcut(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (modifier && e.key === 'k' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        this.toggle();
      }

      // Handle Escape to close
      if (this.isOpen && e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }

      // Handle navigation when open
      if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
          this._updateSelection();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          this._updateSelection();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this._executeSelected();
        }
      }
    });
  }

  /**
   * Install UI elements
   * @private
   */
  private _installUI(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('command-palette-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'command-palette-overlay';
    overlay.className = 'command-palette-overlay';
    overlay.style.display = 'none';
    
    overlay.innerHTML = `
      <div class="command-palette-container">
        <div class="command-palette-header">
          <input 
            type="text" 
            id="command-palette-input" 
            class="command-palette-input" 
            placeholder="Type to search commands..."
            autocomplete="off"
          />
        </div>
        <div class="command-palette-list" id="command-palette-list">
          <!-- Commands will be rendered here -->
        </div>
        <div class="command-palette-footer">
          <span class="command-palette-hint">+ Navigate</span>
          <span class="command-palette-hint">Enter Select</span>
          <span class="command-palette-hint">Esc Close</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.input = document.getElementById('command-palette-input') as HTMLInputElement;
    this.list = document.getElementById('command-palette-list');

    // Setup input event
    if (this.input) {
      this.input.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
        this._filterCommands();
        this._renderCommands();
      });
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Install styles
    this._installStyles();
  }

  /**
   * Install styles
   * @private
   */
  private _installStyles(): void {
    if (document.getElementById('command-palette-styles')) return;

    const style = document.createElement('style');
    style.id = 'command-palette-styles';
    style.textContent = `
      .command-palette-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        z-index: 10000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
      }

      .command-palette-container {
        background: linear-gradient(180deg, var(--fl-bg-input), var(--fl-bg-darkest));
        border: 2px solid var(--fl-orange);
        border-radius: var(--radius-xl);
        width: 600px;
        max-width: 90vw;
        box-shadow: 0 24px 80px rgba(255, 153, 0, 0.6);
        overflow: hidden;
      }

      .command-palette-header {
        padding: var(--spacing-2xl);
        border-bottom: 1px solid rgba(255, 153, 0, 0.3);
      }

      .command-palette-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 153, 0, 0.3);
        border-radius: var(--radius-xl);
        padding: var(--spacing-lg) var(--spacing-xl);
        color: var(--fl-text-primary);
        font-size: 16px;
        font-family: var(--font-body, var(--font-ui));
        outline: none;
        transition: var(--transition-all);
      }

      .command-palette-input:focus {
        border-color: var(--fl-orange);
        box-shadow: var(--input-focus-ring);
      }

      .command-palette-input::placeholder {
        color: var(--fl-text-secondary);
      }

      .command-palette-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 8px 0;
      }

      .command-palette-item {
        padding: 12px 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: background 0.15s;
        border-left: 3px solid transparent;
      }

      .command-palette-item:hover,
      .command-palette-item.selected {
        background: rgba(255, 153, 0, 0.15);
        border-left-color: var(--fl-orange);
      }

      .command-palette-item-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        flex: 1;
      }

      .command-palette-item-label {
        color: var(--fl-text-primary);
        font-size: 14px;
        font-weight: 600;
      }

      .command-palette-item-meta {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
      }

      .command-palette-item-category {
        color: #FF0080;
        font-weight: 600;
      }

      .command-palette-item-shortcut {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
      }

      .command-palette-footer {
        padding: 12px 20px;
        border-top: 1px solid rgba(255, 0, 128, 0.3);
        display: flex;
        gap: 16px;
        justify-content: center;
      }

      .command-palette-hint {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
      }

      .command-palette-empty {
        padding: 40px 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Filter commands based on search query
   * @private
   */
  private _filterCommands(): void {
    if (!this.searchQuery) {
      this.filteredCommands = this.commands;
    } else {
      this.filteredCommands = this.commands.filter(cmd => {
        const searchable = `${cmd.label} ${cmd.category} ${cmd.shortcut || ''}`.toLowerCase();
        return searchable.includes(this.searchQuery);
      });
    }
    this.selectedIndex = 0;
  }

  /**
   * Render commands list
   * @private
   */
  private _renderCommands(): void {
    if (!this.list) return;

    if (this.filteredCommands.length === 0) {
      this.list.innerHTML = '<div class="command-palette-empty">No commands found</div>';
      return;
    }

    this.list.innerHTML = this.filteredCommands.map((cmd, index) => {
      const isSelected = index === this.selectedIndex;
      return `
        <div class="command-palette-item ${isSelected ? 'selected' : ''}" data-index="${index}">
          <div class="command-palette-item-content">
            <div class="command-palette-item-label">${this._highlightMatch(cmd.label)}</div>
            <div class="command-palette-item-meta">
              <span class="command-palette-item-category">${cmd.category}</span>
              ${cmd.shortcut ? `<span class="command-palette-item-shortcut">${cmd.shortcut}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Scroll selected item into view
    this._updateSelection();
  }

  /**
   * Highlight search matches in text
   * @private
   */
  private _highlightMatch(text: string): string {
    if (!this.searchQuery) return text;
    
    const regex = new RegExp(`(${this.searchQuery})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(255, 0, 128, 0.3); color: #FF0080;">$1</mark>');
  }

  /**
   * Update selection visual
   * @private
   */
  private _updateSelection(): void {
    if (!this.list) return;

    const items = this.list.querySelectorAll('.command-palette-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    // Scroll into view
    const selectedItem = items[this.selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Execute selected command
   * @private
   */
  private _executeSelected(): void {
    const command = this.filteredCommands[this.selectedIndex];
    if (command && command.action) {
      try {
        command.action();
        this.close();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('CommandPalette: Error executing command', error);
      }
    }
  }

  /**
   * Open command palette
   */
  open(): void {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.searchQuery = '';
    this.selectedIndex = 0;
    
    if (this.overlay) {
      this.overlay.style.display = 'flex';
    }
    
    if (this.input) {
      this.input.value = '';
      this.input.focus();
    }
    
    this._filterCommands();
    this._renderCommands();
  }

  /**
   * Close command palette
   */
  close(): void {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.searchQuery = '';
    this.selectedIndex = 0;
    
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    
    if (this.input) {
      this.input.blur();
    }
  }

  /**
   * Toggle command palette
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Get all registered commands
   */
  getCommands(): Command[] {
    return this.commands;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CommandPalette };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).CommandPalette = CommandPalette;
}

