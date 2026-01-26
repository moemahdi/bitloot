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
  Star,
  ChevronDown,
  Activity,
  Megaphone,
  Timer,
  Gift,
  Ticket,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/design-system/primitives/dropdown-menu';

// Admin navigation structure with workflow-based grouped menus
const ADMIN_NAV = {
  // Always visible - most frequently accessed
  primary: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: Package },
  ],
  // Financial operations grouped together
  finance: {
    label: 'Finance',
    icon: Wallet,
    items: [
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/balances', label: 'Balances', icon: Wallet },
      { href: '/admin/reservations', label: 'Reservations', icon: BookOpen },
    ],
  },
  // Product & catalog management
  catalog: {
    label: 'Catalog',
    icon: ShoppingBag,
    items: [
      { href: '/admin/catalog', label: 'Overview', icon: ShoppingBag },
      { href: '/admin/catalog/products', label: 'Products', icon: Boxes },
      { href: '/admin/catalog/groups', label: 'Groups', icon: Layers },
      { href: '/admin/catalog/import', label: 'Import', icon: Crown },
      { href: '/admin/catalog/rules', label: 'Pricing Rules', icon: Settings },
      { href: '/admin/catalog/sync', label: 'Sync Status', icon: RefreshCw },
    ],
  },
  // Marketing & homepage customization
  marketing: {
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { href: '/admin/marketing/sections', label: 'Homepage Sections', icon: LayoutDashboard },
      { href: '/admin/marketing/flash-deals', label: 'Flash Deals', icon: Timer },
      { href: '/admin/marketing/bundles', label: 'Bundles', icon: Gift },
      { href: '/admin/promos', label: 'Promo Codes', icon: Ticket },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
    ],
  },
  // System monitoring & operations
  operations: {
    label: 'Operations',
    icon: Activity,
    items: [
      { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
      { href: '/admin/queues', label: 'Job Queues', icon: ListOrdered },
      { href: '/admin/flags', label: 'Feature Flags', icon: ToggleLeft },
      { href: '/admin/config', label: 'API Config', icon: Settings },
      { href: '/admin/audit', label: 'Audit Logs', icon: ClipboardList },
    ],
  },
} as const;

