'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import { Checkbox } from '@/design-system/primitives/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/design-system/primitives/dialog';
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Download, 
  RefreshCw, 
  CreditCard, 
  AlertCircle, 
  Calendar, 
  CheckSquare, 
  X, 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3, 
  FileDown,
  Zap,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Sparkles,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatDateForExport } from '@/utils/format-date';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { useAdminTableState } from '@/features/admin/hooks/useAdminTableState';
import { useAdminOrders, type Order } from '@/features/admin/hooks/useAdminOrders';
import { useOrderAnalytics, useBulkUpdateStatus, useExportOrders } from '@/features/admin/hooks/useOrderBulkOps';

/**
 * Get neon badge class for order status
 * Uses inline Tailwind classes to override Badge component defaults
 */
function getOrderStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'fulfilled':
      return 'bg-green-success/20 text-green-success border border-green-success/30';
    case 'paid':
      return 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30';
    case 'pending':
    case 'created':
    case 'waiting':
    case 'confirming':
      return 'bg-orange-warning/20 text-orange-warning border border-orange-warning/30';
    case 'failed':
    case 'underpaid':
    case 'expired':
      return 'bg-destructive/20 text-destructive border border-destructive/30';
    case 'refunded':
      return 'bg-purple-neon/20 text-purple-neon border border-purple-neon/30';
    case 'cancelled':
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    default:
      return 'bg-purple-neon/20 text-purple-neon border border-purple-neon/30';
  }
}

/**
 * Get neon badge class for payment status
 * Uses inline Tailwind classes to override Badge component defaults
 */
function getPaymentStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'finished':
    case 'confirmed':
      return 'bg-green-success/20 text-green-success border border-green-success/30';
    case 'waiting':
    case 'confirming':
    case 'sending':
      return 'bg-orange-warning/20 text-orange-warning border border-orange-warning/30';
    case 'failed':
    case 'expired':
    case 'refunded':
      return 'bg-destructive/20 text-destructive border border-destructive/30';
    default:
      return 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30';
  }
}

/**
 * Format payment status for display
 */
function formatPaymentStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Get status icon component
 */
function StatusIcon({ status }: { status: string }): React.ReactElement {
  switch (status.toLowerCase()) {
    case 'fulfilled':
    case 'finished':
    case 'confirmed':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'pending':
    case 'waiting':
    case 'confirming':
      return <Clock className="h-3 w-3" />;
    case 'failed':
    case 'expired':
      return <XCircle className="h-3 w-3" />;
    default:
      return <Zap className="h-3 w-3" />;
  }
}

