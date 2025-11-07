/**
 * Backend Connection Utility
 * Handles backend API connections with graceful fallback
 */

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

class BackendConnection {
  private baseURL: string;
  private available = false;
  private checking = false;

  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = baseURL;
  }

  /**
   * Check if backend is available
   */
  async checkAvailability(): Promise<boolean> {
    if (this.checking) {
      return this.available;
    }

    this.checking = true;

    try {
      const response = await fetch(`${this.baseURL}/api/hello`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      this.available = response.ok;
    } catch (error) {
      // Backend not available - this is expected in standalone mode
      this.available = false;
      
      // Backend unavailable - standalone mode active
      // No logging needed per strict rules
    } finally {
      this.checking = false;
    }

    return this.available;
  }

  /**
   * Fetch from backend API with graceful error handling
   */
  async fetch(endpoint: string, options: FetchOptions = {}): Promise<Response | null> {
    // Check availability first (cached)
    if (!this.available && !this.checking) {
      await this.checkAvailability();
    }

    if (!this.available) {
      // Return null instead of throwing - let caller handle gracefully
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      // Network error or timeout
      if (error instanceof Error && error.name !== 'AbortError') {
        // Mark backend as unavailable
        this.available = false;
      }
      
      // Return null instead of throwing
      return null;
    }
  }

  /**
   * Fetch JSON from backend
   */
  async fetchJSON<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T | null> {
    const response = await this.fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response) {
      return null;
    }

    try {
      return await response.json() as T;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse JSON response:', error);
      return null;
    }
  }
}

// Export singleton instance
const backendConnection = new BackendConnection();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackendConnection, backendConnection };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  (window as unknown as Window & { BackendConnection: typeof BackendConnection; backendConnection: BackendConnection })
    .BackendConnection = BackendConnection;
  (window as unknown as Window & { backendConnection: BackendConnection }).backendConnection = backendConnection;
}

export { BackendConnection, backendConnection };
export type { FetchOptions };

