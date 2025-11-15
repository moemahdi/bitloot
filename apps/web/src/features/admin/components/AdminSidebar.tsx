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
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/design-system/primitives/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
  { label: 'Payments', href: '/admin/payments', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Webhooks', href: '/admin/webhooks', icon: <Webhook className="w-5 h-5" /> },
  { label: 'Reservations', href: '/admin/reservations', icon: <Package className="w-5 h-5" /> },
  { label: 'Queues', href: '/admin/queues', icon: <Zap className="w-5 h-5" /> },
  { label: 'Balances', href: '/admin/balances', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Flags', href: '/admin/flags', icon: <Flag className="w-5 h-5" /> },
  { label: 'Audit Log', href: '/admin/audit', icon: <FileText className="w-5 h-5" /> },
];

/**
 * AdminSidebar: Navigation sidebar for admin panel
 * - Shows all admin pages
 * - Active state highlighting
 * - Responsive mobile menu toggle
 */
export function AdminSidebar(): ReactNode {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-card border-r border-border transition-all duration-300 z-30',
          'flex flex-col gap-6 p-6',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo/Title */}
        <div className="flex items-center gap-3 pt-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            B
          </div>
          <div>
            <h1 className="font-bold text-lg">BitLoot Admin</h1>
            <p className="text-xs text-muted-foreground">Control Center</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  'text-sm font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground px-4 py-2">Admin Tools v1.0</p>
        </div>
      </nav>
    </>
  );
}
