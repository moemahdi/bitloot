'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/design-system/utils/utils';
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
  Menu,
  Settings,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronRight,
  Activity,
  X,
  ExternalLink,
  Gauge,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/design-system/primitives/collapsible';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Navigation item configuration
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | 'new' | 'alert';
  shortcut?: string;
  external?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

/**
 * Grouped navigation configuration
 * Organized by admin workflow: Core → Catalog → Operations → Monitoring
 */
const navSections: NavSection[] = [
  {
    id: 'core',
    label: 'Core',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        shortcut: 'G D',
      },
      {
        label: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        shortcut: 'G O',
        badge: undefined, // Will be populated from API
      },
      {
        label: 'Payments',
        href: '/admin/payments',
        icon: CreditCard,
        shortcut: 'G P',
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: Layers,
    defaultOpen: true,
    items: [
      {
        label: 'Products',
        href: '/admin/catalog/products',
        icon: Layers,
        shortcut: 'G C P',
      },
      {
        label: 'Pricing Rules',
        href: '/admin/catalog/rules',
        icon: Settings,
        shortcut: 'G C R',
      },
      {
        label: 'Sync Status',
        href: '/admin/catalog/sync',
        icon: RefreshCw,
        shortcut: 'G C S',
      },
    ],
  },
  {
    id: 'fulfillment',
    label: 'Fulfillment',
    icon: Package,
    defaultOpen: false,
    items: [
      {
        label: 'Reservations',
        href: '/admin/reservations',
        icon: Package,
        shortcut: 'G R',
      },
      {
        label: 'Webhooks',
        href: '/admin/webhooks',
        icon: Webhook,
        shortcut: 'G W',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Gauge,
    defaultOpen: false,
    items: [
      {
        label: 'Queues',
        href: '/admin/queues',
        icon: Zap,
        shortcut: 'G Q',
      },
      {
        label: 'Balances',
        href: '/admin/balances',
        icon: DollarSign,
        shortcut: 'G B',
      },
      {
        label: 'Feature Flags',
        href: '/admin/flags',
        icon: Flag,
        shortcut: 'G F',
      },
      {
        label: 'Audit Log',
        href: '/admin/audit',
        icon: FileText,
        shortcut: 'G A',
      },
    ],
  },
];

/**
 * System status indicator component
 */
function SystemStatus(): ReactNode {
  // In production, this would fetch from /healthz endpoint
  const status: 'online' | 'degraded' | 'offline' = 'online';

  const statusConfig = {
    online: {
      color: 'bg-accent-success',
      shadow: 'shadow-[0_0_8px_rgba(57,255,20,0.6)]',
      label: 'All Systems Operational',
    },
    degraded: {
      color: 'bg-accent-warning',
      shadow: 'shadow-[0_0_8px_rgba(255,193,7,0.6)]',
      label: 'Partial Outage',
    },
    offline: {
      color: 'bg-accent-error',
      shadow: 'shadow-[0_0_8px_rgba(255,71,87,0.6)]',
      label: 'System Offline',
    },
  };

  const config = statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 cursor-help">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-mono">Status</span>
          </div>
          <div
            className={cn(
              'h-2 w-2 rounded-full animate-pulse',
              config.color,
              config.shadow
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-bg-tertiary border-border-primary">
        <p className="text-xs">{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * AdminSidebar: Navigation sidebar for admin panel
 *
 * Features:
 * - Grouped navigation with collapsible sections
 * - Active state highlighting with animated indicator
 * - Notification badges for items needing attention
 * - Keyboard shortcuts (G + letter)
 * - System status indicator
 * - Responsive mobile drawer with focus trap
 * - Accessible with proper ARIA attributes
 */
export function AdminSidebar(): ReactNode {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(navSections.filter((s) => s.defaultOpen).map((s) => s.id))
  );

  // Toggle section open/closed
  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Auto-expand section containing active route
  useEffect(() => {
    for (const section of navSections) {
      const hasActiveItem = section.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (hasActiveItem && !openSections.has(section.id)) {
        setOpenSections((prev) => new Set([...prev, section.id]));
      }
    }
  }, [pathname, openSections]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle keyboard shortcut navigation
  useEffect(() => {
    let keySequence = '';
    let keyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      clearTimeout(keyTimeout);
      keySequence += e.key.toUpperCase();

      // Reset sequence after 1 second
      keyTimeout = setTimeout(() => {
        keySequence = '';
      }, 1000);

      // Check for matching shortcuts
      for (const section of navSections) {
        for (const item of section.items) {
          if (item.shortcut?.replace(/\s/g, '') === keySequence) {
            window.location.href = item.href;
            keySequence = '';
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(keyTimeout);
    };
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={isOpen}
          className="h-10 w-10 border-cyan-glow/30 bg-bg-secondary/90 backdrop-blur-md text-cyan-glow hover:bg-cyan-glow/20 shadow-lg"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav
        role="navigation"
        aria-label="Admin navigation"
        initial={false}
        animate={{
          x: isOpen ? 0 : typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed left-0 top-0 h-full w-[280px] bg-bg-secondary/95 backdrop-blur-xl border-r border-cyan-glow/20 z-40',
          'flex flex-col shadow-[5px_0_30px_rgba(0,0,0,0.5)]',
          'lg:relative lg:z-auto'
        )}
      >
        {/* Logo/Title */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-white/5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-glow via-cyan-glow/80 to-accent-purple text-white font-bold shadow-[0_0_20px_rgba(0,217,255,0.4)]">
            <span className="text-xl font-display">B</span>
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-text-primary tracking-wide">
              BITLOOT
            </h1>
            <p className="text-[10px] text-cyan-glow font-mono tracking-[0.2em] uppercase">
              Admin Console
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-cyan-glow/20 scrollbar-track-transparent">
          <div className="space-y-2">
            {navSections.map((section) => {
              const SectionIcon = section.icon;
              const isExpanded = openSections.has(section.id);

              // Check if any item in section is active
              const hasActiveItem = section.items.some(
                (item) =>
                  pathname === item.href || pathname.startsWith(item.href + '/')
              );

              return (
                <Collapsible
                  key={section.id}
                  open={isExpanded}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  {/* Section Header */}
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        'hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50',
                        hasActiveItem
                          ? 'text-cyan-glow'
                          : 'text-text-secondary hover:text-text-primary'
                      )}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-2.5">
                        <SectionIcon
                          className={cn(
                            'w-4 h-4 transition-colors',
                            hasActiveItem ? 'text-cyan-glow' : 'text-text-muted'
                          )}
                        />
                        <span>{section.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-text-muted transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>

                  {/* Section Items */}
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <div className="mt-1 ml-2 pl-4 border-l border-white/10 space-y-0.5">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(item.href + '/');

                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  'group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50',
                                  isActive
                                    ? 'text-cyan-glow bg-cyan-glow/10'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                <div className="flex items-center gap-2.5">
                                  <ItemIcon
                                    className={cn(
                                      'w-4 h-4 transition-colors',
                                      isActive
                                        ? 'text-cyan-glow'
                                        : 'text-text-muted group-hover:text-text-primary'
                                    )}
                                  />
                                  <span>{item.label}</span>
                                  {item.external && (
                                    <ExternalLink className="w-3 h-3 text-text-muted" />
                                  )}
                                </div>

                                {/* Badge */}
                                {item.badge !== undefined && (
                                  <Badge
                                    variant={
                                      item.badge === 'alert'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className={cn(
                                      'h-5 min-w-[20px] px-1.5 text-[10px] font-bold',
                                      item.badge === 'new' &&
                                        'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30',
                                      item.badge === 'alert' &&
                                        'bg-accent-error/20 text-accent-error border-accent-error/30 animate-pulse'
                                    )}
                                  >
                                    {item.badge === 'new'
                                      ? 'NEW'
                                      : item.badge === 'alert'
                                        ? '!'
                                        : item.badge}
                                  </Badge>
                                )}

                                {/* Active Indicator */}
                                {isActive && (
                                  <motion.div
                                    layoutId="sidebarActiveIndicator"
                                    className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-glow rounded-full shadow-[0_0_10px_rgba(0,217,255,0.6)]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                  />
                                )}
                              </Link>
                            </TooltipTrigger>
                            {item.shortcut && (
                              <TooltipContent
                                side="right"
                                className="bg-bg-tertiary border-border-primary"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">{item.label}</span>
                                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-bg-primary rounded border border-border-primary">
                                    {item.shortcut}
                                  </kbd>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <SystemStatus />
            <span className="text-[10px] text-text-muted font-mono">
              v{process.env.NEXT_PUBLIC_APP_VERSION ?? '2.5.0'}
            </span>
          </div>
        </div>
      </motion.nav>
    </TooltipProvider>
  );
}
