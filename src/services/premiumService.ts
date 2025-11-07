/**
 * Premium Subscription Service
 * Manages premium feature activation/deactivation with localStorage persistence
 * and event system for state changes.
 */

interface PremiumState {
  active: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  features: Record<string, boolean>;
}

interface ActivationOptions {
  duration?: number | null;
  features?: Record<string, boolean>;
}

type StateChangeCallback = (state: PremiumState) => void;

class PremiumService {
  private readonly STORAGE_KEY = 'vocal_studio_premium';
  private listeners = new Set<StateChangeCallback>();
  private _state: PremiumState;

  constructor() {
    this._state = this._loadState();
  }

  /**
   * Load premium state from localStorage
   * @returns Premium state object
   */
  private _loadState(): PremiumState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PremiumState>;
        return {
          active: parsed.active === true,
          activatedAt: parsed.activatedAt ?? null,
          expiresAt: parsed.expiresAt ?? null,
          features: parsed.features ?? {}
        };
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[PremiumService] Failed to load state:', error);
    }
    return {
      active: false,
      activatedAt: null,
      expiresAt: null,
      features: {}
    };
  }

  /**
   * Save premium state to localStorage
   * @private
   */
  private _saveState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[PremiumService] Failed to save state:', error);
    }
  }

  /**
   * Emit state change event to all listeners
   * @private
   */
  private _emitChange(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this._state);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[PremiumService] Listener error:', error);
      }
    });
  }

  /**
   * Check if premium is currently active
   * @returns True if premium is active
   */
  isPremiumActive(): boolean {
    if (!this._state.active) {
      return false;
    }

    // Check expiration if set
    if (this._state.expiresAt) {
      const now = Date.now();
      if (now > this._state.expiresAt) {
        this._state.active = false;
        this._saveState();
        this._emitChange();
        return false;
      }
    }

    return true;
  }

  /**
   * Activate premium subscription
   * @param options - Activation options
   * @returns True if activation successful
   */
  activatePremium(options: ActivationOptions = {}): boolean {
    const { duration = null, features = {} } = options;
    const now = Date.now();

    this._state = {
      active: true,
      activatedAt: now,
      expiresAt: duration ? now + duration : null,
      features: {
        liveRecording: true,
        advancedAutotune: true,
        multipleFormats: true,
        enhancedWaveform: true,
        ...features
      }
    };

    this._saveState();
    this._emitChange();
    return true;
  }

  /**
   * Deactivate premium subscription
   * @returns True if deactivation successful
   */
  deactivatePremium(): boolean {
    this._state = {
      active: false,
      activatedAt: this._state.activatedAt,
      expiresAt: null,
      features: {}
    };

    this._saveState();
    this._emitChange();
    return true;
  }

  /**
   * Check premium status (with optional feature check)
   * @param feature - Optional feature name to check
   * @returns Feature access or full status object
   */
  checkPremiumStatus(feature: string | null = null): boolean | PremiumState {
    const isActive = this.isPremiumActive();
    
    if (!feature) {
      return {
        active: isActive,
        activatedAt: this._state.activatedAt,
        expiresAt: this._state.expiresAt,
        features: this._state.features
      };
    }

    return isActive && (this._state.features[feature] === true);
  }

  /**
   * Subscribe to premium state changes
   * @param callback - Callback function to receive state updates
   * @returns Unsubscribe function
   */
  onStateChange(callback: StateChangeCallback): () => void {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.listeners.add(callback);

    // Immediately call with current state
    try {
      callback(this._state);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[PremiumService] Initial callback error:', error);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get remaining premium time in milliseconds
   * @returns Remaining time or null if unlimited
   */
  getRemainingTime(): number | null {
    if (!this._state.active || !this._state.expiresAt) {
      return null;
    }

    const remaining = this._state.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Check if a specific premium feature is available
   * @param featureName - Name of the feature
   * @returns True if feature is available
   */
  hasFeature(featureName: string): boolean {
    return this.isPremiumActive() && this._state.features[featureName] === true;
  }
}

// Export singleton instance
if (typeof window !== 'undefined') {
  (window as unknown as Window & { premiumService: PremiumService }).premiumService =
    (window as unknown as Window & { premiumService?: PremiumService }).premiumService || new PremiumService();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PremiumService;
}

export default PremiumService;