// Helper to check if any item in a dropdown is active
const isDropdownActive = (items: readonly { href: string }[], pathname: string): boolean => {
  return items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
};

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
            <div className="absolute -inset-4 animate-pulse-ring rounded-full bg-cyan-glow/20 shadow-glow-cyan-lg" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-glow/30 bg-bg-secondary shadow-glow-cyan-sm">
              <Zap className="h-8 w-8 animate-glow-pulse text-cyan-glow" fill="currentColor" />
            </div>
          </div>
          <p className="text-sm text-text-muted animate-fade-in">Verifying admin access...</p>
          <Loader2 className="h-5 w-5 animate-spin-glow text-cyan-glow" />
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
        <div className="text-center space-y-4 max-w-sm px-6 animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center border border-accent-error/30 shadow-glow-error">
            <Icon className="w-8 h-8 text-accent-error animate-glow-pulse" />
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
      <div className="sticky top-0 z-50 border-b border-border-subtle glass-strong shadow-card-md">
        <div className="container mx-auto px-4">
          <nav
            className="flex gap-1 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-cyan-glow/30 scrollbar-track-transparent hover:scrollbar-thumb-cyan-glow/50"
            role="navigation"
            aria-label="Admin navigation"
          >
            {/* Primary Tabs */}
            {ADMIN_NAV.primary.map((tab) => {
              const Icon = tab.icon;
              const isActive = isActiveTab(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                    'transition-all duration-200 ease-out',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                    isActive
                      ? 'bg-cyan-glow/10 text-cyan-glow shadow-glow-cyan-sm border border-cyan-glow/20'
                      : 'text-text-muted hover:text-cyan-glow hover:bg-bg-secondary/50 hover:shadow-glow-cyan-sm border border-transparent hover:border-border-accent'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-all duration-200',
                      isActive ? 'text-cyan-glow' : 'text-text-secondary group-hover:text-cyan-glow'
                    )}
                  />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </Link>
              );
            })}

            {/* Finance Dropdown - Orange theme */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  'transition-all duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-warning/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                  isDropdownActive(ADMIN_NAV.finance.items, pathname)
                    ? 'bg-orange-warning/10 text-orange-warning shadow-glow-error border border-orange-warning/20'
                    : 'text-text-muted hover:text-orange-warning hover:bg-bg-secondary/50 hover:shadow-glow-error border border-transparent hover:border-border-accent'
                )}
              >
                <Wallet
                  className={cn(
                    'h-4 w-4 transition-all duration-200',
                    isDropdownActive(ADMIN_NAV.finance.items, pathname)
                      ? 'text-orange-warning'
                      : 'text-text-secondary group-hover:text-orange-warning'
                  )}
                />
                <span className="whitespace-nowrap">{ADMIN_NAV.finance.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    'group-data-[state=open]:rotate-180'
                  )}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="glass-strong border-border-accent shadow-card-lg min-w-[200px] animate-scale-in"
              >
                <DropdownMenuLabel className="text-orange-warning font-semibold text-xs uppercase tracking-wider">
                  Finance & Billing
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-subtle" />
                {ADMIN_NAV.finance.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 cursor-pointer',
                          'transition-all duration-200',
                          'focus:bg-orange-warning/10 focus:text-orange-warning',
                          isActive
                            ? 'bg-orange-warning/10 text-orange-warning'
                            : 'text-text-secondary hover:text-orange-warning hover:bg-bg-tertiary/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-warning animate-glow-pulse" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Catalog Dropdown - Purple theme */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  'transition-all duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-neon/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                  isDropdownActive(ADMIN_NAV.catalog.items, pathname)
                    ? 'bg-purple-neon/10 text-purple-neon shadow-glow-purple-sm border border-purple-neon/20'
                    : 'text-text-muted hover:text-purple-neon hover:bg-bg-secondary/50 hover:shadow-glow-purple-sm border border-transparent hover:border-border-accent'
                )}
              >
                <ShoppingBag
                  className={cn(
                    'h-4 w-4 transition-all duration-200',
                    isDropdownActive(ADMIN_NAV.catalog.items, pathname)
                      ? 'text-purple-neon'
                      : 'text-text-secondary group-hover:text-purple-neon'
                  )}
                />
                <span className="whitespace-nowrap">{ADMIN_NAV.catalog.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    'group-data-[state=open]:rotate-180'
                  )}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="glass-strong border-border-accent shadow-card-lg min-w-[200px] animate-scale-in"
              >
                <DropdownMenuLabel className="text-purple-neon font-semibold text-xs uppercase tracking-wider">
                  Catalog Management
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-subtle" />
                {ADMIN_NAV.catalog.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 cursor-pointer',
                          'transition-all duration-200',
                          'focus:bg-purple-neon/10 focus:text-purple-neon',
                          isActive
                            ? 'bg-purple-neon/10 text-purple-neon shadow-glow-purple-sm'
                            : 'text-text-secondary hover:text-purple-neon hover:bg-bg-tertiary/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-neon shadow-glow-purple-sm" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Marketing Dropdown - Orange theme */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  'transition-all duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                  isDropdownActive(ADMIN_NAV.marketing.items, pathname)
                    ? 'bg-orange-500/10 text-orange-400 shadow-glow-warning border border-orange-500/20'
                    : 'text-text-muted hover:text-orange-400 hover:bg-bg-secondary/50 hover:shadow-glow-warning border border-transparent hover:border-border-accent'
                )}
              >
                <Megaphone
                  className={cn(
                    'h-4 w-4 transition-all duration-200',
                    isDropdownActive(ADMIN_NAV.marketing.items, pathname)
                      ? 'text-orange-400'
                      : 'text-text-secondary group-hover:text-orange-400'
                  )}
                />
                <span className="whitespace-nowrap">{ADMIN_NAV.marketing.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    'group-data-[state=open]:rotate-180'
                  )}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="glass-strong border-border-accent shadow-card-lg min-w-[200px] animate-scale-in"
              >
                <DropdownMenuLabel className="text-orange-400 font-semibold text-xs uppercase tracking-wider">
                  Marketing & Promos
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-subtle" />
                {ADMIN_NAV.marketing.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 cursor-pointer',
                          'transition-all duration-200',
                          'focus:bg-orange-500/10 focus:text-orange-400',
                          isActive
                            ? 'bg-orange-500/10 text-orange-400 shadow-glow-warning'
                            : 'text-text-secondary hover:text-orange-400 hover:bg-bg-tertiary/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-400 shadow-glow-warning" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Operations Dropdown - Green theme */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  'transition-all duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-success/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                  isDropdownActive(ADMIN_NAV.operations.items, pathname)
                    ? 'bg-green-success/10 text-green-success shadow-glow-success border border-green-success/20'
                    : 'text-text-muted hover:text-green-success hover:bg-bg-secondary/50 hover:shadow-glow-success border border-transparent hover:border-border-accent'
                )}
              >
                <Activity
                  className={cn(
                    'h-4 w-4 transition-all duration-200',
                    isDropdownActive(ADMIN_NAV.operations.items, pathname)
                      ? 'text-green-success'
                      : 'text-text-secondary group-hover:text-green-success'
                  )}
                />
                <span className="whitespace-nowrap">{ADMIN_NAV.operations.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    'group-data-[state=open]:rotate-180'
                  )}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="glass-strong border-border-accent shadow-card-lg min-w-[200px] animate-scale-in"
              >
                <DropdownMenuLabel className="text-green-success font-semibold text-xs uppercase tracking-wider">
                  System & Operations
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-subtle" />
                {ADMIN_NAV.operations.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 cursor-pointer',
                          'transition-all duration-200',
                          'focus:bg-green-success/10 focus:text-green-success',
                          isActive
                            ? 'bg-green-success/10 text-green-success shadow-glow-success'
                            : 'text-text-secondary hover:text-green-success hover:bg-bg-tertiary/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-success shadow-glow-success" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Note: Standalone items removed - all moved to dropdowns */}
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
        <div className="container mx-auto px-4 py-6 lg:py-8 animate-fade-in">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
