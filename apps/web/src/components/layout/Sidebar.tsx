'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/design-system/utils/utils';
import {
    LayoutDashboard,
    Key,
    User,
    LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/profile',
        icon: LayoutDashboard,
    },
    {
        title: 'Digital Keys',
        href: '/profile/my-keys',
        icon: Key,
    },
    {
        title: 'Account Settings',
        href: '/profile/account',
        icon: User,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="hidden w-64 flex-col border-r bg-muted/10 md:flex h-[calc(100vh-4rem)] sticky top-16">
            <div className="flex flex-col gap-2 p-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    );
                })}
            </div>
            <div className="mt-auto p-4 border-t">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
