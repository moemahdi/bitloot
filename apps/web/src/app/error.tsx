'use client';

import { useEffect } from 'react';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { AlertTriangle, Home, RefreshCw, Shield, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-dark z-50">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-neon/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md glass border border-red-500/20 shadow-lg animate-fade-in">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 rounded-full bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-text-primary">
              Something went wrong
            </CardTitle>
            <p className="text-sm text-text-muted">
              We encountered an unexpected error while processing your request.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-4 rounded-lg bg-bg-secondary/50 border border-border-subtle overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Debug Info
                </span>
              </div>
              <pre className="text-xs font-mono text-red-400/80 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.digest && (
                <p className="mt-2 text-xs text-text-muted">
                  Error ID: <code className="text-purple-neon">{error.digest}</code>
                </p>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-green-success/10 border border-green-success/30">
            <Shield className="w-3.5 h-3.5 text-green-success" />
            <span className="text-xs text-green-success font-medium">
              Your data remains secure
            </span>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-text-muted">
            If this problem persists, please{' '}
            <Link href="/support" className="text-cyan-glow hover:text-cyan-300 underline underline-offset-2 transition-colors">
              contact support
            </Link>
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          {/* Primary Action */}
          <Button 
            onClick={() => reset()}
            variant="outline"
            className="w-full h-11 gap-2 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/60 hover:text-cyan-300 font-medium transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>

          {/* Secondary Actions */}
          <div className="flex gap-3 w-full">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="flex-1 h-10 gap-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Link href="/support" className="flex-1">
              <Button 
                variant="ghost" 
                className="w-full h-10 gap-2 text-text-muted hover:text-purple-neon hover:bg-purple-neon/10 transition-all duration-200"
              >
                <HelpCircle className="w-4 h-4" />
                Support
              </Button>
            </Link>
          </div>
        </CardFooter>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
      </Card>
    </div>
  );
}
