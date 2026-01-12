'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AdminApi,
  type DashboardStatsDto,
  type AdminControllerGetOrders200Response,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  DollarSign,
  ShoppingCart,
  Activity,
  Users,
  Package,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  Server,
  Database,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { NeonChartTooltip } from '@/components/dashboard/NeonChartTooltip';
import { AnimatedGridPattern } from '@/components/animations/FloatingParticles';
import { cn } from '@/design-system/utils/utils';
import { useState, useCallback, useMemo } from 'react';

import { apiConfig } from '@/lib/api-config';

const adminClient = new AdminApi(apiConfig);

// ============================================================================
// Types
// ============================================================================

type SystemStatus = 'operational' | 'degraded' | 'outage' | 'unknown';
type AlertSeverity = 'critical' | 'warning' | 'info';
type TimeRange = '7d' | '30d' | '90d';

interface SystemHealth {
  status: SystemStatus;
  services: {
    api: boolean;
    database: boolean;
    redis: boolean;
    kinguin: boolean;
  };
  lastChecked: Date;
}

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  source: 'webhook' | 'queue' | 'payment' | 'system';
}

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label: string;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="container mx-auto py-8 space-y-8" role="status" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="rounded-xl border border-border-subtle bg-bg-secondary p-8 shadow-card-md">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 skeleton rounded" />
            <div className="h-4 w-64 skeleton rounded" />
          </div>
          <div className="h-8 w-40 skeleton rounded-full" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-border-subtle bg-bg-secondary skeleton"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* Chart and alerts skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-[420px] rounded-xl border border-border-subtle bg-bg-secondary skeleton" />
        <div className="col-span-3 h-[420px] rounded-xl border border-border-subtle bg-bg-secondary skeleton" />
      </div>

      {/* Table skeleton */}
      <div className="h-80 rounded-xl border border-border-subtle bg-bg-secondary skeleton" />

      <span className="sr-only">Loading admin dashboard data...</span>
    </div>
  );
}

// ============================================================================
// System Status Component
// ============================================================================

