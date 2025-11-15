'use client';

import type { ReactNode } from 'react';
import { Component, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Button } from '@/design-system/primitives/button';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary: Catches React render errors and displays fallback UI
 *
 * Features:
 * ✅ Catches render errors in child components
 * ✅ Displays user-friendly error message
 * ✅ Provides reset button to recover
 * ✅ Logs errors for debugging
 * ✅ Prevents app crashes
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log to monitoring service (e.g., Sentry)
    if (
      typeof window !== 'undefined' &&
      window.__logErrorToService !== null &&
      window.__logErrorToService !== undefined &&
      typeof window.__logErrorToService === 'function'
    ) {
      window.__logErrorToService(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError && this.state.error !== null && this.state.error !== undefined) {
      if (this.props.fallback !== null && this.props.fallback !== undefined) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="w-full max-w-md">
            <Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-lg">Something went wrong</AlertTitle>
              <AlertDescription className="mt-3 space-y-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {this.state.error.message !== null && this.state.error.message !== undefined && this.state.error.message.length > 0
                    ? this.state.error.message
                    : 'An unexpected error occurred'}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-xs text-red-700 dark:text-red-300 bg-white dark:bg-gray-900 p-2 rounded border border-red-200 dark:border-red-800">
                    <summary className="cursor-pointer font-mono">Stack trace</summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap wrap-break-word">
                      {this.state.error.stack ?? 'No stack trace available'}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={this.handleReset}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try again
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Go home
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Extend window interface for error logging
declare global {
  interface Window {
    __logErrorToService?: (error: Error, errorInfo: ErrorInfo) => void;
  }
}
