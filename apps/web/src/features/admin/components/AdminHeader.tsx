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
    return 'Admin Panel';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Section Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getSectionName()}</h1>
          <p className="text-sm text-muted-foreground">Manage your BitLoot platform</p>
        </div>

        {/* User Navigation */}
        <div className="flex items-center gap-4">
          <AdminNav currentPath={pathname} />
        </div>
      </div>
    </header>
  );
}
