"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminApi, KinguinApi, FulfillmentApi } from "@bitloot/sdk";
import type { KinguinControllerGetStatus200Response } from "@bitloot/sdk";
import { apiConfig } from '@/lib/api-config';
import { convertToCSV, downloadCSV } from "@/utils/csv-export";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { 
  Download, 
  RefreshCw, 
  Eye, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  AlertTriangle,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlertCircle,
  Timer,
  CheckCircle2,
  XOctagon
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/primitives/select';
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

const adminApi = new AdminApi(apiConfig);
const kinguinApi = new KinguinApi(apiConfig);
const fulfillmentApi = new FulfillmentApi(apiConfig);

const LIMIT = 20;

// Interface for Kinguin status response
interface KinguinStatusInfo {
  reservationId: string;
  status: 'completed' | 'pending' | 'error';
  message: string;
  kinguinStatus?: string; // actual status from Kinguin (ready, pending, completed, etc.)
  hasKey?: boolean; // whether key is available
  checkedAt: Date;
}

// Reservation item type (matches SDK AdminControllerGetReservations200ResponseDataInner)
interface ReservationItem {
  id: string;
  email: string;
  status: string;
  kinguinReservationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  totalAmount?: string;
}

// Status configuration for badges
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; icon: React.ElementType }> = {
  created: { label: 'Created', variant: 'outline', className: 'border-purple-neon/50 text-purple-neon bg-purple-neon/10', icon: Clock },
  waiting: { label: 'Waiting', variant: 'outline', className: 'border-purple-neon/50 text-purple-neon bg-purple-neon/10', icon: Timer },
  confirming: { label: 'Confirming', variant: 'outline', className: 'border-cyan-glow/50 text-cyan-glow bg-cyan-glow/10', icon: Loader2 },
  paid: { label: 'Paid', variant: 'default', className: 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/50', icon: CheckCircle },
  fulfilled: { label: 'Fulfilled', variant: 'default', className: 'bg-green-success/20 text-green-success border-green-success/50', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', className: 'bg-pink-featured/20 text-pink-featured border-pink-featured/50', icon: XCircle },
  underpaid: { label: 'Underpaid', variant: 'destructive', className: 'bg-orange-warning/20 text-orange-warning border-orange-warning/50', icon: AlertTriangle },
  expired: { label: 'Expired', variant: 'outline', className: 'border-text-muted/50 text-text-muted bg-text-muted/10', icon: Clock },
  refunded: { label: 'Refunded', variant: 'outline', className: 'border-purple-500/50 text-purple-400 bg-purple-500/10', icon: RotateCcw },
  cancelled: { label: 'Cancelled', variant: 'outline', className: 'border-gray-500/50 text-gray-400 bg-gray-500/10', icon: XOctagon },
};

// Quick filter presets
type QuickFilter = 'all' | 'stuck' | 'failed' | 'underpaid' | 'pending' | 'completed';

export default function AdminReservationsPage(): React.ReactElement {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const queryClient = useQueryClient();

  // UI state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT);
  const [reservationFilter, setReservationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [kinguinStatuses, setKinguinStatuses] = useState<Record<string, KinguinStatusInfo>>({});
  const [checkingReservationId, setCheckingReservationId] = useState<string | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  // Compute status filter based on quick filter
  const effectiveStatusFilter = useMemo(() => {
    if (quickFilter === 'all') return statusFilter;
    if (quickFilter === 'stuck') return 'paid'; // Paid but not fulfilled
    if (quickFilter === 'failed') return 'failed';
    if (quickFilter === 'underpaid') return 'underpaid';
    if (quickFilter === 'pending') return 'waiting,confirming,created';
    if (quickFilter === 'completed') return 'fulfilled';
    return statusFilter;
  }, [quickFilter, statusFilter]);

  const query = useQuery({
    queryKey: [
      "admin-reservations",
      page,
      limit,
      reservationFilter,
      effectiveStatusFilter,
    ],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetReservations({
        limit,
        offset: (page - 1) * limit,
        kinguinReservationId: reservationFilter !== "" ? reservationFilter : undefined,
        status: effectiveStatusFilter !== "" ? effectiveStatusFilter : undefined,
      });
      return response;
    },
    enabled: !guardLoading && isAdmin,
    staleTime: 30_000,
  });

  // Stats query for dashboard
  const statsQuery = useQuery({
    queryKey: ["admin-reservations-stats"],
    queryFn: async () => {
      // Fetch all reservations to calculate stats
      const allStatuses = ['created', 'waiting', 'confirming', 'paid', 'fulfilled', 'failed', 'underpaid', 'expired', 'refunded', 'cancelled'];
      const statCounts: Record<string, number> = {};
      
      for (const status of allStatuses) {
        try {
          const response = await adminApi.adminControllerGetReservations({
            limit: 1,
            offset: 0,
            status,
          });
          statCounts[status] = response.total ?? 0;
        } catch {
          statCounts[status] = 0;
        }
      }
      
      return {
        total: Object.values(statCounts).reduce((a, b) => a + b, 0),
        pending: (statCounts.created ?? 0) + (statCounts.waiting ?? 0) + (statCounts.confirming ?? 0),
        processing: statCounts.paid ?? 0,
        completed: statCounts.fulfilled ?? 0,
        failed: statCounts.failed ?? 0,
        underpaid: statCounts.underpaid ?? 0,
        stuck: statCounts.paid ?? 0, // Paid but not fulfilled = stuck
      };
    },
    enabled: !guardLoading && isAdmin,
    staleTime: 60_000,
  });

  const { data, isLoading, error, refetch } = query;

  // Mutation to check Kinguin order status
  const checkKinguinStatusMutation = useMutation<KinguinControllerGetStatus200Response, Error, string>({
    mutationFn: async (reservationId: string) => {
      setCheckingReservationId(reservationId);
      const response = await kinguinApi.kinguinControllerGetStatus({ orderId: reservationId });
      return response;
    },
    onSuccess: (responseData, reservationId) => {
      // Extract actual Kinguin data
      const kinguinStatus = responseData.status ?? 'unknown';
      const hasKey = responseData.key !== undefined && responseData.key !== null && responseData.key !== '';
      
      // Build informative message
      let message = kinguinStatus;
      if (hasKey) {
        message = `${kinguinStatus} • Key ready`;
      }
      
      const statusInfo: KinguinStatusInfo = {
        reservationId,
        status: hasKey ? 'completed' : (kinguinStatus === 'pending' ? 'pending' : 'completed'),
        message,
        kinguinStatus,
        hasKey,
        checkedAt: new Date(),
      };
      setKinguinStatuses(prev => ({ ...prev, [reservationId]: statusInfo }));
      setCheckingReservationId(null);
      toast.success(`Kinguin: ${kinguinStatus}${hasKey ? ' - Key available!' : ''}`);
    },
    onError: (err, reservationId) => {
      const statusInfo: KinguinStatusInfo = {
        reservationId,
        status: 'error',
        message: err.message,
        checkedAt: new Date(),
      };
      setKinguinStatuses(prev => ({ ...prev, [reservationId]: statusInfo }));
      setCheckingReservationId(null);
      toast.error(`Failed to check status: ${err.message}`);
    },
  });

  // Mutation to retry fulfillment
  const retryFulfillmentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      setRetryingOrderId(orderId);
      const response = await fulfillmentApi.fulfillmentControllerTriggerFulfillment({ id: orderId });
      return response;
    },
    onSuccess: (_data, orderId) => {
      setRetryingOrderId(null);
      toast.success(`Fulfillment retry initiated for order ${orderId.slice(-8)}`);
      void queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-reservations-stats"] });
    },
    onError: (err: Error, orderId) => {
      setRetryingOrderId(null);
      toast.error(`Retry failed for ${orderId.slice(-8)}: ${err.message}`);
    },
  });

  const handleCheckKinguinStatus = (reservationId: string): void => {
    checkKinguinStatusMutation.mutate(reservationId);
  };

  const handleRetryFulfillment = (orderId: string): void => {
    retryFulfillmentMutation.mutate(orderId);
  };

  // Auto-refresh hook
  const { isAutoRefreshEnabled, setIsAutoRefreshEnabled, handleRefresh, lastRefreshTime } =
    useAutoRefresh(query, { enableAutoRefresh: false, refetchInterval: 30_000 });

  // Format date helper
  const formatDate = (dateValue: string | Date | null | undefined): string => {
    if (dateValue === null || dateValue === undefined) return "—";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate time since created
  const getTimeSince = (dateValue: string | Date | null | undefined): string => {
    if (dateValue === null || dateValue === undefined) return "—";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  // Check if order is stuck (paid > 30 mins ago but not fulfilled)
  const isStuckOrder = (item: ReservationItem): boolean => {
    if (item.status !== 'paid') return false;
    if (item.createdAt === null || item.createdAt === undefined) return false;
    const createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    return createdAt < thirtyMinsAgo;
  };

  // Export to CSV
  const handleExportCSV = (): void => {
    const reservations = (data?.data as unknown[]) ?? [];
    if (reservations.length === 0) return;

    const csvData = reservations.map((reservation: unknown) => {
      const res = reservation as Record<string, unknown>;
      return {
        "Order ID": (res.id as string) ?? "",
        Email: (res.email as string) ?? "",
        Status: (res.status as string) ?? "",
        "Reservation ID": (res.kinguinReservationId as string | null) ?? "N/A",
        "Created At": formatDate(res.createdAt as string | Date | null | undefined),
      };
    });

    const csv = convertToCSV(csvData, [
      "Order ID",
      "Email",
      "Status",
      "Reservation ID",
      "Created At",
    ]);

    const filename = `kinguin-reservations-${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csv, filename);
    toast.success('CSV exported successfully');
  };

  // Clear quick filter when using manual filters
  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
    setQuickFilter('all');
  };

  // Reservations data
  const reservations = (data?.data ?? []) as unknown as ReservationItem[];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);
  const stats = statsQuery.data;

  // Render status badge
  const renderStatusBadge = (status: string): React.ReactNode => {
    const defaultConfig = { label: 'Unknown', variant: 'outline' as const, className: 'border-text-muted/50 text-text-muted bg-text-muted/10', icon: Clock };
    const config = STATUS_CONFIG[status] ?? defaultConfig;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1.5 px-2.5 py-1`}>
        <Icon className={`h-3 w-3 ${status === 'confirming' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  // Guard loading state
  if (guardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin-glow text-cyan-glow" />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-bg-secondary border-border-subtle max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-pink-featured mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
            <p className="text-text-secondary">You don&apos;t have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-neon/20 to-cyan-glow/10 rounded-lg border border-purple-neon/30 shadow-glow-purple-sm">
                <Package className="h-6 w-6 text-purple-neon" />
              </div>
              <span className="text-gradient-primary">Kinguin Reservations</span>
            </h1>
            <p className="text-text-secondary mt-1.5">
              Monitor and manage Kinguin fulfillment operations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleRefresh()}
              disabled={isLoading}
              className="btn-outline border-cyan-glow/40 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow hover:shadow-glow-cyan-sm transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer select-none group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isAutoRefreshEnabled}
                  onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded border-2 border-border-accent bg-bg-tertiary peer-checked:bg-cyan-glow/20 peer-checked:border-cyan-glow peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-glow/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-primary transition-all duration-200" />
                <CheckCircle2 className="absolute top-0.5 left-0.5 h-4 w-4 text-cyan-glow opacity-0 peer-checked:opacity-100 transition-opacity duration-200" />
              </div>
              <span className="group-hover:text-text-primary transition-colors">Auto (30s)</span>
            </label>
            
            {lastRefreshTime !== null && (
              <span className="text-xs text-text-muted hidden sm:inline font-mono">
                {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total */}
          <Card className="card-interactive bg-bg-secondary border-border-subtle">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-neon/20 to-purple-neon/5 rounded-lg border border-purple-neon/20">
                  <Package className="h-5 w-5 text-purple-neon" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Total</p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-7 w-14 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-text-primary tabular-nums">{stats?.total ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card 
            className={`card-interactive bg-bg-secondary cursor-pointer transition-all duration-250 ${quickFilter === 'pending' ? 'border-purple-neon shadow-glow-purple-sm ring-1 ring-purple-neon/30' : 'border-border-subtle hover:border-purple-neon/40'}`}
            onClick={() => setQuickFilter(quickFilter === 'pending' ? 'all' : 'pending')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border transition-colors duration-200 ${quickFilter === 'pending' ? 'bg-purple-neon/20 border-purple-neon/40' : 'bg-purple-neon/10 border-purple-neon/20'}`}>
                  <Clock className="h-5 w-5 text-purple-neon" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Pending</p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-7 w-14 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-purple-neon tabular-nums">{stats?.pending ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing (Paid) */}
          <Card 
            className={`card-interactive bg-bg-secondary cursor-pointer transition-all duration-250 ${quickFilter === 'stuck' ? 'border-cyan-glow shadow-glow-cyan-sm ring-1 ring-cyan-glow/30' : 'border-border-subtle hover:border-cyan-glow/40'}`}
            onClick={() => setQuickFilter(quickFilter === 'stuck' ? 'all' : 'stuck')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border transition-colors duration-200 ${quickFilter === 'stuck' ? 'bg-cyan-glow/20 border-cyan-glow/40' : 'bg-cyan-glow/10 border-cyan-glow/20'}`}>
                  <Zap className="h-5 w-5 text-cyan-glow" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Processing</p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-7 w-14 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-cyan-glow tabular-nums">{stats?.processing ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card 
            className={`card-interactive bg-bg-secondary cursor-pointer transition-all duration-250 ${quickFilter === 'completed' ? 'border-green-success shadow-glow-success ring-1 ring-green-success/30' : 'border-border-subtle hover:border-green-success/40'}`}
            onClick={() => setQuickFilter(quickFilter === 'completed' ? 'all' : 'completed')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border transition-colors duration-200 ${quickFilter === 'completed' ? 'bg-green-success/20 border-green-success/40' : 'bg-green-success/10 border-green-success/20'}`}>
                  <CheckCircle2 className="h-5 w-5 text-green-success" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Completed</p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-7 w-14 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-success tabular-nums">{stats?.completed ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Failed */}
          <Card 
            className={`card-interactive bg-bg-secondary cursor-pointer transition-all duration-250 ${quickFilter === 'failed' ? 'border-pink-featured shadow-glow-pink ring-1 ring-pink-featured/30' : 'border-border-subtle hover:border-pink-featured/40'}`}
            onClick={() => setQuickFilter(quickFilter === 'failed' ? 'all' : 'failed')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border transition-colors duration-200 ${quickFilter === 'failed' ? 'bg-pink-featured/20 border-pink-featured/40' : 'bg-pink-featured/10 border-pink-featured/20'}`}>
                  <XCircle className="h-5 w-5 text-pink-featured" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Failed</p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-7 w-14 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-pink-featured tabular-nums">{stats?.failed ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Underpaid */}
          <Card 
            className={`card-interactive bg-bg-secondary cursor-pointer transition-all duration-250 ${quickFilter === 'underpaid' ? 'border-orange-warning shadow-glow-error ring-1 ring-orange-warning/30' : 'border-border-subtle hover:border-orange-warning/40'}`}
            onClick={() => setQuickFilter(quickFilter === 'underpaid' ? 'all' : 'underpaid')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border transition-colors duration-200 ${quickFilter === 'underpaid' ? 'bg-orange-warning/20 border-orange-warning/40' : 'bg-orange-warning/10 border-orange-warning/20'}`}>
                  <AlertTriangle className="h-5 w-5 text-orange-warning" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Underpaid</p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-7 w-14 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-warning tabular-nums">{stats?.underpaid ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="bg-bg-secondary border-border-subtle shadow-card-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Filter className="h-4 w-4 text-cyan-glow" />
                <CardTitle className="text-base font-semibold text-text-primary">Filters</CardTitle>
                {quickFilter !== 'all' && (
                  <Badge variant="secondary" className="badge-info text-xs">
                    Quick: {quickFilter}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isLoading || reservations.length === 0}
                  className="btn-outline border-green-success/40 text-green-success hover:bg-green-success/10 hover:border-green-success hover:shadow-glow-success transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Items per page */}
              <div className="space-y-2">
                <label className="text-sm text-text-muted font-medium">Items per page</label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(parseInt(value, 10));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-border-subtle">
                    <SelectItem value="10">10 items</SelectItem>
                    <SelectItem value="25">25 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reservation ID filter */}
              <div className="space-y-2">
                <label className="text-sm text-text-muted font-medium">Reservation ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    placeholder="Search by ID..."
                    value={reservationFilter}
                    onChange={(e) => setReservationFilter(e.target.value)}
                    className="pl-10 input-glow bg-bg-tertiary border-border-subtle"
                  />
                </div>
              </div>

              {/* Status filter */}
              <div className="space-y-2">
                <label className="text-sm text-text-muted font-medium">Status</label>
                <Select
                  value={statusFilter !== null && statusFilter !== undefined && statusFilter !== '' ? statusFilter : "all"}
                  onValueChange={(val) => handleStatusFilterChange(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-border-subtle">
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="confirming">Confirming</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="underpaid">Underpaid</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <label className="text-sm text-text-muted font-medium">Actions</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setPage(1);
                      void refetch();
                    }}
                    className="flex-1 btn-primary"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReservationFilter("");
                      setStatusFilter("");
                      setQuickFilter('all');
                      setPage(1);
                    }}
                    className="btn-ghost border-border-accent hover:border-text-muted"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="bg-bg-secondary border-border-subtle shadow-card-md overflow-hidden">
          <CardContent className="p-0">
            {/* Loading State */}
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : error instanceof Error ? (
              /* Error State */
              <div className="empty-state p-12">
                <div className="empty-state-icon bg-pink-featured/10">
                  <AlertCircle className="h-8 w-8 text-pink-featured" />
                </div>
                <h3 className="empty-state-title">Failed to load reservations</h3>
                <p className="empty-state-description text-orange-warning">{error.message}</p>
                <Button
                  onClick={() => void refetch()}
                  className="mt-4 btn-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : reservations.length === 0 ? (
              /* Empty State */
              <div className="empty-state p-12">
                <div className="empty-state-icon bg-purple-neon/10">
                  <Package className="h-8 w-8 text-purple-neon" />
                </div>
                <h3 className="empty-state-title">No reservations found</h3>
                <p className="empty-state-description">
                  {quickFilter !== 'all' 
                    ? `No ${quickFilter} orders match the current filters.`
                    : 'There are no Kinguin reservations matching your filters.'
                  }
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReservationFilter("");
                    setStatusFilter("");
                    setQuickFilter('all');
                    setPage(1);
                  }}
                  className="mt-4 btn-outline border-purple-neon/40 text-purple-neon hover:bg-purple-neon/10 hover:border-purple-neon"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              /* Table */
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-subtle bg-bg-tertiary/30 hover:bg-bg-tertiary/30">
                      <TableHead className="text-text-muted font-semibold text-xs uppercase tracking-wider w-[200px]">Order ID</TableHead>
                      <TableHead className="text-text-muted font-semibold text-xs uppercase tracking-wider">Email</TableHead>
                      <TableHead className="text-text-muted font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-text-muted font-semibold text-xs uppercase tracking-wider">Reservation ID</TableHead>
                      <TableHead className="text-text-muted font-semibold text-xs uppercase tracking-wider">Kinguin Status</TableHead>
                      <TableHead className="text-text-muted font-semibold text-xs uppercase tracking-wider">Created</TableHead>
                      <TableHead className="text-text-muted font-semibold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((item) => {
                      const reservationId = item.kinguinReservationId;
                      const kinguinStatus = reservationId != null ? kinguinStatuses[reservationId] : undefined;
                      const isChecking = checkingReservationId === reservationId;
                      const isRetrying = retryingOrderId === item.id;
                      const isStuck = isStuckOrder(item);
                      const canRetry = ['paid', 'failed'].includes(item.status);
                      
                      return (
                        <TableRow 
                          key={item.id} 
                          className={`border-border-subtle/50 transition-colors duration-150 ${isStuck ? 'bg-orange-warning/5 hover:bg-orange-warning/10' : 'hover:bg-bg-tertiary/50'}`}
                        >
                          {/* Order ID */}
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              {isStuck && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="h-4 w-4 text-orange-warning animate-bounce-subtle cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-bg-tertiary border-border-subtle shadow-card-md">
                                    <p className="text-sm">Stuck order - paid &gt;30 mins ago</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <span className="text-cyan-glow font-medium">#{item.id.slice(-8)}</span>
                            </div>
                          </TableCell>

                          {/* Email */}
                          <TableCell className="text-text-secondary max-w-[180px] truncate">{item.email}</TableCell>

                          {/* Status */}
                          <TableCell>{renderStatusBadge(item.status)}</TableCell>

                          {/* Reservation ID */}
                          <TableCell className="font-mono text-sm">
                            {reservationId !== null ? (
                              <span className="text-purple-neon">{reservationId}</span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </TableCell>

                          {/* Kinguin Status */}
                          <TableCell>
                            {reservationId != null ? (
                              <div className="flex items-center gap-2">
                                {kinguinStatus !== undefined ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 cursor-help">
                                        {kinguinStatus.hasKey === true ? (
                                          <CheckCircle className="h-4 w-4 text-green-success" />
                                        ) : kinguinStatus.status === 'pending' ? (
                                          <Clock className="h-4 w-4 text-purple-neon" />
                                        ) : kinguinStatus.status === 'error' ? (
                                          <XCircle className="h-4 w-4 text-pink-featured" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-cyan-glow" />
                                        )}
                                        <span className={`text-xs font-medium ${kinguinStatus.hasKey === true ? 'text-green-success' : kinguinStatus.status === 'error' ? 'text-pink-featured' : 'text-text-secondary'}`}>
                                          {kinguinStatus.kinguinStatus ?? kinguinStatus.message}
                                        </span>
                                        {kinguinStatus.hasKey === true && (
                                          <Badge variant="outline" className="h-5 text-[10px] px-1.5 bg-green-success/10 text-green-success border-green-success/30">
                                            Key Ready
                                          </Badge>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-bg-tertiary border-border-subtle shadow-card-md">
                                      <div className="text-xs space-y-1">
                                        <p><span className="text-text-muted">Status:</span> <span className="text-text-primary font-medium">{kinguinStatus.kinguinStatus ?? 'N/A'}</span></p>
                                        <p><span className="text-text-muted">Key Available:</span> <span className={kinguinStatus.hasKey === true ? 'text-green-success' : 'text-orange-warning'}>{kinguinStatus.hasKey === true ? 'Yes' : 'No'}</span></p>
                                        <p><span className="text-text-muted">Checked:</span> <span className="text-text-secondary">{kinguinStatus.checkedAt.toLocaleTimeString()}</span></p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { if (reservationId !== null && reservationId !== undefined && reservationId !== '') handleCheckKinguinStatus(reservationId); }}
                                    disabled={isChecking}
                                    className="h-7 text-xs text-cyan-glow hover:text-cyan-glow hover:bg-cyan-glow/10"
                                  >
                                    {isChecking ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Eye className="h-3 w-3 mr-1" />
                                    )}
                                    {isChecking ? 'Checking...' : 'Check'}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-text-muted text-xs">No reservation</span>
                            )}
                          </TableCell>

                          {/* Created */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm text-text-secondary">{formatDate(item.createdAt)}</span>
                              <span className="text-xs text-text-muted">{getTimeSince(item.createdAt)}</span>
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Retry Fulfillment */}
                              {canRetry && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRetryFulfillment(item.id)}
                                      disabled={isRetrying}
                                      className="h-8 w-8 p-0 text-orange-warning hover:text-orange-warning hover:bg-orange-warning/10"
                                    >
                                      {isRetrying ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-bg-tertiary border-border-subtle">
                                    <p className="text-sm">Retry Fulfillment</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {/* View Order */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="h-8 w-8 p-0 text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10"
                                  >
                                    <a href={`/admin/orders/${item.id}`} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-bg-tertiary border-border-subtle">
                                  <p className="text-sm">View Order Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {!isLoading && reservations.length > 0 && (
            <div className="border-t border-border-subtle bg-bg-tertiary/30 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-text-muted">
                Showing <span className="font-semibold text-cyan-glow tabular-nums">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-cyan-glow tabular-nums">{Math.min(page * limit, data?.total ?? 0)}</span> of{' '}
                <span className="font-semibold text-text-primary tabular-nums">{data?.total ?? 0}</span> reservations
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-outline border-border-accent hover:border-cyan-glow/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary rounded-lg border border-border-subtle">
                  <span className="text-sm text-text-muted">Page</span>
                  <span className="text-sm font-bold text-cyan-glow tabular-nums">{page}</span>
                  <span className="text-sm text-text-muted">of</span>
                  <span className="text-sm font-medium text-text-secondary tabular-nums">{(totalPages !== null && totalPages !== undefined && totalPages !== 0 && !Number.isNaN(totalPages)) ? totalPages : 1}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={reservations.length < limit || page >= totalPages}
                  className="btn-outline border-border-accent hover:border-cyan-glow/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </TooltipProvider>
  );
}
