'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/primitives/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface AdminNavProps {
  currentPath: string;
}

const ADMIN_MENU_ITEMS = [
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/payments', label: 'Payments', icon: '💳' },
  { href: '/admin/webhooks', label: 'Webhooks', icon: '🔔' },
  { href: '/admin/reservations', label: 'Reservations', icon: '🎫' },
  { href: '/admin/queues', label: 'Queues', icon: '⏳' },
  { href: '/admin/balances', label: 'Balances', icon: '💰' },
  { href: '/admin/flags', label: 'Feature Flags', icon: '🚩' },
  { href: '/admin/audit', label: 'Audit Logs', icon: '📋' },
];

// AdminNav: Sidebar navigation for admin dashboard
// Features:
// - 8 admin menu items with icons
// - Active link highlighting
// - User profile dropdown with logout
// - Mobile-responsive (collapse on small screens)
export function AdminNav({ currentPath }: AdminNavProps): ReactNode {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = (): void => {
    logout();
    router.push('/auth/login');
  };

  return (
    <nav className="flex h-full flex-col">
      {/* Menu Items */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ADMIN_MENU_ITEMS.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* User Menu */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <span className="text-lg">👤</span>
              <span className="ml-2 flex-1 text-left">Admin</span>
              <span className="text-xs">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <span>🚪 Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
