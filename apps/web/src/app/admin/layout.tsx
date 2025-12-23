'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/features/admin/components/AdminSidebar';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { cn } from '@/design-system/utils/utils';
import { ShieldAlert, LogOut } from 'lucide-react';

/**
 * Branded loading skeleton for admin panel
 * Shows app shell structure while authenticating
 */
function AdminLoadingSkeleton(): ReactNode {
  return (
    <div className="flex h-screen bg-bg-primary" role="status" aria-label="Loading admin panel">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:flex w-[280px] flex-col bg-bg-secondary/95 border-r border-cyan-glow/20">
        {/* Logo skeleton */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-white/5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-accent-purple/20 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-2.5 w-24 bg-cyan-glow/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Nav items skeleton */}
        <div className="flex-1 p-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse" />
              <div className="ml-6 space-y-1">
                {[...Array(3)].map((_, j) => (
                  <div
                    key={j}
                    className="h-7 w-4/5 bg-white/5 rounded animate-pulse"
                    style={{ animationDelay: `${(i * 3 + j) * 100}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer skeleton */}
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-cyan-glow/30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-16 border-b border-white/10 bg-bg-secondary/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-cyan-glow/20 rounded animate-pulse" />
            <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-bg-secondary/50 rounded-xl border border-white/10 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <div className="h-64 bg-bg-secondary/50 rounded-xl border border-white/10 animate-pulse" />
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Verifying admin credentials...</span>
    </div>
  );
}

/**
 * Redirect state component with user feedback
 */
function RedirectingState({
  reason,
  destination,
}: {
  reason: 'unauthenticated' | 'unauthorized';
  destination: string;
}): ReactNode {
  const messages = {
    unauthenticated: {
      icon: LogOut,
      title: 'Session Required',
      description: 'Please sign in to access the admin panel.',
    },
    unauthorized: {
      icon: ShieldAlert,
      title: 'Access Denied',
      description: 'You do not have admin privileges.',
    },
  };

  const { icon: Icon, title, description } = messages[reason];

  return (
    <div
      className="flex h-screen items-center justify-center bg-bg-primary"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center space-y-4 max-w-sm px-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent-error/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-accent-error" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-glow border-t-transparent" />
          <span>Redirecting to {destination}...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminLayout: Protects all /admin/* routes with JWT + admin role
 *
 * Features:
 * - Verifies user authentication via useAuth hook
 * - Branded loading skeleton during auth check
 * - Clear feedback before auth redirects
 * - Accessible with proper ARIA landmarks
 * - Skip-to-content link for keyboard users
 * - Responsive sidebar + header layout
 *
 * Security:
 * - Redirects to /auth/login if not authenticated
 * - Redirects to / if user is not admin
 * - Never renders admin content for unauthorized users
 */
export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [redirectReason, setRedirectReason] = useState<'unauthenticated' | 'unauthorized' | null>(
    null
  );

  // Check authentication and authorization
  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (user === null) {
      setRedirectReason('unauthenticated');
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 1500); // Brief delay to show feedback
      return () => clearTimeout(timer);
    }

    // Not admin
    if (user?.role !== 'admin') {
      setRedirectReason('unauthorized');
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  // Show branded loading skeleton during auth check
  if (isLoading) {
    return <AdminLoadingSkeleton />;
  }

  // Show redirect feedback before navigation
  if (redirectReason === 'unauthenticated') {
    return <RedirectingState reason="unauthenticated" destination="login" />;
  }

  if (redirectReason === 'unauthorized' || user?.role !== 'admin') {
    return <RedirectingState reason="unauthorized" destination="home" />;
  }

  // Not authenticated - should not reach here but safety check
  if (user === null) {
    return null;
  }

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Skip to main content - Accessibility */}
      <a
        href="#admin-main-content"
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:z-50',
          'focus:top-4 focus:left-4 focus:px-4 focus:py-2',
          'focus:bg-cyan-glow focus:text-bg-primary focus:rounded-lg',
          'focus:font-medium focus:text-sm focus:outline-none',
          'focus:shadow-[0_0_20px_rgba(0,217,255,0.5)]'
        )}
      >
        Skip to main content
      </a>

      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header */}
        <AdminHeader />

        {/* Page Content */}
        <main
          id="admin-main-content"
          className="flex-1 overflow-auto focus:outline-none"
          tabIndex={-1}
          role="main"
          aria-label="Admin page content"
        >
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
