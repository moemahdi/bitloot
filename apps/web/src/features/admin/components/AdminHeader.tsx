'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Webhook,
  Package,
  Zap,
  DollarSign,
  Flag,
  FileText,
  Layers,
  Settings,
  RefreshCw,
  Bell,
  Search,
  Shield,
  ChevronRight,
  LogOut,
  User,
  HelpCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/design-system/primitives/avatar';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/design-system/primitives/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/design-system/primitives/breadcrumb';
import { cn } from '@/design-system/utils/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

/**
 * Route configuration for admin sections
 * Centralized for maintainability and type-safety
 */
interface RouteConfig {
  path: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  parent?: string;
}

const ADMIN_ROUTES: Record<string, RouteConfig> = {
  '/admin': {
    path: '/admin',
    label: 'Dashboard',
    description: 'Overview & analytics',
    icon: LayoutDashboard,
  },
  '/admin/orders': {
    path: '/admin/orders',
    label: 'Orders',
    description: 'Manage customer orders',
    icon: ShoppingCart,
  },
  '/admin/payments': {
    path: '/admin/payments',
    label: 'Payments',
    description: 'Payment transactions & status',
    icon: CreditCard,
  },
  '/admin/webhooks': {
    path: '/admin/webhooks',
    label: 'Webhooks',
    description: 'IPN logs & verification',
    icon: Webhook,
  },
  '/admin/reservations': {
    path: '/admin/reservations',
    label: 'Reservations',
    description: 'Kinguin order reservations',
    icon: Package,
  },
  '/admin/queues': {
    path: '/admin/queues',
    label: 'Queues',
    description: 'BullMQ job monitoring',
    icon: Zap,
  },
  '/admin/balances': {
    path: '/admin/balances',
    label: 'Balances',
    description: 'Account & wallet balances',
    icon: DollarSign,
  },
  '/admin/flags': {
    path: '/admin/flags',
    label: 'Feature Flags',
    description: 'Runtime feature toggles',
    icon: Flag,
  },
  '/admin/audit': {
    path: '/admin/audit',
    label: 'Audit Logs',
    description: 'Security & action history',
    icon: FileText,
  },
  '/admin/catalog': {
    path: '/admin/catalog',
    label: 'Catalog',
    description: 'Product catalog management',
    icon: Layers,
  },
  '/admin/catalog/products': {
    path: '/admin/catalog/products',
    label: 'Products',
    description: 'Manage product listings',
    icon: Layers,
    parent: '/admin/catalog',
  },
  '/admin/catalog/rules': {
    path: '/admin/catalog/rules',
    label: 'Pricing Rules',
    description: 'Configure pricing strategies',
    icon: Settings,
    parent: '/admin/catalog',
  },
  '/admin/catalog/sync': {
    path: '/admin/catalog/sync',
    label: 'Catalog Sync',
    description: 'Kinguin sync status',
    icon: RefreshCw,
    parent: '/admin/catalog',
  },
};

/**
 * AdminHeader: Top navigation bar for admin panel
 *
 * Features:
 * - Dynamic breadcrumb navigation
 * - User profile with role badge & session status
 * - Quick actions (search, notifications, help)
 * - Security indicator (session status)
 * - Responsive design with mobile support
 * - Accessible with proper ARIA landmarks
 */
