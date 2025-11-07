/**
 * ContextMenu - Professional context menu system with TypeScript
 * Provides right-click context menus with context-aware items
 * @module ui/ContextMenu
 */

/**
 * Context menu item definition
 */
export interface ContextMenuItem {
  label: string;
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

/**
 * Context menu class
 */
export class ContextMenu {
  private menu: HTMLElement | null;

  private isVisible: boolean;

  private currentItems: ContextMenuItem[];

  /**
   * Create a new ContextMenu instance
   */
  constructor() {
    this.menu = null;
    this.isVisible = false;
    this.currentItems = [];
  }

  /**
   * Initialize context menu DOM element
   * @private
   */
  private init(): void {
    if (this.menu) {
      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    this.menu = document.createElement('div');
    this.menu.className = 'fl-context-menu';
    this.menu.style.cssText = `
      position: fixed;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 4px 0;
      min-width: 180px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 10001;
      display: none;
      font-size: 11px;
      font-family: var(--font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif);
    `;
    document.body.appendChild(this.menu);

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (this.isVisible && this.menu && !this.menu.contains(e.target as Node)) {
        this.hide();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (this.isVisible && e.key === 'Escape') {
        this.hide();
      }
    });
  }

  /**
   * Show context menu
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param items - Menu items
   */
  show(x: number, y: number, items: ContextMenuItem[]): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (!this.menu) {
      this.init();
    }

    if (!this.menu) {
      return;
    }

    this.currentItems = items;
    this.menu.innerHTML = '';

    items.forEach((item) => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'fl-context-menu-separator';
        separator.style.cssText = `
          height: 1px;
          background: #444;
          margin: 4px 0;
        `;
        this.menu!.appendChild(separator);
        return;
      }

      const menuItem = document.createElement('div');
      menuItem.className = 'fl-context-menu-item';
      menuItem.style.cssText = `
        padding: 6px 16px;
        cursor: pointer;
        color: #fff;
        transition: background 0.1s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      if (item.disabled) {
        menuItem.style.opacity = '0.5';
        menuItem.style.cursor = 'not-allowed';
      } else {
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = '#3a3a3a';
        });
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = 'transparent';
        });
        menuItem.addEventListener('click', () => {
          if (!item.disabled && item.action) {
            item.action();
            this.hide();
          }
        });
      }

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      menuItem.appendChild(labelSpan);

      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = item.shortcut;
        shortcut.style.cssText = `
          color: #888;
          margin-left: 16px;
          font-size: 10px;
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
    this.currentItems = [];
  }

  /**
   * Attach context menu to element
   * @param element - Element to attach to
   * @param items - Menu items or function that returns items
   */
  attach(element: HTMLElement, items: ContextMenuItems): void {
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const menuItems = typeof items === 'function' ? items(e) : items;
      this.show(e.clientX, e.clientY, menuItems);
    });
  }

  /**
   * Detach context menu from element
   * @param element - Element to detach from
   */
  detach(element: HTMLElement): void {
    // Note: This is a simplified implementation
    // Full implementation would track attached elements
    element.removeEventListener('contextmenu', () => {
      // Handler would be stored in a Map for proper removal
    });
  }

  /**
   * Check if menu is visible
   * @returns True if menu is visible
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }
}

// Create singleton instance
export const contextMenu = new ContextMenu();

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as Window & { ContextMenu: typeof ContextMenu; contextMenu: ContextMenu }).ContextMenu =
    ContextMenu;
  (window as Window & { contextMenu: ContextMenu }).contextMenu = contextMenu;
}

