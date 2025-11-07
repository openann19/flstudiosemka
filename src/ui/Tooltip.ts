/**
 * Tooltip - Professional tooltip system
 * Provides hover tooltips for UI elements
 */

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipOptions {
  position?: TooltipPosition;
  delay?: number;
}

class Tooltip {
  private tooltip: HTMLElement | null = null;
  private currentTarget: HTMLElement | null = null;
  private delay = 500; // ms
  private timeout: ReturnType<typeof setTimeout> | null = null;

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
   */
  attach(element: HTMLElement, text: string, options: TooltipOptions = {}): void {
    if (!this.tooltip) this.init();

    const {
      position = 'top',
      delay = this.delay
    } = options;

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
  private show(element: HTMLElement, text: string, position: TooltipPosition): void {
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
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + 8;
        break;
      default:
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
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
const tooltip = new Tooltip();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Tooltip, tooltip };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Tooltip = Tooltip;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).tooltip = tooltip;
}

