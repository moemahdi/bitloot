'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
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
import { Button } from '@/design-system/primitives/button';
import { Checkbox } from '@/design-system/primitives/checkbox';
import {
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  ArrowLeft,
  CheckSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { useWebhookLogsEnhanced } from '@/features/admin/hooks/useWebhookLogsEnhanced';
import { useWebhookBulkReplay } from '@/features/admin/hooks/useWebhookBulkReplay';
import {
  WebhookFilters,
  DEFAULT_FILTERS,
  type WebhookFiltersState,
  WebhookStatusBadge,
  WebhookTypeBadge,
  SignatureIndicator,
  PaymentStatusBadge,
} from '@/features/admin/components/webhooks';

export default function AdminWebhookLogsPage(): React.ReactElement {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL params
  const initialFilters = useMemo((): WebhookFiltersState => {
    const base = { ...DEFAULT_FILTERS };
    const processed = searchParams.get('processed');
    const signatureValid = searchParams.get('signatureValid');
    const webhookType = searchParams.get('webhookType');
    const orderId = searchParams.get('orderId');
    
    if (processed) base.processed = processed;
    if (signatureValid) base.signatureValid = signatureValid;
    if (webhookType) base.webhookType = webhookType;
    if (orderId) base.search = orderId;
    
    return base;
  }, [searchParams]);

  const [filters, setFilters] = useState<WebhookFiltersState>(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { webhooks, isLoading, isFetching, error, refetch, invalidate } = useWebhookLogsEnhanced({
    filters,
    page,
    limit,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { replay: bulkReplay, isReplaying, result: bulkResult } = useWebhookBulkReplay();

  const handleFiltersChange = useCallback((newFilters: WebhookFiltersState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
    setSelectedIds(new Set()); // Clear selection
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!webhooks?.data) return;
    const allIds = webhooks.data.map((w) => w.id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [webhooks?.data, selectedIds.size]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBulkReplay = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      bulkReplay(Array.from(selectedIds));
      toast.success(`Replaying ${selectedIds.size} webhooks...`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error('Failed to replay webhooks');
      console.error(error);
    }
  }, [selectedIds, bulkReplay]);

  const handleExportCSV = useCallback(() => {
    if (!webhooks?.data || webhooks.data.length === 0) return;

    const headers = [
      'ID',
      'External ID',
      'Type',
      'Processed',
      'Signature Valid',
      'Payment Status',
      'Order ID',
      'Error',
      'Date',
    ];
    const rows = webhooks.data.map((log) => [
      log.id,
      log.externalId ?? '',
      log.webhookType,
      log.processed ? 'Yes' : 'No',
      log.signatureValid === null ? 'Unknown' : log.signatureValid ? 'Yes' : 'No',
      log.paymentStatus ?? '',
      log.orderId ?? '',
      log.error ?? '',
      new Date(log.createdAt).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `webhooks_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export downloaded');
  }, [webhooks?.data]);

  if (isGuardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin-glow" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="hover:text-cyan-glow hover:bg-bg-tertiary transition-all duration-200">
            <Link href="/admin/webhooks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">Webhook Logs</h1>
            <p className="text-text-secondary">
              Browse, filter, and manage all webhook events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading || isFetching} className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200 disabled:opacity-50">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={!webhooks?.data?.length} className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200 disabled:opacity-50">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <WebhookFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-purple-neon/10 border border-purple-neon/30 rounded-lg shadow-glow-purple-sm">
          <CheckSquare className="h-5 w-5 text-purple-neon" />
          <span className="font-medium text-text-primary">
            {selectedIds.size} webhook{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkReplay}
            disabled={isReplaying}
            className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200 disabled:opacity-50"
          >
            <RotateCcw className={`mr-2 h-4 w-4 ${isReplaying ? 'animate-spin' : ''}`} />
            Replay Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="hover:text-cyan-glow hover:bg-bg-tertiary transition-all duration-200">
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="bg-bg-secondary border-border-subtle">
        <CardHeader>
          <CardTitle className="text-text-primary">
            Webhook Events
            {webhooks?.total !== undefined && (
              <span className="ml-2 text-sm font-normal text-text-secondary">
                ({webhooks.total} total)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Click on a row to view full webhook details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border-subtle overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        (webhooks?.data?.length ?? 0) > 0 &&
                        selectedIds.size === (webhooks?.data?.length ?? 0)
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signature</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin-glow" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-orange-warning">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Failed to load webhooks: {error.message}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !webhooks?.data?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-text-muted">
                      No webhooks found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  webhooks.data.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-bg-tertiary/50 transition-colors duration-200"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(log.id)}
                          onCheckedChange={() => handleSelectOne(log.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <WebhookTypeBadge type={log.webhookType} size="sm" />
                      </TableCell>
                      <TableCell>
                        <WebhookStatusBadge
                          processed={log.processed}
                          signatureValid={log.signatureValid ?? false}
                          error={log.error ?? undefined}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <SignatureIndicator valid={log.signatureValid ?? null} size="sm" />
                      </TableCell>
                      <TableCell>
                        {log.paymentStatus ? (
                          <PaymentStatusBadge status={log.paymentStatus} size="sm" />
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.orderId ? (
                          <Link
                            href={`/admin/orders/${log.orderId}`}
                            className="font-mono text-xs text-cyan-glow hover:text-pink-featured hover:underline transition-colors duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.orderId.slice(0, 8)}...
                          </Link>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-text-secondary">
                        {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="hover:text-cyan-glow hover:bg-bg-tertiary transition-all duration-200">
                          <Link href={`/admin/webhooks/logs/${log.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-text-secondary">
              Showing {webhooks?.data?.length ?? 0} of {webhooks?.total ?? 0} logs
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-text-secondary">Rows per page</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => handleLimitChange(Number(value))}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <span className="text-sm font-medium px-2 text-text-primary">
                {page} / {webhooks?.totalPages ?? 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= (webhooks?.totalPages ?? 1) || isLoading}
                className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
