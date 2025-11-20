'use client';

import { useQuery } from '@tanstack/react-query';
import { Configuration, AdminOperationsApi, OrdersApi } from '@bitloot/sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import { DollarSign, ShoppingCart, AlertTriangle, Activity, TrendingUp, Users, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';

// Initialize SDK configuration
const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || '';
    }
    return '';
  },
});

const adminOpsClient = new AdminOperationsApi(apiConfig);
const ordersClient = new OrdersApi(apiConfig);

// Mock data for charts
const revenueData = [
  { name: 'Mon', total: 1200 },
  { name: 'Tue', total: 2100 },
  { name: 'Wed', total: 800 },
  { name: 'Thu', total: 1600 },
  { name: 'Fri', total: 2400 },
  { name: 'Sat', total: 3200 },
  { name: 'Sun', total: 1800 },
];

export default function AdminDashboardPage() {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();

  // Fetch System Health
  const { data: health } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      return await adminOpsClient.adminOpsControllerGetSystemHealth();
    },
    enabled: isAdmin,
  });

  // Fetch Balance
  const { data: balance } = useQuery({
    queryKey: ['admin-balance'],
    queryFn: async () => {
      return await adminOpsClient.adminOpsControllerGetBalance();
    },
    enabled: isAdmin,
  });

  // Fetch Recent Orders (admin list endpoint not available yet - TODO: implement admin orders list)
  const recentOrders: any[] = [];

  if (isGuardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Guard handles redirect
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of system performance and sales.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-sm">
            System Status: OPERATIONAL
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(balance as any)?.nowpayments?.balanceUsd ? parseFloat((balance as any).nowpayments.balanceUsd).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentOrders.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">+180 since last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+201 since last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Alerts */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Failed Payment Webhook</p>
                  <p className="text-sm text-muted-foreground">
                    NOWPayments IPN signature mismatch
                  </p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">2m ago</div>
              </div>
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">High Queue Latency</p>
                  <p className="text-sm text-muted-foreground">
                    Fulfillment queue processing &gt; 5s
                  </p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">15m ago</div>
              </div>
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Catalog Sync Started</p>
                  <p className="text-sm text-muted-foreground">
                    Syncing 50k products from Kinguin
                  </p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">1h ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>${parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === 'completed'
                          ? 'default'
                          : order.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
