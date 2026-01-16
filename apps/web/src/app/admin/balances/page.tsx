'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Wallet,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Activity,
  Info,
  ArrowUpRight,
  Zap,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Sparkles,
} from 'lucide-react';
import { AdminKinguinBalanceApi, AdminKinguinProfitAnalyticsApi } from '@bitloot/sdk';
import { getApiConfig } from '@/lib/api-config';

// ============================================================================
// Types (matching backend DTOs)
// ============================================================================

interface TopProduct {
  name: string;
  count: number;
  totalCost: number;
}

// ============================================================================
// Profit Analytics Types (matching kinguin-profit.dto.ts)
// ============================================================================

interface ProfitSummary {
  period: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number; // Backend field name
  profitMarginPercent: number; // Backend field name
  orderCount: number;
  avgProfitPerOrder: number;
  avgRevenuePerOrder: number;
  avgCostPerOrder: number;
  roiPercent: number;
  fetchedAt: string;
}

interface ProductProfit {
  productId: string;
  productName: string;
  unitsSold: number; // Backend field name
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  marginPercent: number;
  avgSellPrice: number;
  avgCostPrice: number;
  avgProfitPerUnit: number;
}

interface ProfitTrendPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  orderCount: number;
}

interface MarginDistribution {
  range: string;
  minMargin: number;
  maxMargin: number;
  productCount: number;
  percentOfTotal: number;
  totalProfit: number;
  totalRevenue: number;
}

interface ProfitAlert {
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  value?: number;
  threshold?: number;
}

interface ProfitDashboard {
  summaryTotal: ProfitSummary;
  summary24h: ProfitSummary;
  summary7d: ProfitSummary;
  summary30d: ProfitSummary;
  topProducts: ProductProfit[];
  lowMarginProducts: ProductProfit[];
  profitTrend: ProfitTrendPoint[];
  marginDistribution: MarginDistribution[];
  alerts: ProfitAlert[];
  fetchedAt: string;
}

interface SpendingStats {
  period: string;
  totalSpent: number;
  orderCount: number;
  averageOrderCost: number;
  topProducts: TopProduct[];
}

interface OrderProduct {
  name: string;
  qty: number;
}

interface KinguinOrderSummary {
  orderId: string;
  externalOrderId?: string;
  products: OrderProduct[];
  paymentPrice: number;
  status: string;
  createdAt: string;
}

interface BalanceAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  threshold?: number;
  currentValue?: number;
}

interface BalanceHistoryPoint {
  date: string;
  balance: number;    // Estimated balance (from backend: balance)
  spending: number;   // Daily spending (from backend: spending)
}

interface KinguinDashboard {
  balance: {
    balance: number;
    currency: string;
    fetchedAt: string;
    apiConnected: boolean;
    environment: 'sandbox' | 'production';
  };
  spending24h: SpendingStats;
  spending7d: SpendingStats;
  spending30d: SpendingStats;
  recentOrders: KinguinOrderSummary[];
  alerts: BalanceAlert[];
  runwayDays: number;
}

// ============================================================================
// API Functions (using SDK with proper auth)
// ============================================================================

async function fetchKinguinDashboard(): Promise<KinguinDashboard> {
  const api = new AdminKinguinBalanceApi(getApiConfig());
  const response = await api.kinguinBalanceControllerGetDashboard();
  return response as unknown as KinguinDashboard;
}

async function fetchBalanceHistory(days: number = 30): Promise<BalanceHistoryPoint[]> {
  const api = new AdminKinguinBalanceApi(getApiConfig());
  const response = await api.kinguinBalanceControllerGetBalanceHistory({ days });
  // Map SDK response to local interface (SDK uses balance/spending, we need the same)
  return (response ?? []).map((point) => ({
    date: point.date,
    balance: point.balance ?? 0,
    spending: point.spending ?? 0,
  }));
}

async function fetchProfitDashboard(): Promise<ProfitDashboard> {
  const api = new AdminKinguinProfitAnalyticsApi(getApiConfig());
  const response = await api.kinguinProfitControllerGetDashboard();
  return response as unknown as ProfitDashboard;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 8, // Support crypto precision
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    month: 'short',
    day: 'numeric',
  });
}

