'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/features/admin/components/AdminSidebar';
import { AdminHeader } from '@/features/admin/components/AdminHeader';

/**
 * AdminLayout: Protects all /admin/* routes with JWT + admin role
 *
 * Features:
 * - Verifies user authentication via useAuth hook
 * - Redirects to /auth/login if not authenticated
 * - Redirects to / if user is not admin
 * - Displays sidebar navigation for admin pages
 * - Full-width responsive layout
 */
export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Check authentication and authorization
  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (user === null) {
      router.push('/auth/login');
      return;
    }

    // Not admin
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-2 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or not admin - redirect happens above
  if (user === null || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header */}
        <AdminHeader />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