export function AdminHeader(): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Get current route configuration
  const currentRoute = useMemo(() => {
    // Check for exact match first
    if (ADMIN_ROUTES[pathname]) {
      return ADMIN_ROUTES[pathname];
    }
    // Check for partial matches (for dynamic routes)
    const matchingPath = Object.keys(ADMIN_ROUTES)
      .filter((path) => path !== '/admin' && pathname.startsWith(path))
      .sort((a, b) => b.length - a.length)[0];

    return matchingPath ? ADMIN_ROUTES[matchingPath] : ADMIN_ROUTES['/admin'];
  }, [pathname]);

  // Build breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const crumbs: RouteConfig[] = [ADMIN_ROUTES['/admin']];

    if (currentRoute.parent) {
      const parentRoute = ADMIN_ROUTES[currentRoute.parent];
      if (parentRoute) crumbs.push(parentRoute);
    }

    if (currentRoute.path !== '/admin') {
      crumbs.push(currentRoute);
    }

    return crumbs;
  }, [currentRoute]);

  // Get user initials for avatar fallback
  const userInitials = useMemo(() => {
    if (!user?.email) return 'AD';
    const parts = user.email.split('@')[0].split(/[._-]/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }, [user?.email]);

  const handleLogout = (): void => {
    logout();
    router.push('/auth/login');
  };

  const handleSearch = (): void => {
    // TODO: Implement command palette (⌘K)
    console.log('Open search...');
  };

  const SectionIcon = currentRoute.icon;

  return (
    <TooltipProvider>
      <header
        role="banner"
        className="sticky top-0 z-40 border-b border-cyan-glow/20 bg-bg-secondary/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg-secondary/60"
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          {/* Left: Breadcrumb & Title */}
          <div className="flex flex-col gap-1 min-w-0">
            {/* Breadcrumb Navigation */}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  const CrumbIcon = crumb.icon;

                  return (
                    <BreadcrumbItem key={crumb.path}>
                      {!isLast ? (
                        <>
                          <BreadcrumbLink asChild>
                            <Link
                              href={crumb.path}
                              className="flex items-center gap-1.5 text-text-secondary hover:text-cyan-glow transition-colors"
                            >
                              <CrumbIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{crumb.label}</span>
                            </Link>
                          </BreadcrumbLink>
                          <BreadcrumbSeparator>
                            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
                          </BreadcrumbSeparator>
                        </>
                      ) : (
                        <BreadcrumbPage className="flex items-center gap-1.5 text-text-primary font-medium">
                          <CrumbIcon className="w-3.5 h-3.5 text-cyan-glow" />
                          <span>{crumb.label}</span>
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Section Title & Description */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                <SectionIcon className="w-5 h-5 text-cyan-glow" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-text-primary tracking-tight">
                  {currentRoute.label}
                </h1>
                <p className="text-xs md:text-sm text-text-secondary hidden sm:block">
                  {currentRoute.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearch}
                  className="hidden md:flex text-text-secondary hover:text-text-primary hover:bg-cyan-glow/10"
                  aria-label="Search (⌘K)"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Search <kbd className="ml-1 px-1 py-0.5 text-xs bg-bg-tertiary rounded">⌘K</kbd></p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-text-secondary hover:text-text-primary hover:bg-cyan-glow/10"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {/* Notification badge - show when there are unread notifications */}
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-warning rounded-full animate-pulse" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>

            {/* Help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex text-text-secondary hover:text-text-primary hover:bg-cyan-glow/10"
                  aria-label="Help & Documentation"
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Help & Docs</p>
              </TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-border-primary/50" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 md:px-3 py-1.5 h-auto hover:bg-cyan-glow/10 focus-visible:ring-cyan-glow"
                  aria-label="User menu"
                >
                  {/* Session Status Indicator */}
                  <div className="relative">
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 border-2 border-cyan-glow/30">
                      <AvatarImage src={undefined} alt={user?.email ?? 'Admin'} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-glow/20 to-accent-purple/20 text-text-primary text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status dot */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-success rounded-full border-2 border-bg-secondary"
                      aria-label="Online"
                    />
                  </div>

                  {/* User Info (hidden on mobile) */}
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                      {user?.email?.split('@')[0] ?? 'Admin'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-cyan-glow" />
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0 text-[10px] font-medium border-cyan-glow/30 text-cyan-glow bg-cyan-glow/5"
                      >
                        {user?.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-bg-secondary border-border-primary">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {user?.email ?? 'admin@bitloot.io'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Role: <span className="text-cyan-glow font-medium">{user?.role ?? 'Admin'}</span>
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-primary/50" />

                <DropdownMenuItem className="cursor-pointer text-text-secondary hover:text-text-primary focus:bg-cyan-glow/10">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer text-text-secondary hover:text-text-primary focus:bg-cyan-glow/10">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Security</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer text-text-secondary hover:text-text-primary focus:bg-cyan-glow/10">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border-primary/50" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-accent-error hover:text-accent-error focus:bg-accent-error/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
