/**
 * ErrorBoundary - Error boundary component for graceful error recovery
 * @module components/ErrorBoundary
 */

import React, { Component, type ReactNode } from 'react';

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error
   */
  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Render error UI or children
   */
  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '16px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-red)',
            borderRadius: '4px',
            color: 'var(--fl-text-primary)',
          }}
        >
          <h3 style={{ color: 'var(--fl-red)', marginTop: 0 }}>Something went wrong</h3>
          <p style={{ color: 'var(--fl-text-secondary)', fontSize: '11px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              background: 'var(--fl-orange)',
              border: 'none',
              color: '#000',
              fontSize: '10px',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

