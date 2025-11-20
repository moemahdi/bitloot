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
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/design-system/primitives/button';
import { motion } from 'framer-motion';

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

  // Catalog Management Section
  { label: 'Catalog Rules', href: '/admin/catalog/rules', icon: <Settings className="w-5 h-5" /> },
  { label: 'Catalog Sync', href: '/admin/catalog/sync', icon: <RefreshCw className="w-5 h-5" /> },
  { label: 'Products', href: '/admin/catalog/products', icon: <Layers className="w-5 h-5" /> },

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
          className="border-cyan-glow/30 bg-bg-secondary/80 backdrop-blur-md text-cyan-glow hover:bg-cyan-glow/20"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-bg-secondary/95 backdrop-blur-xl border-r border-cyan-glow/20 transition-all duration-300 z-30 shadow-[5px_0_30px_rgba(0,0,0,0.5)]',
          'flex flex-col gap-6 p-6',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo/Title */}
        <div className="flex items-center gap-3 pt-4 pb-2">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-glow to-purple-glow text-white font-bold shadow-[0_0_15px_rgba(0,217,255,0.5)]">
            <span className="text-lg">B</span>
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-text-primary tracking-wide">BITLOOT</h1>
            <p className="text-xs text-cyan-glow font-mono tracking-wider">ADMIN CONSOLE</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-glow/20 scrollbar-track-transparent">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block relative group"
              >
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative z-10',
                    'text-sm font-medium',
                    isActive
                      ? 'text-cyan-glow bg-cyan-glow/10 shadow-[0_0_10px_rgba(0,217,255,0.1)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
                  )}
                >
                  <span className={cn("transition-colors duration-200", isActive ? "text-cyan-glow" : "text-text-muted group-hover:text-text-primary")}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-glow rounded-full shadow-[0_0_8px_#00d9ff]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-text-muted font-mono">v2.4.0-NEON</p>
            <div className="h-2 w-2 rounded-full bg-green-success shadow-[0_0_5px_#39FF14] animate-pulse" />
          </div>
        </div>
      </nav>
    </>
  );
}
