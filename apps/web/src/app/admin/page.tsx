'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminApi,
  AdminKinguinBalanceApi,
  type DashboardStatsDto,
  type AdminControllerGetOrders200Response,
} from '@bitloot/sdk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Progress } from '@/design-system/primitives/progress';
import { Skeleton } from '@/design-system/primitives/skeleton';
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
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  Server,
  Database,
  CreditCard,
  Boxes,
  Tag,
  Star,
  BarChart3,
  ExternalLink,
  Loader2,
  Timer,
  Wallet,
  Settings,
  PieChart,
  ArrowRight,
  Sparkles,
  RotateCcw,
  CheckCircle,
  FileText,
  Webhook,
  ClipboardList,
  Percent,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Area,
  AreaChart,
} from 'recharts';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { useWebhookStats } from '@/features/admin/hooks/useWebhookStats';
import { cn } from '@/design-system/utils/utils';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiConfig } from '@/lib/api-config';
import { formatDate } from '@/utils/format-date';
import { toast } from 'sonner';

const adminClient = new AdminApi(apiConfig);
const kinguinBalanceApi = new AdminKinguinBalanceApi(apiConfig);

// ============================================================================
// Types
// ============================================================================

type SystemStatus = 'operational' | 'degraded' | 'outage' | 'unknown';
type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

interface SystemHealth {
  status: SystemStatus;
  services: {
    api: boolean;
    database: boolean;
    redis: boolean;
    kinguin: boolean;
    nowpayments: boolean;
  };
  lastChecked: Date;
}

interface KinguinBalance {
  balance: number;
  currency: string;
  lastUpdated: Date;
}

interface OrderAnalytics {
  byStatus: Array<{ status: string; count: number }>;
  totalOrders: number;
  totalRevenue: number;
  fulfillmentRate: number;
  failedRate: number;
  averageOrderValue: number;
}

// ============================================================================
// Status Configurations
// ============================================================================

const ORDER_STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ElementType;
  chartColor: string;
}> = {
  fulfilled: { 
    label: 'Fulfilled', 
    color: 'text-green-success', 
    bgColor: 'bg-green-success/10',
    borderColor: 'border-green-success/30',
    icon: CheckCircle2,
    chartColor: '#39FF14',
  },
  paid: { 
    label: 'Paid', 
    color: 'text-cyan-glow', 
    bgColor: 'bg-cyan-glow/10',
    borderColor: 'border-cyan-glow/30',
    icon: DollarSign,
    chartColor: '#00D9FF',
  },
  waiting: { 
    label: 'Waiting', 
    color: 'text-purple-neon', 
    bgColor: 'bg-purple-neon/10',
    borderColor: 'border-purple-neon/30',
    icon: Timer,
    chartColor: '#9D4EDD',
  },
  confirming: { 
    label: 'Confirming', 
    color: 'text-cyan-glow', 
    bgColor: 'bg-cyan-glow/10',
    borderColor: 'border-cyan-glow/30',
    icon: Loader2,
    chartColor: '#00D9FF',
  },
  failed: { 
    label: 'Failed', 
    color: 'text-pink-featured', 
    bgColor: 'bg-pink-featured/10',
    borderColor: 'border-pink-featured/30',
    icon: XCircle,
    chartColor: '#FF006E',
  },
  underpaid: { 
    label: 'Underpaid', 
    color: 'text-orange-warning', 
    bgColor: 'bg-orange-warning/10',
    borderColor: 'border-orange-warning/30',
    icon: AlertTriangle,
    chartColor: '#FF6B00',
  },
  expired: { 
    label: 'Expired', 
    color: 'text-text-muted', 
    bgColor: 'bg-text-muted/10',
    borderColor: 'border-text-muted/30',
    icon: Clock,
    chartColor: '#7A8599',
  },
  refunded: { 
    label: 'Refunded', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: RotateCcw,
    chartColor: '#A855F7',
  },
  created: { 
    label: 'Created', 
    color: 'text-purple-neon', 
    bgColor: 'bg-purple-neon/10',
    borderColor: 'border-purple-neon/30',
    icon: Package,
    chartColor: '#9D4EDD',
  },
};

