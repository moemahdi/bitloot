'use client';

import type { ReactNode } from 'react';
import { AdminNav } from './AdminNav';
import { usePathname } from 'next/navigation';

/**
 * AdminHeader: Top navigation bar for admin panel
 * - Displays current section title
 * - User profile dropdown (via AdminNav)
 * - Responsive design
 */
export function AdminHeader(): ReactNode {
  const pathname = usePathname();

  // Get current section name from pathname
  const getSectionName = (): string => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname.includes('/orders')) return 'Orders';
    if (pathname.includes('/payments')) return 'Payments';
    if (pathname.includes('/webhooks')) return 'Webhooks';
    if (pathname.includes('/reservations')) return 'Reservations';
    if (pathname.includes('/queues')) return 'Queues';
    if (pathname.includes('/balances')) return 'Balances';
    if (pathname.includes('/flags')) return 'Feature Flags';
    if (pathname.includes('/audit')) return 'Audit Logs';
    if (pathname.includes('/catalog')) return 'Catalog Management';
    return 'Admin Panel';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-glow/20 bg-bg-secondary/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg-secondary/60 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Section Title */}
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight drop-shadow-[0_0_10px_rgba(0,217,255,0.1)]">
            {getSectionName()}
          </h1>
          <p className="text-sm text-text-secondary">Manage your BitLoot platform</p>
        </div>

        {/* User Navigation */}
        <div className="flex items-center gap-4">
          <AdminNav currentPath={pathname} />
        </div>
      </div>
    </header>
  );
}