export default function AdminOrdersPage(): React.ReactElement {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  
  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkReason, setBulkReason] = useState<string>('');
  
  // Export dialog state
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [exportSourceType, setExportSourceType] = useState<string>('all');
  
  const tableState = useAdminTableState({
    initialFilters: {
      status: 'all',
      search: '',
      sourceType: 'all',
      startDate: '',
      endDate: '',
    },
  });

  const {
    page,
    limit,
    filters,
    setPage,
    setLimit,
    handleFilterChange,
  } = tableState;

  const { 
    orders, 
    total: totalItems, 
    isLoading, 
    refetch,
    isRefetching
  } = useAdminOrders(tableState);
  const totalPages = (totalItems > 0 && limit > 0) ? Math.ceil(totalItems / limit) : 0;

  // Analytics hook
  const { analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useOrderAnalytics(30);
  
  // Refresh loading state
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  
  // Bulk operations hooks
  const { bulkUpdate, isUpdating } = useBulkUpdateStatus();
  const { exportOrders, isExporting } = useExportOrders();

  // Bulk selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((o: Order) => o.id));
    } else {
      setSelectedOrders([]);
    }
  }, [orders]);

  const handleSelectOrder = useCallback((orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  }, []);

  const handleBulkStatusUpdate = async (): Promise<void> => {
    if (selectedOrders.length === 0 || bulkStatus === null || bulkStatus === undefined || bulkStatus === '') return;
    
    try {
      await bulkUpdate({
        orderIds: selectedOrders,
        status: bulkStatus,
        reason: (bulkReason !== null && bulkReason !== undefined && bulkReason !== '') ? bulkReason : undefined,
      });
      setSelectedOrders([]);
      setBulkStatusDialogOpen(false);
      setBulkStatus('');
      setBulkReason('');
      void refetch();
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const handleExport = async (): Promise<void> => {
    try {
      const data = await exportOrders({
        startDate: (exportStartDate !== null && exportStartDate !== undefined && exportStartDate !== '') ? exportStartDate : undefined,
        endDate: (exportEndDate !== null && exportEndDate !== undefined && exportEndDate !== '') ? exportEndDate : undefined,
        status: exportStatus !== 'all' ? exportStatus : undefined,
        sourceType: exportSourceType !== 'all' ? exportSourceType : undefined,
      });
      
      // Generate CSV from data
      const exportData = data as Order[];
      if (exportData !== null && exportData !== undefined && exportData.length > 0) {
        const headers = ['ID', 'Email', 'Total', 'Status', 'Source', 'Payment Status', 'Created At'];
        const csvContent = [
          headers.join(','),
          ...exportData.map((order: Order) => [
            order.id,
            order.email,
            parseFloat(order.total).toFixed(2),
            order.status,
            order.sourceType,
            order.payment?.status ?? 'N/A',
            new Date(order.createdAt).toISOString(),
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const _exportToCSV = (): void => {
    if ((orders?.length ?? 0) === 0) return;

    const headers = ['Order ID', 'Customer', 'Total (EUR)', 'Order Status', 'Payment Status', 'Payment Provider', 'Payment ID', 'Date'];
    const rows = (orders ?? []).map((order: Order) => [
      String(order.id),
      String(order.email),
      parseFloat(order.total).toFixed(2),
      String(order.status),
      order.payment?.status ?? 'N/A',
      order.payment?.provider ?? 'N/A',
      order.payment?.id ?? 'N/A',
      formatDateForExport(order.createdAt),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (guardLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin-glow text-cyan-glow" />
          <span className="text-text-secondary text-sm">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                <Package className="h-6 w-6 text-cyan-glow" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary tracking-tight">Order Management</h1>
                <p className="text-text-secondary">View and manage all customer orders.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRefreshingAll(true);
                void Promise.all([refetch(), Promise.resolve(refetchAnalytics())]).finally(() => {
                  setIsRefreshingAll(false);
                });
              }}
              disabled={isRefreshingAll || isRefetching}
              className="border-border-subtle hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingAll || isRefetching ? 'animate-spin' : ''}`} />
              {isRefreshingAll || isRefetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-bg-secondary border-border-subtle">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-text-primary">
                    <Download className="h-5 w-5 text-cyan-glow" />
                    Export Orders
                  </DialogTitle>
                  <DialogDescription className="text-text-secondary">
                    Configure export options and download as CSV.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Start Date</label>
                      <Input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="input-glow bg-bg-tertiary border-border-subtle"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">End Date</label>
                      <Input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="input-glow bg-bg-tertiary border-border-subtle"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Status Filter</label>
                      <Select value={exportStatus} onValueChange={setExportStatus}>
                        <SelectTrigger className="bg-bg-tertiary border-border-subtle">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent className="bg-bg-secondary border-border-subtle">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirming">Confirming</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="fulfilled">Fulfilled</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Source Type</label>
                      <Select value={exportSourceType} onValueChange={setExportSourceType}>
                        <SelectTrigger className="bg-bg-tertiary border-border-subtle">
                          <SelectValue placeholder="All sources" />
                        </SelectTrigger>
                        <SelectContent className="bg-bg-secondary border-border-subtle">
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="kinguin">Kinguin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setExportDialogOpen(false)}
                    className="border-border-subtle hover:bg-bg-tertiary"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => void handleExport()} 
                    disabled={isExporting}
                    className="btn-primary"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Analytics Dashboard Widgets */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Orders Card */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-cyan-glow/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Total Orders</CardTitle>
              <div className="p-2 rounded-lg bg-cyan-glow/10 group-hover:bg-cyan-glow/20 transition-colors">
                <Package className="h-4 w-4 text-cyan-glow" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {analyticsLoading ? (
                  <div className="skeleton h-9 w-20 rounded" />
                ) : (
                  <span className="text-glow-cyan">{analytics?.totalOrders ?? 0}</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-success" />
                <p className="text-xs text-text-secondary">Last 30 days</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue Card */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-green-success/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-green-success/10 group-hover:bg-green-success/20 transition-colors">
                <DollarSign className="h-4 w-4 text-green-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {analyticsLoading ? (
                  <div className="skeleton h-9 w-28 rounded" />
                ) : (
                  <span className="crypto-amount">€{(analytics?.totalRevenue ?? 0).toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="h-3 w-3 text-green-success" />
                <p className="text-xs text-text-secondary">Last 30 days</p>
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment Rate Card */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-purple-neon/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Fulfillment Rate</CardTitle>
              <div className="p-2 rounded-lg bg-purple-neon/10 group-hover:bg-purple-neon/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-purple-neon" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {analyticsLoading ? (
                  <div className="skeleton h-9 w-20 rounded" />
                ) : (
                  <span>{(analytics?.fulfillmentRate ?? 0).toFixed(1)}%</span>
                )}
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-2">
                <div 
                  className="bg-purple-neon h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(analytics?.fulfillmentRate ?? 0, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Avg Order Value Card */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-pink-featured/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Avg Order Value</CardTitle>
              <div className="p-2 rounded-lg bg-pink-featured/10 group-hover:bg-pink-featured/20 transition-colors">
                <BarChart3 className="h-4 w-4 text-pink-featured" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {analyticsLoading ? (
                  <div className="skeleton h-9 w-24 rounded" />
                ) : (
                  <span className="crypto-amount">€{(analytics?.averageOrderValue ?? 0).toFixed(2)}</span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1">Per order average</p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedOrders.length > 0 && (
          <Card className="border-neon-cyan bg-cyan-glow/5 animate-slide-up">
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-cyan-glow/20">
                  <CheckSquare className="h-5 w-5 text-cyan-glow" />
                </div>
                <span className="font-medium text-text-primary">
                  <span className="text-cyan-glow">{selectedOrders.length}</span> orders selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary" size="sm">
                      <Zap className="mr-2 h-4 w-4" />
                      Update Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-bg-secondary border-border-subtle">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-text-primary">
                        <Zap className="h-5 w-5 text-cyan-glow" />
                        Bulk Status Update
                      </DialogTitle>
                      <DialogDescription className="text-text-secondary">
                        Update status for <span className="text-cyan-glow font-medium">{selectedOrders.length}</span> selected orders.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-primary">New Status</label>
                        <Select value={bulkStatus} onValueChange={setBulkStatus}>
                          <SelectTrigger className="bg-bg-tertiary border-border-subtle">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-bg-secondary border-border-subtle">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirming">Confirming</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-primary">Reason (optional)</label>
                        <Input
                          value={bulkReason}
                          onChange={(e) => setBulkReason(e.target.value)}
                          placeholder="Enter reason for status change..."
                          className="input-glow bg-bg-tertiary border-border-subtle"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setBulkStatusDialogOpen(false)}
                        className="border-border-subtle hover:bg-bg-tertiary"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => void handleBulkStatusUpdate()} 
                        disabled={bulkStatus === null || bulkStatus === undefined || bulkStatus === '' || isUpdating}
                        className="btn-primary"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Update All
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedOrders([])}
                  className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-bg-secondary border-border-subtle">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-text-primary">Orders</CardTitle>
                <CardDescription className="text-text-secondary">
                  Total orders: <span className="text-cyan-glow font-medium">{totalItems}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                  <Input
                    placeholder="Search by email or order ID..."
                    className="pl-9 w-full md:w-[280px] input-glow bg-bg-tertiary border-border-subtle"
                    value={(filters.search as string) ?? ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <Select
                  value={(filters.status as string) ?? 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="w-full md:w-[150px] bg-bg-tertiary border-border-subtle">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-border-subtle">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="underpaid">Underpaid</SelectItem>
                    <SelectItem value="confirming">Confirming</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => setLimit(Number(value))}
                >
                  <SelectTrigger className="w-[100px] bg-bg-tertiary border-border-subtle">
                    <SelectValue placeholder="Limit" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-border-subtle">
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Additional filters row */}
            <div className="flex flex-wrap gap-2 items-center border-t border-border-subtle pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-neon" />
                <span className="text-sm text-text-secondary">Date Range:</span>
                <Input
                  type="date"
                  className="w-[140px] input-glow bg-bg-tertiary border-border-subtle"
                  value={(filters.startDate as string) ?? ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  placeholder="Start date"
                />
                <span className="text-text-muted">to</span>
                <Input
                  type="date"
                  className="w-[140px] input-glow bg-bg-tertiary border-border-subtle"
                  value={(filters.endDate as string) ?? ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  placeholder="End date"
                />
              </div>
              <Select
                value={(filters.sourceType as string) ?? 'all'}
                onValueChange={(value) => handleFilterChange('sourceType', value)}
              >
                <SelectTrigger className="w-[150px] bg-bg-tertiary border-border-subtle">
                  <SelectValue placeholder="Source Type" />
                </SelectTrigger>
                <SelectContent className="bg-bg-secondary border-border-subtle">
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="kinguin">Kinguin</SelectItem>
                </SelectContent>
              </Select>
              {(((filters.startDate as string) ?? '') !== '' || ((filters.endDate as string) ?? '') !== '' || (filters.sourceType as string) !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleFilterChange('startDate', '');
                    handleFilterChange('endDate', '');
                    handleFilterChange('sourceType', 'all');
                  }}
                  className="text-text-secondary hover:text-cyan-glow"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {/* Skeleton loading rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-bg-tertiary/50">
                  <div className="skeleton h-4 w-4 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                  <div className="skeleton h-6 w-20 rounded-full" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-6 w-24 rounded-full" />
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-8 w-8 rounded ml-auto" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state py-16">
              <div className="p-4 rounded-full bg-bg-tertiary mb-4">
                <Package className="empty-state-icon text-text-muted" />
              </div>
              <h3 className="empty-state-title text-text-primary">No orders found</h3>
              <p className="empty-state-description text-text-secondary">
                {(filters.search ?? '') !== '' || (filters.status ?? 'all') !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Orders will appear here once customers make purchases.'}
              </p>
              {((filters.search ?? '') !== '' || (filters.status ?? 'all') !== 'all') && (
                <Button
                  variant="outline"
                  className="mt-4 border-cyan-glow/30 hover:border-cyan-glow text-cyan-glow"
                  onClick={() => {
                    handleFilterChange('search', '');
                    handleFilterChange('status', 'all');
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border-subtle overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-tertiary/50 hover:bg-bg-tertiary/50">
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={orders.length > 0 && selectedOrders.length === orders.length}
                          onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                          aria-label="Select all orders"
                          className="border-border-accent data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow"
                        />
                      </TableHead>
                      <TableHead className="text-text-secondary font-medium">Order ID</TableHead>
                      <TableHead className="text-text-secondary font-medium">Customer</TableHead>
                      <TableHead className="text-text-secondary font-medium">Total</TableHead>
                      <TableHead className="text-text-secondary font-medium">Status</TableHead>
                      <TableHead className="text-text-secondary font-medium">Source</TableHead>
                      <TableHead className="text-text-secondary font-medium">Payment</TableHead>
                      <TableHead className="text-text-secondary font-medium">Date</TableHead>
                      <TableHead className="text-right text-text-secondary font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {orders.map((order: Order) => (
                    <TableRow 
                      key={order.id}
                      className={`
                        transition-colors duration-150
                        ${selectedOrders.includes(order.id) 
                          ? 'bg-cyan-glow/5 hover:bg-cyan-glow/10' 
                          : 'hover:bg-bg-tertiary/50'
                        }
                      `}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, Boolean(checked))}
                          aria-label={`Select order ${order.id}`}
                          className="border-border-accent data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code className="font-mono text-xs text-cyan-glow bg-cyan-glow/10 px-2 py-1 rounded cursor-pointer hover:bg-cyan-glow/20 transition-colors">
                                {order.id}
                              </code>
                            </TooltipTrigger>
                            <TooltipContent className="bg-bg-tertiary border-border-subtle">
                              <p className="text-xs">Click to copy</p>
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                            onClick={() => {
                              void navigator.clipboard.writeText(order.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-primary">{order.email}</TableCell>
                      <TableCell className="crypto-amount text-text-primary font-medium">
                        €{parseFloat(order.total).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getOrderStatusBadgeClass(order.status)} gap-1`}>
                          <StatusIcon status={order.status} />
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={
                            order.sourceType === 'kinguin' 
                              ? 'border-purple-neon/30 text-purple-neon bg-purple-neon/10' 
                              : 'border-border-accent text-text-secondary'
                          }
                        >
                          {order.sourceType === 'kinguin' ? 'Kinguin' : 'Custom'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.payment !== null && order.payment !== undefined ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className={`${getPaymentStatusBadgeClass(order.payment.status)} gap-1 cursor-help`}>
                                <CreditCard className="h-3 w-3" />
                                {formatPaymentStatus(order.payment.status)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="bg-bg-tertiary border-border-subtle">
                              <div className="text-xs space-y-1">
                                <p><span className="text-text-secondary">Provider:</span> <span className="text-text-primary">{order.payment.provider}</span></p>
                                <p><span className="text-text-secondary">ID:</span> <span className="text-cyan-glow font-mono">{order.payment.id.slice(0, 12)}...</span></p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-text-muted text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            No payment
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm whitespace-nowrap">
                        {formatDate(order.createdAt, 'datetime')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow transition-all"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
                  <p className="text-sm text-text-secondary">
                    Showing <span className="text-text-primary font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                    <span className="text-text-primary font-medium">{Math.min(page * limit, totalItems)}</span> of{' '}
                    <span className="text-cyan-glow font-medium">{totalItems}</span> orders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-3">
                      {/* Page number indicators */}
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const pageNum = page <= 3 ? i + 1 : page + i - 2;
                        if (pageNum > totalPages || pageNum < 1) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={
                              pageNum === page 
                                ? 'bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 w-8 h-8 p-0' 
                                : 'hover:bg-bg-tertiary text-text-secondary w-8 h-8 p-0'
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
