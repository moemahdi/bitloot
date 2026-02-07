'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Card, CardContent, CardHeader } from '@/design-system/primitives/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/**
 * Auth Layout: Shared layout for all auth pages (/auth/login, /auth/register, etc.)
 * Handles:
 * - Auth state checking & redirects
 * - Cyberpunk background with animated effects
 * - Header with navigation and Footer with links
 * - Loading skeleton while checking auth
 */
export default function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Get redirect URL from query params (used after guest checkout login)
  const redirectUrl = searchParams.get('redirect') ?? searchParams.get('returnTo') ?? '/profile';

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  // Loading skeleton while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-primary relative overflow-hidden">
        <Header />
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="absolute inset-0 bg-radial-cyan opacity-30" />
        
        <main className="flex-1 flex items-center justify-center z-10">
          <Card className="w-full max-w-md glass border border-cyan-glow/20 shadow-glow-cyan">
            <CardHeader className="space-y-4 pb-6">
              <Skeleton className="h-16 w-16 mx-auto rounded-2xl" />
              <Skeleton className="h-8 w-40 mx-auto" />
              <Skeleton className="h-5 w-56 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // If authenticated, don't render children (redirect happening)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-primary">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-cyan-glow">Redirecting...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render auth page with cyberpunk background
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary relative overflow-hidden">
      <Header />
      
      {/* Animated Cyberpunk Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cyan glow - top right */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-glow/10 rounded-full blur-3xl animate-pulse" />
        {/* Purple glow - bottom left */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-neon/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        {/* Center radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial-cyan opacity-20" />
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--cyan-glow) / 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--cyan-glow) / 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
