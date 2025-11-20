'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Card, CardContent } from '@/design-system/primitives/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <Card className="bg-bg-secondary border-error/30 shadow-xl shadow-error/10">
          <CardContent className="p-8 text-center">
            {/* Error Icon with Shake Animation */}
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1]
              }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center"
            >
              <AlertTriangle className="w-10 h-10 text-error" />
            </motion.div>

            {/* Error Title */}
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              Oops! Something went wrong
            </h2>

            {/* Error Message */}
            <p className="text-text-secondary mb-2">
              {error?.message || 'An unexpected error occurred'}
            </p>

            {/* Technical Details (development only) */}
            {process.env.NODE_ENV === 'development' && error?.stack && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-text-muted hover:text-cyan-glow mb-2 transition-colors">
                  Technical Details
                </summary>
                <pre className="text-xs bg-bg-tertiary p-3 rounded-lg overflow-auto max-h-40 text-text-muted font-mono border border-border-subtle">
                  {error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <GlowButton
                onClick={resetError}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </GlowButton>

              <GlowButton
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => window.location.href = '/'}
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </GlowButton>
            </div>

            {/* Help Text */}
            <p className="text-xs text-text-muted mt-6">
              If this problem persists, please contact support
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export { ErrorFallback };
