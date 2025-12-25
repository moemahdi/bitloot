'use client';

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
import { Badge } from '@/design-system/primitives/badge';
import { Download, RefreshCw, AlertCircle, Loader2, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminTableState } from '@/features/admin/hooks/useAdminTableState';
import { useAdminWebhooks } from '@/features/admin/hooks/useAdminWebhooks';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { toast } from 'sonner';

export default function AdminWebhooksPage(): React.ReactElement {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const state = useAdminTableState({
    initialFilters: {
      webhookType: 'all',
      processed: 'all',
    },
  });

  const { query, replayMutation } = useAdminWebhooks(state);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = query;

  const handleExportCSV = (): void => {
    if ((data?.data?.length ?? 0) === 0) return;

    const headers = ['ID', 'External ID', 'Type', 'Processed', 'Valid', 'Date'];
    const webhookData = data?.data ?? [];
    const rows = webhookData.map((log) => [
      log.id,
      log.externalId,
      log.webhookType,
      log.processed ? 'Yes' : 'No',
      log.signatureValid ? 'Yes' : 'No',
      new Date(log.createdAt).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `webhooks_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReplay = async (id: string): Promise<void> => {
    try {
      await replayMutation.mutateAsync(id);
      toast.success('Webhook replay triggered successfully');
    } catch (error) {
      toast.error('Failed to replay webhook');
      console.error(error);
    }
  };

  const getStatusBadge = (processed: boolean, valid: boolean): React.ReactElement => {
    if (!valid) return <Badge variant="destructive">Invalid Sig</Badge>;
    if (processed) return <Badge className="bg-green-500 hover:bg-green-600">Processed</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (isGuardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Audit and replay webhook events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading || isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={(data?.data?.length ?? 0) === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Logs</CardTitle>
          <CardDescription>
            View incoming webhooks and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="w-[200px]">
                <Select
                  value={state.filters.webhookType as string}
                  onValueChange={(value) => state.handleFilterChange('webhookType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="fulfillment">Fulfillment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[200px]">
                <Select
                  value={state.filters.processed as string}
                  onValueChange={(value) => state.handleFilterChange('processed', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="true">Processed</SelectItem>
                    <SelectItem value="false">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>External ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-red-500">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Failed to load webhooks: {error instanceof Error ? error.message : 'Unknown error'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (data?.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No webhooks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-mono text-xs">{log.externalId}</TableCell>
                        <TableCell className="capitalize">{log.webhookType}</TableCell>
                        <TableCell>{getStatusBadge(log.processed, log.signatureValid)}</TableCell>
                        <TableCell>
                          {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReplay(log.id)}
                            disabled={replayMutation.isPending}
                            title="Replay Webhook"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {data?.data.length ?? 0} of {data?.total ?? 0} logs
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-muted-foreground">Rows per page</span>
                  <Select
                    value={state.limit.toString()}
                    onValueChange={(value) => state.setLimit(Number(value))}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="20" />
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
                  onClick={() => state.setPage(state.page - 1)}
                  disabled={state.page <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {state.page} of {data?.totalPages ?? 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => state.setPage(state.page + 1)}
                  disabled={state.page >= (data?.totalPages ?? 1) || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