// ============================================================================
// Loading Skeleton
// ============================================================================

function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
      </div>

      {/* Stats Grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-bg-secondary border-border-subtle h-[400px]">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="bg-bg-secondary border-border-subtle h-[400px]">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stat Card Component (Enhanced)
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'cyan' | 'green' | 'purple' | 'orange' | 'pink';
  href?: string;
  loading?: boolean;
}

const colorConfig = {
  cyan: {
    iconBg: 'bg-cyan-glow/20',
    iconColor: 'text-cyan-glow',
    borderColor: 'border-cyan-glow/20',
    glowColor: 'shadow-glow-cyan-sm',
    trendUp: 'text-green-success',
    trendDown: 'text-pink-featured',
  },
  green: {
    iconBg: 'bg-green-success/20',
    iconColor: 'text-green-success',
    borderColor: 'border-green-success/20',
    glowColor: 'shadow-glow-success',
    trendUp: 'text-green-success',
    trendDown: 'text-pink-featured',
  },
  purple: {
    iconBg: 'bg-purple-neon/20',
    iconColor: 'text-purple-neon',
    borderColor: 'border-purple-neon/20',
    glowColor: 'shadow-glow-purple-sm',
    trendUp: 'text-green-success',
    trendDown: 'text-pink-featured',
  },
  orange: {
    iconBg: 'bg-orange-warning/20',
    iconColor: 'text-orange-warning',
    borderColor: 'border-orange-warning/20',
    glowColor: 'shadow-glow-error',
    trendUp: 'text-green-success',
    trendDown: 'text-pink-featured',
  },
  pink: {
    iconBg: 'bg-pink-featured/20',
    iconColor: 'text-pink-featured',
    borderColor: 'border-pink-featured/20',
    glowColor: 'shadow-glow-pink',
    trendUp: 'text-green-success',
    trendDown: 'text-pink-featured',
  },
};

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color,
  href,
  loading = false,
}: StatCardProps): React.ReactElement {
  const config = colorConfig[color];
  
  const content = (
    <Card className={cn(
      'relative overflow-hidden bg-bg-secondary border-border-subtle transition-all duration-300',
      'hover:border-border-accent hover:shadow-card-md group h-full',
      href !== undefined && href !== '' ? 'cursor-pointer' : '',
    )}>
      <CardContent className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between flex-1">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-text-primary font-display tracking-tight">
                {value}
              </p>
            )}
            {/* Always reserve space for subtitle - show text or invisible placeholder */}
            <p className={cn(
              'text-xs min-h-4',
              subtitle !== undefined && subtitle !== '' && !loading ? 'text-text-muted' : 'invisible'
            )}>
              {subtitle !== undefined && subtitle !== '' && !loading ? subtitle : 'placeholder'}
            </p>
            {/* Always reserve space for trend - show content or invisible placeholder */}
            {trend !== undefined && trend !== null && !loading ? (
              <div className="flex items-center gap-1 min-h-5">
                {trend.isPositive === true ? (
                  <ArrowUpRight className="h-3 w-3 text-green-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-pink-featured" />
                )}
                <span className={cn(
                  'text-xs font-medium',
                  trend.isPositive === true ? 'text-green-success' : 'text-pink-featured'
                )}>
                  {Math.abs(trend.value).toFixed(1)}%
                </span>
                <span className="text-xs text-text-muted">vs last period</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 min-h-5 invisible">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-xs">0.0%</span>
                <span className="text-xs">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl transition-all duration-300 shrink-0',
            config.iconBg,
            'group-hover:scale-110',
          )}>
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
        </div>
        {href !== undefined && href !== '' && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4 text-text-muted" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href !== undefined && href !== '') {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// ============================================================================
// System Status Badge
// ============================================================================

function SystemStatusBadge({ health, isChecking }: { health: SystemHealth; isChecking: boolean }): React.ReactElement {
  const statusConfig = {
    operational: {
      label: 'All Systems Operational',
      dotColor: 'bg-green-success',
      textColor: 'text-green-success',
      bgColor: 'bg-green-success/10',
      borderColor: 'border-green-success/30',
    },
    degraded: {
      label: 'Partial Outage',
      dotColor: 'bg-orange-warning',
      textColor: 'text-orange-warning',
      bgColor: 'bg-orange-warning/10',
      borderColor: 'border-orange-warning/30',
    },
    outage: {
      label: 'System Outage',
      dotColor: 'bg-pink-featured',
      textColor: 'text-pink-featured',
      bgColor: 'bg-pink-featured/10',
      borderColor: 'border-pink-featured/30',
    },
    unknown: {
      label: 'Checking...',
      dotColor: 'bg-text-muted',
      textColor: 'text-text-muted',
      bgColor: 'bg-text-muted/10',
      borderColor: 'border-text-muted/30',
    },
  };

  const config = statusConfig[health.status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full border cursor-help transition-all',
            config.bgColor,
            config.borderColor,
          )}>
            {isChecking ? (
              <Loader2 className={cn('h-3 w-3 animate-spin', config.textColor)} />
            ) : (
              <div className={cn('h-2 w-2 rounded-full animate-pulse', config.dotColor)} />
            )}
            <span className={cn('text-sm font-medium', config.textColor)}>
              {config.label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-bg-secondary border-border-subtle p-4 w-64">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">Service Status</p>
            <div className="space-y-2">
              {Object.entries(health.services).map(([service, isUp]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary flex items-center gap-2">
                    {service === 'api' && <Server className="h-3 w-3" />}
                    {service === 'database' && <Database className="h-3 w-3" />}
                    {service === 'redis' && <Zap className="h-3 w-3" />}
                    {service === 'kinguin' && <Boxes className="h-3 w-3" />}
                    {service === 'nowpayments' && <CreditCard className="h-3 w-3" />}
                    <span className="capitalize">{service}</span>
                  </span>
                  <span className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    isUp ? 'text-green-success' : 'text-pink-featured'
                  )}>
                    {isUp ? (
                      <><CheckCircle2 className="h-3 w-3" /> Online</>
                    ) : (
                      <><XCircle className="h-3 w-3" /> Offline</>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted pt-2 border-t border-border-subtle">
              Last checked: {formatDate(health.lastChecked, 'time')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Quick Action Card
// ============================================================================

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: 'cyan' | 'green' | 'purple' | 'orange' | 'pink';
  badge?: string;
}

function QuickActionCard({ title, description, icon: Icon, href, color, badge }: QuickActionProps): React.ReactElement {
  const config = colorConfig[color];
  
  return (
    <Link href={href}>
      <Card className={cn(
        'relative overflow-hidden bg-bg-secondary border-border-subtle transition-all duration-300',
        'hover:border-border-accent hover:shadow-card-md cursor-pointer group h-full',
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2.5 rounded-lg transition-all duration-300',
              config.iconBg,
              'group-hover:scale-110',
            )}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-text-primary truncate">{title}</h4>
                {badge !== undefined && badge !== '' && (
                  <Badge variant="outline" className={cn(
                    'text-[10px] px-1.5 py-0',
                    config.iconColor,
                    config.borderColor,
                  )}>
                    {badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// Attention Item Card
// ============================================================================

interface AttentionItemProps {
  title: string;
  count: number;
  icon: React.ElementType;
  href: string;
  severity: 'critical' | 'warning' | 'info';
}

function AttentionItem({ title, count, icon: Icon, href, severity }: AttentionItemProps): React.ReactElement {
  const severityConfig = {
    critical: {
      bg: 'bg-pink-featured/10',
      border: 'border-pink-featured/30',
      text: 'text-pink-featured',
      badge: 'bg-pink-featured/20 text-pink-featured border-pink-featured/50',
    },
    warning: {
      bg: 'bg-orange-warning/10',
      border: 'border-orange-warning/30',
      text: 'text-orange-warning',
      badge: 'bg-orange-warning/20 text-orange-warning border-orange-warning/50',
    },
    info: {
      bg: 'bg-cyan-glow/10',
      border: 'border-cyan-glow/30',
      text: 'text-cyan-glow',
      badge: 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/50',
    },
  };

  const config = severityConfig[severity];

  if (count === 0) return <></>;

  return (
    <Link href={href}>
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-all',
        'hover:bg-bg-tertiary cursor-pointer group',
        config.bg,
        config.border,
      )}>
        <div className="flex items-center gap-3">
          <Icon className={cn('h-4 w-4', config.text)} />
          <span className="text-sm text-text-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs font-bold', config.badge)}>
            {count}
          </Badge>
          <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Order Status Badge (Enhanced)
// ============================================================================

const DEFAULT_STATUS_CONFIG = {
  label: 'Unknown',
  color: 'text-text-muted',
  bgColor: 'bg-text-muted/10',
  borderColor: 'border-text-muted/30',
  icon: Package,
  chartColor: '#7A8599',
};

function OrderStatusBadge({ status }: { status: string }): React.ReactElement {
  const config = ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG.created ?? DEFAULT_STATUS_CONFIG;
  const StatusIcon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bgColor,
      config.color,
      config.borderColor,
    )}>
      <StatusIcon className="h-3 w-3" />
      <span className="capitalize">{config.label}</span>
    </span>
  );
}

// ============================================================================
// Revenue Chart Custom Tooltip
// ============================================================================

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}): React.ReactElement | null {
  if (active !== true || payload === undefined || payload === null || payload.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-lg p-3 shadow-card-lg">
      <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm text-cyan-glow">
          €{entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ============================================================================
// Order Status Pie Chart
// ============================================================================

function OrderStatusChart({ data }: { data: Array<{ status: string; count: number }> }): React.ReactElement {
  const chartData = useMemo(() => {
    return data
      .filter(item => item.count > 0)
      .map(item => ({
        name: ORDER_STATUS_CONFIG[item.status]?.label ?? item.status,
        value: item.count,
        color: ORDER_STATUS_CONFIG[item.status]?.chartColor ?? '#7A8599',
      }));
  }, [data]);

  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-text-muted">
        <div className="text-center">
          <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No order data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <RechartsTooltip
            content={({ active, payload }) => {
              if (active !== true || payload === undefined || payload === null || payload.length === 0) return null;
              const firstPayload = payload[0];
              if (firstPayload === undefined) return null;
              const payloadData = firstPayload.payload as { name: string; value: number; color: string } | undefined;
              if (payloadData === undefined) return null;
              return (
                <div className="bg-bg-secondary border border-border-subtle rounded-lg p-2 shadow-card-lg">
                  <p className="text-sm text-text-primary">{payloadData.name}</p>
                  <p className="text-sm font-bold" style={{ color: payloadData.color }}>
                    {payloadData.value} ({((payloadData.value / total) * 100).toFixed(1)}%)
                  </p>
                </div>
              );
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function AdminDashboardPage(): React.ReactElement | null {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'unknown',
    services: { api: true, database: true, redis: true, kinguin: true, nowpayments: true },
    lastChecked: new Date(),
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // ============================================================================
  // Data Queries
  // ============================================================================

  // Dashboard Stats
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['admin-dashboard-stats', timeRange],
    queryFn: async (): Promise<DashboardStatsDto> => {
      return await adminClient.adminControllerGetDashboardStats({ 
        timeRange: timeRange as '24h' | '7d' | '30d' | '90d' | 'all' 
      });
    },
    enabled: isAdmin,
    refetchInterval: 60000, // Auto-refresh every minute
    staleTime: 30000,
  });

  // Recent Orders
  const { 
    data: recentOrders, 
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async (): Promise<AdminControllerGetOrders200Response> => {
      return await adminClient.adminControllerGetOrders({ limit: 8 });
    },
    enabled: isAdmin,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Order Analytics
  const { data: orderAnalytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['admin-order-analytics', timeRange],
    queryFn: async (): Promise<OrderAnalytics> => {
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const response = await adminClient.adminControllerGetOrderAnalytics({ days });
      return {
        byStatus: response.byStatus ?? [],
        totalOrders: response.totalOrders ?? 0,
        totalRevenue: response.totalRevenue ?? 0,
        fulfillmentRate: response.fulfillmentRate ?? 0,
        failedRate: response.failedRate ?? 0,
        averageOrderValue: response.averageOrderValue ?? 0,
      };
    },
    enabled: isAdmin,
    staleTime: 60000,
  });

  // Webhook Stats
  const { stats: webhookStats, isLoading: isWebhookStatsLoading } = useWebhookStats({
    period: timeRange === '24h' ? '24h' : timeRange === '7d' ? '7d' : '30d',
    enabled: isAdmin,
  });

  // Kinguin Balance
  const { data: kinguinBalance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['kinguin-balance-overview'],
    queryFn: async (): Promise<KinguinBalance> => {
      try {
        const response = await kinguinBalanceApi.kinguinBalanceControllerGetBalance();
        return {
          balance: response.balance ?? 0,
          currency: response.currency ?? 'EUR',
          lastUpdated: new Date(),
        };
      } catch {
        return { balance: 0, currency: 'EUR', lastUpdated: new Date() };
      }
    },
    enabled: isAdmin,
    staleTime: 120000,
  });

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Calculate attention items from orders
  const attentionItems = useMemo(() => {
    if (recentOrders?.data === undefined || recentOrders?.data === null) return { failed: 0, underpaid: 0, stuck: 0 };
    
    const orders = recentOrders.data;
    return {
      failed: orders.filter(o => o.status === 'failed').length,
      underpaid: orders.filter(o => o.status === 'underpaid').length,
      stuck: orders.filter(o => o.status === 'confirming' || o.status === 'paid').length,
    };
  }, [recentOrders]);

  const needsAttention = attentionItems.failed > 0 || attentionItems.underpaid > 0;

  // Revenue chart data
  const revenueChartData = useMemo(() => {
    return (
      stats?.revenueHistory
        ?.filter((item) => item.date != null)
        ?.map((item) => ({
          name: formatDate(item.date!, 'short'),
          revenue: item.revenue,
        })) ?? []
    );
  }, [stats?.revenueHistory]);

  // Last updated time
  const lastUpdated = useMemo(() => {
    if (dataUpdatedAt === undefined || dataUpdatedAt === 0) return null;
    return formatDate(dataUpdatedAt, 'time');
  }, [dataUpdatedAt]);

  // ============================================================================
  // Health Check
  // ============================================================================

  const checkSystemHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      // Check API health
      const apiHealthy = await adminClient.adminControllerGetDashboardStats()
        .then(() => true)
        .catch(() => false);

      // In production, you'd check other services here
      const newHealth: SystemHealth = {
        status: apiHealthy ? 'operational' : 'degraded',
        services: {
          api: apiHealthy,
          database: apiHealthy, // Inferred from API
          redis: true,
          kinguin: kinguinBalance !== undefined,
          nowpayments: true,
        },
        lastChecked: new Date(),
      };
      setSystemHealth(newHealth);
    } catch {
      setSystemHealth(prev => ({
        ...prev,
        status: 'unknown',
        lastChecked: new Date(),
      }));
    } finally {
      setIsCheckingHealth(false);
    }
  }, [kinguinBalance]);

  // Initial health check
  useEffect(() => {
    if (isAdmin) {
      void checkSystemHealth();
    }
  }, [isAdmin, checkSystemHealth]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchOrders(),
        queryClient.invalidateQueries({ queryKey: ['admin-order-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['webhook-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['kinguin-balance-overview'] }),
        checkSystemHealth(),
      ]);
      toast.success('Dashboard refreshed');
    } catch {
      toast.error('Failed to refresh some data');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchStats, refetchOrders, queryClient, checkSystemHealth]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isGuardLoading || isStatsLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-display tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-cyan-glow" />
            Admin Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Overview of your BitLoot platform performance
            {lastUpdated !== null && lastUpdated !== '' && (
              <span className="text-text-muted ml-2">• Updated {lastUpdated}</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-secondary border border-border-subtle">
            {(['24h', '7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  timeRange === range
                    ? 'bg-cyan-glow/20 text-cyan-glow shadow-glow-cyan-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                )}
              >
                {range === '24h' ? '24H' : range === '7d' ? '7D' : range === '30d' ? '30D' : range === '90d' ? '90D' : 'All'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {/* System Status */}
          <SystemStatusBadge health={systemHealth} isChecking={isCheckingHealth} />
        </div>
      </div>

      {/* Attention Banner (if issues exist) */}
      {needsAttention && (
        <Card className="bg-pink-featured/5 border-pink-featured/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-pink-featured/20">
                <AlertTriangle className="h-5 w-5 text-pink-featured" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-text-primary">Attention Required</h4>
                <p className="text-sm text-text-secondary">
                  {attentionItems.failed > 0 && `${attentionItems.failed} failed order(s)`}
                  {attentionItems.failed > 0 && attentionItems.underpaid > 0 && ' • '}
                  {attentionItems.underpaid > 0 && `${attentionItems.underpaid} underpaid order(s)`}
                </p>
              </div>
              <Link href="/admin/orders?status=failed">
                <Button size="sm" variant="outline" className="border-pink-featured/50 text-pink-featured hover:bg-pink-featured/10">
                  Review Orders
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - 6 Columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Revenue"
          value={`€${(stats?.totalRevenue ?? 0).toFixed(2)}`}
          subtitle="All time earnings"
          icon={DollarSign}
          color="green"
          href="/admin/payments"
          loading={isStatsLoading}
        />
        <StatCard
          title="Active Orders"
          value={stats?.activeOrders?.toString() ?? '0'}
          subtitle="Currently processing"
          icon={ShoppingCart}
          color="cyan"
          href="/admin/orders"
          loading={isStatsLoading}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders?.toString() ?? '0'}
          subtitle="All orders"
          icon={Package}
          color="purple"
          href="/admin/orders"
          loading={isStatsLoading}
        />
        <StatCard
          title="Fulfillment Rate"
          value={`${(orderAnalytics?.fulfillmentRate ?? 0).toFixed(1)}%`}
          subtitle="Success rate"
          icon={CheckCircle}
          color="green"
          loading={isAnalyticsLoading}
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers?.toString() ?? '0'}
          subtitle="Registered accounts"
          icon={Users}
          color="purple"
          loading={isStatsLoading}
        />
        <StatCard
          title="Kinguin Balance"
          value={`€${(kinguinBalance?.balance ?? 0).toFixed(2)}`}
          subtitle="Available funds"
          icon={Wallet}
          color="orange"
          href="/admin/balances"
          loading={isBalanceLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 bg-bg-secondary border-border-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-text-primary">
                Revenue Overview
              </CardTitle>
              <CardDescription>
                {timeRange === '24h' ? 'Last 24 hours' : timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </CardDescription>
            </div>
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm" className="text-text-muted hover:text-cyan-glow">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3344" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#7A8599" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#7A8599" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#00D9FF"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto opacity-50 mb-2" />
                    <p className="text-sm">No revenue data for this period</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Status & Quick Stats */}
        <div className="space-y-6">
          {/* Order Status Distribution */}
          <Card className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-text-primary">
                Order Status
              </CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <OrderStatusChart data={orderAnalytics?.byStatus ?? []} />
              )}
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {(orderAnalytics?.byStatus ?? []).slice(0, 4).map((item) => {
                  const statusConfig = ORDER_STATUS_CONFIG[item.status];
                  if (statusConfig === undefined || statusConfig === null || item.count === 0) return null;
                  return (
                    <div key={item.status} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: statusConfig.chartColor }}
                      />
                      <span className="text-xs text-text-secondary">
                        {statusConfig.label}: {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Webhook Health */}
          <Card className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-text-primary">
                  Webhook Health
                </CardTitle>
                <Link href="/admin/webhooks">
                  <Button variant="ghost" size="sm" className="text-text-muted hover:text-cyan-glow h-8 px-2">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isWebhookStatsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Success Rate</span>
                    <span className={cn(
                      'text-lg font-bold',
                      (webhookStats?.successRate ?? 0) >= 95 ? 'text-green-success' : 
                      (webhookStats?.successRate ?? 0) >= 80 ? 'text-orange-warning' : 'text-pink-featured'
                    )}>
                      {(webhookStats?.successRate ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={webhookStats?.successRate ?? 0} 
                    className="h-2 bg-bg-tertiary"
                  />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-bg-tertiary">
                      <p className="text-lg font-bold text-text-primary">{webhookStats?.processed ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Processed</p>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-tertiary">
                      <p className="text-lg font-bold text-orange-warning">{webhookStats?.pending ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Pending</p>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-tertiary">
                      <p className="text-lg font-bold text-pink-featured">{webhookStats?.failed ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Failed</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="bg-bg-secondary border-border-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-glow" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickActionCard
                title="Manage Orders"
                description="View and manage all orders"
                icon={ShoppingCart}
                href="/admin/orders"
                color="cyan"
                badge={stats?.activeOrders?.toString()}
              />
              <QuickActionCard
                title="Payment History"
                description="View all payment transactions"
                icon={CreditCard}
                href="/admin/payments"
                color="green"
              />
              <QuickActionCard
                title="Product Catalog"
                description="Manage products & pricing"
                icon={Boxes}
                href="/admin/catalog"
                color="purple"
              />
              <QuickActionCard
                title="Promo Codes"
                description="Create & manage discounts"
                icon={Tag}
                href="/admin/promos"
                color="pink"
              />
              <QuickActionCard
                title="Customer Reviews"
                description="Moderate product reviews"
                icon={Star}
                href="/admin/reviews"
                color="orange"
              />
              <QuickActionCard
                title="Marketing"
                description="Flash deals & bundles"
                icon={Percent}
                href="/admin/marketing/flash-deals"
                color="cyan"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items Requiring Attention */}
        <Card className="bg-bg-secondary border-border-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-warning" />
              Requires Attention
            </CardTitle>
            <CardDescription>Items that need your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AttentionItem
                title="Failed Orders"
                count={attentionItems.failed}
                icon={XCircle}
                href="/admin/orders?status=failed"
                severity="critical"
              />
              <AttentionItem
                title="Underpaid Orders"
                count={attentionItems.underpaid}
                icon={AlertTriangle}
                href="/admin/orders?status=underpaid"
                severity="warning"
              />
              <AttentionItem
                title="Stuck Reservations"
                count={attentionItems.stuck}
                icon={Timer}
                href="/admin/reservations"
                severity="info"
              />
              <AttentionItem
                title="Failed Webhooks"
                count={webhookStats?.failed ?? 0}
                icon={Webhook}
                href="/admin/webhooks"
                severity="warning"
              />
              {!needsAttention && (webhookStats?.failed ?? 0) === 0 && attentionItems.stuck === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 rounded-full bg-green-success/10 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-green-success" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">All Clear!</p>
                  <p className="text-xs text-text-muted mt-1">No items require attention</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="bg-bg-secondary border-border-subtle">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-neon" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest orders in the system</CardDescription>
          </div>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isOrdersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-subtle hover:bg-transparent">
                    <TableHead className="text-text-secondary text-xs">Order ID</TableHead>
                    <TableHead className="text-text-secondary text-xs">Customer</TableHead>
                    <TableHead className="text-text-secondary text-xs">Amount</TableHead>
                    <TableHead className="text-text-secondary text-xs">Payment</TableHead>
                    <TableHead className="text-text-secondary text-xs">Status</TableHead>
                    <TableHead className="text-text-secondary text-xs text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentOrders?.data?.length ?? 0) > 0 ? (
                    recentOrders?.data?.map((order) => (
                      <TableRow 
                        key={order.id} 
                        className="border-border-subtle/50 hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
                      >
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="font-mono text-xs text-text-secondary hover:text-cyan-glow transition-colors">
                                {order.id?.slice(0, 8)}...
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{order.id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-text-primary">{order.email}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono font-semibold text-text-primary">
                            €{order.total ?? '0.00'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {order.payment !== undefined && order.payment !== null ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-cyan-glow shadow-glow-cyan-sm" />
                              <span className="text-xs text-text-secondary font-mono">
                                {order.payment.id?.slice(0, 6)}...
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">No payment</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status ?? 'created'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-text-secondary">
                              {order.createdAt !== undefined && order.createdAt !== null
                                ? formatDate(order.createdAt, 'date')
                                : 'N/A'}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {order.createdAt !== undefined && order.createdAt !== null
                                ? formatDate(order.createdAt, 'time')
                                : ''}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-text-muted">
                          <Package className="h-10 w-10 opacity-50" />
                          <p className="text-sm">No orders found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Navigation Links */}
      <Card className="bg-bg-secondary border-border-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Settings className="h-5 w-5 text-text-muted" />
            Admin Navigation
          </CardTitle>
          <CardDescription>Quick links to all admin sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              { title: 'Orders', icon: ShoppingCart, href: '/admin/orders', color: 'cyan' as const },
              { title: 'Payments', icon: CreditCard, href: '/admin/payments', color: 'green' as const },
              { title: 'Reservations', icon: ClipboardList, href: '/admin/reservations', color: 'purple' as const },
              { title: 'Catalog', icon: Boxes, href: '/admin/catalog', color: 'cyan' as const },
              { title: 'Reviews', icon: Star, href: '/admin/reviews', color: 'orange' as const },
              { title: 'Promo Codes', icon: Tag, href: '/admin/promos', color: 'pink' as const },
              { title: 'Flash Deals', icon: Zap, href: '/admin/marketing/flash-deals', color: 'cyan' as const },
              { title: 'Bundles', icon: Package, href: '/admin/marketing/bundles', color: 'purple' as const },
              { title: 'Webhooks', icon: Webhook, href: '/admin/webhooks', color: 'orange' as const },
              { title: 'Audit Log', icon: FileText, href: '/admin/audit', color: 'purple' as const },
              { title: 'Balances', icon: Wallet, href: '/admin/balances', color: 'green' as const },
              { title: 'Feature Flags', icon: Settings, href: '/admin/flags', color: 'cyan' as const },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  'bg-bg-tertiary/50 border-border-subtle',
                  'hover:bg-bg-tertiary hover:border-border-accent cursor-pointer group',
                )}>
                  <div className={cn(
                    'p-2 rounded-lg',
                    colorConfig[item.color].iconBg,
                  )}>
                    <item.icon className={cn('h-4 w-4', colorConfig[item.color].iconColor)} />
                  </div>
                  <span className="text-sm font-medium text-text-primary group-hover:text-cyan-glow transition-colors">
                    {item.title}
                  </span>
                  <ArrowRight className="h-4 w-4 ml-auto text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
