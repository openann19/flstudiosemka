/**
 * ContextMenu - Professional context menu system
 * Provides right-click context menus
 */

/**
 * Context menu item definition
 */
export interface ContextMenuItem {
  label?: string;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

/**
 * Context menu items can be array or function that returns array
 */
export type ContextMenuItems = ContextMenuItem[] | ((event: MouseEvent) => ContextMenuItem[]);

// Legacy interface for backward compatibility
interface MenuItem {
  label?: string;
  disabled?: boolean;
  shortcut?: string;
  action?: () => void;
}

type MenuItemOrSeparator = MenuItem | 'separator';

class ContextMenu {
  private menu: HTMLElement | null = null;
  private isVisible = false;

  /**
   * Initialize context menu
   */
  init(): void {
    if (this.menu) return;

    this.menu = document.createElement('div');
    this.menu.className = 'fl-context-menu';
    this.menu.style.cssText = `
      position: fixed;
      background: var(--fl-bg-dark);
      border: 1px solid var(--fl-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-sm) 0;
      min-width: 180px;
      box-shadow: var(--shadow-md);
      z-index: var(--z-tooltip);
      display: none;
      font-size: 11px;
    `;
    document.body.appendChild(this.menu);

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (this.isVisible && this.menu && !this.menu.contains(e.target as Node)) {
        this.hide();
      }
    });
  }

  /**
   * Show context menu
   */
  show(x: number, y: number, items: ContextMenuItem[] | MenuItemOrSeparator[]): void {
    if (!this.menu) this.init();
    if (!this.menu) return;

    this.menu.innerHTML = '';

    items.forEach(item => {
      // Handle separator - either as string or as property
      if (item === 'separator' || (typeof item === 'object' && 'separator' in item && item.separator)) {
        const separator = document.createElement('div');
        separator.className = 'fl-context-menu-separator';
        separator.style.cssText = `
          height: 1px;
          background: var(--fl-border);
          margin: var(--spacing-sm) 0;
        `;
        this.menu!.appendChild(separator);
        return;
      }

      // Type guard for ContextMenuItem
      const menuItemData = typeof item === 'object' && 'label' in item ? item : null;
      if (!menuItemData) return;

      const menuItem = document.createElement('div');
      menuItem.className = 'fl-context-menu-item';
      menuItem.style.cssText = `
        padding: 6px var(--spacing-xl);
        cursor: pointer;
        color: var(--fl-text-primary);
        transition: var(--transition-fast);
      `;

      if (menuItemData.disabled) {
        menuItem.style.opacity = '0.5';
        menuItem.style.cursor = 'not-allowed';
      } else {
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = 'var(--fl-bg-hover)';
        });
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = 'transparent';
        });
        menuItem.addEventListener('click', () => {
          if (!menuItemData.disabled && menuItemData.action) {
            menuItemData.action();
            this.hide();
          }
        });
      }

      menuItem.textContent = menuItemData.label ?? '';

      if (menuItemData.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = menuItemData.shortcut;
        shortcut.style.cssText = `
          float: right;
          color: var(--fl-text-secondary);
          margin-left: var(--spacing-xl);
        `;
        menuItem.appendChild(shortcut);
      }

      this.menu!.appendChild(menuItem);
    });

    this.menu.style.display = 'block';
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;

    // Keep within viewport
    const rect = this.menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.menu.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.menu.style.top = `${window.innerHeight - rect.height - 8}px`;
    }

    this.isVisible = true;
  }

  /**
   * Hide context menu
   */
  hide(): void {
    if (this.menu) {
      this.menu.style.display = 'none';
    }
    this.isVisible = false;
  }

  /**
   * Attach to element
   */
  attach(element: HTMLElement, items: MenuItemOrSeparator[] | ((e: MouseEvent) => MenuItemOrSeparator[])): void {
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const menuItems = typeof items === 'function' ? items(e) : items;
      this.show(e.clientX, e.clientY, menuItems);
    });
  }

  /**
   * Check if menu is visible
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }
}

// Create singleton instance
const contextMenu = new ContextMenu();

// Export for ES modules
export { ContextMenu, contextMenu };

// Export for CommonJS module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContextMenu, contextMenu };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ContextMenu = ContextMenu;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).contextMenu = contextMenu;
}

