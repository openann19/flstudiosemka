/**
 * Premium Subscription Service
 * Manages premium feature activation/deactivation with localStorage persistence
 * and event system for state changes.
 * @module services/premiumService
 */

/**
 * Premium state
 */
export interface PremiumState {
  active: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  features: Record<string, boolean>;
}

/**
 * Activation options
 */
export interface ActivationOptions {
  duration?: number | null;
  features?: Record<string, boolean>;
}

/**
 * Premium status
 */
export interface PremiumStatus {
  active: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  features: Record<string, boolean>;
}

/**
 * State change callback
 */
export type StateChangeCallback = (state: PremiumState) => void;

/**
 * PremiumService - Premium subscription service
 * Manages premium feature activation/deactivation with localStorage persistence
 * and event system for state changes.
 */
export class PremiumService {
  private readonly STORAGE_KEY: string;
  private listeners: Set<StateChangeCallback>;
  private _state: PremiumState;

  constructor() {
    this.STORAGE_KEY = 'vocal_studio_premium';
    this.listeners = new Set();
    this._state = this._loadState();
  }

  /**
   * Load premium state from localStorage
   * @returns {PremiumState} Premium state object
   */
  private _loadState(): PremiumState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PremiumState>;
        return {
          active: parsed.active === true,
          activatedAt: parsed.activatedAt || null,
          expiresAt: parsed.expiresAt || null,
          features: parsed.features || {},
        };
      }
    } catch (error) {
      // Ignore errors
    }
    return {
      active: false,
      activatedAt: null,
      expiresAt: null,
      features: {},
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
      // Ignore errors
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
        // Ignore listener errors
      }
    });
  }

  /**
   * Check if premium is currently active
   * @returns {boolean} True if premium is active
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
   * @param {ActivationOptions} options - Activation options
   * @returns {boolean} True if activation successful
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
        ...features,
      },
    };

    this._saveState();
    this._emitChange();
    return true;
  }

  /**
   * Deactivate premium subscription
   * @returns {boolean} True if deactivation successful
   */
  deactivatePremium(): boolean {
    this._state = {
      active: false,
      activatedAt: this._state.activatedAt,
      expiresAt: null,
      features: {},
    };

    this._saveState();
    this._emitChange();
    return true;
  }

  /**
   * Check premium status (with optional feature check)
   * @param {string | null} feature - Optional feature name to check
   * @returns {boolean | PremiumStatus} Feature access or full status object
   */
  checkPremiumStatus(feature: string | null = null): boolean | PremiumStatus {
    const isActive = this.isPremiumActive();

    if (!feature) {
      return {
        active: isActive,
        activatedAt: this._state.activatedAt,
        expiresAt: this._state.expiresAt,
        features: this._state.features,
      };
    }

    return isActive && this._state.features[feature] === true;
  }

  /**
   * Subscribe to premium state changes
   * @param {StateChangeCallback} callback - Callback function to receive state updates
   * @returns {Function} Unsubscribe function
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
      // Ignore initial callback errors
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get remaining premium time in milliseconds
   * @returns {number | null} Remaining time or null if unlimited
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
   * @param {string} featureName - Name of the feature
   * @returns {boolean} True if feature is available
   */
  hasFeature(featureName: string): boolean {
    return (
      this.isPremiumActive() && this._state.features[featureName] === true
    );
  }
}

// Export singleton instance
let premiumServiceInstance: PremiumService | null = null;

if (typeof window !== 'undefined') {
  premiumServiceInstance =
    (window as unknown as { premiumService?: PremiumService })
      .premiumService || new PremiumService();
  (window as unknown as { premiumService: PremiumService }).premiumService =
    premiumServiceInstance;
}

export const premiumService = premiumServiceInstance || new PremiumService();