// Default spending stats for safe fallbacks
const defaultSpendingStats: SpendingStats = {
  period: '',
  totalSpent: 0,
  orderCount: 0,
  averageOrderCost: 0,
  topProducts: [],
};

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'canceled':
    case 'refunded':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusIcon(status: string): React.ReactNode {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'processing':
      return <Clock className="h-3 w-3 animate-spin-glow" />;
    case 'canceled':
    case 'refunded':
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  trend?: {
    direction: 'up' | 'down';
    label: string;
  };
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
}: StatCardProps): React.ReactElement {
  const variantStyles = {
    default: 'border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/40',
    success: 'border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-zinc-900/80 shadow-[0_0_30px_rgba(0,217,255,0.15)]',
    warning: 'border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-950/30 to-zinc-900/80',
    danger: 'border-l-4 border-l-red-500 bg-gradient-to-br from-red-950/30 to-zinc-900/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  };

  const iconColors = {
    default: 'text-purple-400',
    success: 'text-cyan-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  const iconBgColors = {
    default: 'bg-purple-500/10',
    success: 'bg-cyan-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-red-500/10',
  };

  return (
    <Card className={`relative overflow-hidden backdrop-blur-xl ${variantStyles[variant]} hover:scale-[1.02] hover:shadow-xl transition-all duration-300 animate-scale-in group`}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="pt-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">{value}</p>
            {subtitle !== undefined && subtitle !== '' && <p className="text-xs text-zinc-500">{subtitle}</p>}
            {trend !== undefined && trend !== null && (
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight
                  className={`h-3 w-3 ${
                    trend.direction === 'up' ? 'text-red-400' : 'text-emerald-400'
                  }`}
                />
                <span className="text-xs text-zinc-500">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`${iconBgColors[variant]} ${iconColors[variant]} p-3 rounded-xl`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Alert Banner Component
// ============================================================================

interface AlertBannerProps {
  alerts: BalanceAlert[];
}

function AlertBanner({ alerts }: AlertBannerProps): React.ReactElement | null {
  const criticalAlerts = alerts.filter((a) => a.type === 'critical');
  const warningAlerts = alerts.filter((a) => a.type === 'warning');
  const infoAlerts = alerts.filter((a) => a.type === 'info');

  if (criticalAlerts.length > 0) {
    return (
      <Alert
        variant="destructive"
        className="border-destructive bg-bg-tertiary shadow-glow-error animate-slide-in-right"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Critical Alert</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            {criticalAlerts.map((alert, idx) => (
              <li key={idx}>{alert.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  if (warningAlerts.length > 0) {
    return (
      <Alert className="border-orange-warning bg-bg-tertiary animate-slide-in-right">
        <AlertTriangle className="h-4 w-4 text-orange-warning" />
        <AlertTitle className="text-orange-warning font-semibold">Warning</AlertTitle>
        <AlertDescription className="text-text-secondary">
          <ul className="list-disc list-inside space-y-1 mt-2">
            {warningAlerts.map((alert, idx) => (
              <li key={idx}>{alert.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  if (infoAlerts.length > 0) {
    return (
      <Alert className="border-cyan-glow bg-bg-tertiary shadow-glow-cyan-sm animate-slide-in-right">
        <Info className="h-4 w-4 text-cyan-glow" />
        <AlertTitle className="text-cyan-glow font-semibold">Info</AlertTitle>
        <AlertDescription className="text-text-secondary">
          <ul className="list-disc list-inside space-y-1 mt-2">
            {infoAlerts.map((alert, idx) => (
              <li key={idx}>{alert.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

// ============================================================================
// Top Products Card Component
// ============================================================================

interface TopProductsCardProps {
  products: TopProduct[];
}

function TopProductsCard({ products }: TopProductsCardProps): React.ReactElement {
  const maxCost = Math.max(...products.map((p) => p.totalCost), 1);

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50 hover:border-purple-500/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-zinc-200">Top Products by Spending</span>
        </CardTitle>
        <CardDescription className="text-zinc-500">Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="space-y-4">
            {products.slice(0, 5).map((product, idx) => (
              <div key={idx} className="space-y-2 group">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[200px] text-zinc-300 group-hover:text-cyan-400 transition-colors" title={product.name}>
                    {product.name}
                  </span>
                  <span className="font-medium text-emerald-400 tabular-nums">
                    {formatCurrency(product.totalCost)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-zinc-800/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 group-hover:shadow-[0_0_10px_rgba(0,217,255,0.5)]"
                      style={{ width: `${(product.totalCost / maxCost) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-16 text-right tabular-nums">
                    {product.count} orders
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-xl bg-zinc-800/50 mb-3">
              <Package className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No data available</p>
            <p className="text-zinc-600 text-sm">Products will appear after orders</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Recent Orders Table Component
// ============================================================================

interface RecentOrdersTableProps {
  orders: KinguinOrderSummary[];
}

function RecentOrdersTable({ orders }: RecentOrdersTableProps): React.ReactElement {
  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Package className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-zinc-200">Recent Kinguin Orders</span>
        </CardTitle>
        <CardDescription className="text-zinc-500">Last 10 orders</CardDescription>
      </CardHeader>
      <CardContent className="scrollbar-thin">
        {orders.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/50">
                  <TableHead className="text-zinc-400 font-medium">Order ID</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Products</TableHead>
                  <TableHead className="text-right text-zinc-400 font-medium">Cost</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, idx) => (
                  <TableRow
                    key={order.orderId}
                    className={`border-zinc-800/50 hover:bg-zinc-800/30 transition-all group ${idx % 2 === 0 ? 'bg-zinc-900/20' : ''}`}
                  >
                    <TableCell className="font-mono text-xs text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      <button
                        onClick={() => {
                          void navigator.clipboard.writeText(order.orderId);
                        }}
                        className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 cursor-pointer transition-colors flex items-center gap-1.5 max-w-[180px]"
                        title="Click to copy Order ID"
                      >
                        <span className="truncate">{order.orderId}</span>
                        <svg className="h-3 w-3 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-sm text-zinc-300 truncate max-w-[150px]">
                          {order.products.map((p) => `${p.name} x${p.qty}`).join(', ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-emerald-400">
                      {formatCurrency(order.paymentPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(order.status)}
                        className="flex items-center gap-1.5 w-fit text-xs"
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 mb-4">
              <Package className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-zinc-300 font-semibold mb-1">No orders found</h3>
            <p className="text-zinc-500 text-sm max-w-xs">
              Orders will appear here once customers start purchasing products
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Balance History Chart (Simple Bar Chart)
// ============================================================================

interface SimpleBalanceChartProps {
  data: BalanceHistoryPoint[];
}

function SimpleBalanceChart({ data }: SimpleBalanceChartProps): React.ReactElement {
  // Safe calculations to prevent NaN - using correct field names from backend DTO
  const validData = data.filter(d => 
    typeof d.balance === 'number' && !isNaN(d.balance) &&
    typeof d.spending === 'number' && !isNaN(d.spending)
  );
  
  const maxBalance = validData.length > 0 
    ? Math.max(...validData.map((d) => d.balance), 1) 
    : 1;
  
  const totalSpent = validData.reduce((sum, d) => sum + (d.spending ?? 0), 0);
  const daysWithSpending = validData.filter((d) => d.spending > 0).length;
  const avgDailySpend = daysWithSpending > 0 ? totalSpent / daysWithSpending : 0;

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-zinc-200">Balance History (30 Days)</span>
        </CardTitle>
        <CardDescription className="text-zinc-500">Estimated balance trend based on order activity</CardDescription>
      </CardHeader>
      <CardContent>
        {validData.length > 0 ? (
          <div className="space-y-6">
            {/* Bar chart visualization */}
            <div className="relative">
              <div className="flex items-end gap-1.5 h-40 bg-gradient-to-t from-zinc-900/50 to-transparent rounded-xl p-4 border border-zinc-800/50">
                {validData.slice(-14).map((point, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                    <div
                      className="w-full rounded-t-sm transition-all duration-500 bg-gradient-to-t from-cyan-600 via-cyan-500 to-emerald-400 group-hover:from-cyan-500 group-hover:via-cyan-400 group-hover:to-emerald-300 group-hover:shadow-[0_0_15px_rgba(0,217,255,0.5)]"
                      style={{
                        height: `${(point.balance / maxBalance) * 100}%`,
                        minHeight: '6px',
                      }}
                      title={`${formatDateShort(point.date)}: ${formatCurrency(point.balance)} (Spent: ${formatCurrency(point.spending)})`}
                    />
                  </div>
                ))}
              </div>
              {/* Grid lines */}
              <div className="absolute inset-4 pointer-events-none">
                <div className="h-full flex flex-col justify-between">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="border-t border-dashed border-zinc-800/50" />
                  ))}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex justify-between text-xs text-zinc-500 px-4">
              <span>{validData.length > 0 ? formatDateShort(validData[Math.max(0, validData.length - 14)]?.date ?? '') : ''}</span>
              <span className="text-zinc-600">← Timeline →</span>
              <span>{validData.length > 0 ? formatDateShort(validData[validData.length - 1]?.date ?? '') : ''}</span>
            </div>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/50">
              <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xl font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(totalSpent)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Total Spent (30d)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <p className="text-xl font-bold text-purple-400 tabular-nums">
                  {daysWithSpending}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Active Days</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xl font-bold text-cyan-400 tabular-nums">
                  {formatCurrency(avgDailySpend)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Avg Daily Spend</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 mb-4">
              <Activity className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-zinc-300 font-semibold mb-1">No history data</h3>
            <p className="text-zinc-500 text-sm">Balance history will appear after order activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Profit Analytics Components
// ============================================================================

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface ProfitStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function ProfitStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: ProfitStatCardProps): React.ReactElement {
  const variantStyles = {
    default: 'border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/40',
    success: 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-zinc-900/80 shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    warning: 'border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-950/30 to-zinc-900/80',
    danger: 'border-l-4 border-l-red-500 bg-gradient-to-br from-red-950/30 to-zinc-900/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  };

  const iconColors = {
    default: 'text-purple-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  const iconBgColors = {
    default: 'bg-purple-500/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-red-500/10',
  };

  return (
    <Card className={`relative overflow-hidden backdrop-blur-xl ${variantStyles[variant]} hover:scale-[1.02] hover:shadow-xl transition-all duration-300 animate-scale-in group`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="pt-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">{value}</p>
            {subtitle !== undefined && subtitle !== '' && <p className="text-xs text-zinc-500">{subtitle}</p>}
            {trend !== undefined && trend !== null && (
              <div className="flex items-center gap-1 mt-2">
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          <div className={`${iconBgColors[variant]} ${iconColors[variant]} p-3 rounded-xl`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfitAlertsBannerProps {
  alerts: ProfitAlert[];
}

function ProfitAlertsBanner({ alerts }: ProfitAlertsBannerProps): React.ReactElement | null {
  const criticalAlerts = alerts.filter((a) => a.type === 'critical');
  const warningAlerts = alerts.filter((a) => a.type === 'warning');

  if (criticalAlerts.length > 0) {
    return (
      <Alert variant="destructive" className="border-red-500/30 bg-gradient-to-r from-red-950/30 to-zinc-900/80 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Profit Alert</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            {criticalAlerts.map((alert, idx) => (
              <li key={idx}>{alert.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  if (warningAlerts.length > 0) {
    return (
      <Alert className="border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-zinc-900/80">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-400 font-semibold">Low Margin Warning</AlertTitle>
        <AlertDescription className="text-zinc-400">
          <ul className="list-disc list-inside space-y-1 mt-2">
            {warningAlerts.map((alert, idx) => (
              <li key={idx}>{alert.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

interface TopProfitableProductsProps {
  products: ProductProfit[];
}

function TopProfitableProducts({ products }: TopProfitableProductsProps): React.ReactElement {
  const maxProfit = Math.max(...products.map((p) => p.totalProfit), 1);

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50 hover:border-emerald-500/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-zinc-200">Top Profitable Products</span>
        </CardTitle>
        <CardDescription className="text-zinc-500">Highest profit earners (30d)</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="space-y-4">
            {products.slice(0, 5).map((product, idx) => (
              <div key={idx} className="space-y-2 group">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[180px] text-zinc-300 group-hover:text-emerald-400 transition-colors" title={product.productName}>
                    {product.productName}
                  </span>
                  <div className="flex gap-3">
                    <span className="font-medium text-emerald-400 tabular-nums">
                      {formatCurrency(product.totalProfit)}
                    </span>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {formatPercent(product.marginPercent)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-zinc-800/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${(product.totalProfit / maxProfit) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-20 text-right tabular-nums">
                    {product.unitsSold} sold
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-xl bg-zinc-800/50 mb-3">
              <DollarSign className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No profit data</p>
            <p className="text-zinc-600 text-sm">Profit appears after fulfilled Kinguin orders</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LowMarginProductsProps {
  products: ProductProfit[];
}

function LowMarginProducts({ products }: LowMarginProductsProps): React.ReactElement {
  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50 hover:border-amber-500/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Target className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-zinc-200">Low Margin Products</span>
        </CardTitle>
        <CardDescription className="text-zinc-500">Products below 15% margin</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="space-y-3">
            {products.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0 group hover:bg-zinc-800/20 px-2 -mx-2 rounded transition-colors">
                <span className="truncate max-w-[180px] text-sm text-zinc-300" title={product.productName}>
                  {product.productName}
                </span>
                <div className="flex gap-3 items-center">
                  <Badge
                    variant={product.marginPercent < 5 ? 'destructive' : 'secondary'}
                    className={`text-xs tabular-nums ${product.marginPercent < 5 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}
                  >
                    {formatPercent(product.marginPercent)}
                  </Badge>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {formatCurrency(product.totalProfit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-xl bg-emerald-500/10 mb-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-medium">All margins healthy!</p>
            <p className="text-zinc-600 text-sm">No products below 15% margin</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProfitTrendChartProps {
  data: ProfitTrendPoint[];
}

function ProfitTrendChart({ data }: ProfitTrendChartProps): React.ReactElement {
  const validData = data.filter(d => 
    typeof d.profit === 'number' && !isNaN(d.profit) &&
    typeof d.revenue === 'number' && !isNaN(d.revenue)
  );
  
  const maxProfit = validData.length > 0 
    ? Math.max(...validData.map((d) => Math.abs(d.profit)), 1) 
    : 1;
  
  const totalProfit = validData.reduce((sum, d) => sum + d.profit, 0);
  const totalRevenue = validData.reduce((sum, d) => sum + d.revenue, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-zinc-200">Profit Trend (30 Days)</span>
        </CardTitle>
        <CardDescription className="text-zinc-500">Daily profit with positive/negative indication</CardDescription>
      </CardHeader>
      <CardContent>
        {validData.length > 0 ? (
          <div className="space-y-6">
            <div className="relative">
              <div className="flex items-end gap-1 h-32 bg-gradient-to-t from-zinc-900/50 to-transparent rounded-xl p-4 border border-zinc-800/50">
                {validData.slice(-14).map((point, idx) => {
                  const isPositive = point.profit >= 0;
                  const height = (Math.abs(point.profit) / maxProfit) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${
                          isPositive 
                            ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-cyan-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-t from-red-600 via-red-500 to-red-400 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                        }`}
                        style={{
                          height: `${height}%`,
                          minHeight: '4px',
                        }}
                        title={`${formatDateShort(point.date)}: ${formatCurrency(point.profit)} (${formatPercent(point.marginPercent)})`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 px-4">
              <span>{validData.length > 0 ? formatDateShort(validData[Math.max(0, validData.length - 14)]?.date ?? '') : ''}</span>
              <span className="text-zinc-600">← Daily Profit →</span>
              <span>{validData.length > 0 ? formatDateShort(validData[validData.length - 1]?.date ?? '') : ''}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/50">
              <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className={`text-xl font-bold tabular-nums ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(totalProfit)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Total Profit (30d)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xl font-bold text-cyan-400 tabular-nums">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Total Revenue</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <p className={`text-xl font-bold tabular-nums ${avgMargin >= 15 ? 'text-purple-400' : 'text-amber-400'}`}>
                  {formatPercent(avgMargin)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Avg Margin</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 mb-4">
              <BarChart3 className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-zinc-300 font-semibold mb-1">No trend data</h3>
            <p className="text-zinc-500 text-sm">Profit trends appear after fulfilled orders</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MarginDistributionChartProps {
  data: MarginDistribution[];
}

function MarginDistributionChart({ data }: MarginDistributionChartProps): React.ReactElement {
  const maxCount = Math.max(...data.map((d) => d.productCount), 1);

  const getBarColor = (minMargin: number): string => {
    if (minMargin < 0) return 'from-red-600 to-red-400';
    if (minMargin < 10) return 'from-amber-600 to-amber-400';
    if (minMargin < 20) return 'from-yellow-600 to-yellow-400';
    if (minMargin < 30) return 'from-emerald-600 to-emerald-400';
    return 'from-cyan-600 to-cyan-400';
  };

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <PieChart className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-zinc-200">Margin Distribution</span>
        </CardTitle>
        <CardDescription className="text-zinc-500">Product count by profit margin range</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.map((bucket, idx) => (
              <div key={idx} className="space-y-1 group">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{bucket.range}</span>
                  <span className="font-medium text-zinc-300 tabular-nums">
                    {bucket.productCount} products ({formatPercent(bucket.percentOfTotal)})
                  </span>
                </div>
                <div className="flex-1 bg-zinc-800/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 bg-gradient-to-r ${getBarColor(bucket.minMargin)} group-hover:shadow-md`}
                    style={{ width: `${(bucket.productCount / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-xl bg-zinc-800/50 mb-3">
              <PieChart className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No distribution data</p>
            <p className="text-zinc-600 text-sm">Data appears after orders are fulfilled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * KinguinBalanceDashboard - Kinguin Financial Operations Center
 *
 * Comprehensive dashboard for monitoring Kinguin account balance,
 * spending patterns, and order activity.
 *
 * Features:
 * - Real-time balance from Kinguin API
 * - 24h/7d/30d spending statistics
 * - Low balance alerts and runway estimation
 * - Recent orders table
 * - Balance history visualization
 */
// Duration filter options for profit analytics
type ProfitPeriod = 'total' | '30d' | '7d' | '24h';

const PERIOD_LABELS: Record<ProfitPeriod, string> = {
  total: 'All Time',
  '30d': 'Last 30 Days',
  '7d': 'Last 7 Days',
  '24h': 'Last 24 Hours',
};

export default function AdminBalancesPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('overview');
  const [profitPeriod, setProfitPeriod] = useState<ProfitPeriod>('total');

  // Fetch main dashboard data
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery<KinguinDashboard>({
    queryKey: ['kinguin', 'dashboard'],
    queryFn: fetchKinguinDashboard,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Auto-refresh every minute
  });

  // Fetch balance history for chart
  const { data: history = [] } = useQuery<BalanceHistoryPoint[]>({
    queryKey: ['kinguin', 'history'],
    queryFn: () => fetchBalanceHistory(30),
    staleTime: 5 * 60_000, // 5 minutes
  });

  // Fetch profit analytics data
  const { data: profitData, isLoading: profitLoading } = useQuery<ProfitDashboard>({
    queryKey: ['kinguin', 'profit', 'dashboard'],
    queryFn: fetchProfitDashboard,
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // Auto-refresh every 5 minutes
  });

  // Get the selected period's profit summary
  const selectedProfitSummary = useMemo(() => {
    if (profitData === null || profitData === undefined) return null;
    switch (profitPeriod) {
      case '24h':
        return profitData.summary24h;
      case '7d':
        return profitData.summary7d;
      case '30d':
        return profitData.summary30d;
      case 'total':
      default:
        return profitData.summaryTotal;
    }
  }, [profitData, profitPeriod]);

  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Calculate runway badge variant
  const runwayVariant = useMemo(() => {
    if (dashboard === null || dashboard === undefined) return 'default';
    if (dashboard.runwayDays < 7) return 'danger';
    if (dashboard.runwayDays < 14) return 'warning';
    return 'success';
  }, [dashboard]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <span className="text-zinc-300 font-medium">Loading Kinguin data...</span>
          <p className="text-zinc-500 text-sm">Fetching balance and order statistics</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error !== null && error !== undefined) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-red-950/30 to-zinc-900/80 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold text-zinc-200">Connection Error</h3>
              <p className="text-zinc-400 text-sm">
                Failed to connect to Kinguin API. Please check your credentials and try again.
              </p>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <code className="text-xs text-red-400 font-mono">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </code>
              </div>
              <Button onClick={handleRefresh} className="mt-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dashboard === null || dashboard === undefined) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <Info className="h-4 w-4 text-cyan-glow" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No balance data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <main className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Kinguin Balance
            </h1>
            <Badge
              variant={dashboard.balance?.environment === 'production' ? 'default' : 'secondary'}
              className={`font-medium ${dashboard.balance?.environment === 'production' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}
            >
              {dashboard.balance?.environment ?? 'unknown'}
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
              <div className={`w-2 h-2 rounded-full ${dashboard.balance?.apiConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'} animate-pulse`} />
              <span className="text-sm text-zinc-400">
                {dashboard.balance?.apiConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <p className="text-zinc-400">
            Financial operations center for Kinguin integration
          </p>
        </div>
        <Button onClick={handleRefresh} className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(0,217,255,0.25)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all duration-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {(dashboard.alerts ?? []).length > 0 && <AlertBanner alerts={dashboard.alerts ?? []} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Balance"
          value={formatCurrency(dashboard.balance?.balance ?? 0)}
          subtitle={`Updated ${dashboard.balance?.fetchedAt !== undefined && dashboard.balance.fetchedAt !== '' ? formatDate(dashboard.balance.fetchedAt) : 'N/A'}`}
          icon={<Wallet className="h-8 w-8" />}
          variant={
            (dashboard.balance?.balance ?? 0) < 100
              ? 'danger'
              : (dashboard.balance?.balance ?? 0) < 500
                ? 'warning'
                : 'success'
          }
        />
        <StatCard
          title="24h Spending"
          value={formatCurrency((dashboard.spending24h ?? defaultSpendingStats).totalSpent)}
          subtitle={`${(dashboard.spending24h ?? defaultSpendingStats).orderCount} orders`}
          icon={<TrendingDown className="h-8 w-8" />}
          variant="default"
        />
        <StatCard
          title="7d Spending"
          value={formatCurrency((dashboard.spending7d ?? defaultSpendingStats).totalSpent)}
          subtitle={`Avg ${formatCurrency((dashboard.spending7d ?? defaultSpendingStats).averageOrderCost)}/order`}
          icon={<TrendingDown className="h-8 w-8" />}
          variant="default"
        />
        <StatCard
          title="Runway"
          value={
            dashboard.runwayDays === Infinity
              ? '∞'
              : `${dashboard.runwayDays} days`
          }
          subtitle="At current spending rate"
          icon={<Clock className="h-8 w-8" />}
          variant={runwayVariant}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 transition-all duration-300">
            Overview
          </TabsTrigger>
          <TabsTrigger value="profit" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600/20 data-[state=active]:to-cyan-600/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 transition-all duration-300">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Profit
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 transition-all duration-300">
            Orders
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 transition-all duration-300">
            History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProductsCard products={(dashboard.spending7d ?? defaultSpendingStats).topProducts} />
            <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10">
                    <Activity className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="text-zinc-200">Spending Insights</span>
                </CardTitle>
                <CardDescription className="text-zinc-500">Last 30 days analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50 group hover:bg-zinc-800/20 px-2 -mx-2 rounded transition-colors">
                  <span className="text-sm text-zinc-400">Total Orders</span>
                  <span className="font-semibold text-purple-400 tabular-nums">{(dashboard.spending30d ?? defaultSpendingStats).orderCount}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50 group hover:bg-zinc-800/20 px-2 -mx-2 rounded transition-colors">
                  <span className="text-sm text-zinc-400">Total Spent</span>
                  <span className="font-semibold text-emerald-400 tabular-nums">
                    {formatCurrency((dashboard.spending30d ?? defaultSpendingStats).totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50 group hover:bg-zinc-800/20 px-2 -mx-2 rounded transition-colors">
                  <span className="text-sm text-zinc-400">Avg Order Cost</span>
                  <span className="font-semibold text-zinc-300 tabular-nums">
                    {formatCurrency((dashboard.spending30d ?? defaultSpendingStats).averageOrderCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 group hover:bg-zinc-800/20 px-2 -mx-2 rounded transition-colors">
                  <span className="text-sm text-zinc-400">Daily Burn Rate</span>
                  <span className="font-semibold text-amber-400 tabular-nums">
                    ~{formatCurrency((dashboard.spending30d ?? defaultSpendingStats).totalSpent / 30)}/day
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profit Tab */}
        <TabsContent value="profit" className="space-y-6 animate-fade-in">
          {/* Duration Filter - Always Visible */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-400 mr-2">Period:</span>
            {(['total', '30d', '7d', '24h'] as ProfitPeriod[]).map((period) => (
              <Button
                key={period}
                variant={profitPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProfitPeriod(period)}
                className={
                  profitPeriod === period
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                }
              >
                {PERIOD_LABELS[period]}
              </Button>
            ))}
          </div>

          {profitLoading ? (
            <div className="flex flex-col justify-center items-center h-40 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <span className="text-zinc-400">Loading profit analytics...</span>
            </div>
          ) : profitData !== null && profitData !== undefined && selectedProfitSummary !== null && selectedProfitSummary !== undefined ? (
            <>
              {/* Profit Alerts */}
              {(profitData.alerts ?? []).length > 0 && (
                <ProfitAlertsBanner alerts={profitData.alerts ?? []} />
              )}

              {/* Profit Stats Cards - Using Selected Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProfitStatCard
                  title={`${PERIOD_LABELS[profitPeriod]} Profit`}
                  value={formatCurrency(selectedProfitSummary.grossProfit ?? 0)}
                  subtitle={`${selectedProfitSummary.orderCount ?? 0} orders`}
                  icon={<DollarSign className="h-6 w-6" />}
                  variant={(selectedProfitSummary.grossProfit ?? 0) >= 0 ? 'success' : 'danger'}
                />
                <ProfitStatCard
                  title="Revenue"
                  value={formatCurrency(selectedProfitSummary.totalRevenue ?? 0)}
                  subtitle="Customer payments"
                  icon={<TrendingUp className="h-6 w-6" />}
                  variant="default"
                />
                <ProfitStatCard
                  title="Cost"
                  value={formatCurrency(selectedProfitSummary.totalCost ?? 0)}
                  subtitle="Kinguin purchases"
                  icon={<TrendingDown className="h-6 w-6" />}
                  variant="default"
                />
                <ProfitStatCard
                  title="Avg Margin"
                  value={formatPercent(selectedProfitSummary.profitMarginPercent ?? 0)}
                  subtitle={`ROI: ${formatPercent(selectedProfitSummary.roiPercent ?? 0)}`}
                  icon={<Target className="h-6 w-6" />}
                  variant={(selectedProfitSummary.profitMarginPercent ?? 0) >= 15 ? 'success' : (selectedProfitSummary.profitMarginPercent ?? 0) >= 10 ? 'warning' : 'danger'}
                />
              </div>

              {/* Profit Trend Chart */}
              <ProfitTrendChart data={profitData.profitTrend ?? []} />

              {/* Top Products and Low Margin Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProfitableProducts products={profitData.topProducts ?? []} />
                <LowMarginProducts products={profitData.lowMarginProducts ?? []} />
              </div>

              {/* Margin Distribution */}
              <MarginDistributionChart data={profitData.marginDistribution ?? []} />

              {/* Period Comparison */}
              <Card className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border-zinc-700/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <Activity className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-zinc-200">Period Comparison</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500">Profit metrics across different time periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border border-zinc-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/50">
                          <TableHead className="text-zinc-400 font-medium">Period</TableHead>
                          <TableHead className="text-right text-zinc-400 font-medium">Revenue</TableHead>
                          <TableHead className="text-right text-zinc-400 font-medium">Cost</TableHead>
                          <TableHead className="text-right text-zinc-400 font-medium">Profit</TableHead>
                          <TableHead className="text-right text-zinc-400 font-medium">Margin</TableHead>
                          <TableHead className="text-right text-zinc-400 font-medium">Orders</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: 'All Time', data: profitData.summaryTotal },
                          { label: 'Last 30d', data: profitData.summary30d },
                          { label: 'Last 7d', data: profitData.summary7d },
                          { label: 'Last 24h', data: profitData.summary24h },
                        ].map((row, idx) => (
                          <TableRow key={idx} className={`border-zinc-800/50 hover:bg-zinc-800/30 ${idx % 2 === 0 ? 'bg-zinc-900/20' : ''}`}>
                            <TableCell className="font-medium text-zinc-300">{row.label}</TableCell>
                            <TableCell className="text-right text-cyan-400 tabular-nums">{formatCurrency(row.data?.totalRevenue ?? 0)}</TableCell>
                            <TableCell className="text-right text-zinc-400 tabular-nums">{formatCurrency(row.data?.totalCost ?? 0)}</TableCell>
                            <TableCell className={`text-right font-semibold tabular-nums ${(row.data?.grossProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {formatCurrency(row.data?.grossProfit ?? 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={`tabular-nums ${(row.data?.profitMarginPercent ?? 0) >= 15 ? 'bg-emerald-500/20 text-emerald-400' : (row.data?.profitMarginPercent ?? 0) >= 10 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                {formatPercent(row.data?.profitMarginPercent ?? 0)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-zinc-400 tabular-nums">{row.data?.orderCount ?? 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 mb-4">
                <DollarSign className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-zinc-300 font-semibold mb-1">No profit data</h3>
              <p className="text-zinc-500 text-sm max-w-sm">
                Profit analytics will appear after orders are fulfilled through Kinguin.
                This requires completed BitLoot sales with Kinguin fulfillment.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="animate-fade-in">
          <RecentOrdersTable orders={dashboard.recentOrders ?? []} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="animate-fade-in">
          <SimpleBalanceChart data={history} />
        </TabsContent>
      </Tabs>

      {/* Info Footer */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-cyan-950/20 to-zinc-900/80 border-cyan-500/20 shadow-[0_0_30px_rgba(0,217,255,0.05)]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10">
              <Info className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-cyan-400">About Kinguin Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400 space-y-3">
          <p className="flex gap-2">
            <span className="text-cyan-400 font-semibold min-w-[120px]">Current Balance:</span>
            <span>Your available EUR balance on Kinguin for purchasing game keys.</span>
          </p>
          <p className="flex gap-2">
            <span className="text-cyan-400 font-semibold min-w-[120px]">Runway:</span>
            <span>Estimated days until balance reaches zero at the current spending rate.</span>
          </p>
          <p className="flex gap-2">
            <span className="text-cyan-400 font-semibold min-w-[120px]">Alerts:</span>
            <span>Critical alerts appear when balance falls below €100, warnings below €500.</span>
          </p>
          <p className="flex gap-2">
            <span className="text-cyan-400 font-semibold min-w-[120px]">Auto-Refresh:</span>
            <span>Data refreshes automatically every 60 seconds.</span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}