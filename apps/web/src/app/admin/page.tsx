'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { BarChart3, ShoppingCart, CreditCard, Webhook } from 'lucide-react';

/**
 * Admin Dashboard: Main admin panel overview
 *
 * Features:
 * - Quick stats cards (orders, payments, webhooks, reservations)
 * - Quick navigation links
 * - Protected by admin role
 */
export default function AdminDashboard(): ReactNode {
  const { isLoading, isAdmin } = useAdminGuard();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your BitLoot operations and key metrics
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value="—"
          description="Order management"
          icon={<ShoppingCart className="w-5 h-5" />}
          href="/admin/orders"
        />
        <StatCard
          title="Payments"
          value="—"
          description="Payment tracking"
          icon={<CreditCard className="w-5 h-5" />}
          href="/admin/payments"
        />
        <StatCard
          title="Webhooks"
          value="—"
          description="Webhook events"
          icon={<Webhook className="w-5 h-5" />}
          href="/admin/webhooks"
        />
        <StatCard
          title="Metrics"
          value="—"
          description="System monitoring"
          icon={<BarChart3 className="w-5 h-5" />}
          href="/metrics"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionLink href="/admin/orders">View All Orders</ActionLink>
            <ActionLink href="/admin/payments">View All Payments</ActionLink>
            <ActionLink href="/admin/reservations">View Reservations</ActionLink>
            <ActionLink href="/admin/webhooks">View Webhook Logs</ActionLink>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Application health and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <StatusItem label="API" status="healthy" />
            <StatusItem label="Database" status="healthy" />
            <StatusItem label="Redis" status="healthy" />
            <StatusItem label="Webhooks" status="monitoring" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components

function StatCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  href: string;
}): ReactNode {
  return (
    <a href={href}>
      <Card className="cursor-pointer hover:bg-accent transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </a>
  );
}

function ActionLink({ href, children }: { href: string; children: string }): ReactNode {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded-md bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
    >
      {children}
    </a>
  );
}

function StatusItem({ label, status }: { label: string; status: 'healthy' | 'monitoring' | 'error' }): ReactNode {
  const statusColors = {
    healthy: 'bg-green-500/20 text-green-700 dark:text-green-400',
    monitoring: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    error: 'bg-red-500/20 text-red-700 dark:text-red-400',
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className={`text-xs px-2 py-1 rounded ${statusColors[status]}`}>
        {status === 'healthy' ? '✓ Healthy' : status === 'monitoring' ? '⚠ Monitoring' : '✗ Error'}
      </span>
    </div>
  );
}
