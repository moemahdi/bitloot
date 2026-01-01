'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/design-system/utils/utils';
import {
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  Package,
  CreditCard,
  Webhook,
  BookOpen,
  Boxes,
  ToggleLeft,
  ListOrdered,
  Wallet,
  ClipboardList,
  ShoppingBag,
  Settings,
  RefreshCw,
  Zap,
  Loader2,
  Crown,
  Layers,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Admin navigation tabs configuration
const ADMIN_TABS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/admin/reservations', label: 'Reservations', icon: BookOpen },
  { href: '/admin/catalog', label: 'Catalog', icon: ShoppingBag },
  { href: '/admin/catalog/products', label: 'Products', icon: Boxes },
  { href: '/admin/catalog/groups', label: 'Groups', icon: Layers },
  { href: '/admin/catalog/import', label: 'Import', icon: Crown },
  { href: '/admin/catalog/rules', label: 'Pricing', icon: Settings },
  { href: '/admin/catalog/sync', label: 'Sync', icon: RefreshCw },
  { href: '/admin/flags', label: 'Flags', icon: ToggleLeft },
  { href: '/admin/queues', label: 'Queues', icon: ListOrdered },
  { href: '/admin/balances', label: 'Balances', icon: Wallet },
  { href: '/admin/audit', label: 'Audit', icon: ClipboardList },
] as const;

/**
 * Branded loading skeleton for admin panel
 */
function AdminLoadingSkeleton(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 animate-ping rounded-full bg-cyan-glow/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-glow/30 bg-bg-secondary">
              <Zap className="h-8 w-8 animate-pulse text-cyan-glow" fill="currentColor" />
            </div>
          </div>
          <p className="text-sm text-text-muted">Verifying admin access...</p>
          <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
        </div>
      </main>
      <Footer />
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
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent-error/10 flex items-center justify-center border border-accent-error/30">
            <Icon className="w-8 h-8 text-accent-error" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
            <p className="text-sm text-text-secondary">{description}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-glow" />
            <span>Redirecting to {destination}...</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/**
 * AdminLayout: Tab-based navigation for admin dashboard
 *
 * Features:
 * - 13 navigation tabs for all admin sections
 * - Active tab highlighting with cyan glow
 * - Horizontal scrollable tabs on mobile
 * - Header + Footer from main layout
 * - No sidebar - cleaner single-page feel
 */
export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [redirectReason, setRedirectReason] = useState<'unauthenticated' | 'unauthorized' | null>(
    null
  );

  // Check authentication and authorization
  useEffect(() => {
    if (isLoading) return;

    if (user === null) {
      setRedirectReason('unauthenticated');
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (user?.role !== 'admin') {
      setRedirectReason('unauthorized');
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  // Show loading skeleton during auth check
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

  if (user === null) {
    return null;
  }

  // Check if current path matches a tab
  const isActiveTab = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-dark">
      <Header />

      {/* Admin Tabs Navigation */}
      <div className="sticky top-0 z-40 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <nav
            className="flex gap-1 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent"
            role="tablist"
            aria-label="Admin navigation"
          >
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = isActiveTab(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                    isActive
                      ? 'bg-cyan-glow/10 text-cyan-glow shadow-[0_0_12px_rgba(0,217,255,0.15)]'
                      : 'text-text-muted hover:bg-bg-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <main
        id="admin-main-content"
        className="flex-1 focus:outline-none"
        tabIndex={-1}
        role="main"
        aria-label="Admin page content"
      >
        <div className="container mx-auto px-4 py-6 lg:py-8">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
