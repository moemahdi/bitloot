'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Home,
  LogIn,
} from 'lucide-react';

/**
 * Cancel Deletion Page
 *
 * Handles account deletion cancellation via secure token from email.
 * Works without requiring authentication (public endpoint).
 * Placed outside /auth folder to bypass auth layout redirect.
 *
 * Status states:
 * - loading: Processing token
 * - success: Deletion cancelled
 * - already_cancelled: Was already cancelled
 * - expired: Token expired
 * - invalid: Token invalid
 * - error: Server error
 */

type CancellationStatus =
  | 'loading'
  | 'success'
  | 'already_cancelled'
  | 'expired'
  | 'invalid'
  | 'error';

interface CancellationResult {
  status: CancellationStatus;
  message: string;
  email?: string;
  cancelledAt?: string;
}

// Get API base URL from environment
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function CancelDeletionPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = params.token as string;
  
  // Prevent double execution in React 18 Strict Mode
  const hasExecutedRef = useRef(false);

  const [result, setResult] = useState<CancellationResult>({
    status: 'loading',
    message: 'Processing your request...',
  });

  const cancelDeletion = useCallback(async () => {
    // Prevent double execution
    if (hasExecutedRef.current) {
      return;
    }
    hasExecutedRef.current = true;
    
    if (!token) {
      setResult({
        status: 'invalid',
        message: 'No cancellation token provided.',
      });
      return;
    }

    try {
      // Call public endpoint (no auth required)
      const response = await fetch(
        `${API_BASE_URL}/auth/account/delete/cancel/${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const data = (await response.json()) as CancellationResult;

      setResult({
        status: data.status,
        message: data.message,
        email: data.email,
        cancelledAt: data.cancelledAt,
      });
    } catch (error: unknown) {
      console.error('Cancellation error:', error);
      setResult({
        status: 'error',
        message:
          'An unexpected error occurred. Please try again or contact support.',
      });
    }
  }, [token]);

  useEffect(() => {
    void cancelDeletion();
  }, [cancelDeletion]);

  // Status-specific content rendering
  const renderStatusContent = () => {
    switch (result.status) {
      case 'loading':
        return (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-cyan-glow/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-cyan-glow animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-text-primary">
              Processing...
            </CardTitle>
            <CardDescription className="text-center text-text-secondary">
              Please wait while we process your cancellation request.
            </CardDescription>
          </>
        );

      case 'success':
        return (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-green-500">
              Deletion Cancelled!
            </CardTitle>
            <CardDescription className="text-center text-text-secondary">
              {result.message}
            </CardDescription>
            {result.email && (
              <p className="text-center text-sm text-text-tertiary">
                Account: {result.email}
              </p>
            )}
          </>
        );

      case 'already_cancelled':
        return (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-cyan-glow/20 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-cyan-glow" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-cyan-glow">
              Already Cancelled
            </CardTitle>
            <CardDescription className="text-center text-text-secondary">
              {result.message}
            </CardDescription>
            {result.email && (
              <p className="text-center text-sm text-text-tertiary">
                Account: {result.email}
              </p>
            )}
          </>
        );

      case 'expired':
        return (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-yellow-500">
              Link Expired
            </CardTitle>
            <CardDescription className="text-center text-text-secondary">
              {result.message}
            </CardDescription>
            <p className="text-center text-sm text-text-tertiary">
              You can still cancel the deletion by logging in to your account.
            </p>
          </>
        );

      case 'invalid':
        return (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-red-500">
              Invalid Link
            </CardTitle>
            <CardDescription className="text-center text-text-secondary">
              {result.message}
            </CardDescription>
          </>
        );

      case 'error':
        return (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-red-500">
              Something Went Wrong
            </CardTitle>
            <CardDescription className="text-center text-text-secondary">
              {result.message}
            </CardDescription>
          </>
        );
    }
  };

  // Status-specific action buttons
  const renderActions = () => {
    switch (result.status) {
      case 'loading':
        return null;

      case 'success':
      case 'already_cancelled':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/')}
              className="flex-1 bg-cyan-glow hover:bg-cyan-glow/90 text-bg-primary"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                // Invalidate deletion status cache before navigating
                await queryClient.invalidateQueries({ queryKey: ['deletion-status'] });
                router.push('/profile');
              }}
              className="flex-1 border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10"
            >
              View Profile
            </Button>
          </div>
        );

      case 'expired':
      case 'invalid':
      case 'error':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/auth/login')}
              className="flex-1 bg-cyan-glow hover:bg-cyan-glow/90 text-bg-primary"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1 border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Homepage
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary relative overflow-hidden">
      <Header />

      {/* Animated Cyberpunk Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated glow orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-glow/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-neon/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        {/* Radial gradient overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial-cyan opacity-20" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(0, 255, 255) 1px, transparent 1px), linear-gradient(to bottom, rgb(0, 255, 255) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass border border-cyan-glow/20 shadow-glow-cyan">
            <CardHeader className="space-y-4 pb-6 text-center">
              {renderStatusContent()}
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              {renderActions()}

              {/* Support link - shown for all completed states */}
              {result.status !== 'loading' && (
                <p className="text-center text-sm text-text-tertiary">
                  Need help?{' '}
                  <Link
                    href="/support"
                    className="text-cyan-glow hover:underline"
                  >
                    Contact Support
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
