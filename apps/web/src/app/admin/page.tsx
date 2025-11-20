'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Configuration, 
  AdminApi, 
  type DashboardStatsDto,
  type AdminControllerGetOrders200Response 
} from '@bitloot/sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import { DollarSign, ShoppingCart, Activity, Users, Package, Loader2, ArrowUpRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { motion } from 'framer-motion';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { NeonChartTooltip } from '@/components/dashboard/NeonChartTooltip';
import { AnimatedGridPattern } from '@/components/animations/FloatingParticles';

// Initialize SDK configuration
const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') ?? '';
    }
    return '';
  },
});

const adminClient = new AdminApi(apiConfig);

export default function AdminDashboardPage(): React.ReactElement | null {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();

  // Fetch Dashboard Stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStatsDto> => {
      return await adminClient.adminControllerGetDashboardStats();
    },
    enabled: isAdmin,
  });

  // Fetch Recent Orders
  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async (): Promise<AdminControllerGetOrders200Response> => {
      return await adminClient.adminControllerGetOrders({ limit: 5 });
    },
    enabled: isAdmin,
  });

  if (isGuardLoading || isStatsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Guard handles redirect
  }

  // Format revenue history for chart
  const chartData = stats?.revenueHistory
    .filter(item => item.date != null)
    .map(item => ({
      name: new Date(item.date!).toLocaleDateString('en-US', { weekday: 'short' }),
      total: item.revenue,
      fullDate: item.date
    })) ?? [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="relative overflow-hidden rounded-xl border border-cyan-glow/20 bg-bg-secondary p-8 shadow-lg shadow-cyan-glow/5">
        <div className="absolute inset-0 opacity-30">
          <AnimatedGridPattern />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary">Overview of system performance and sales.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-green-success/30 bg-green-success/10 px-4 py-1.5 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-success shadow-[0_0_8px_#39FF14]" />
              <span className="text-sm font-medium text-green-success">System Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue.toFixed(2) ?? '0.00'}`}
          icon={DollarSign}
          color="green"
          trend={{ value: 12.5, label: 'this week', direction: 'up' }}
          delay={0.1}
        />
        <DashboardStatCard
          title="Active Orders"
          value={stats?.activeOrders.toString() ?? '0'}
          icon={ShoppingCart}
          color="cyan"
          trend={{ value: 5, label: 'processing', direction: 'up' }}
          delay={0.2}
        />
        <DashboardStatCard
          title="Total Orders"
          value={stats?.totalOrders.toString() ?? '0'}
          icon={Package}
          color="purple"
          trend={{ value: 8.2, label: 'all time', direction: 'up' }}
          delay={0.3}
        />
        <DashboardStatCard
          title="Total Users"
          value={stats?.totalUsers.toString() ?? '0'}
          icon={Users}
          color="orange"
          trend={{ value: 2.1, label: 'registered', direction: 'up' }}
          delay={0.4}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="col-span-4"
        >
          <Card className="border-border/50 bg-bg-secondary/50 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="text-text-primary">Revenue Overview (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--text-secondary))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--text-secondary))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<NeonChartTooltip />} cursor={{ fill: 'hsl(var(--cyan-glow))', opacity: 0.1 }} />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--cyan-glow))"
                      radius={[4, 4, 0, 0]}
                      className="filter drop-shadow-[0_0_8px_rgba(0,217,255,0.3)]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity / Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="col-span-3"
        >
          <Card className="border-border/50 bg-bg-secondary/50 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="text-text-primary">System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="flex items-center group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all group-hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-text-primary">Failed Payment Webhook</p>
                    <p className="text-sm text-text-secondary">
                      NOWPayments IPN signature mismatch
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-text-muted">2m ago</div>
                </div>
                <div className="flex items-center group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-warning/30 bg-orange-warning/10 text-orange-warning shadow-[0_0_10px_rgba(255,107,0,0.2)] transition-all group-hover:shadow-[0_0_15px_rgba(255,107,0,0.4)]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-text-primary">High Queue Latency</p>
                    <p className="text-sm text-text-secondary">
                      Fulfillment queue processing &gt; 5s
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-text-muted">15m ago</div>
                </div>
                <div className="flex items-center group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow shadow-[0_0_10px_rgba(0,217,255,0.2)] transition-all group-hover:shadow-[0_0_15px_rgba(0,217,255,0.4)]">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-text-primary">Catalog Sync Started</p>
                    <p className="text-sm text-text-secondary">
                      Syncing 50k products from Kinguin
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-text-muted">1h ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Card className="border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-text-primary">Recent Orders</CardTitle>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm" className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:text-cyan-glow">
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-text-secondary">Order ID</TableHead>
                  <TableHead className="text-text-secondary">Customer</TableHead>
                  <TableHead className="text-text-secondary">Total</TableHead>
                  <TableHead className="text-text-secondary">Status</TableHead>
                  <TableHead className="text-right text-text-secondary">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentOrders?.data?.length ?? 0) > 0 ? (
                  recentOrders?.data?.map((order) => (
                    <TableRow key={order.id} className="border-border/50 hover:bg-bg-tertiary/30">
                      <TableCell className="font-mono text-xs text-text-secondary">
                        {order.id?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-text-primary">{order.email}</TableCell>
                      <TableCell className="text-text-primary font-mono">
                        {order.total}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.status === 'fulfilled' ? 'bg-green-500/10 text-green-500' :
                          order.status === 'paid' ? 'bg-blue-500/10 text-blue-500' :
                            order.status === 'waiting' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-red-500/10 text-red-500'
                          }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-text-secondary text-sm">
                        {order.createdAt != null ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-border/50 hover:bg-bg-tertiary/30">
                    <TableCell colSpan={5} className="text-center h-24 text-text-muted">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