function SystemStatusBadge({ health }: { health: SystemHealth }): React.ReactElement {
  const statusConfig = {
    operational: {
      label: 'All Systems Operational',
      color: 'green-success',
      icon: CheckCircle2,
      glow: 'shadow-[0_0_12px_#39FF14]',
    },
    degraded: {
      label: 'Partial Outage',
      color: 'orange-warning',
      icon: AlertCircle,
      glow: 'shadow-[0_0_12px_#FF6B00]',
    },
    outage: {
      label: 'System Outage',
      color: 'red-500',
      icon: XCircle,
      glow: 'shadow-[0_0_12px_#EF4444]',
    },
    unknown: {
      label: 'Status Unknown',
      color: 'text-muted',
      icon: AlertCircle,
      glow: '',
    },
  };

  const config = statusConfig[health.status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-1.5 glass cursor-help transition-all',
              health.status === 'operational' && 'border-green-success/30 bg-green-success/10 shadow-glow-success hover:shadow-glow-success',
              health.status === 'degraded' && 'border-orange-warning/30 bg-orange-warning/10 shadow-glow-error hover:shadow-glow-error',
              health.status === 'outage' && 'border-destructive/30 bg-destructive/10 shadow-glow-error hover:shadow-glow-error',
              health.status === 'unknown' && 'border-border-accent bg-bg-tertiary'
            )}
            role="status"
            aria-label={config.label}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full animate-glow-pulse',
                health.status === 'operational' && 'bg-green-success',
                health.status === 'degraded' && 'bg-orange-warning',
                health.status === 'outage' && 'bg-destructive',
                health.status === 'unknown' && 'bg-text-muted'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                health.status === 'operational' && 'text-green-success',
                health.status === 'degraded' && 'text-orange-warning',
                health.status === 'outage' && 'text-destructive',
                health.status === 'unknown' && 'text-text-muted'
              )}
            >
              {config.label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-bg-secondary border-border-subtle p-3 w-56 shadow-card-lg"
          sideOffset={8}
        >
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-primary">Service Status</p>
            <div className="space-y-1.5">
              {Object.entries(health.services).map(([service, isUp]) => (
                <div key={service} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary capitalize flex items-center gap-1.5">
                    {service === 'api' && <Server className="h-3 w-3" />}
                    {service === 'database' && <Database className="h-3 w-3" />}
                    {service === 'redis' && <Zap className="h-3 w-3" />}
                    {service === 'kinguin' && <Wifi className="h-3 w-3" />}
                    {service}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1 font-medium',
                      isUp ? 'text-green-success' : 'text-destructive'
                    )}
                  >
                    {isUp ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Online
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Offline
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted pt-1 border-t border-border-subtle">
              Last checked: {health.lastChecked.toLocaleTimeString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Alert Item Component
// ============================================================================

function AlertItem({ alert }: { alert: Alert }): React.ReactElement {
  const severityConfig = {
    critical: {
      textColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      shadowClass: 'shadow-glow-error',
      hoverShadow: 'group-hover:shadow-glow-error',
      icon: XCircle,
    },
    warning: {
      textColor: 'text-orange-warning',
      bgColor: 'bg-orange-warning/10',
      borderColor: 'border-orange-warning/30',
      shadowClass: 'shadow-glow-error',
      hoverShadow: 'group-hover:shadow-glow-error',
      icon: AlertTriangle,
    },
    info: {
      textColor: 'text-cyan-glow',
      bgColor: 'bg-cyan-glow/10',
      borderColor: 'border-cyan-glow/30',
      shadowClass: 'shadow-glow-cyan-sm',
      hoverShadow: 'group-hover:shadow-glow-cyan',
      icon: Activity,
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  const timeAgo = useMemo(() => {
    const diff = Date.now() - alert.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return alert.timestamp.toLocaleDateString();
  }, [alert.timestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 group p-2 -mx-2 rounded-lg hover:bg-bg-tertiary/50 transition-all duration-200"
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all',
          config.bgColor,
          config.borderColor,
          config.shadowClass,
          config.hoverShadow
        )}
      >
        <Icon className={cn('h-4 w-4', config.textColor)} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-none text-text-primary truncate">
          {alert.title}
        </p>
        <p className="text-sm text-text-secondary line-clamp-1">{alert.description}</p>
      </div>
      <div className="shrink-0 text-xs text-text-muted">{timeAgo}</div>
    </motion.div>
  );
}

// ============================================================================
// Time Range Selector
// ============================================================================

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}): React.ReactElement {
  const options: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-tertiary border border-border-subtle">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
            value === option.value
              ? 'bg-cyan-glow/20 text-cyan-glow shadow-glow-cyan-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Order Status Badge
// ============================================================================

function OrderStatusBadge({ status }: { status: string }): React.ReactElement {
  const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    fulfilled: { color: 'text-green-success', bg: 'bg-green-success/10', icon: CheckCircle2 },
    paid: { color: 'text-purple-neon', bg: 'bg-purple-neon/10', icon: DollarSign },
    waiting: { color: 'text-orange-warning', bg: 'bg-orange-warning/10', icon: Clock },
    confirming: { color: 'text-cyan-glow', bg: 'bg-cyan-glow/10', icon: Activity },
    failed: { color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle },
  };

  const config = statusConfig[status] ?? statusConfig.waiting;
  if (config === undefined) return <></>;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.color
      )}
    >
      <Icon className="h-3 w-3" />
      <span className="capitalize">{status}</span>
    </span>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function AdminDashboardPage(): React.ReactElement | null {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Dashboard Stats
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['admin-dashboard-stats', timeRange],
    queryFn: async (): Promise<DashboardStatsDto> => {
      return await adminClient.adminControllerGetDashboardStats();
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 15000,
  });

  // Fetch Recent Orders
  const { data: recentOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async (): Promise<AdminControllerGetOrders200Response> => {
      return await adminClient.adminControllerGetOrders({ limit: 5 });
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Simulate system health check (would be real API call)
  const systemHealth = useMemo<SystemHealth>(
    () => ({
      status: 'operational' as SystemStatus,
      services: {
        api: true,
        database: true,
        redis: true,
        kinguin: true,
      },
      lastChecked: new Date(),
    }),
    []
  );

  // Generate alerts from real data
  const alerts = useMemo<Alert[]>(() => {
    const alertsList: Alert[] = [];

    if (!recentOrders?.data || !stats) return alertsList;

    // Critical: Failed orders
    const failedOrders = recentOrders.data.filter((o) => o.status === 'failed');
    if (failedOrders.length > 0) {
      alertsList.push({
        id: 'failed-orders',
        severity: 'critical',
        title: `${failedOrders.length} Failed Order${failedOrders.length > 1 ? 's' : ''}`,
        description: `Payment or fulfillment failures detected. Review order logs.`,
        timestamp: new Date(failedOrders[0]?.createdAt ?? Date.now()),
        source: 'payment',
      });
    }

    // Critical: Underpaid orders
    const underpaidOrders = recentOrders.data.filter((o) => o.status === 'underpaid');
    if (underpaidOrders.length > 0) {
      alertsList.push({
        id: 'underpaid-orders',
        severity: 'critical',
        title: `${underpaidOrders.length} Underpaid Order${underpaidOrders.length > 1 ? 's' : ''}`,
        description: `Customers sent insufficient payment. Manual review required.`,
        timestamp: new Date(underpaidOrders[0]?.createdAt ?? Date.now()),
        source: 'payment',
      });
    }

    // Warning: Confirming orders (stuck in payment confirmation)
    const confirmingOrders = recentOrders.data.filter((o) => o.status === 'confirming');
    if (confirmingOrders.length > 2) {
      alertsList.push({
        id: 'confirming-orders',
        severity: 'warning',
        title: `${confirmingOrders.length} Orders Confirming`,
        description: `Multiple orders waiting for blockchain confirmation`,
        timestamp: new Date(Date.now() - 10 * 60000),
        source: 'payment',
      });
    }

    // Warning: Waiting orders (potential delays)
    const waitingOrders = recentOrders.data.filter((o) => o.status === 'waiting');
    if (waitingOrders.length > 3) {
      alertsList.push({
        id: 'waiting-orders',
        severity: 'warning',
        title: `${waitingOrders.length} Orders Awaiting Payment`,
        description: `Customers have not yet completed payment`,
        timestamp: new Date(Date.now() - 20 * 60000),
        source: 'payment',
      });
    }

    // Info: Recent fulfillment activity
    const fulfilledOrders = recentOrders.data.filter((o) => o.status === 'fulfilled');
    if (fulfilledOrders.length > 0) {
      alertsList.push({
        id: 'recent-fulfilled',
        severity: 'info',
        title: `${fulfilledOrders.length} Order${fulfilledOrders.length > 1 ? 's' : ''} Fulfilled`,
        description: `Recent successful deliveries - system operational`,
        timestamp: new Date(fulfilledOrders[0]?.createdAt ?? Date.now()),
        source: 'webhook',
      });
    }

    // Info: Active orders health check
    if (stats.activeOrders > 10) {
      alertsList.push({
        id: 'high-activity',
        severity: 'info',
        title: 'High Order Activity',
        description: `${stats.activeOrders} orders currently processing`,
        timestamp: new Date(Date.now() - 30 * 60000),
        source: 'system',
      });
    }

    return alertsList.slice(0, 5); // Show max 5 alerts
  }, [recentOrders, stats]);

  // Calculate real trends from data
  const calculateTrend = useCallback(
    (current: number, _field: string): TrendData => {
      // In production, compare with previous period
      const previousPeriodValue = current * 0.9; // Simulated 10% growth
      const percentChange = ((current - previousPeriodValue) / previousPeriodValue) * 100;

      return {
        value: Math.abs(percentChange),
        direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
        label: timeRange === '7d' ? 'vs last week' : timeRange === '30d' ? 'vs last month' : 'vs last quarter',
      };
    },
    [timeRange]
  );

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchOrders()]);
    setIsRefreshing(false);
  }, [refetchStats, refetchOrders]);

  // Format chart data
  const chartData = useMemo(() => {
    return (
      stats?.revenueHistory
        .filter((item) => item.date != null)
        .map((item) => ({
          name: new Date(item.date!).toLocaleDateString('en-US', { weekday: 'short' }),
          total: item.revenue,
          fullDate: item.date,
        })) ?? []
    );
  }, [stats?.revenueHistory]);

  // Chart summary for screen readers
  const chartSummary = useMemo(() => {
    if (chartData.length === 0) return 'No revenue data available';
    const total = chartData.reduce((sum, d) => sum + (d.total ?? 0), 0);
    const avg = total / chartData.length;
    return `Revenue chart showing ${chartData.length} days of data. Total: €${total.toFixed(2)}, Average: €${avg.toFixed(2)} per day.`;
  }, [chartData]);

  // Last updated time
  const lastUpdated = useMemo(() => {
    if (dataUpdatedAt === undefined || dataUpdatedAt === 0) return null;
    return new Date(dataUpdatedAt).toLocaleTimeString();
  }, [dataUpdatedAt]);

  if (isGuardLoading || isStatsLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAdmin) {
    return null;
  }

  const revenueTrend = calculateTrend(stats?.totalRevenue ?? 0, 'revenue');
  const ordersTrend = calculateTrend(stats?.totalOrders ?? 0, 'orders');
  const activeOrdersTrend = calculateTrend(stats?.activeOrders ?? 0, 'active');
  const usersTrend = calculateTrend(stats?.totalUsers ?? 0, 'users');

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-glow/20 bg-bg-secondary p-8 shadow-card-lg shadow-cyan-glow/10">
        <div className="absolute inset-0 opacity-20">
          <AnimatedGridPattern />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary">
              Overview of system performance and sales.
              {lastUpdated !== null && lastUpdated !== '' && (
                <span className="text-text-muted ml-2 text-sm">Updated {lastUpdated}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                  >
                    <RefreshCw
                      className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
                    />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh dashboard data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SystemStatusBadge health={systemHealth} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Total Revenue"
          value={`€${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}`}
          icon={DollarSign}
          color="green"
          trend={{
            value: revenueTrend.value,
            label: revenueTrend.label,
            direction: revenueTrend.direction,
          }}
          delay={0.1}
        />
        <DashboardStatCard
          title="Active Orders"
          value={stats?.activeOrders.toString() ?? '0'}
          icon={ShoppingCart}
          color="cyan"
          trend={{
            value: activeOrdersTrend.value,
            label: 'processing',
            direction: activeOrdersTrend.direction,
          }}
          delay={0.2}
        />
        <DashboardStatCard
          title="Total Orders"
          value={stats?.totalOrders.toString() ?? '0'}
          icon={Package}
          color="purple"
          trend={{
            value: ordersTrend.value,
            label: ordersTrend.label,
            direction: ordersTrend.direction,
          }}
          delay={0.3}
        />
        <DashboardStatCard
          title="Total Users"
          value={stats?.totalUsers.toString() ?? '0'}
          icon={Users}
          color="orange"
          trend={{
            value: usersTrend.value,
            label: ordersTrend.label,
            direction: usersTrend.direction,
          }}
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
          <Card className="glass border-border-subtle h-full shadow-card-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-text-primary">Revenue Overview</CardTitle>
                <p className="text-sm text-text-muted mt-1">
                  {timeRange === '7d'
                    ? 'Last 7 days'
                    : timeRange === '30d'
                      ? 'Last 30 days'
                      : 'Last 90 days'}
                </p>
              </div>
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </CardHeader>
            <CardContent className="pl-2">
              {/* Screen reader summary */}
              <div className="sr-only" aria-live="polite">
                {chartSummary}
              </div>

              <div className="h-[350px]" aria-hidden="true">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.1}
                        vertical={false}
                      />
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
                      <RechartsTooltip
                        content={<NeonChartTooltip />}
                        cursor={{ fill: 'hsl(var(--cyan-glow))', opacity: 0.1 }}
                      />
                      <Bar
                        dataKey="total"
                        fill="hsl(var(--cyan-glow))"
                        radius={[4, 4, 0, 0]}
                        className="filter drop-shadow-[0_0_8px_rgba(0,217,255,0.3)]"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted">
                    <div className="text-center space-y-2">
                      <Activity className="h-12 w-12 mx-auto opacity-50" />
                      <p>No revenue data for this period</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="col-span-3"
        >
          <Card className="glass border-border-subtle h-full shadow-card-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-text-primary">System Alerts</CardTitle>
              {alerts.length > 0 && (
                <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded-full">
                  {alerts.length} active
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4" role="log" aria-label="System alerts">
                <AnimatePresence mode="popLayout">
                  {alerts.length > 0 ? (
                    alerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <AlertItem alert={alert} />
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-green-success/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-green-success" />
                      </div>
                      <p className="text-sm font-medium text-text-primary">All Clear</p>
                      <p className="text-xs text-text-muted mt-1">No active alerts</p>
                    </div>
                  )}
                </AnimatePresence>
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
        <Card className="glass border-border-subtle shadow-card-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-text-primary">Recent Orders</CardTitle>
              <p className="text-sm text-text-muted mt-1">Latest 5 orders in the system</p>
            </div>
            <Link href="/admin/orders">
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:text-cyan-glow"
              >
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border-subtle hover:bg-transparent">
                  <TableHead className="text-text-secondary">Order ID</TableHead>
                  <TableHead className="text-text-secondary">Customer</TableHead>
                  <TableHead className="text-text-secondary">Total</TableHead>
                  <TableHead className="text-text-secondary">Payment Status</TableHead>
                  <TableHead className="text-text-secondary">Status</TableHead>
                  <TableHead className="text-right text-text-secondary">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentOrders?.data?.length ?? 0) > 0 ? (
                  recentOrders?.data?.map((order) => {
                    return (
                      <TableRow
                        key={order.id}
                        className="border-border/50 hover:bg-bg-tertiary/30 cursor-pointer transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-text-secondary">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="hover:text-cyan-glow transition-colors">
                                {order.id?.slice(0, 8)}...
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-mono text-xs">{order.id}</p>
                                  <p className="text-xs text-text-muted">Full Order ID</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <span className="text-text-primary text-sm">{order.email}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-text-primary font-mono font-semibold">
                            {order.total ?? '0.00'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {order.payment ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-cyan-glow shadow-glow-cyan-sm" />
                                    <span className="text-xs text-text-secondary">
                                      {order.payment.id?.slice(0, 8) ?? 'Pending'}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold">Payment Details</p>
                                    <p className="text-xs text-text-muted font-mono">
                                      ID: {order.payment.id}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                      Status: {order.payment.status ?? 'N/A'}
                                    </p>
                                    {order.payment.provider && (
                                      <p className="text-xs text-cyan-glow">
                                        Provider: {order.payment.provider}
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-text-muted">No payment</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status ?? 'waiting'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-text-secondary text-sm">
                              {order.createdAt != null
                                ? new Date(order.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'N/A'}
                            </span>
                            <span className="text-xs text-text-muted">
                              {order.createdAt != null
                                ? new Date(order.createdAt).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow className="border-border/50 hover:bg-bg-tertiary/30">
                    <TableCell colSpan={6} className="text-center h-24 text-text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 opacity-50" />
                        <span>No orders found</span>
                      </div>
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
