/**
 * Tooltip - Professional tooltip system
 * Provides hover tooltips for UI elements
 * @module ui/Tooltip
 */

/**
 * Tooltip options
 */
export interface TooltipOptions {
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/**
 * Tooltip - Professional tooltip system
 * Provides hover tooltips for UI elements
 */
export class Tooltip {
  private tooltip: HTMLDivElement | null;
  private currentTarget: HTMLElement | null;
  private delay: number;
  private timeout: ReturnType<typeof setTimeout> | null;

  constructor() {
    this.tooltip = null;
    this.currentTarget = null;
    this.delay = 500; // ms
    this.timeout = null;
  }

  /**
   * Initialize tooltip system
   */
  init(): void {
    if (this.tooltip) return;

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'fl-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 11px;
      pointer-events: none;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s;
      max-width: 200px;
      word-wrap: break-word;
    `;
    document.body.appendChild(this.tooltip);
  }

  /**
   * Attach tooltip to element
   * @param {HTMLElement} element - Element to attach to
   * @param {string} text - Tooltip text
   * @param {TooltipOptions} options - Options
   */
  attach(element: HTMLElement, text: string, options: TooltipOptions = {}): void {
    if (!this.tooltip) this.init();

    const { position = 'top', delay = this.delay } = options;

    element.addEventListener('mouseenter', () => {
      this.currentTarget = element;
      this.timeout = setTimeout(() => {
        this.show(element, text, position);
      }, delay);
    });

    element.addEventListener('mouseleave', () => {
      this.hide();
    });
  }

  /**
   * Show tooltip
   * @private
   */
  private show(
    element: HTMLElement,
    text: string,
    position: 'top' | 'bottom' | 'left' | 'right'
  ): void {
    if (!this.tooltip || this.currentTarget !== element) return;

    this.tooltip.textContent = text;
    this.tooltip.style.opacity = '1';

    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let top: number;
    let left: number;

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + 8;
        break;
      default:
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    }

    // Keep within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  /**
   * Hide tooltip
   */
  hide(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.tooltip) {
      this.tooltip.style.opacity = '0';
    }

    this.currentTarget = null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.hide();
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }
}

// Create singleton instance
export const tooltip = new Tooltip();

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  (window as unknown as { Tooltip: typeof Tooltip }).Tooltip = Tooltip;
  (window as unknown as { tooltip: typeof tooltip }).tooltip = tooltip;
}

